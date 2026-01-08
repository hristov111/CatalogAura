import { Injectable, signal, computed, inject } from '@angular/core';
import { AuthService } from './auth.service';      // Supabase - Main auth
import { JwtAuthService } from './jwt-auth.service'; // Custom - Chat tokens
import { Router } from '@angular/router';
import { environment } from '../environments/environment';

/**
 * AI Chat Service
 * Handles SSE connections, message streaming, and automatic JWT token management
 * 
 * Token Management Strategy:
 * 1. Auto-create token on first use (via Supabase session)
 * 2. Auto-refresh before expiry (proactive)
 * 3. Handle 401 errors (defensive)
 * 4. Monitor expiry in background
 * 5. Seamless user experience - no manual token management
 */

export interface ChatMessage {
  id?: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  conversationId?: string;
}

export interface ThinkingStep {
  step: string;
  icon: string;
  title: string;
  details: string;
  data?: string;
  status: 'processing' | 'complete';
  timestamp: Date;
}

export interface SSEEvent {
  type: 'thinking' | 'chunk' | 'done' | 'age_verification_required' | 'error';
  step?: string;
  data?: any;
  chunk?: string;
  conversation_id?: string;
  error?: string;
}

export interface ChatConfig {
  apiUrl: string;
  maxMessageLength: number;
  autoScroll: boolean;
  showTimestamps: boolean;
  thinkingPanelVisible: boolean;
}

export type ConnectionStatus = 'disconnected' | 'connected' | 'processing';

@Injectable({
  providedIn: 'root'
})
export class AiChatService {
  private authService = inject(AuthService);        // Main user auth (Supabase)
  private chatAuthService = inject(JwtAuthService); // Chat-specific JWT tokens
  private router = inject(Router);

  // State signals
  readonly messages = signal<ChatMessage[]>([]);
  readonly thinkingSteps = signal<ThinkingStep[]>([]);
  readonly conversationId = signal<string | null>(null);
  readonly isProcessing = signal<boolean>(false);
  readonly connectionStatus = signal<ConnectionStatus>('disconnected');
  
  // Config
  readonly config = signal<ChatConfig>({
    apiUrl: environment.apiUrl,  // Node.js backend proxy on port 3000
    maxMessageLength: environment.chat.maxMessageLength,
    autoScroll: environment.chat.autoScroll,
    showTimestamps: environment.chat.showTimestamps,
    thinkingPanelVisible: false,
  });

  // Computed values
  readonly hasMessages = computed(() => this.messages().length > 0);
  readonly canSendMessage = computed(() => !this.isProcessing());

  // Token management
  private tokenRefreshTimer: any = null;
  private readonly TOKEN_REFRESH_BUFFER = environment.chat.tokenRefreshBuffer;

  constructor() {
    this.initTokenMonitoring();
    this.loadConversationFromStorage();
  }

  /**
   * Initialize automatic token monitoring and refresh
   */
  private async initTokenMonitoring() {
    // Start monitoring session
    setInterval(async () => {
      await this.checkAndRefreshToken();
    }, environment.chat.monitoringInterval);

    // Initial check
    await this.checkAndRefreshToken();
  }

  /**
   * Check token expiry and refresh if needed (proactive approach)
   */
  private async checkAndRefreshToken(): Promise<void> {
    try {
      // Get user ID from main auth (Supabase)
      const user = this.authService.currentUser();
      
      if (!user) {
        console.log('⚠️ No user logged in');
        return;
      }

      // Check and refresh chat token
      await this.chatAuthService.checkAndRefreshToken(user.id);
    } catch (error) {
      console.error('Error checking chat token:', error);
    }
  }

  /**
   * Get valid chat JWT token (creates/refreshes automatically)
   * Uses main auth (Supabase) for user identity,
   * creates chat-specific token via JwtAuthService
   */
  private async getChatToken(): Promise<string | null> {
    try {
      // Get user from main auth (Supabase)
      const user = this.authService.currentUser();
      
      if (!user) {
        console.log('⚠️ User not logged in with main auth');
        this.handleAuthError();
        return null;
      }

      console.log('🔑 Getting chat token for user:', user.id);

      // Get/create chat-specific token
      const chatToken = await this.chatAuthService.getValidToken(user.id);
      
      if (!chatToken) {
        console.log('⚠️ Failed to get chat token');
        this.handleAuthError();
        return null;
      }

      console.log('✅ Chat token ready');
      return chatToken;
    } catch (error) {
      console.error('Error getting chat token:', error);
      this.handleAuthError();
      return null;
    }
  }

