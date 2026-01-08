# AI Chat Setup Guide

This guide will help you get the AI Chat feature up and running with automatic JWT token management.

## ✅ What's Been Implemented

### 1. **AI Chat Service** (`src/services/ai-chat.service.ts`)
- ✅ Automatic JWT token management
- ✅ SSE streaming support
- ✅ Thinking steps visualization
- ✅ Background token monitoring
- ✅ Proactive token refresh (5 min before expiry)
- ✅ Defensive 401 error handling with retry
- ✅ Age verification support
- ✅ Conversation management

### 2. **Profile Chat Component** (`src/components/profile-detail/profile-chat/`)
- ✅ Full chat UI implementation
- ✅ Real-time message streaming
- ✅ Typing indicators
- ✅ Collapsible thinking panel
- ✅ Connection status indicator
- ✅ Welcome messages
- ✅ Error handling
- ✅ Responsive design

### 3. **JWT Token Management**
- ✅ Auto-retrieval from Supabase session
- ✅ Auto-refresh before expiry
- ✅ Background monitoring every 60 seconds
- ✅ Defensive retry on 401 errors
- ✅ Seamless user experience

## 📋 Prerequisites

### Backend Requirements

Your backend should already have:
- ✅ Supabase authentication configured
- ✅ `/api/chat` endpoint with SSE streaming
- ✅ Auth middleware validating JWT tokens

### Frontend Requirements

Your frontend should have:
- ✅ Angular 21+ (already installed)
- ✅ Supabase client library (already installed)
- ✅ AuthService configured (already implemented)

## 🚀 Quick Start

### Step 1: Test the Chat Component

The chat component is already integrated into your profile detail page. Just navigate to a profile:

```
http://localhost:4200/profile/[profile-id]
```

### Step 2: Verify Authentication

Make sure you're logged in:

1. If not logged in, navigate to `/auth/login`
2. Login with your credentials
3. Navigate back to a profile page
4. The chat should work automatically!

### Step 3: Configure API URL (if needed)

If your backend is not at `http://localhost:3000`, update the config:

```typescript
// In src/services/ai-chat.service.ts (line ~43)
readonly config = signal<ChatConfig>({
  apiUrl: 'http://your-backend-url/api', // Update this
  maxMessageLength: 5000,
  autoScroll: true,
  showTimestamps: true,
  thinkingPanelVisible: false,
});
```

Or set it dynamically in your component:

```typescript
constructor() {
  this.chatService.updateConfig({
    apiUrl: environment.apiUrl // From your environment file
  });
}
```

## 🧪 Testing JWT Token Management

### Test 1: Verify Token Auto-Inclusion

1. Open browser DevTools → Network tab
2. Send a message in the chat
3. Look for the `/api/chat` request
4. Check the Headers tab
5. You should see: `Authorization: Bearer eyJ...`

**Expected:** Token is automatically included without any manual code.

### Test 2: Verify Background Monitoring

1. Open browser console
2. You should see periodic logs like:
   ```
   🔄 Token expiring soon, refreshing...
   ✅ Token refreshed successfully
   ```

**Expected:** Token refresh happens automatically in the background.

### Test 3: Verify 401 Error Handling

To test defensive handling:

1. Temporarily modify backend to return 401
2. Send a message
3. Observe in console:
   ```
   🔐 Received 401, attempting token refresh...
   ✅ Token refreshed
   [Request automatically retried]
   ```

**Expected:** System automatically recovers from 401 errors.

### Test 4: Verify Proactive Refresh

1. Wait until your token is ~5 minutes from expiring
2. Check the console
3. You should see automatic refresh

**Expected:** Token refreshes before it expires (proactive).

## 🔧 Configuration Options

### Token Refresh Timing

Adjust when tokens are refreshed (default: 5 minutes before expiry):

```typescript
// In ai-chat.service.ts
private readonly TOKEN_REFRESH_BUFFER = 5 * 60 * 1000; // Adjust this
```

### Monitoring Interval

Change how often the system checks token expiry (default: every minute):

```typescript
// In ai-chat.service.ts (line ~70)
setInterval(async () => {
  await this.checkAndRefreshToken();
}, 60000); // Adjust this (in milliseconds)
```

### Chat Features

Toggle features via config:

```typescript
chatService.updateConfig({
  autoScroll: true,           // Auto-scroll to latest message
  showTimestamps: true,       // Show message timestamps
  thinkingPanelVisible: false, // Show/hide thinking panel
  maxMessageLength: 5000,     // Max characters per message
});
```

## 🎨 Customization

### Update Chat Styles

Edit `profile-chat.component.css` to match your design:

```css
/* Change message colors */
.bg-[var(--accent)] {
  /* Your custom color */
}

/* Adjust thinking panel width */
.w-80 {
  width: 25rem; /* Adjust width */
}
```

### Add Custom Thinking Steps

When implementing backend, send thinking events like this:

```javascript
// Backend SSE event
res.write(`data: ${JSON.stringify({
  type: 'thinking',
  step: 'custom_step_name',
  data: {
    message: 'Processing your request...',
    // Additional data for display
  }
})}\n\n`);
```

The frontend will automatically display it in the thinking panel!

### Customize Icons

Update step icons in `ai-chat.service.ts`:

```typescript
// In getStepInfo() method
case 'your_custom_step':
  info.icon = '🎯'; // Your custom emoji
  info.title = 'Custom Action';
  break;
```

