# Custom JWT Authentication Setup Guide

## Overview

Your AI Chat system now uses **your custom JWT authentication endpoints** instead of Supabase:

- ✅ `POST /auth/token` - Create/get JWT token
- ✅ `POST /auth/validate` - Validate JWT token

The system provides **automatic token management** with the same seamless user experience!

## 🔑 Your JWT Endpoints

### 1. Create/Get JWT Token

**Endpoint:** `POST http://localhost:8000/auth/token`

**Request:**
```json
{
  "user_id": "john-doe",
  "expires_in_hours": 24  // Optional, default: 24
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "expires_in": 86400,
  "user_id": "john-doe"
}
```

**What it does:**
- ✅ Creates user in database if doesn't exist
- ✅ Generates signed JWT token
- ✅ Token is valid for 24 hours (or custom time)
- ✅ Returns the token immediately

### 2. Validate JWT Token

**Endpoint:** `POST http://localhost:8000/auth/validate`

**Request:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (valid):**
```json
{
  "valid": true,
  "user_id": "john-doe",
  "expires_at": "2025-01-05T14:30:00Z",
  "issued_at": "2025-01-04T14:30:00Z"
}
```

**Response (invalid/expired):**
```json
{
  "valid": false,
  "user_id": null,
  "error": "Token has expired"
}
```

## 🎯 Implementation Architecture

```
┌─────────────────────────────────────────────────────┐
│  ProfileChatComponent (UI)                          │
│  - Displays chat messages                           │
│  - No token handling                                │
└─────────────────────────────────────────────────────┘
                    ↓ uses
┌─────────────────────────────────────────────────────┐
│  AiChatService (Business Logic)                     │
│  - Manages chat state                               │
│  - Handles SSE streaming                            │
│  - Uses JwtAuthService for tokens                   │
└─────────────────────────────────────────────────────┘
                    ↓ uses
┌─────────────────────────────────────────────────────┐
│  JwtAuthService (Token Management) ⭐ NEW           │
│  - Calls /auth/token to create tokens               │
│  - Calls /auth/validate to check tokens             │
│  - Automatic refresh before expiry                  │
│  - Stores tokens in localStorage                    │
└─────────────────────────────────────────────────────┘
                    ↓ calls
┌─────────────────────────────────────────────────────┐
│  Your Backend JWT Endpoints                         │
│  - POST /auth/token                                 │
│  - POST /auth/validate                              │
└─────────────────────────────────────────────────────┘
```

## 🔄 Token Lifecycle Flow

```
┌──────────────────────────────────────────────────┐
│  1. User Opens Chat                              │
│     ↓                                            │
│  2. JwtAuthService checks localStorage           │
│     ↓                                            │
│  3. If token exists → Validate it                │
│     ↓                                            │
│  4. If valid → Use existing token                │
│     If invalid/expired → Create new token        │
│     ↓                                            │
│  5. Start background monitoring (every 60s)      │
└──────────────────────────────────────────────────┘
                    ↓
┌──────────────────────────────────────────────────┐
│  User Sends Message                              │
│     ↓                                            │
│  getValidToken(userId) called                    │
│     ↓                                            │
│  Check if token exists and expiry time           │
│     ↓                                            │
│  If < 5 minutes remaining:                       │
│     → Call POST /auth/validate                   │
│     → If valid: Call POST /auth/token (refresh)  │
│     → If invalid: Call POST /auth/token (new)    │
│     ↓                                            │
│  Include token in Authorization header           │
│     ↓                                            │
│  Send chat request                               │
└──────────────────────────────────────────────────┘
                    ↓
┌──────────────────────────────────────────────────┐
│  Background Monitoring (every 60 seconds)        │
│     ↓                                            │
│  checkAndRefreshToken() called                   │
│     ↓                                            │
│  Check token expiry time                         │
│     ↓                                            │
│  If < 5 minutes remaining:                       │
│     → Call POST /auth/validate                   │
│     → Call POST /auth/token (refresh)            │
│     ↓                                            │
│  User continues without interruption             │
└──────────────────────────────────────────────────┘
```

## 📦 New Service: JwtAuthService

### Key Methods

```typescript
// Create or get a token
await jwtAuthService.createToken(userId, expiresInHours);

// Validate a token
await jwtAuthService.validateToken(token);

// Get a valid token (auto-creates/refreshes)
const token = await jwtAuthService.getValidToken(userId);

// Check and refresh if needed (background)
await jwtAuthService.checkAndRefreshToken(userId);

// Login (creates token)
await jwtAuthService.login(userId, expiresInHours);

// Logout (clears token)
jwtAuthService.logout();
```

### Token Storage

Tokens are stored in localStorage with:
- `jwt_token` - The full token object
- `user_id` - The user's ID
- `token_issued_at` - Timestamp when token was created

