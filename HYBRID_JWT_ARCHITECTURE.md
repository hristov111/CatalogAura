# Hybrid JWT Architecture

## Overview

Your system uses **TWO separate JWT systems** for optimal security and separation of concerns:

### 1. Frontend JWT (Supabase) 🔐
**Purpose:** General user authentication
- User login/registration
- Profile access
- Navigation
- General app features
- Managed by `AuthService` (Supabase)

### 2. Chat Service JWT (Custom) 💬
**Purpose:** AI Chat service access only
- AI chat requests
- Conversation management
- Thinking steps
- Managed automatically by `AiChatService`
- Uses your custom `/auth/token` endpoint

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                         User                                 │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│                    Angular Frontend                          │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  AuthService (Supabase) - Main Authentication          │ │
│  │  - User login/logout                                   │ │
│  │  - Profile access                                      │ │
│  │  - Session management                                  │ │
│  │  - Frontend JWT (long-lived)                          │ │
│  └────────────────────────────────────────────────────────┘ │
│                          ↓                                   │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  AiChatService - Chat Logic                           │ │
│  │  - Manages chat state                                  │ │
│  │  - Handles SSE streaming                              │ │
│  │  - Uses JwtAuthService internally                     │ │
│  └────────────────────────────────────────────────────────┘ │
│                          ↓                                   │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  JwtAuthService - Chat Token Management (Internal)    │ │
│  │  - Creates chat tokens automatically                   │ │
│  │  - Validates chat tokens                              │ │
│  │  - Refreshes chat tokens                              │ │
│  │  - Chat JWT (short-lived, scoped to AI service)      │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                          ↓
        ┌─────────────────┴─────────────────┐
        ↓                                   ↓
┌──────────────────┐              ┌──────────────────┐
│  Supabase Auth   │              │  AI Chat Service │
│  (Main Auth)     │              │  (port 8000)     │
│                  │              │                  │
│  - User mgmt     │              │  POST /auth/token│
│  - Profiles      │              │  POST /auth/validate│
│  - General data  │              │  POST /api/chat  │
└──────────────────┘              └──────────────────┘
```

## User Flow

### 1. Initial Login (Frontend JWT)

```
User opens app
    ↓
User logs in with Supabase (email/password, OAuth, etc.)
    ↓
AuthService creates Supabase session
    ↓
Frontend JWT stored by Supabase
    ↓
User can navigate app, view profiles, etc.
```

### 2. Opening Chat (Chat JWT - Automatic)

```
User opens chat with a profile
    ↓
AiChatService initialized
    ↓
JwtAuthService checks for chat token
    ↓
If no chat token:
    ├─ Gets user_id from AuthService (Supabase)
    ├─ Calls POST /auth/token with user_id
    └─ Stores chat token in memory/localStorage
    ↓
Chat token ready! User can send messages
```

### 3. Sending Messages (Chat JWT Auto-Included)

```
User sends message
    ↓
AiChatService.sendMessage()
    ↓
JwtAuthService.getValidToken()
    ├─ Checks chat token expiry
    ├─ Refreshes if needed (< 5 min remaining)
    └─ Returns valid chat token
    ↓
Chat request sent with Authorization: Bearer {chat_token}
    ↓
AI service validates chat token
    ↓
Response streams back
```

## Implementation

### Update AiChatService

```typescript
export class AiChatService {
  private authService = inject(AuthService);      // Supabase (main auth)
  private jwtAuthService = inject(JwtAuthService); // Chat tokens
  
  /**
   * Get valid chat token
   * Creates one automatically using user_id from main auth
   */
  private async getChatToken(): Promise<string | null> {
    // Get user ID from main auth (Supabase)
    const user = this.authService.currentUser();
    
    if (!user) {
      console.log('⚠️ User not logged in');
      return null;
    }
    
    // Get/create chat token for this user
    const chatToken = await this.jwtAuthService.getValidToken(user.id);
    
    return chatToken;
  }
  
  async sendMessage(message: string, profileId?: number): Promise<void> {
    // Get chat token (creates automatically if needed)
    const chatToken = await this.getChatToken();
    
    if (!chatToken) {
      throw new Error('Failed to get chat token');
    }
    
    // Use chat token for AI service
    await this.streamChat(message, chatToken, profileId);
  }
}
```

### User Login Flow

```typescript
// Step 1: User logs in with Supabase (main auth)
@Component({...})
export class LoginComponent {
  authService = inject(AuthService); // Supabase
  
  async login(email: string, password: string) {
    // Login with Supabase
    const result = await this.authService.login(email, password);
    
    if (result.success) {
      // User is now authenticated for the app
      // Frontend JWT managed by Supabase
      this.router.navigate(['/profiles']);
    }
  }
}