## 🐛 Troubleshooting

### Issue: Chat not connecting

**Check:**
1. Is the backend running? (`http://localhost:3000`)
2. Is the user logged in? (check `authService.isAuthenticated()`)
3. Is CORS configured on backend?

**Solution:**
```typescript
// Backend CORS config (backend/index.js)
app.use(cors({
  origin: 'http://localhost:4200',
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
```

### Issue: Messages not streaming

**Check:**
1. Is backend returning `Content-Type: text/event-stream`?
2. Are SSE events formatted correctly?

**Solution:**
```javascript
// Backend should set headers
res.setHeader('Content-Type', 'text/event-stream');
res.setHeader('Cache-Control', 'no-cache');
res.setHeader('Connection', 'keep-alive');
```

### Issue: 401 Unauthorized errors

**Check:**
1. Is Supabase configured correctly?
2. Do frontend and backend use same Supabase project?
3. Is authMiddleware verifying tokens correctly?

**Solution:**
```javascript
// Backend authMiddleware.js should use:
const { data: { user }, error } = await supabase.auth.getUser(token);
```

### Issue: Token not refreshing automatically

**Check:**
1. Is the user's refresh token valid?
2. Is Supabase auth properly configured?

**Solution:**
- User may need to login again
- Check Supabase dashboard for session settings

## 📱 Mobile Considerations

The chat is responsive, but for better mobile UX:

1. **Hide thinking panel on mobile** (already implemented in CSS)
2. **Adjust textarea size** for better keyboard experience
3. **Consider haptic feedback** on message send

## 🔒 Security Best Practices

### ✅ Already Implemented

1. ✅ Tokens never exposed in URLs
2. ✅ Tokens sent via Authorization header only
3. ✅ Automatic token refresh before expiry
4. ✅ Secure storage via Supabase session
5. ✅ No manual token handling in components

### 🚨 Additional Recommendations

1. **Use HTTPS in production**
   ```typescript
   // In environment.prod.ts
   apiUrl: 'https://your-domain.com/api'
   ```

2. **Implement rate limiting** (backend)
   ```javascript
   // Already in backend/middleware/rateLimiter.js
   ```

3. **Monitor token refresh frequency**
   - Add analytics to track refresh patterns
   - Alert on excessive refresh attempts

4. **Set appropriate token expiry times**
   - Access token: 15-60 minutes
   - Refresh token: 7-30 days

## 📊 Monitoring & Analytics

### Add Tracking for Token Events

```typescript
// In ai-chat.service.ts
private async checkAndRefreshToken(): Promise<void> {
  // ... existing code ...
  
  if (result.success) {
    console.log('✅ Token refreshed successfully');
    
    // Track refresh event
    this.analytics.track('token_refresh_success', {
      timestamp: Date.now(),
      proactive: true
    });
  }
}
```

### Monitor Chat Usage

```typescript
async sendMessage(message: string, profileId?: number): Promise<void> {
  // Track message sent
  this.analytics.track('chat_message_sent', {
    profileId,
    messageLength: message.length,
    timestamp: Date.now()
  });
  
  // ... existing code ...
}
```

## 🎯 Next Steps

### Immediate
1. ✅ Test the chat functionality
2. ✅ Verify token management is working
3. ✅ Check that messages are streaming correctly

### Short-term
- [ ] Customize the UI to match your brand
- [ ] Add custom thinking steps for your backend
- [ ] Implement analytics tracking
- [ ] Test on mobile devices

### Long-term
- [ ] Add message persistence (save to database)
- [ ] Implement typing indicators for both sides
- [ ] Add file upload support
- [ ] Implement message reactions
- [ ] Add read receipts
- [ ] Multi-language support

## 💡 Usage Tips

### 1. Pre-load Chat Service

For faster first message:

```typescript
// In app.component.ts or profile-detail.component.ts
constructor() {
  inject(AiChatService); // Pre-load the service
}
```

### 2. Show Connection Status

Already implemented! The status dot shows:
- 🔴 Disconnected (gray)
- 🟢 Connected (green)
- 🔵 Processing (blue, pulsing)

### 3. Enable Debug Logging

For development, add more logging:

```typescript
// In ai-chat.service.ts
private async getValidToken(): Promise<string | null> {
  console.log('🔍 Getting valid token...');
  // ... existing code ...
  console.log('✅ Token obtained:', token.substring(0, 20) + '...');
}
```

### 4. Handle Slow Networks

The system already handles:
- ✅ Connection timeouts
- ✅ Retry logic
- ✅ Error recovery

But you can add offline detection:

```typescript
if (!navigator.onLine) {
  throw new Error('You are offline. Please check your connection.');
}
```

## 📚 Additional Resources

- [JWT Token Management Strategy](./JWT_TOKEN_MANAGEMENT.md) - Detailed explanation
- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
- [SSE Streaming Guide](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events)

## ✨ Summary

You now have a **production-ready AI chat system** with:

1. ✅ **Seamless authentication** - Users never think about tokens
2. ✅ **Real-time streaming** - Messages appear as they're generated
3. ✅ **Thinking visualization** - Users see AI's thought process
4. ✅ **Automatic recovery** - System handles errors gracefully
5. ✅ **Beautiful UI** - Modern, responsive design
6. ✅ **Type-safe** - Full TypeScript support

**Just navigate to a profile and start chatting!** 🚀