This allows the service to calculate expiry times and refresh proactively.

## 🚀 How to Use

### 1. **Setup Configuration**

Edit `src/environments/environment.ts`:

```typescript
export const environment = {
  production: false,
  
  apiUrl: 'http://localhost:3000/api',  // Your chat API
  authUrl: 'http://localhost:8000',     // Your JWT auth API ⭐
  
  jwt: {
    defaultExpiryHours: 24,
    storageKey: 'jwt_token',
  },
};
```

### 2. **Login User**

When a user first arrives, create a token for them:

```typescript
import { inject } from '@angular/core';
import { JwtAuthService } from './services/jwt-auth.service';

export class YourComponent {
  authService = inject(JwtAuthService);
  
  async onUserLogin() {
    const userId = 'john-doe'; // Your user's ID
    
    // Create token automatically
    await this.authService.login(userId, 24); // 24 hours
    
    // Token is now stored and ready to use!
    console.log('✅ User logged in:', this.authService.userId());
  }
}
```

### 3. **Use Chat**

Once the user has a token, they can chat:

```typescript
import { inject } from '@angular/core';
import { AiChatService } from './services/ai-chat.service';

export class ChatComponent {
  chatService = inject(AiChatService);
  
  async sendMessage(text: string) {
    // Token is automatically included!
    await this.chatService.sendMessage(text);
  }
}
```

**That's it!** The system handles everything else automatically.

## 🔧 Configuration Options

### Token Expiry

Change default token expiry time:

```typescript
// In environment.ts
jwt: {
  defaultExpiryHours: 48, // 48 hours instead of 24
}
```

Or when creating token:

```typescript
await authService.createToken(userId, 72); // 72 hours
```

### Refresh Timing

Change when tokens are refreshed:

```typescript
// In environment.ts
chat: {
  tokenRefreshBuffer: 10 * 60 * 1000, // Refresh 10 min before expiry
}
```

### Monitoring Frequency

Change how often the system checks tokens:

```typescript
// In environment.ts
chat: {
  monitoringInterval: 30000, // Check every 30 seconds
}
```

## 🧪 Testing the Custom JWT System

### Test 1: Create Token

```typescript
// In browser console
const authService = inject(JwtAuthService);
await authService.createToken('test-user', 24);
console.log('Token:', authService.getToken());
```

### Test 2: Validate Token

```typescript
const validation = await authService.validateToken();
console.log('Valid:', validation.valid);
console.log('Expires:', validation.expires_at);
```

### Test 3: Token Auto-Refresh

1. Create a token with 1 hour expiry
2. Wait ~55 minutes
3. Send a message
4. Check console - should see automatic refresh

### Test 4: Check Network Requests

1. Open DevTools → Network tab
2. Send a chat message
3. Look for these requests:
   - `POST /auth/validate` (validation check)
   - `POST /auth/token` (if refresh needed)
   - `POST /api/chat` (with Bearer token)

## 💡 Example: Complete User Flow

```typescript
// 1. User opens app
import { Component, OnInit, inject } from '@angular/core';
import { JwtAuthService } from './services/jwt-auth.service';
import { AiChatService } from './services/ai-chat.service';

@Component({
  selector: 'app-chat',
  template: `
    <div>
      <button (click)="login()">Login</button>
      <button (click)="sendMessage()">Send Message</button>
      <div *ngIf="authService.isAuthenticated()">
        Logged in as: {{ authService.userId() }}
      </div>
    </div>
  `
})
export class ChatComponent implements OnInit {
  authService = inject(JwtAuthService);
  chatService = inject(AiChatService);
  
  async ngOnInit() {
    // Check if user already has a token
    if (this.authService.isAuthenticated()) {
      console.log('✅ User already authenticated');
      
      // Optionally validate the token
      const validation = await this.authService.validateToken();
      if (!validation.valid) {
        console.log('⚠️ Token invalid, user needs to login');
      }
    }
  }
  
  async login() {
    // Get user ID from your app (e.g., from login form)
    const userId = 'john-doe';
    
    try {
      // Create token automatically
      await this.authService.login(userId, 24);
      console.log('✅ Logged in successfully');
    } catch (error) {
      console.error('❌ Login failed:', error);
    }
  }
  
  async sendMessage() {
    if (!this.authService.isAuthenticated()) {
      console.log('⚠️ User not authenticated');
      return;
    }
    
    try {
      // Token is automatically included!
      await this.chatService.sendMessage('Hello, AI!');
      console.log('✅ Message sent');
    } catch (error) {
      console.error('❌ Error sending message:', error);
    }
  }
}
```

## 🔒 Security Considerations

### Token Storage