// Step 2: User opens chat (chat token created automatically)
@Component({...})
export class ProfileChatComponent {
  chatService = inject(AiChatService);
  
  async sendMessage(text: string) {
    // Chat token is created/managed automatically!
    // No manual token management needed
    await this.chatService.sendMessage(text);
  }
}
```

## Benefits of Hybrid Approach

### Security

| Aspect | Frontend JWT | Chat JWT |
|--------|-------------|----------|
| **Scope** | Full app access | Chat service only |
| **Lifetime** | Long (days/weeks) | Short (hours) |
| **Storage** | Supabase managed | localStorage |
| **Use** | Navigation, profiles, data | AI chat only |
| **Compromise Risk** | Higher impact | Limited to chat |

### Separation of Concerns

```
Frontend Auth (Supabase)
├─ User management
├─ Profile access
├─ General features
└─ Does NOT care about AI chat service

Chat Auth (Custom JWT)
├─ AI chat access only
├─ Conversation tokens
├─ Scoped credentials
└─ Independent from main auth
```

### Flexibility

- ✅ Change chat service without touching main auth
- ✅ Change main auth without touching chat service
- ✅ Different token lifetimes for different purposes
- ✅ Scale services independently
- ✅ Monitor chat usage separately

## Token Lifecycle

### Frontend JWT (Supabase)

```
User logs in
    ↓
Supabase creates session (JWT)
    ↓
Token valid for 7-30 days (configurable)
    ↓
Supabase handles refresh automatically
    ↓
Used for all app features
```

### Chat JWT (Custom)

```
User opens chat (first time)
    ↓
AiChatService gets user_id from AuthService
    ↓
JwtAuthService calls POST /auth/token
    ↓
Chat token created (24 hours)
    ↓
Stored in localStorage
    ↓
Background monitoring starts (every 60s)
    ↓
Proactive refresh (5 min before expiry)
    ↓
Used ONLY for chat requests
```

## Configuration

### environment.ts

```typescript
export const environment = {
  production: false,
  
  // Main Auth (Supabase)
  supabase: {
    url: 'https://your-project.supabase.co',
    anonKey: 'eyJ...',
  },
  
  // Chat Service (Custom JWT)
  authUrl: 'http://localhost:8000',      // Chat token endpoint
  apiUrl: 'http://localhost:3000/api',   // Chat API endpoint
  
  jwt: {
    defaultExpiryHours: 24,  // Chat tokens expire in 24 hours
  },
  
  chat: {
    tokenRefreshBuffer: 5 * 60 * 1000,   // Refresh chat token 5 min before expiry
    monitoringInterval: 60000,           // Check chat token every 60s
  },
};
```

## Example: Complete User Journey

### 1. User Opens App

```typescript
// No authentication yet
console.log('Frontend auth:', authService.isAuthenticated()); // false
console.log('Chat auth:', jwtAuthService.isAuth());           // false
```

### 2. User Logs In

```typescript
// User logs in with Supabase
await authService.login('user@example.com', 'password');

console.log('Frontend auth:', authService.isAuthenticated()); // true ✅
console.log('User:', authService.currentUser());             // { id: 'abc...', email: '...' }
console.log('Chat auth:', jwtAuthService.isAuth());          // false (not needed yet)
```

### 3. User Browses Profiles

```typescript
// User can navigate, view profiles, etc.
// Using frontend JWT (Supabase)

// No chat token needed yet
console.log('Chat auth:', jwtAuthService.isAuth()); // false
```

### 4. User Opens Chat

```typescript
// User clicks on chat with a profile
// Component loads ProfileChatComponent

// AiChatService automatically:
// 1. Gets user.id from AuthService (Supabase)
// 2. Calls POST /auth/token with user.id
// 3. Gets chat token
// 4. Stores it
// 5. Starts monitoring

console.log('Frontend auth:', authService.isAuthenticated()); // true
console.log('Chat auth:', jwtAuthService.isAuth());          // true ✅
```

### 5. User Sends Message

```typescript
// User types message and clicks send
await chatService.sendMessage('Hello!');

// Behind the scenes:
// 1. Gets chat token (already exists)
// 2. Validates it's not expired
// 3. Includes in Authorization header
// 4. Sends to AI service

// Request:
// POST http://localhost:3000/api/chat
// Authorization: Bearer {chat_token}
// Body: { message: 'Hello!' }
```

### 6. User Continues Chatting

```typescript
// Background monitoring (every 60s):
// - Checks chat token expiry
// - Refreshes if < 5 min remaining
// - User never notices

// If chat token expires during use:
// - System automatically refreshes
// - Retries failed request
// - User sees seamless experience
```

### 7. User Logs Out

```typescript
await authService.logout();

