# 🔧 Quick Fix for 401 Unauthorized Error

## The Problem

You're getting a 401 error because the **frontend is using old code** that sends the wrong token type.

## The Solution

### Step 1: Restart Angular (CRITICAL!)

The frontend code was updated but Angular needs to rebuild:

```bash
# Stop Angular
pkill -f "ng serve"

# Wait 2 seconds
sleep 2

# Start Angular with fresh build
cd /home/bean12/CatalogAura
ng serve
```

**Wait for**: `✔ Compiled successfully`

### Step 2: Hard Refresh Your Browser

After Angular restarts:

1. Open your browser to `http://localhost:4200`
2. **Hard refresh**: 
   - **Linux/Windows**: `Ctrl + Shift + R`
   - **Mac**: `Cmd + Shift + R`
3. Or open in **Incognito/Private** window

This clears cached JavaScript files.

### Step 3: Make Sure You're Logged In

1. Check if you see your name/email in the header
2. If not logged in, click **Login**
3. Enter your credentials

### Step 4: Try Chatting Again

1. Select a persona (e.g., Elara)
2. Send a message: "Hello!"
3. Should work now! ✅

---

## What Changed?

### Old Code (Causing 401):
```typescript
// Sent AI backend JWT token to Node.js backend ❌
const response = await fetch('/api/ai-chat', {
  headers: {
    'Authorization': `Bearer ${aiBackendToken}` // Wrong token!
  }
});
```

### New Code (Fixed):
```typescript
// Sends Supabase token to Node.js backend ✅
const supabaseToken = await this.authService.getSession();
const response = await fetch('/api/ai-chat', {
  headers: {
    'Authorization': `Bearer ${supabaseToken.session.access_token}` // Correct token!
  }
});
```

---

## Verification

After restarting Angular, check browser console:

### ✅ Success Looks Like:
```
🔑 Getting chat token for user: 76aa71b0-...
✅ Chat token ready
[No 401 errors]
[SSE events streaming...]
```

### ❌ Still 401? Check:

1. **Angular restarted?**
   ```bash
   lsof -i :4200 | grep LISTEN
   ```

2. **Browser hard refreshed?**
   - Open DevTools → Network tab → Disable cache
   - Refresh page

3. **Logged in with Supabase?**
   ```javascript
   // In browser console:
   localStorage.getItem('sb-wgigbvraeojprbndnrmt-auth-token')
   // Should show token data
   ```

4. **Node.js backend restarted?**
   ```bash
   lsof -i :3000 | grep LISTEN
   ```

---

## Still Not Working?

### Check All Services Running:

```bash
# AI Backend (port 8000)
lsof -i :8000 | grep LISTEN

# Node.js Backend (port 3000)
lsof -i :3000 | grep LISTEN

# Angular Frontend (port 4200)
lsof -i :4200 | grep LISTEN
```

All three should show `LISTEN`.

### Check Backend Logs:

**Node.js Backend Terminal:**
Look for errors in authentication:
```
Missing or invalid authorization header
Invalid token
```

If you see these, the Supabase token isn't being sent or is invalid.

### Test Manually:

```bash
# 1. Get your Supabase token from browser localStorage
# Open browser console and run:
localStorage.getItem('sb-wgigbvraeojprbndnrmt-auth-token')

# 2. Extract the access_token from the JSON

# 3. Test the endpoint:
curl -X POST http://localhost:3000/api/ai-chat \
  -H "Authorization: Bearer YOUR_SUPABASE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message": "test", "persona_id": 1}'
```

---

## Summary

**Problem**: Frontend using old code with wrong token  
**Fix**: Restart Angular + Hard refresh browser  
**Time**: ~30 seconds  

After Angular rebuilds, it will work! 🎉

