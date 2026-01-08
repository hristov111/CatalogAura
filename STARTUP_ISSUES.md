# 🔧 Startup Issues Found & Fixed

## Issues Identified

### ✅ **FIXED: Issue 1 - Missing `aiApiUrl` in Environment**
**Location**: `/src/environments/environment.ts`  
**Problem**: `ai-chat.service.ts` referenced `environment.aiApiUrl` which didn't exist  
**Fix**: Added `aiApiUrl: 'http://localhost:8000'` to environment configuration  

### ⚠️ **CRITICAL: Issue 2 - Missing `.env` File**
**Location**: `/CatalogAura/.env`  
**Problem**: Backend configuration file doesn't exist  
**Fix**: Created `.env` template with placeholders  
**Action Required**: 
1. Open `/CatalogAura/.env`
2. Replace `your_service_role_key_here` with your actual Supabase Service Role Key
3. Update `JWT_SECRET` with a strong random string

### ⚠️ **Issue 3 - Architecture Confusion**
**Problem**: Two backends running different services
- **Node.js Backend (Port 3000)**: User profiles, authentication
- **AI Backend (Port 8000)**: AI chat, JWT tokens for chat

**Current Configuration**:
```typescript
// Frontend environment.ts
apiUrl: 'http://localhost:3000/api'      // ✅ User profiles, main backend
authUrl: 'http://localhost:8000'         // ✅ AI backend JWT auth
aiApiUrl: 'http://localhost:8000'        // ✅ AI chat API
```

### ⚠️ **Issue 4 - Duplicate JWT Routes**
**Problem**: JWT auth routes exist in both backends
- `/backend/routes/jwt-auth.js` (Node.js - port 3000) 
- AI Backend also has `/auth/token` and `/auth/validate` (port 8000)

**Current Behavior**: Frontend calls **port 8000** for JWT tokens (correct for AI chat)

**Recommendation**: 
- If AI backend handles its own JWT tokens → Keep current setup
- If you want Node.js to handle JWT → Change `authUrl` to `http://localhost:3000`

---

## 📋 Pre-Flight Checklist

Before starting the app, ensure:

### 1. Environment Variables
- [ ] `.env` file exists in root directory
- [ ] `SUPABASE_SERVICE_ROLE_KEY` is set correctly
- [ ] `JWT_SECRET` is a strong random string

### 2. AI Backend (Port 8000)
- [ ] AI Backend is running
- [ ] CORS allows `http://localhost:4200`
- [ ] Endpoints available:
  - `POST /auth/token`
  - `POST /auth/validate`
  - `POST /chat`
  - `POST /age-verification`

### 3. Node.js Backend (Port 3000)
- [ ] Dependencies installed (`npm install` in `/backend`)
- [ ] Supabase connection configured
- [ ] Database migrations run (see `005_auth_system_migration.sql`)

### 4. Angular Frontend (Port 4200)
- [ ] Dependencies installed (`npm install` in root)
- [ ] Environment configured (`src/environments/environment.ts`)

---

## 🚀 Startup Order

```bash
# Terminal 1: AI Backend (Port 8000) - Start FIRST
cd "/home/bean12/Desktop/AI Service"
source venv/bin/activate
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

# Terminal 2: Node.js Backend (Port 3000)
cd /home/bean12/CatalogAura/backend
npm start

# Terminal 3: Angular Frontend (Port 4200)
cd /home/bean12/CatalogAura
ng serve
```

---

## 🔍 Common Errors & Solutions

### Error: "Missing Supabase URL or Service Role Key"
**Solution**: Add `SUPABASE_SERVICE_ROLE_KEY` to `.env` file

### Error: "CORS policy: No 'Access-Control-Allow-Origin'"
**Solution**: Ensure AI backend CORS includes `http://localhost:4200`

### Error: "Failed to fetch at 'http://localhost:8000/auth/token'"
**Solutions**:
1. Check if AI backend is running on port 8000
2. Check AI backend CORS configuration
3. Verify AI backend has `/auth/token` endpoint

### Error: "Error Loading Profile Invalid Token"
**Solutions**:
1. Run database migration: `005_auth_system_migration.sql`
2. Verify Supabase Service Role Key in `.env`

### Error: "Age verification required"
**Solution**: Age verification is one-time setup, should be handled by AI backend

---

## 📝 Notes

- **JWT Tokens**: Frontend creates separate JWT tokens for AI chat via port 8000
- **Main Auth**: Handled by Supabase (email/password, OAuth)
- **User Profiles**: Stored in Supabase, accessed via port 3000
- **AI Chat**: Completely separate service on port 8000

---

## ⚙️ Configuration Summary

| Service | Port | Purpose | Auth Method |
|---------|------|---------|-------------|
| Angular Frontend | 4200 | UI | Supabase Session |
| Node.js Backend | 3000 | User profiles, main API | Supabase Service Key |
| AI Backend | 8000 | AI chat, JWT tokens | Custom JWT |

---

## 🔐 Security Notes

1. **Never commit** `.env` file to git
2. Use **strong, random** JWT_SECRET
3. Keep **Supabase Service Role Key** private
4. Rotate secrets regularly in production

