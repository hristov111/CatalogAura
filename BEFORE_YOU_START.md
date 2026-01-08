# ⚠️ BEFORE YOU START THE APP

## 🔴 **CRITICAL: You Must Complete These Steps First!**

---

## ✅ Issues Fixed Automatically

1. ✅ **Added `aiApiUrl` to `environment.ts`**
   - Location: `/src/environments/environment.ts`
   - Added: `aiApiUrl: 'http://localhost:8000'`

---

## ⚠️ **Action Required: Add JWT Config to `.env`**

Your `.env` file is **missing JWT configuration** needed by the backend.

### Steps:

1. Open `/home/bean12/CatalogAura/.env`

2. Add these lines at the end:

```env
# JWT Configuration for chat-specific tokens
JWT_SECRET=your-super-secret-jwt-key-change-this-to-a-strong-random-string
JWT_EXPIRY=24h
```

3. **Important**: Replace `your-super-secret-jwt-key-change-this-to-a-strong-random-string` with a real secret!

   You can generate one with:
   ```bash
   openssl rand -base64 32
   ```

---

## 📋 Complete Pre-Flight Checklist

### ✅ Backend Configuration

- [ ] `.env` file exists in `/home/bean12/CatalogAura/`
- [ ] `JWT_SECRET` is added to `.env` (see above)
- [ ] `JWT_EXPIRY=24h` is added to `.env`
- [ ] `SUPABASE_SERVICE_ROLE_KEY` is correctly set
- [ ] Backend dependencies installed: `cd backend && npm install`

### ✅ AI Backend (Port 8000) - **Must be running!**

- [ ] AI Backend is running on `http://localhost:8000`
- [ ] CORS configuration includes `http://localhost:4200`
  - File: `/home/bean12/Desktop/AI Service/app/core/config.py`
  - Should have: `cors_origins: str = "http://localhost:4200,http://localhost:3000,..."`
- [ ] Endpoints are accessible:
  - `POST /auth/token` - Create JWT tokens
  - `POST /auth/validate` - Validate JWT tokens
  - `POST /chat` - AI chat with SSE streaming
  - `POST /age-verification` - Age verification

### ✅ Database

- [ ] Migration `005_auth_system_migration.sql` has been run
  - This creates `sessions` table and adds user profile columns
  - **If you haven't run it yet**, go to Supabase SQL Editor and paste the contents of:
    `/home/bean12/CatalogAura/backend/db/005_auth_system_migration.sql`

### ✅ Frontend Configuration

- [ ] Angular dependencies installed: `npm install` (in root)
- [ ] Environment file updated (already done ✅)

---

## 🚀 Startup Order (IMPORTANT!)

**Start in this exact order:**

```bash
# ========================================
# Terminal 1: AI Backend FIRST (Port 8000)
# ========================================
cd "/home/bean12/Desktop/AI Service"
source venv/bin/activate
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

# Wait for: "Application startup complete"
# Verify: http://localhost:8000/docs should load

# ========================================
# Terminal 2: Node.js Backend (Port 3000)
# ========================================
cd /home/bean12/CatalogAura/backend
npm start

# Wait for: "🚀 Server is running on port 3000"

# ========================================
# Terminal 3: Angular Frontend (Port 4200)
# ========================================
cd /home/bean12/CatalogAura
ng serve

# Wait for: "✔ Compiled successfully"
# Open: http://localhost:4200
```

---

## 🔍 Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                 Angular Frontend                     │
│                 (Port 4200)                          │
│  - User Interface                                    │
│  - Supabase Auth (login/register)                   │
└─────────────┬───────────────────┬───────────────────┘
              │                   │
              │                   │
              v                   v
┌─────────────────────┐  ┌──────────────────────────┐
│  Node.js Backend    │  │    AI Backend            │
│  (Port 3000)        │  │    (Port 8000)           │
│  - User profiles    │  │    - JWT tokens (chat)   │
│  - Main API         │  │    - AI chat             │
│  - Supabase DB      │  │    - SSE streaming       │
└─────────────────────┘  └──────────────────────────┘
```

### Request Flow:

1. **User Login** → Supabase → Angular
2. **Get User Profile** → Angular → Node.js (3000) → Supabase
3. **Start Chat** → Angular → AI Backend (8000) `/auth/token` → Get JWT
4. **Send Message** → Angular → AI Backend (8000) `/chat` (with JWT) → Stream response

---

## 🐛 Common Errors & Quick Fixes

### Error: "Missing Supabase URL or Service Role Key"
```bash
# Check .env file exists and has correct keys
cat /home/bean12/CatalogAura/.env | grep SUPABASE_SERVICE_ROLE_KEY
```

### Error: "CORS policy: No 'Access-Control-Allow-Origin'"
```bash
# Fix AI backend CORS:
# Edit: /home/bean12/Desktop/AI Service/app/core/config.py
# Ensure it includes: http://localhost:4200
```

### Error: "Failed to fetch at 'http://localhost:8000/auth/token'"
```bash
# 1. Check AI backend is running:
lsof -i :8000 | grep LISTEN

# 2. Test endpoint manually:
curl -X POST http://localhost:8000/auth/token \
  -H "Content-Type: application/json" \
  -d '{"user_id": "test-user-123"}'

# Should return: {"access_token": "...", "token_type": "bearer", ...}
```

### Error: "Error Loading Profile Invalid Token"
```bash
# Run database migration in Supabase SQL Editor:
# Copy contents of: /home/bean12/CatalogAura/backend/db/005_auth_system_migration.sql
# Paste into Supabase SQL Editor
# Click "Run"
```

### Error: "Cannot find module 'jsonwebtoken'"
```bash
cd /home/bean12/CatalogAura/backend
npm install
```

---

## 📝 Current Configuration

### Environment Variables (`environment.ts`)
```typescript
apiUrl: 'http://localhost:3000/api'      // ✅ User profiles
authUrl: 'http://localhost:8000'         // ✅ JWT auth (AI backend)
aiApiUrl: 'http://localhost:8000'        // ✅ AI chat API
```

### Backend Routes (Port 3000)
- `/api/auth/*` - User authentication
- `/api/user/*` - User profiles
- `/auth/token` - JWT token creation (fallback)
- `/auth/validate` - JWT token validation (fallback)

### AI Backend Routes (Port 8000)
- `/auth/token` - Create JWT for chat ⭐
- `/auth/validate` - Validate JWT
- `/chat` - AI chat with SSE streaming ⭐
- `/age-verification` - Age verification (one-time)
- `/docs` - API documentation

---

## ✅ Ready to Start?

Make sure you've completed:
1. ✅ Added `JWT_SECRET` to `.env`
2. ✅ AI Backend CORS includes port 4200
3. ✅ Database migration has been run
4. ✅ All dependencies installed (`npm install`)

Then start in order: **AI Backend (8000)** → **Node.js (3000)** → **Angular (4200)**

---

## 📚 Related Documentation

- `STARTUP_ISSUES.md` - Detailed issue analysis
- `AI_BACKEND_INTEGRATION.md` - AI integration guide
- `TROUBLESHOOTING_AI_CHAT.md` - Chat troubleshooting
- `/home/bean12/Desktop/AI Service/COMPLETE_API_REFERENCE.md` - AI API docs

---

**Good luck! 🚀**