- ✅ Tokens stored in localStorage
- ✅ Automatically cleared on logout
- ✅ Validated before use
- ✅ Refreshed before expiry

**Note:** For production, consider using:
- HttpOnly cookies (more secure than localStorage)
- Shorter token expiry times (1-2 hours)
- Refresh token mechanism

### Token Transmission

- ✅ Sent via `Authorization: Bearer` header
- ✅ Never in URL parameters
- ✅ HTTPS required in production

### Backend Validation

Your backend should:
- ✅ Verify JWT signature
- ✅ Check expiry time
- ✅ Validate user_id
- ✅ Return 401 for invalid tokens

## 🐛 Troubleshooting

### Issue: "Failed to create token"

**Check:**
1. Is auth backend running? (`http://localhost:8000`)
2. Is CORS configured?
3. Is the endpoint correct?

**Solution:**
```typescript
// Check environment.ts
authUrl: 'http://localhost:8000', // Should match your backend
```

### Issue: Token not persisting

**Check:**
1. localStorage is enabled in browser
2. No browser extensions blocking localStorage

**Solution:**
```typescript
// Check localStorage in browser console
localStorage.getItem('jwt_token');
```

### Issue: Token constantly refreshing

**Cause:** Token expiry time too short or system clock mismatch

**Solution:**
```typescript
// Increase token expiry
await authService.createToken(userId, 48); // 48 hours

// Or adjust refresh buffer
chat: {
  tokenRefreshBuffer: 10 * 60 * 1000, // 10 minutes
}
```

### Issue: 401 errors

**Check:**
1. Token format is correct
2. Backend is validating tokens properly
3. Token hasn't expired

**Solution:**
```typescript
// Validate token manually
const validation = await authService.validateToken();
console.log('Token valid:', validation);
```

## 📊 Comparison: Supabase vs Custom JWT

| Feature | Supabase Auth | Custom JWT (Your System) |
|---------|---------------|--------------------------|
| Token Creation | Automatic on login | Call `/auth/token` |
| Token Storage | Managed by Supabase | localStorage (manual) |
| Token Refresh | Built-in refresh tokens | Manual refresh via `/auth/token` |
| Validation | Automatic | Call `/auth/validate` |
| User Management | Full user system | Basic user_id only |
| Session Management | Built-in | Manual via localStorage |

**Your system is simpler and gives you full control!** ✨

## 🎯 Benefits of Custom JWT System

### Advantages:

1. ✅ **Full Control** - You own the auth logic
2. ✅ **Simpler** - No external dependencies
3. ✅ **Flexible** - Custom expiry times
4. ✅ **Transparent** - You can see exactly what's happening
5. ✅ **Cost-effective** - No third-party service costs

### Trade-offs:

1. ⚠️ **Manual Refresh** - You implement refresh logic (but we did it!)
2. ⚠️ **Security** - You're responsible for JWT security
3. ⚠️ **User Management** - No built-in user features

**But we've handled all the complex parts for you!** 🎉

## 📚 Quick Reference

### JwtAuthService API

```typescript
// Login
await authService.login(userId, hours);

// Logout
authService.logout();

// Get token
const token = authService.getToken();

// Check authentication
const isAuth = authService.isAuth();

// Get user ID
const userId = authService.userId();

// Get token expiry
const expiry = authService.getTokenExpiry();

// Validate token
const valid = await authService.validateToken();

// Get valid token (auto-refresh)
const token = await authService.getValidToken(userId);
```

### Configuration

```typescript
// environment.ts
{
  authUrl: 'http://localhost:8000',
  jwt: {
    defaultExpiryHours: 24,
    storageKey: 'jwt_token',
  },
  chat: {
    tokenRefreshBuffer: 5 * 60 * 1000,
    monitoringInterval: 60000,
  }
}
```

## 🎉 Summary

Your chat system now uses **your custom JWT endpoints** with:

1. ✅ **Automatic token creation** via `/auth/token`
2. ✅ **Automatic token validation** via `/auth/validate`
3. ✅ **Proactive refresh** before expiry
4. ✅ **Background monitoring** every 60 seconds
5. ✅ **Defensive retry** on 401 errors
6. ✅ **localStorage persistence**
7. ✅ **Seamless user experience**

**Users can chat without ever thinking about tokens!** 🚀

## 🔗 Related Documentation

- [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md) - Complete overview
- [AI_CHAT_SETUP_GUIDE.md](./AI_CHAT_SETUP_GUIDE.md) - Setup guide
- [TOKEN_FLOW_DIAGRAM.md](./TOKEN_FLOW_DIAGRAM.md) - Visual diagrams

---

**You're all set!** Just make sure your auth backend is running on port 8000, and the chat system will handle everything else automatically. 🎊


