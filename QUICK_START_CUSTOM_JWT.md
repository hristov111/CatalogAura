# 🚀 Quick Start - Custom JWT System

## Ready in 3 Steps!

Your AI Chat is now integrated with your custom JWT authentication endpoints. Here's how to get started:

## Step 1: Configure Environment (2 minutes)

Edit `src/environments/environment.ts`:

```typescript
export const environment = {
  production: false,
  
  // Your endpoints
  apiUrl: 'http://localhost:3000/api',  // Chat API
  authUrl: 'http://localhost:8000',     // JWT Auth API ⭐
  
  jwt: {
    defaultExpiryHours: 24,
  },
};
```

**That's it!** ✅

## Step 2: Start Your Backend (1 minute)

Make sure both services are running:

```bash
# Terminal 1: JWT Auth Service (port 8000)
# Your existing auth service with endpoints:
# - POST /auth/token
# - POST /auth/validate

# Terminal 2: Chat API Service (port 3000)  
# Your existing chat API service

# Terminal 3: Angular Dev Server (port 4200)
npm start
# or
ng serve
```

**All services running!** ✅

## Step 3: Login and Chat (30 seconds)

### Option A: Use Existing Profile Chat

Navigate to any profile:
```
http://localhost:4200/profile/1
```

The chat component will automatically:
1. Check for existing token in localStorage
2. Create one if needed via `/auth/token`
3. Start background monitoring
4. You can start chatting!

### Option B: Manual Login First

Add login functionality to your component:

```typescript
import { inject } from '@angular/core';
import { JwtAuthService } from './services/jwt-auth.service';

export class YourComponent {
  authService = inject(JwtAuthService);
  
  async ngOnInit() {
    // Login with user ID
    await this.authService.login('john-doe', 24);
    
    // User is now authenticated!
    console.log('✅ Logged in:', this.authService.userId());
  }
}
```

**User authenticated!** ✅

## 🎉 You're Done!

Open a profile page and start chatting. The system handles everything automatically:

- ✅ Token creation
- ✅ Token validation
- ✅ Token refresh
- ✅ Background monitoring
- ✅ Error recovery

## 🧪 Quick Test

### 1. Test Token Creation

Open browser console:

```javascript
// Get auth service
const authService = /* inject JwtAuthService */;

// Create token
await authService.login('test-user', 24);

// Check it worked
console.log('Token:', authService.getToken());
console.log('User:', authService.userId());
console.log('Authenticated:', authService.isAuth());
```

### 2. Test Chat

1. Navigate to: `http://localhost:4200/profile/1`
2. Type a message
3. Click Send
4. Watch the response stream in!

### 3. Verify Network Requests

Open DevTools → Network tab:

1. Send a message
2. Look for these requests:
   - `POST /auth/token` or `POST /auth/validate` ✅
   - `POST /api/chat` (with `Authorization: Bearer ...`) ✅

## 🔑 How Token Management Works

```
User opens chat
    ↓
JwtAuthService checks localStorage for existing token
    ↓
    ├─ If token exists:
    │   ├─ Check if expired
    │   ├─ If valid → Use it
    │   └─ If expired → Create new one via POST /auth/token
    │
    └─ If no token:
        └─ User needs to login (call authService.login())
    ↓
Start background monitoring (every 60s)
    ↓
User sends message
    ↓
getValidToken() automatically:
    ├─ Checks expiry time
    ├─ If < 5 min remaining → Refresh via POST /auth/token
    └─ Returns valid token
    ↓
Token included in Authorization header
    ↓
Message sent to chat API
    ↓
If 401 error → Automatic retry with refreshed token
    ↓
User continues chatting seamlessly! ✨
```

## 💡 Common Use Cases

### Use Case 1: Guest Chat

Allow guests to chat without registration:

```typescript
async enableGuestChat() {
  // Generate guest ID
  const guestId = `guest-${Date.now()}`;
  
  // Create token for guest
  await this.authService.login(guestId, 24);
  
  // Guest can now chat!
}
```

### Use Case 2: Persistent User

User returns after closing browser:

```typescript
async ngOnInit() {
  // Check if user already has token
  if (this.authService.isAuthenticated()) {
    // Validate it's still good
    const validation = await this.authService.validateToken();
    
    if (validation.valid) {
      console.log('✅ Welcome back!');
      // User can continue chatting
    } else {
      console.log('⚠️ Token expired, please login again');
      // Show login form
    }
  }
}
```

### Use Case 3: Different Token Expiry Per User Type

```typescript
async login(userType: 'free' | 'premium') {
  const userId = this.getUserId();
  
  // Different expiry times
  const hours = userType === 'premium' ? 168 : 24; // 7 days vs 1 day
  
  await this.authService.login(userId, hours);
}
```

## 🛠️ Customization

### Change Refresh Timing

```typescript
// environment.ts
chat: {
  tokenRefreshBuffer: 10 * 60 * 1000, // Refresh 10 min before expiry
}
```

### Change Monitoring Frequency

```typescript
// environment.ts
chat: {
  monitoringInterval: 30000, // Check every 30 seconds
}
```

### Change Default Token Expiry

```typescript
// environment.ts
jwt: {
  defaultExpiryHours: 48, // 48 hours instead of 24
}
```

## 🐛 Troubleshooting

### Problem: "Failed to create token"

**Solution:**
```bash
# Check if auth service is running
curl http://localhost:8000/auth/token

# If not running, start it
# [Your command to start auth service]
```

### Problem: "No token and no user ID"

**Solution:**
```typescript
// User needs to login first
await authService.login('user-id', 24);
```

### Problem: Token keeps expiring

**Solution:**
```typescript
// Increase token expiry time
await authService.login('user-id', 48); // 48 hours
```

### Problem: 401 errors

**Solution:**
```typescript
// Validate token
const validation = await authService.validateToken();
console.log('Token valid:', validation);

// If invalid, create new one
if (!validation.valid) {
  await authService.login('user-id', 24);
}
```

## 📚 Full Documentation

- **[CUSTOM_JWT_SETUP.md](./CUSTOM_JWT_SETUP.md)** - Complete custom JWT guide
- **[UPDATED_IMPLEMENTATION_SUMMARY.md](./UPDATED_IMPLEMENTATION_SUMMARY.md)** - What changed and why
- **[AI_CHAT_SETUP_GUIDE.md](./AI_CHAT_SETUP_GUIDE.md)** - General chat setup
- **[TOKEN_FLOW_DIAGRAM.md](./TOKEN_FLOW_DIAGRAM.md)** - Visual diagrams

## ✅ Checklist

Before going to production:

- [ ] Auth service running on correct port
- [ ] Chat API service running
- [ ] Environment URLs configured correctly
- [ ] CORS configured on backend
- [ ] HTTPS enabled in production
- [ ] Token expiry time appropriate for your use case
- [ ] Error handling tested
- [ ] Token refresh tested
- [ ] User login flow implemented

## 🎊 Success!

Your AI Chat with automatic JWT token management is ready!

**Key Points:**
1. ✅ Users login once via `authService.login(userId)`
2. ✅ Tokens are managed automatically after that
3. ✅ Background monitoring keeps tokens fresh
4. ✅ Users can chat without thinking about auth

**Go test it now!** 🚀

---

Questions? Check the documentation files or look at the implementation in:
- `src/services/jwt-auth.service.ts` - Token management
- `src/services/ai-chat.service.ts` - Chat with auto-token inclusion
- `src/components/profile-detail/profile-chat/` - Chat UI

**Happy chatting!** 🎉


