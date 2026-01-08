# JWT Token Management Strategy

## Overview

The AI Chat system implements **seamless, automatic JWT token management** so users never need to think about authentication. The system handles token creation, refresh, and expiration monitoring entirely in the background.

## The User Experience

```
1. User opens chat page
   ↓
2. System checks for existing session (automatic)
   ↓
3. If session exists → Verify token validity
   ↓
4. If token expired → Auto-refresh (transparent)
   ↓
5. User sends message → Token included automatically
   ↓
6. Background monitoring checks expiry every minute
   ↓
7. Proactive refresh 5 minutes before expiry
   ↓
8. If 401 error occurs → Defensive retry with refresh
   ↓
9. User chats seamlessly without manual intervention ✨
```

## Architecture

### Components

1. **AuthService** (`src/services/auth.service.ts`)
   - Manages Supabase authentication
   - Provides `getToken()` and `refreshSession()` methods
   - Monitors auth state changes

2. **AiChatService** (`src/services/ai-chat.service.ts`)
   - Handles all AI chat functionality
   - Implements automatic token management
   - Manages SSE streaming connections

3. **ProfileChatComponent** (`src/components/profile-detail/profile-chat/`)
   - UI component for chat interface
   - Uses AiChatService for all operations
   - No direct token handling needed

## Token Management Strategy

### 1. Automatic Token Retrieval

```typescript
// In AiChatService
private async getValidToken(): Promise<string | null> {
  // 1. Try to get current token from Supabase session
  let token = await this.authService.getToken();
  
  // 2. If no token, user needs to login
  if (!token) {
    this.handleAuthError();
    return null;
  }
  
  // 3. Check if token is still valid
  const session = await this.authService.getSession();
  const expiresAt = session.expires_at * 1000;
  const now = Date.now();
  
  // 4. If expired or about to expire, refresh it
  if (expiresAt <= now + TOKEN_REFRESH_BUFFER) {
    const result = await this.authService.refreshSession();
    token = result.data?.session?.access_token;
  }
  
  return token;
}
```

### 2. Proactive Monitoring (Background)

```typescript
// Runs every minute
private async checkAndRefreshToken(): Promise<void> {
  const session = await this.authService.getSession();
  const expiresAt = session.expires_at * 1000;
  const timeUntilExpiry = expiresAt - Date.now();
  
  // Refresh 5 minutes before expiry
  if (timeUntilExpiry < TOKEN_REFRESH_BUFFER) {
    await this.authService.refreshSession();
  }
}
```

### 3. Defensive Error Handling

```typescript
// In sendMessage()
try {
  await this.streamChat(message, token, profileId);
} catch (error) {
  // Handle 401 errors defensively
  if (error.message.includes('401')) {
    const result = await this.authService.refreshSession();
    
    if (result.success) {
      // Retry with new token
      const newToken = await this.authService.getToken();
      await this.streamChat(message, newToken, profileId);
      return;
    }
  }
  
  this.handleAuthError();
}
```

## How It Works

### Step-by-Step Flow

#### 1. **User Sends Message**
```typescript
// User clicks send button
await this.chatService.sendMessage(message, profileId);
```

#### 2. **Service Gets Valid Token**
```typescript
// Automatically retrieves and validates token
const token = await this.getValidToken();

// Checks:
// - Does session exist?
// - Is token expired?
// - Is token about to expire?
// - Refreshes if needed
```

#### 3. **Makes API Request**
```typescript
const response = await fetch(`${apiUrl}/chat`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`, // Auto-included
  },
  body: JSON.stringify(body),
});
```

#### 4. **Handles Response**
```typescript
if (response.status === 401) {
  // Defensive handling
  await refreshSession();
  // Retry automatically
}
```

#### 5. **Background Monitoring**
```typescript
// Every 60 seconds
setInterval(async () => {
  await this.checkAndRefreshToken();
}, 60000);
```

## Token Lifecycle

```
┌─────────────────────────────────────────────────────┐
│  User Logs In (via AuthService)                    │
│  ↓                                                  │
│  Supabase creates session with JWT token           │
│  ↓                                                  │
│  Token stored in Supabase session (automatic)      │
└─────────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────┐
│  User Opens Chat                                    │
│  ↓                                                  │
│  AiChatService initializes                         │
│  ↓                                                  │
│  Starts background monitoring (every 60s)          │
└─────────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────┐
│  User Sends Message                                 │
│  ↓                                                  │
│  Service calls getValidToken()                     │
│  ↓                                                  │
│  Checks token validity                             │
│  ↓                                                  │
│  Refreshes if needed (< 5 min to expiry)          │
│  ↓                                                  │
│  Includes token in API request                     │
└─────────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────┐
│  Background Check (every minute)                    │
│  ↓                                                  │
│  If expiring soon → Refresh proactively            │
│  ↓                                                  │
│  User continues chatting without interruption      │
└─────────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────┐
│  If API Returns 401                                 │
│  ↓                                                  │
│  Service catches error                             │
│  ↓                                                  │
│  Attempts refresh                                  │
│  ↓                                                  │
│  Retries request with new token                    │
│  ↓                                                  │
│  If refresh fails → Redirect to login              │
└─────────────────────────────────────────────────────┘
```

## Configuration

### Token Refresh Buffer

```typescript
// Refresh token 5 minutes before expiry (configurable)
private readonly TOKEN_REFRESH_BUFFER = 5 * 60 * 1000; // 5 minutes in ms
```

### Monitoring Interval

```typescript
// Check token every minute (configurable)
setInterval(async () => {
  await this.checkAndRefreshToken();
}, 60000); // 60 seconds
```

## Security Considerations

### 1. Token Storage
- Tokens are stored in Supabase session (in-memory + localStorage)
- Never stored in component state or service state
- Always retrieved fresh from AuthService

### 2. Token Transmission
- Always sent via `Authorization: Bearer` header
- Never sent in URL parameters
- HTTPS required in production

### 3. Token Refresh
- Uses Supabase's built-in refresh token mechanism
- Refresh tokens are httpOnly cookies (secure)
- Automatic rotation on refresh

### 4. Error Handling
- 401 errors trigger automatic retry
- Failed refreshes redirect to login
- No sensitive error messages exposed to user

## Backend Requirements

### 1. Authentication Middleware

```javascript
// backend/authMiddleware.js
const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing authorization' });
  }
  
  const token = authHeader.split(' ')[1];
  
  // Verify with Supabase
  const { data: { user }, error } = await supabase.auth.getUser(token);
  
  if (error || !user) {
    return res.status(401).json({ error: 'Invalid token' });
  }
  
  req.user = user;
  next();
};
```

### 2. API Endpoints

All protected endpoints should:
1. Expect `Authorization: Bearer <token>` header
2. Return 401 for invalid/expired tokens
3. Include CORS headers for frontend origin

## Usage in Components

### Simple Usage

```typescript
import { inject } from '@angular/core';
import { AiChatService } from '../services/ai-chat.service';