  /**
   * Handle authentication errors
   */
  private handleAuthError() {
    this.connectionStatus.set('disconnected');
    // Could show a notification here
    // For now, just log - the AuthService will handle the redirect
  }

  /**
   * Send a message and stream the response
   */
  async sendMessage(message: string, profileId?: number): Promise<void> {
    if (!message.trim() || this.isProcessing()) {
      return;
    }

    if (message.length > this.config().maxMessageLength) {
      throw new Error(`Message too long (max ${this.config().maxMessageLength} characters)`);
    }

    // Get valid chat token (creates/refreshes automatically)
    const chatToken = await this.getChatToken();
    if (!chatToken) {
      throw new Error('Chat authentication required - please login');
    }

    // Add user message
    const userMessage: ChatMessage = {
      role: 'user',
      content: message,
      timestamp: new Date(),
      conversationId: this.conversationId() || undefined,
    };
    
    this.messages.update(msgs => [...msgs, userMessage]);
    
    // Clear thinking steps
    this.thinkingSteps.set([]);
    
    // Update state
    this.isProcessing.set(true);
    this.connectionStatus.set('processing');

    try {
      await this.streamChat(message, chatToken, profileId);
    } catch (error: any) {
      console.error('Chat error:', error);
      
      // Handle 401 errors (defensive approach)
      if (error.message.includes('401') || error.message.includes('Unauthorized')) {
        console.log('🔐 Received 401, attempting chat token refresh...');
        
        // Try to get a new chat token
        const newChatToken = await this.getChatToken();
        
        if (newChatToken) {
          console.log('✅ Chat token refreshed, retrying request...');
          // Retry with new token
          await this.streamChat(message, newChatToken, profileId);
          return;
        }
        
        this.handleAuthError();
      }
      
      throw error;
    } finally {
      this.isProcessing.set(false);
      this.connectionStatus.set('disconnected');
    }
  }

