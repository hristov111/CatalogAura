# 🐛 Debug: "An unexpected error occurred" in Chat

## 📊 **What We Know**

From your error logs:
```
✅ JWT token created successfully: 76aa71b0-8aae-48b4-9458-64dd75c9f630
✅ Token ready
❌ Chat error: "An unexpected error occurred. Please try again."
```

**Conclusion**: The frontend is working correctly, but the **AI Backend** is rejecting the chat request.

---

## 🔍 **Most Likely Causes**

### 1. **Age Verification Not Completed** (Most Common)
The AI backend requires one-time age verification before chat.

**Symptoms**:
- Token works
- Chat fails with generic error
- Backend logs show "age verification required"

**Solution**:
```bash
# Test age verification endpoint
curl -X POST http://localhost:8000/age-verification \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "birth_year": 2000,
    "agreed_to_terms": true
  }'
```

### 2. **User Profile Not Found in AI Backend Database**
The AI backend may have its own user database.

**Symptoms**:
- Token validates
- User ID not found in AI backend's database
- Chat fails

**Solution**: Check AI backend logs for "user not found" or similar errors.

### 3. **AI Backend Configuration Issue**
Missing environment variables or configuration.

**Symptoms**:
- Generic error message
- Backend logs show missing config
- Database connection issues

**Solution**: Check AI backend `.env` file and configuration.

### 4. **Database Connection Failure**
AI backend can't connect to its database.

**Symptoms**:
- Backend starts but operations fail
- Logs show database errors

**Solution**: Check database connection in AI backend logs.

---

## 🔧 **Debugging Steps**

### Step 1: Check AI Backend Logs (CRITICAL!)

**Where to look**: The terminal where you ran:
```bash
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

**What to look for**:
```python
# Common error patterns:
ERROR: Age verification required
ERROR: User not found in database
ERROR: Database connection failed
ERROR: Invalid configuration
Traceback (most recent call last):
```

**Action**: Copy the EXACT error from AI backend logs and share it.

---

### Step 2: Run Manual Test

I created a test script for you:

```bash
cd /home/bean12/CatalogAura
./test-ai-chat.sh
```

This will:
1. Create a JWT token
2. Send a test message
3. Show the raw response

**Look for**:
- Does it get a token? ✅
- What error does `/chat` return? ❌
- Is it the same error or different?

---

### Step 3: Test Age Verification

If the error is about age verification:

```bash
# Get a token first
TOKEN=$(curl -s -X POST http://localhost:8000/auth/token \
  -H "Content-Type: application/json" \
  -d '{"user_id": "76aa71b0-8aae-48b4-9458-64dd75c9f630"}' \
  | jq -r '.access_token')

# Verify age
curl -X POST http://localhost:8000/age-verification \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "birth_year": 2000,
    "agreed_to_terms": true
  }' | jq '.'
```

---

### Step 4: Check AI Backend Health

```bash
# Test if AI backend is responding
curl http://localhost:8000/docs

# Should return HTML of the API docs page
```

---

## 📋 **Quick Checklist**

Before diving deeper, verify:

- [ ] AI Backend is running: `lsof -i :8000 | grep LISTEN`
- [ ] AI Backend started without errors
- [ ] You can access `http://localhost:8000/docs` in browser
- [ ] Environment variables are set in AI backend
- [ ] Database is accessible from AI backend

---

## 🎯 **Next Steps**

1. **Check AI backend terminal logs** - This is the most important step!
2. Run `./test-ai-chat.sh` to test directly
3. Share the EXACT error message from AI backend logs
4. Check if age verification is required

---

## 📝 **Common Fixes**

### Fix 1: Age Verification Required

If backend says "age verification required":

**Frontend Fix** (already in code):
The frontend will show a message asking for age verification.

**Manual Fix** (for testing):
```bash
# Run the age verification curl command above
```

### Fix 2: User Profile Not Created

If backend says "user not found":

**Check**: Does the AI backend have a user creation endpoint?
**Solution**: May need to create user profile in AI backend database first.

### Fix 3: Missing AI Backend Environment Variables

**Check**: AI backend `.env` file
**Common missing vars**:
- Database connection strings
- API keys
- Model configurations

### Fix 4: Database Not Running

**Check**: Is the AI backend's database running?
**Solution**: Start the database service (PostgreSQL, MongoDB, etc.)

---

## 🔬 **Advanced Debugging**

### Enable Verbose Logging

In AI backend, enable debug logging to see detailed errors.

### Check Network Traffic

Use browser DevTools → Network tab to see:
- Request headers
- Request body
- Response status code
- Response body

### Check CORS

If you see CORS errors too:
```python
# In AI backend config (app/core/config.py)
cors_origins: str = "http://localhost:4200,http://localhost:3000"
```

---

## 💡 **Most Likely Solution**

Based on previous errors, this is probably **age verification**. 

**Quick Test**:
1. Look at AI backend logs
2. If you see "age verification required" → Run the age verification curl command
3. Try chatting again

---

## 📞 **Still Stuck?**

Share these details:
1. ✅ Exact error from AI backend terminal logs
2. ✅ Output of `./test-ai-chat.sh`
3. ✅ Can you access `http://localhost:8000/docs`?
4. ✅ AI backend configuration (without secrets)

---

**Remember**: The error is in the AI Backend (port 8000), not the frontend! Check those logs first! 🔍

