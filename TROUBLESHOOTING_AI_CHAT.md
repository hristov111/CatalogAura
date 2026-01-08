# Troubleshooting AI Chat Error

## ✅ What I Fixed

1. **Error Handling**: Changed the error event handler to show errors in chat instead of crashing
2. **Age Verification**: Removed automatic age verification during chat (it should be done once during setup)

Now errors will display in the chat window instead of breaking the connection.

---

## 🔍 Debugging the Backend Error

The backend is returning: `"An unexpected error occurred. Please try again."`

### Step 1: Check Backend Logs

Look at your AI backend terminal for detailed error messages:

```bash
cd "/home/bean12/Desktop/AI Service"
# The backend should be running and showing logs
```

**Look for:**
- Database connection errors
- Missing API keys
- Authentication errors
- Missing tables or schema issues

---

## 🐛 Common Issues & Fixes

### Issue 1: Database Not Connected

**Error**: `database connection failed` or `no such table`

**Fix**: Make sure PostgreSQL is running and the database exists:

```bash
# Check if PostgreSQL is running
sudo systemctl status postgresql

# Start PostgreSQL if needed
sudo systemctl start postgresql

# Create the database (if it doesn't exist)
sudo -u postgres psql -c "CREATE DATABASE ai_companion;"
```

**Or in .env**:
```bash
# Check this line in /home/bean12/Desktop/AI Service/.env
POSTGRES_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/ai_companion
```

---

### Issue 2: Missing OpenAI API Key

**Error**: `openai api key not found` or `invalid api key`

**Fix**: Add your OpenAI API key to `.env`:

```bash
# Edit /home/bean12/Desktop/AI Service/.env
OPENAI_API_KEY=sk-your-actual-key-here
```

**Or use LM Studio (local AI)**:

```bash
# In .env
LM_STUDIO_BASE_URL=http://localhost:1234/v1
# Make sure LM Studio is running on port 1234
```

---

### Issue 3: JWT Secret Not Set

**Error**: `jwt secret key not configured`

**Fix**: Generate and set a JWT secret:

```bash
# Generate a secure random key
python3 -c 'import secrets; print(secrets.token_urlsafe(32))'

# Add to .env
JWT_SECRET_KEY=your-generated-key-here
```

---

### Issue 4: Database Schema Not Initialized

**Error**: `table does not exist` or `column not found`

**Fix**: Initialize the database schema:

```bash
cd "/home/bean12/Desktop/AI Service"
source venv/bin/activate

# Option 1: Using Alembic migrations
alembic upgrade head

# Option 2: Manual SQL init (if available)
# Check if there's an init_db.sql or similar file
```

---

## 🧪 Test the Backend Directly

Test each endpoint to isolate the issue:

### 1. Health Check
```bash
curl http://localhost:8000/health
```

**Expected**:
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "database": true,
  "llm": true
}
```

If `"database": false` → Database issue  
If `"llm": false` → AI provider issue

---

### 2. Get JWT Token
```bash
curl -X POST http://localhost:8000/auth/token \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "test_user_123",
    "expires_in_hours": 24
  }'
```

**Expected**:
```json
{
  "access_token": "eyJhbGci...",
  "token_type": "bearer",
  "expires_in": 86400,
  "user_id": "test_user_123"
}
```

**Save the token** for next steps!

---

### 3. Test Chat (with token from step 2)
```bash
curl -X POST http://localhost:8000/chat \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Hello, this is a test"
  }'
```

**Expected**: SSE stream with thinking steps and response

---

## 📋 Backend Environment Checklist

Check your `/home/bean12/Desktop/AI Service/.env` file has these set:

```bash
# Required
POSTGRES_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/ai_companion
JWT_SECRET_KEY=your-secret-key-here
CORS_ORIGINS=http://localhost:4200,http://localhost:3000,http://localhost:8080

# Choose one AI provider:
# Option A: OpenAI
OPENAI_API_KEY=sk-your-key-here
OPENAI_MODEL_NAME=gpt-4o-mini

# Option B: LM Studio (local)
LM_STUDIO_BASE_URL=http://localhost:1234/v1
LM_STUDIO_MODEL_NAME=local-model

# Optional
LOG_LEVEL=INFO
RATE_LIMIT_REQUESTS_PER_MINUTE=30
```

---

## 🔧 Quick Fix: Restart Everything

Sometimes a clean restart fixes issues:

```bash
# 1. Stop AI backend (Ctrl+C)

# 2. Restart PostgreSQL
sudo systemctl restart postgresql

# 3. Clear any cached state
cd "/home/bean12/Desktop/AI Service"
rm -rf __pycache__ app/__pycache__

# 4. Restart AI backend
source venv/bin/activate
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

# 5. In browser, hard refresh Angular app (Ctrl+Shift+R)
```

---

## 📝 Getting Backend Logs

To see detailed error messages:

```bash
# If backend is running in background, check logs
cd "/home/bean12/Desktop/AI Service"

# Or run with verbose logging
LOG_LEVEL=DEBUG python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```

---

## 🆘 Still Not Working?

If you're still seeing errors:

1. **Copy the exact error** from the backend terminal
2. **Share the backend logs** showing what happens when you send a chat message
3. **Check** if the database tables exist:
   ```bash
   sudo -u postgres psql ai_companion -c "\dt"
   ```

---

**Next Steps:**
1. Check the backend terminal for error details
2. Try the curl commands above to test each component
3. Verify all environment variables are set
4. Make sure PostgreSQL is running

Let me know what errors you see in the backend logs! 🔍