// Supabase session cleared (frontend JWT)
console.log('Frontend auth:', authService.isAuthenticated()); // false

// Chat token could be cleared too (optional)
jwtAuthService.logout();
console.log('Chat auth:', jwtAuthService.isAuth()); // false
```

## Security Considerations

### Token Separation Benefits

1. **Blast Radius Limitation**
   - If chat token compromised → Only chat access
   - If frontend token compromised → Full app access
   - Separate tokens = smaller risk per token

2. **Different Lifetimes**
   - Frontend JWT: 7-30 days (convenience)
   - Chat JWT: 1-24 hours (security)

3. **Service Isolation**
   - AI service only validates chat tokens
   - Main backend only validates frontend tokens
   - No cross-service token sharing

4. **Auditing**
   - Track chat usage separately
   - Monitor AI service access independently
   - Clear separation in logs

### Best Practices

```typescript
// ✅ DO: Keep tokens separate
const frontendToken = authService.getToken();    // For general API
const chatToken = jwtAuthService.getToken();     // For chat API only

// ✅ DO: Clear both on logout
authService.logout();      // Clear frontend token
jwtAuthService.logout();   // Clear chat token

// ✅ DO: Use shortest lifetime that works
jwt: { defaultExpiryHours: 1 }  // For production

// ❌ DON'T: Use frontend token for chat
// ❌ DON'T: Use chat token for general API
// ❌ DON'T: Share tokens between services
```

## Migration Path

If you already have Supabase auth:

### 1. Keep Existing AuthService

```typescript
// src/services/auth.service.ts
// Keep as-is - handles main authentication
export class AuthService {
  // ... existing Supabase auth code
}
```

### 2. Add JwtAuthService for Chat

```typescript
// src/services/jwt-auth.service.ts
// NEW - handles chat tokens only
export class JwtAuthService {
  // ... chat token management
}
```

### 3. Update AiChatService

```typescript
// src/services/ai-chat.service.ts
export class AiChatService {
  private authService = inject(AuthService);      // Main auth
  private jwtAuthService = inject(JwtAuthService); // Chat auth
  
  private async getChatToken(): Promise<string | null> {
    // Bridge: Get user from main auth, create chat token
    const user = this.authService.currentUser();
    if (!user) return null;
    
    return await this.jwtAuthService.getValidToken(user.id);
  }
}
```

### 4. No Changes to Components!

Your components don't change - they just use the services:

```typescript
// Login component uses AuthService (Supabase)
@Component({...})
export class LoginComponent {
  authService = inject(AuthService);
  
  async login() {
    await this.authService.login(email, password);
  }
}

// Chat component uses AiChatService (chat tokens automatic)
@Component({...})
export class ChatComponent {
  chatService = inject(AiChatService);
  
  async sendMessage() {
    await this.chatService.sendMessage(text);
  }
}
```

## Summary

### What You Have Now

```
┌─────────────────────────────────────────────┐
│  Frontend (Angular)                         │
│                                             │
│  AuthService (Supabase)                     │
│  ├─ Main user authentication               │
│  ├─ Profile access                         │
│  └─ Frontend JWT (long-lived)              │
│                                             │
│  AiChatService                              │
│  ├─ Chat functionality                     │
│  └─ Uses JwtAuthService internally         │
│                                             │
│  JwtAuthService (Hidden from user)         │
│  ├─ Chat token management                  │
│  ├─ Calls /auth/token                      │
│  └─ Chat JWT (short-lived, auto-managed)   │
└─────────────────────────────────────────────┘
         ↓                     ↓
   ┌──────────┐      ┌──────────────────┐
   │ Supabase │      │  AI Chat Service │
   │   Auth   │      │  (Custom JWT)    │
   └──────────┘      └──────────────────┘
```

### Benefits

1. ✅ **User Experience**: Single login for everything
2. ✅ **Security**: Separate tokens, limited scope
3. ✅ **Simplicity**: Chat tokens managed automatically
4. ✅ **Flexibility**: Change services independently
5. ✅ **Scalability**: Services can scale separately

### User Perspective

```
User logs in once (Supabase) →
  Can browse profiles ✅
  Can view content ✅
  Can navigate app ✅
  Opens chat → Chat token created automatically ✅
  Sends messages → Works seamlessly ✅
  
No manual token management needed! ✨
```

## Recommended Approach

**This hybrid architecture is PERFECT for your use case!**

- Main app uses Supabase (full user management)
- Chat uses custom JWT (AI service specific)
- Users only log in once
- Chat tokens managed automatically
- Clear separation of concerns
- Maximum flexibility

**Users experience seamless authentication while you maintain secure, scalable service boundaries!** 🎉


