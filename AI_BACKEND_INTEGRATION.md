# AI Backend Integration Guide

## ✅ Integration Complete

The Angular frontend is now properly configured to work with your AI Companion Service backend on **port 8000**.

---

## 🔧 Configuration Changes

### 1. Environment Configuration (`src/environments/environment.ts`)
```typescript
apiUrl: 'http://localhost:3000/api'        // User management backend (Supabase)
authUrl: 'http://localhost:8000'           // AI backend JWT auth
aiApiUrl: 'http://localhost:8000'          // AI chat backend
```

### 2. Services Updated

- **JWT Auth Service** → Points to `http://localhost:8000/auth/token` and `/auth/validate`
- **AI Chat Service** → Points to `http://localhost:8000/chat` for streaming
- **Age Verification** → Points to `http://localhost:8000/age-verification`

---

## 🚀 How to Start Everything

### 1. Start User Management Backend (Port 3000)
```bash
cd /home/bean12/CatalogAura/backend
npm start
```

### 2. Start AI Backend (Port 8000)
```bash
cd "/home/bean12/Desktop/AI Service"
# Follow your AI backend startup instructions
# This should start the service on port 8000
```

### 3. Start Angular Frontend (Port 4200)
```bash
cd /home/bean12/CatalogAura
ng serve
```

---

## 🔐 Authentication Flow

1. **User logs in** → Supabase authentication (handled by `AuthService`)
2. **User opens chat** → Frontend gets Supabase user ID
3. **Frontend requests AI token** → Calls `POST http://localhost:8000/auth/token`
   ```json
   {
     "user_id": "supabase_user_id",
     "expires_in_hours": 24
   }
   ```
4. **AI backend returns JWT** → Frontend stores it in `JwtAuthService`
5. **Chat requests use JWT** → All `/chat` requests use `Authorization: Bearer <jwt_token>`

---

## 📡 API Endpoints Used

### From AI Backend (Port 8000)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/auth/token` | POST | Create JWT token for user |
| `/auth/validate` | POST | Validate JWT token |
| `/chat` | POST | Stream chat with AI (SSE) |
| `/age-verification` | POST | Verify user age |
| `/personality` | GET/POST | Get/set AI personality |
| `/preferences` | GET/POST | Get/set communication preferences |
| `/goals` | Various | Goal tracking system |
| `/emotions/history` | GET | Emotion tracking |

### From User Backend (Port 3000)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/user/profile` | GET | Get user profile |
| `/api/user/profile` | PUT | Update user profile |
| `/api/user/stats` | GET | Get user statistics |

---

## 🧪 Testing the Integration

### 1. Check Backend Health
```bash
# Test AI backend
curl http://localhost:8000/health

# Expected response:
{
  "status": "healthy",
  "version": "4.0.0",
  "database": true,
  "llm": true,
  "timestamp": "2024-03-01T10:30:00Z"
}
```

### 2. Test JWT Token Creation
```bash
# Get a token
curl -X POST http://localhost:8000/auth/token \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "test_user",
    "expires_in_hours": 24
  }'

# Expected response:
{
  "access_token": "eyJhbGciOiJIUzI1...",
  "token_type": "bearer",
  "expires_in": 86400,
  "user_id": "test_user"
}
```

### 3. Test Chat (with token from step 2)
```bash
curl -X POST http://localhost:8000/chat \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Hello!"
  }'
```

### 4. Test in Browser
1. Go to `http://localhost:4200`
2. Login with Google/GitHub
3. Navigate to `/user/profile`
4. Open the chat panel
5. Send a message
6. Watch for:
   - ✅ Token creation in Network tab (`/auth/token`)
   - ✅ Chat streaming from `/chat` endpoint
   - ✅ Thinking steps displayed
   - ✅ AI response streaming in

---

## 🐛 Troubleshooting

### CORS Errors
If you see CORS errors, make sure your AI backend (port 8000) has CORS enabled for `http://localhost:4200`.

**Python/FastAPI example:**
```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:4200"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Token Errors
If token creation fails:
1. Check AI backend is running on port 8000
2. Check environment.ts has correct `authUrl: 'http://localhost:8000'`
3. Check browser console for detailed error messages

### Chat Not Streaming
If chat doesn't stream:
1. Verify `/chat` endpoint returns SSE format (check API reference)
2. Check Network tab for failed requests
3. Verify JWT token is being sent in Authorization header

---

## 📚 API Reference

Full API documentation: `/home/bean12/Desktop/AI Service/COMPLETE_API_REFERENCE.md`

Key features available:
- ✅ Multi-user support with JWT tokens
- ✅ Adaptive communication styles
- ✅ Emotion detection
- ✅ Personality system (mentor, friend, professional, creative, analytical)
- ✅ Goal tracking
- ✅ Content safety & age verification
- ✅ Long-term memory system
- ✅ SSE streaming responses
- ✅ Thinking steps visualization

---

## 🎯 Next Steps

1. **Start AI Backend** (if not running)
2. **Test in browser** (follow testing steps above)
3. **Configure personality** (optional - set AI archetype)
4. **Set communication style** (optional - casual/formal/technical/friendly)
5. **Enjoy chatting!** 🎉

---

**Last Updated:** January 2025  
**Frontend:** Angular 19 (Port 4200)  
**User Backend:** Node.js/Express (Port 3000)  
**AI Backend:** FastAPI/Python (Port 8000)


