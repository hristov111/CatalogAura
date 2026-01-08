# JWT Token Flow - Visual Diagram

## Complete Token Lifecycle

```
┌──────────────────────────────────────────────────────────────────────────┐
│                         USER OPENS CHAT PAGE                             │
└──────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌──────────────────────────────────────────────────────────────────────────┐
│                    AiChatService Constructor                             │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │  constructor() {                                                   │ │
│  │    this.initTokenMonitoring();  ← Starts background monitoring    │ │
│  │    this.loadConversationFromStorage();                            │ │
│  │  }                                                                 │ │
│  └────────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌──────────────────────────────────────────────────────────────────────────┐
│                    BACKGROUND MONITORING STARTS                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │  setInterval(async () => {                                        │ │
│  │    await this.checkAndRefreshToken();  ← Every 60 seconds        │ │
│  │  }, 60000);                                                       │ │
│  └────────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────┘
                                    ↓
                    ┌───────────────┴───────────────┐
                    ↓                               ↓
    ┌───────────────────────────┐   ┌───────────────────────────┐
    │   USER SENDS MESSAGE      │   │  BACKGROUND CHECK (60s)   │
    └───────────────────────────┘   └───────────────────────────┘
                    ↓                               ↓
    ┌───────────────────────────┐   ┌───────────────────────────┐
    │  sendMessage() called     │   │  checkAndRefreshToken()   │
    └───────────────────────────┘   └───────────────────────────┘
                    ↓                               ↓
                    └───────────────┬───────────────┘
                                    ↓
┌──────────────────────────────────────────────────────────────────────────┐
│                         getValidToken()                                  │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │  1. Get token from AuthService                                    │ │
│  │     ↓                                                              │ │
│  │  2. Check if token exists                                         │ │
│  │     ↓                                                              │ │
│  │  3. Get session and check expiry                                  │ │
│  │     ↓                                                              │ │
│  │  4. If expired or < 5 min remaining:                             │ │
│  │     → Call authService.refreshSession()                          │ │
│  │     → Get new token                                              │ │
│  │     ↓                                                              │ │
│  │  5. Return valid token                                            │ │
│  └────────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌──────────────────────────────────────────────────────────────────────────┐
│                      MAKE API REQUEST                                    │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │  fetch(`${apiUrl}/chat`, {                                        │ │
│  │    method: 'POST',                                                │ │
│  │    headers: {                                                     │ │
│  │      'Authorization': `Bearer ${token}`,  ← Token auto-included  │ │
│  │      'Content-Type': 'application/json'                          │ │
│  │    },                                                             │ │
│  │    body: JSON.stringify({ message })                             │ │
│  │  })                                                               │ │
│  └────────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────┘
                                    ↓
                    ┌───────────────┴───────────────┐
                    ↓                               ↓
        ┌───────────────────┐         ┌───────────────────┐
        │  SUCCESS (200)    │         │   ERROR (401)     │
        └───────────────────┘         └───────────────────┘
                    ↓                               ↓
        ┌───────────────────┐         ┌───────────────────────────┐
        │  Stream response  │         │  DEFENSIVE HANDLING       │
        │  Display messages │         │  ┌─────────────────────┐  │
        └───────────────────┘         │  │ 1. Catch 401 error  │  │
                                      │  │ 2. Refresh token    │  │
                                      │  │ 3. Retry request    │  │
                                      │  │ 4. If fails → Login │  │
                                      │  └─────────────────────┘  │
                                      └───────────────────────────┘
```

## Token Refresh Decision Tree