  /**
   * Stream chat response via SSE
   */
  private async streamChat(message: string, token: string, profileId?: number): Promise<void> {
    const apiUrl = this.config().apiUrl;
    
    const body: any = {
      message: message,
      persona_id: profileId, // Send persona_id to Node.js proxy
    };

    if (this.conversationId()) {
      body.conversation_id = this.conversationId();
    }

    // Get Supabase token for Node.js backend authentication
    const supabaseToken = await this.authService.getSession();
    const supabaseAccessToken = supabaseToken?.session?.access_token;
    
    if (!supabaseAccessToken) {
      throw new Error('No Supabase session found');
    }

    // Call Node.js proxy endpoint with Supabase token
    const response = await fetch(`${apiUrl}/ai-chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseAccessToken}`, // Use Supabase token
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('401 Unauthorized');
      }
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    this.connectionStatus.set('connected');

    // Create assistant message placeholder
    const assistantMessage: ChatMessage = {
      role: 'assistant',
      content: '',
      timestamp: new Date(),
    };
    
    this.messages.update(msgs => [...msgs, assistantMessage]);
    const messageIndex = this.messages().length - 1;

    // Read SSE stream
    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      
      if (done) break;
      
      buffer += decoder.decode(value, { stream: true });
      
      // Process complete SSE messages
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.substring(6);
          
          try {
            const event: SSEEvent = JSON.parse(data);
            
            switch (event.type) {
              case 'thinking':
                this.handleThinkingEvent(event);
                break;
                
              case 'chunk':
                this.updateAssistantMessage(messageIndex, event.chunk || '');
                
                // Update conversation ID if present
                if (event.conversation_id && !this.conversationId()) {
                  this.conversationId.set(event.conversation_id);
                  this.saveConversationToStorage();
                }
                break;
                
              case 'done':
                // Update conversation ID
                if (event.conversation_id) {
                  this.conversationId.set(event.conversation_id);
                  this.saveConversationToStorage();
                }
                break;
                
              case 'age_verification_required':
                await this.handleAgeVerificationRequired(event);
                break;
                
              case 'error':
                console.error('Chat error event:', event.error);
                // Add error message to chat
                this.addSystemMessage(`Error: ${event.error || 'An error occurred'}`);
                // Don't throw - just show the error to user
                return;
            }
          } catch (e) {
            console.error('Failed to parse SSE data:', e, data);
          }
        }
      }
    }
  }

  /**
   * Handle thinking step events
   */
  private handleThinkingEvent(event: SSEEvent): void {
    if (!event.step || !event.data) return;

    const stepInfo = this.getStepInfo(event.step, event.data);
    
    const thinkingStep: ThinkingStep = {
      step: event.step,
      icon: stepInfo.icon,
      title: stepInfo.title,
      details: stepInfo.details,
      data: stepInfo.data,
      status: 'processing',
      timestamp: new Date(),
    };

    this.thinkingSteps.update(steps => [...steps, thinkingStep]);

    // Mark as complete after a short delay
    setTimeout(() => {
      this.thinkingSteps.update(steps =>
        steps.map((s, i) =>
          i === steps.length - 1 ? { ...s, status: 'complete' } : s
        )
      );
    }, 500);
  }

  /**
   * Update assistant message content
   */
  private updateAssistantMessage(index: number, chunk: string): void {
    this.messages.update(msgs => {
      const updated = [...msgs];
      if (updated[index]) {
        updated[index] = {
          ...updated[index],
          content: updated[index].content + chunk,
        };
      }
      return updated;
    });
  }

  /**
   * Handle age verification required
   */
  private async handleAgeVerificationRequired(event: SSEEvent): Promise<void> {
    // Store conversation ID
    if (event.conversation_id) {
      this.conversationId.set(event.conversation_id);
      this.saveConversationToStorage();
    }

    // For now, just inform the user without auto-verifying
    // In production, you'd want a proper dialog/modal
    this.addSystemMessage(
      '⚠️ Age Verification Required: This chat service requires age verification. ' +
      'Please verify you are 18+ years old to continue. ' +
      'Contact support to complete age verification.'
    );
    
    // Note: Age verification should be done once during account setup,
    // not during every chat session. This is just a fallback handler.
  }

  /**
   * Verify age with backend
   */
  private async verifyAge(): Promise<void> {
    try {
      const chatToken = await this.getChatToken();
      if (!chatToken) return;

      const apiUrl = this.config().apiUrl;
      
      const response = await fetch(`${apiUrl}/age-verification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${chatToken}`,
        },
        body: JSON.stringify({
          birth_year: new Date().getFullYear() - 18, // Default to 18+ age
          agreed_to_terms: true,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to verify age: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.age_verified) {
        this.addSystemMessage('Age verified successfully. Please send your message again to continue.');
      } else {
        this.addSystemMessage('Age verification failed');
      }
    } catch (error: any) {
      console.error('Age verification error:', error);
      this.addSystemMessage(`Age verification error: ${error.message}`);
    }
  }

  /**
   * Add a system message
   */
  private addSystemMessage(content: string): void {
    const message: ChatMessage = {
      role: 'assistant',
      content: content,
      timestamp: new Date(),
    };
    
    this.messages.update(msgs => [...msgs, message]);
  }

  /**
   * Get step information for UI display
   */
  private getStepInfo(step: string, data: any): { icon: string; title: string; details: string; data?: string } {
    const info = {
      icon: '🔄',
      title: step,
      details: data.message || '',
      data: undefined as string | undefined,
    };

    switch (step) {
      case 'processing_start':
        info.icon = '🚀';
        info.title = 'Starting Processing';
        break;
      
      case 'message_stored':
        info.icon = '💾';
        info.title = 'Message Stored';
        break;
      
      case 'checking_preferences':
        info.icon = '🔍';
        info.title = 'Analyzing Preferences';
        break;
      
      case 'preferences_updated':
        info.icon = '✅';
        info.title = 'Preferences Analyzed';
        break;
      
      case 'checking_personality':
        info.icon = '🔍';
        info.title = 'Checking Personality Config';
        break;
        
      case 'personality_detected':
      case 'personality_loaded':
        info.icon = '🎭';
        info.title = step === 'personality_detected' ? 'Personality Updated' : 'Personality Applied';
        if (data.archetype) {
          info.details = `${data.archetype}`;
          if (data.relationship_depth) {
            info.details += ` (depth: ${data.relationship_depth.toFixed(1)}/10)`;
          }
        }
        if (data.traits && Object.keys(data.traits).length > 0) {
          const traitsList = Object.entries(data.traits)
            .map(([k, v]) => `${k}: ${v}/10`)
            .slice(0, 3)
            .join(', ');
          info.data = traitsList;
        }
        break;
      
      case 'analyzing_emotion':
        info.icon = '🔍';
        info.title = 'Analyzing Emotion';
        break;
        
      case 'emotion_detected':
        info.icon = '😊';
        info.title = 'Emotion Detected';
        info.details = `${data.emotion} (confidence: ${(data.confidence * 100).toFixed(0)}%, intensity: ${data.intensity})`;
        break;
      
      case 'analyzing_goals':
        info.icon = '🔍';
        info.title = 'Analyzing Goals';
        break;
        
      case 'goals_tracked':
        info.icon = '🎯';
        info.title = 'Goals Tracked';
        info.details = `${data.active_count} active goals`;
        if (data.new_goals > 0) {
          info.details += `, ${data.new_goals} new`;
        }
        if (data.progress_updates > 0) {
          info.details += `, ${data.progress_updates} updated`;
        }
        if (data.goals && data.goals.length > 0) {
          info.data = data.goals
            .map((g: any) => `${g.title} (${g.category}): ${g.progress.toFixed(0)}%`)
            .join('\n');
        }
        break;
      
      case 'retrieving_memories':
        info.icon = '🔍';
        info.title = 'Searching Memories';
        break;
        
      case 'memories_retrieved':
        info.icon = '🧠';
        info.title = 'Memories Retrieved';
        info.details = `Found ${data.count} relevant memories`;
        if (data.memories && data.memories.length > 0) {
          info.data = data.memories
            .map((m: any) => {
              const type = m.type ? `[${m.type}]` : '';
              const importance = m.importance ? `[${m.importance.toFixed(2)}]` : '';
              return `${type}${importance} ${m.content}`;
            })
            .join('\n\n');
        }
        break;
      
      case 'building_context':
        info.icon = '🔧';
        info.title = 'Building Context';
        if (data.message_count) {
          info.details = `Assembling ${data.message_count} messages`;
        }
        break;
        
      case 'prompt_built':
        info.icon = '📝';
        info.title = 'Context Assembled';
        if (data.context) {
          const ctx = data.context;
          const parts = [];
          if (ctx.memories > 0) parts.push(`${ctx.memories} memories`);
          if (ctx.messages > 0) parts.push(`${ctx.messages} messages`);
          if (ctx.personality) parts.push(`${ctx.personality} personality`);
          if (ctx.emotion) parts.push(`${ctx.emotion} emotion`);
          if (ctx.goals > 0) parts.push(`${ctx.goals} goals`);
          if (ctx.preferences) parts.push('preferences');
          info.details = parts.join(', ');
        }
        break;
        
      case 'generating_response':
        info.icon = '⚡';
        info.title = 'Generating Response';
        break;
      
      case 'extracting_memories':
        info.icon = '💾';
        info.title = 'Extracting Memories';
        info.details = 'Background task running...';
        break;
        
      default:
        info.title = step.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }

    return info;
  }

  /**
   * Clear chat history
   */
  clearChat(): void {
    this.messages.set([]);
    this.thinkingSteps.set([]);
    this.conversationId.set(null);
    localStorage.removeItem('chat_conversation_id');
  }

  /**
   * Update config
   */
  updateConfig(partial: Partial<ChatConfig>): void {
    this.config.update(current => ({ ...current, ...partial }));
  }

  /**
   * Save conversation ID to storage
   */
  private saveConversationToStorage(): void {
    const id = this.conversationId();
    if (id) {
      localStorage.setItem('chat_conversation_id', id);
    }
  }

  /**
   * Load conversation ID from storage
   */
  private loadConversationFromStorage(): void {
    const id = localStorage.getItem('chat_conversation_id');
    if (id) {
      this.conversationId.set(id);
    }
  }
}

