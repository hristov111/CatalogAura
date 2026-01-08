import { Component, ChangeDetectionStrategy, input, inject, OnDestroy, effect } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Profile } from '../../../profile.model';
import { AiChatService, ChatMessage, ThinkingStep } from '../../../services/ai-chat.service';

@Component({
  selector: 'app-profile-chat',
  templateUrl: './profile-chat.component.html',
  styleUrl: './profile-chat.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NgOptimizedImage, FormsModule],
})
export class ProfileChatComponent implements OnDestroy {
  profile = input.required<Profile>();
  
  // Inject AI Chat Service
  protected chatService = inject(AiChatService);
  
  // Local state
  messageInput = '';
  showThinkingPanel = false;
  showWelcome = true;
  errorMessage: string | null = null;
  
  // Expose service signals to template
  messages = this.chatService.messages;
  thinkingSteps = this.chatService.thinkingSteps;
  isProcessing = this.chatService.isProcessing;
  connectionStatus = this.chatService.connectionStatus;
  conversationId = this.chatService.conversationId;
  
  // Scroll effect
  private scrollEffect = effect(() => {
    // Trigger scroll when messages change
    const msgs = this.messages();
    if (msgs.length > 0 && this.chatService.config().autoScroll) {
      setTimeout(() => this.scrollToBottom(), 100);
    }
  });
  
  constructor() {
    // Hide welcome message if there are already messages
    effect(() => {
      this.showWelcome = this.messages().length === 0;
    });
    
    // Load chat history when profile changes
    effect(() => {
      const currentProfile = this.profile();
      if (currentProfile?.id) {
        console.log(`📂 Profile changed to ${currentProfile.id} (${currentProfile.name}) - loading chat history`);
        this.chatService.switchToPersona(currentProfile.id);
      }
    });
  }
  
  ngOnDestroy(): void {
    // Cleanup if needed
  }
  
  /**
   * Send message to AI
   */
  async onSendMessage(): Promise<void> {
    const message = this.messageInput.trim();
    
    if (!message || this.isProcessing()) {
      return;
    }
    
    // Clear input immediately
    this.messageInput = '';
    this.errorMessage = null;
    
    try {
      await this.chatService.sendMessage(message, this.profile().id, this.profile().name);
    } catch (error: any) {
      console.error('Error sending message:', error);
      this.errorMessage = error.message || 'Failed to send message';
      
      // Show error for 5 seconds
      setTimeout(() => {
        this.errorMessage = null;
      }, 5000);
    }
  }
  
  /**
   * Handle Enter key in textarea
   */
  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.onSendMessage();
    }
  }
  
  /**
   * Clear chat history
   */
  onClearChat(): void {
    if (confirm('Clear all messages? This will start a new conversation.')) {
      this.chatService.clearChat();
      this.showThinkingPanel = false;
    }
  }
  
  /**
   * Toggle thinking panel visibility
   */
  toggleThinkingPanel(): void {
    this.showThinkingPanel = !this.showThinkingPanel;
    this.chatService.updateConfig({
      thinkingPanelVisible: this.showThinkingPanel
    });
  }
  
  /**
   * Get connection status display
   */
  getStatusDisplay(): { text: string; class: string } {
    const status = this.connectionStatus();
    switch (status) {
      case 'connected':
        return { text: 'Connected', class: 'status-connected' };
      case 'processing':
        return { text: 'Processing...', class: 'status-processing' };
      case 'disconnected':
      default:
        return { text: 'Disconnected', class: 'status-disconnected' };
    }
  }
  
  /**
   * Get conversation display
   */
  getConversationDisplay(): string {
    const id = this.conversationId();
    if (id) {
      return `Conversation: ${id.substring(0, 8)}...`;
    }
    return 'No conversation';
  }
  
  /**
   * Format timestamp
   */
  formatTime(date: Date): string {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  }
  
  /**
   * Scroll to bottom of messages
   */
  private scrollToBottom(): void {
    const messagesContainer = document.querySelector('.chat-messages');
    if (messagesContainer) {
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
  }
  
  /**
   * Track by for messages
   */
  trackByMessage(index: number, message: ChatMessage): any {
    return message.id || index;
  }
  
  /**
   * Track by for thinking steps
   */
  trackByStep(index: number, step: ThinkingStep): any {
    return `${step.step}-${step.timestamp.getTime()}`;
  }
}