```
                        ┌─────────────────────┐
                        │  Get Current Token  │
                        └──────────┬──────────┘
                                   ↓
                        ┌──────────────────────┐
                        │  Token Exists?       │
                        └──────────┬───────────┘
                                   ↓
                    ┌──────────────┴──────────────┐
                    ↓                             ↓
            ┌───────────────┐            ┌──────────────┐
            │  YES          │            │  NO          │
            └───────┬───────┘            └──────┬───────┘
                    ↓                            ↓
        ┌───────────────────────┐    ┌──────────────────┐
        │  Get Session          │    │  Redirect Login  │
        └───────────┬───────────┘    └──────────────────┘
                    ↓
        ┌───────────────────────┐
        │  Check Expiry Time    │
        └───────────┬───────────┘
                    ↓
        ┌───────────────────────────────────┐
        │  Time Until Expiry?               │
        └───────────┬───────────────────────┘
                    ↓
    ┌───────────────┴───────────────┐
    ↓                               ↓
┌─────────────────┐     ┌─────────────────────┐
│ > 5 minutes     │     │ < 5 minutes         │
└────────┬────────┘     └──────────┬──────────┘
         ↓                          ↓
┌─────────────────┐     ┌─────────────────────┐
│ Use Token       │     │ Refresh Token       │
└─────────────────┘     └──────────┬──────────┘
                                   ↓
                        ┌─────────────────────┐
                        │ Refresh Success?    │
                        └──────────┬──────────┘
                                   ↓
                    ┌──────────────┴──────────────┐
                    ↓                             ↓
            ┌───────────────┐            ┌──────────────┐
            │  YES          │            │  NO          │
            └───────┬───────┘            └──────┬───────┘
                    ↓                            ↓
        ┌───────────────────┐        ┌──────────────────┐
        │  Use New Token    │        │  Redirect Login  │
        └───────────────────┘        └──────────────────┘
```

## Proactive vs Defensive Strategy

```
┌─────────────────────────────────────────────────────────────────────┐
│                        PROACTIVE (Background)                       │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │                                                               │ │
│  │  Every 60 seconds:                                           │ │
│  │  ┌─────────────────────────────────────────────────────────┐ │ │
│  │  │  1. Check token expiry time                            │ │ │
│  │  │  2. If < 5 minutes remaining:                          │ │ │
│  │  │     → Refresh token NOW                                │ │ │
│  │  │     → Prevents expiry during use                       │ │ │
│  │  │  3. User continues without interruption                │ │ │
│  │  └─────────────────────────────────────────────────────────┘ │ │
│  │                                                               │ │
│  │  Benefits:                                                    │ │
│  │  ✅ Prevents token expiry                                    │ │
│  │  ✅ No user interruption                                     │ │
│  │  ✅ Smooth experience                                        │ │
│  └───────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                        DEFENSIVE (On Error)                         │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │                                                               │ │
│  │  When 401 error occurs:                                      │ │
│  │  ┌─────────────────────────────────────────────────────────┐ │ │
│  │  │  1. Catch 401 error                                     │ │ │
│  │  │  2. Attempt token refresh                               │ │ │
│  │  │  3. If successful:                                      │ │ │
│  │  │     → Retry request with new token                      │ │ │
│  │  │     → User doesn't notice                               │ │ │
│  │  │  4. If failed:                                          │ │ │
│  │  │     → Redirect to login                                 │ │ │
│  │  └─────────────────────────────────────────────────────────┘ │ │
│  │                                                               │ │
│  │  Benefits:                                                    │ │
│  │  ✅ Catches edge cases                                       │ │
│  │  ✅ Automatic recovery                                       │ │
│  │  ✅ Backup safety net                                        │ │
│  └───────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                      COMBINED STRATEGY                              │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │                                                               │ │
│  │  Proactive (Background) + Defensive (On Error)               │ │
│  │  = Bulletproof Token Management                              │ │
│  │                                                               │ │
│  │  Result:                                                      │ │
│  │  ✅ Tokens rarely expire (proactive refresh)                │ │
│  │  ✅ Edge cases handled (defensive retry)                    │ │
│  │  ✅ User never sees auth errors                             │ │
│  │  ✅ Seamless experience                                      │ │
│  └───────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

## Timeline Example

```
Time: 0:00 → User logs in
         ↓
         Token created (expires at 1:00)
         ↓
Time: 0:01 → Background monitoring starts
         ↓
Time: 0:05 → User sends message
         ↓
         getValidToken() → Token valid (55 min remaining)
         ↓
         Request sent with token
         ↓
Time: 0:10 → User sends another message
         ↓
         getValidToken() → Token valid (50 min remaining)
         ↓
         Request sent with token
         ↓
         ... user continues chatting ...
         ↓