export class ChatComponent {
  chatService = inject(AiChatService);
  
  async sendMessage(text: string) {
    // That's it! Token handling is automatic
    await this.chatService.sendMessage(text);
  }
}
```

### No Manual Token Management Needed

```typescript
// ❌ DON'T DO THIS - No need!
const token = await this.authService.getToken();
await this.chatService.sendMessage(text, token);

// ✅ DO THIS - Service handles tokens automatically
await this.chatService.sendMessage(text);
```

## Error Scenarios

### Scenario 1: Token Expired During Chat

```
1. User is chatting
2. Token expires
3. Background check detects expiry
4. Automatically refreshes token
5. User continues chatting (no interruption)
```

### Scenario 2: Network Interruption During Refresh

```
1. Background refresh fails (network error)
2. User sends message
3. getValidToken() attempts refresh again
4. If successful → Message sent
5. If failed → Show error, may redirect to login
```

### Scenario 3: Session Completely Expired

```
1. User hasn't used app in days
2. Refresh token expired
3. getValidToken() returns null
4. handleAuthError() called
5. AuthService redirects to login
6. User logs in again
7. New session created
```

## Testing the Implementation

### 1. Test Token Refresh

```typescript
// In browser console
// Manually expire the token and see auto-refresh
const expiryTime = Date.now() + 60000; // 1 minute
// Send message before expiry → Should auto-refresh
```

### 2. Test 401 Handling

```typescript
// Temporarily modify backend to return 401
// Observe automatic retry with refreshed token
```

### 3. Test Background Monitoring

```typescript
// Open chat and wait 5 minutes
// Check network tab → Should see refresh before expiry
```

## Benefits of This Approach

### ✅ User Experience
- Seamless authentication
- No manual token handling
- No interruptions during use
- Automatic recovery from errors

### ✅ Security
- Short-lived access tokens
- Automatic rotation
- Secure storage via Supabase
- Protection against token expiry

### ✅ Developer Experience
- Simple API - just call `sendMessage()`
- No token management in components
- Centralized error handling
- Easy to test and maintain

### ✅ Reliability
- Proactive refresh (prevents expiry)
- Defensive error handling (recovers from errors)
- Background monitoring (always ready)
- Automatic retry logic

## Troubleshooting

### Issue: "Authentication required" error

**Cause:** User not logged in

**Solution:** 
```typescript
// Check if user is authenticated
if (!this.authService.isAuthenticated()) {
  this.router.navigate(['/auth/login']);
}
```

### Issue: Constant 401 errors

**Cause:** Backend not accepting Supabase tokens

**Solution:**
- Verify backend authMiddleware is using Supabase's `getUser(token)`
- Check Supabase credentials match between frontend and backend
- Ensure CORS headers allow Authorization header

### Issue: Token not refreshing

**Cause:** Refresh token expired

**Solution:**
- User needs to login again
- Check Supabase project settings for refresh token expiry time
- Consider extending refresh token lifetime

## Future Enhancements

1. **Token Prefetching**: Refresh token before user action to reduce latency
2. **Offline Queue**: Queue messages when offline, send when connection restored
3. **Token Metrics**: Track refresh frequency for monitoring
4. **Custom Refresh Strategy**: Allow per-user refresh policies
5. **Multi-Tab Sync**: Coordinate token refresh across browser tabs

## Conclusion

This implementation provides a **production-ready, user-friendly authentication system** that handles all token management automatically. Users can focus on chatting while the system ensures secure, uninterrupted access to the API.

The combination of **proactive monitoring** (background checks) and **defensive handling** (401 retry) creates a robust system that gracefully handles all token lifecycle scenarios.