Time: 0:55 → Background check detects < 5 min remaining
         ↓
         ⚡ PROACTIVE REFRESH TRIGGERED
         ↓
         New token created (expires at 1:55)
         ↓
Time: 0:56 → User sends message
         ↓
         getValidToken() → New token used (59 min remaining)
         ↓
         ✅ User didn't notice anything!
         ↓
Time: 1:00 → Old token would have expired
         ↓
         But user is using new token
         ↓
         ✅ No interruption!
```

## Error Scenario Example

```
Time: 0:00 → User logs in
         ↓
         Token created (expires at 1:00)
         ↓
Time: 0:55 → Background check should refresh
         ↓
         ❌ Network error - refresh fails
         ↓
Time: 0:58 → User sends message
         ↓
         getValidToken() → Token expiring soon
         ↓
         Attempts refresh → ❌ Still fails
         ↓
Time: 1:01 → Token expired, user sends message
         ↓
         Request sent with expired token
         ↓
         Backend returns 401
         ↓
         🛡️ DEFENSIVE HANDLING TRIGGERED
         ↓
         Catch 401 error
         ↓
         Attempt refresh → ✅ Network back
         ↓
         New token obtained
         ↓
         Retry request with new token
         ↓
         ✅ Request succeeds!
         ↓
         User sees message delivered
         ↓
         ✅ Seamless recovery!
```

## Code Flow Visualization

```typescript
// USER ACTION: Sends message
await chatService.sendMessage("Hello");
    ↓
// SERVICE: Get valid token
const token = await this.getValidToken();
    ↓
    ┌─────────────────────────────────────┐
    │  getValidToken() Internal Flow      │
    │  ┌───────────────────────────────┐  │
    │  │ 1. authService.getToken()     │  │
    │  │    ↓                          │  │
    │  │ 2. authService.getSession()   │  │
    │  │    ↓                          │  │
    │  │ 3. Check expiry               │  │
    │  │    ↓                          │  │
    │  │ 4. If expiring:               │  │
    │  │    authService.refreshSession()│ │
    │  │    ↓                          │  │
    │  │ 5. Return valid token         │  │
    │  └───────────────────────────────┘  │
    └─────────────────────────────────────┘
    ↓
// SERVICE: Make API request
await fetch(url, {
    headers: { 
        'Authorization': `Bearer ${token}` 
    }
})
    ↓
    ┌─────────────────────────────────────┐
    │  Response Handling                  │
    │  ┌───────────────────────────────┐  │
    │  │ if (response.ok)              │  │
    │  │   → Stream messages           │  │
    │  │                               │  │
    │  │ if (response.status === 401)  │  │
    │  │   → Refresh token             │  │
    │  │   → Retry request             │  │
    │  └───────────────────────────────┘  │
    └─────────────────────────────────────┘
    ↓
// USER: Sees message delivered ✅
```

## Summary

### The Magic ✨

```
┌─────────────────────────────────────────────────────────┐
│  USER'S PERSPECTIVE                                     │
│  ┌───────────────────────────────────────────────────┐ │
│  │  1. Opens chat                                    │ │
│  │  2. Types message                                 │ │
│  │  3. Clicks send                                   │ │
│  │  4. Sees response                                 │ │
│  │  5. Continues chatting                            │ │
│  │                                                    │ │
│  │  🎉 NO TOKEN MANAGEMENT NEEDED!                   │ │
│  └───────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  SYSTEM'S WORK (Behind the Scenes)                     │
│  ┌───────────────────────────────────────────────────┐ │
│  │  1. Check token validity                          │ │
│  │  2. Refresh if needed                             │ │
│  │  3. Monitor in background                         │ │
│  │  4. Handle errors automatically                   │ │
│  │  5. Retry on failures                             │ │
│  │  6. Keep session alive                            │ │
│  │                                                    │ │
│  │  🔐 ALL AUTOMATIC!                                │ │
│  └───────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

### Result

**Users chat seamlessly while the system handles all authentication complexity automatically!** 🚀


