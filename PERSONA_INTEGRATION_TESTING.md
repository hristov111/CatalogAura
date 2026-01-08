# 🧪 Persona System Prompt Integration - Testing Guide

## Implementation Complete! ✅

All code changes have been successfully implemented according to the plan:

1. ✅ **Backend proxy route created** (`backend/routes/ai-chat.js`)
2. ✅ **Route registered** in `backend/index.js`
3. ✅ **Environment variable added** (`AI_BACKEND_URL` in `.env`)
4. ✅ **Frontend service updated** (`src/services/ai-chat.service.ts`)
5. ✅ **AI backend updated** (`/home/bean12/Desktop/AI Service/app/`)

---

## 🚀 Testing Instructions

### Prerequisites

Before testing, ensure all services are running:

```bash
# Terminal 1: AI Backend (Port 8000)
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

## Test 1: Backend Proxy with curl

### Step 1: Get JWT Token

```bash
TOKEN=$(curl -s -X POST http://localhost:8000/auth/token \
  -H "Content-Type: application/json" \
  -d '{"user_id": "test-user-123", "expires_in_hours": 24}' \
  | jq -r '.access_token')

echo "Token: $TOKEN"
```

### Step 2: Test Proxy with Elara (persona_id: 1)

```bash
curl -N -X POST http://localhost:3000/api/ai-chat \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Hello, who are you and what do you love?",
    "persona_id": 1
  }'
```

**Expected Response:**
- AI should respond as **Elara** (art enthusiast from Paris)
- Should mention: art, philosophy, jazz, sailing
- Tone: warm, thoughtful, contemplative

### Step 3: Test Proxy with Seraphina (persona_id: 2)

```bash
curl -N -X POST http://localhost:3000/api/ai-chat \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Tell me about your interests and passions",
    "persona_id": 2
  }'
```

**Expected Response:**
- AI should respond as **Seraphina** (mindfulness coach from Kyoto)
- Should mention: meditation, pottery, zen garden, tea ceremonies
- Tone: calm, thoughtful, serene

### Step 4: Test with Different Personas

```bash
# Test Isla (persona_id: 3) - Marine biologist
curl -N -X POST http://localhost:3000/api/ai-chat \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What makes you excited?",
    "persona_id": 3
  }'
```

---

## Test 2: Frontend Integration

### Step 1: Open Angular App

```bash
# Open in browser
http://localhost:4200
```

### Step 2: Select Persona

1. Navigate to homepage
2. Click on **"Elara"** persona card
3. You should be taken to `/profile/1`

### Step 3: Test Chat with Elara

1. In the chat interface, send: **"Who are you?"**
2. **Expected**: AI responds as Elara with her personality
3. Check for keywords: "art", "Paris", "philosophy", "jazz"

### Step 4: Switch Personas

1. Go back to homepage (click logo)
2. Select **"Seraphina"** persona
3. Navigate to `/profile/2`
4. Send same message: **"Who are you?"**
5. **Expected**: Different response with Seraphina's personality
6. Check for keywords: "mindfulness", "Kyoto", "meditation", "pottery"

### Step 5: Verify Conversation Context

1. Continue chatting with Seraphina
2. Say: **"What did I just ask you?"**
3. **Expected**: AI remembers previous context
4. Conversation ID should persist across messages

---

## Test 3: Verify Database Integration

### Check Personas in Supabase

```sql
-- In Supabase SQL Editor
SELECT id, name, city, LEFT(system_prompt, 100) as prompt_preview
FROM personas
ORDER BY id;
```

**Expected Output:**
```
id | name       | city   | prompt_preview
---+------------+--------+------------------------------------------
1  | Elara      | Paris  | You are Elara, a 28-year-old art enthus...
2  | Seraphina  | Kyoto  | You are Seraphina, a 31-year-old mindfu...
3  | Isla       | Sydney | You are Isla, a 25-year-old marine biol...
...
```

---

## Test 4: Error Handling

### Test Missing persona_id

```bash
curl -N -X POST http://localhost:3000/api/ai-chat \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Hello"
  }'
```

**Expected:** 400 Bad Request - "persona_id is required"

### Test Invalid persona_id

```bash
curl -N -X POST http://localhost:3000/api/ai-chat \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Hello",
    "persona_id": 999
  }'
```

**Expected:** 404 Not Found - "Persona not found"

### Test Without Auth Token

```bash
curl -N -X POST http://localhost:3000/api/ai-chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Hello",
    "persona_id": 1
  }'
```

**Expected:** 401 Unauthorized

---

## Test 5: Browser DevTools Inspection

### Check Network Requests

1. Open browser DevTools (F12)
2. Go to **Network** tab
3. Send a chat message in the app
4. Find the request to `/api/ai-chat`
5. **Check Request**:
   ```json
   {
     "message": "Hello",
     "persona_id": 1
   }
   ```
6. **Check Response**: Should be SSE stream with thinking steps

### Check Console Logs

Look for these logs in browser console:
```
🔑 Getting chat token for user: 76aa71b0-...
✅ Chat token ready
```

### Check Backend Logs

Look for these in Node.js backend terminal:
```
📝 Fetching persona 1 from Supabase...
✅ Found persona: Elara
🚀 Forwarding to AI backend: http://localhost:8000/chat
📡 Streaming response back to frontend...
✅ Stream complete
```

### Check AI Backend Logs

Look for these in AI backend terminal:
```
INFO: Using custom persona system prompt
INFO: Chat request: user=..., conversation_id=...
INFO: Streaming response from ...
```

---

## Test 6: Personality Consistency

### Test Same Persona Across Sessions

1. Chat with Elara: "Tell me about art"
2. Note the response style
3. Refresh the page (new session)
4. Chat with Elara again: "What do you think about modern art?"
5. **Expected**: Same personality, similar tone and vocabulary

### Test Different Personas

1. Chat with Elara: "What do you do for fun?"
2. Note: artistic, philosophical response
3. Switch to Isla: "What do you do for fun?"
4. Note: adventurous, ocean-related response
5. **Expected**: Clearly different personalities

---

## 🎯 Success Criteria

✅ **Backend Proxy**
- Proxy route responds without errors
- Fetches persona from Supabase correctly
- Forwards to AI backend with system_prompt
- Streams SSE response back to frontend

✅ **Frontend Integration**
- Persona selection works
- Chat sends persona_id correctly
- Receives and displays AI responses
- Thinking steps display correctly

✅ **AI Responses**
- Matches selected persona's personality
- Uses persona's system_prompt
- Maintains conversation context
- Different personas have distinct personalities

✅ **Error Handling**
- Missing persona_id → 400 error
- Invalid persona_id → 404 error
- No auth token → 401 error
- AI backend down → 503 error

---

## 🐛 Troubleshooting

### Issue: "persona_id is required" error

**Cause**: Frontend not sending persona_id
**Fix**: Check that profile ID is being passed in chat component

### Issue: "Persona not found" error

**Cause**: Invalid persona_id or database not seeded
**Fix**: 
```sql
-- Check personas exist
SELECT id, name FROM personas;
```

### Issue: AI responds with default personality, not persona

**Cause**: AI backend not using system_prompt
**Fix**: Check AI backend logs for "Using custom persona system prompt"

### Issue: CORS error

**Cause**: Node.js backend CORS not configured
**Fix**: Already configured in `backend/index.js` line 34

### Issue: "AI service unavailable"

**Cause**: AI backend not running
**Fix**: 
```bash
cd "/home/bean12/Desktop/AI Service"
source venv/bin/activate
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

---

## 📊 Test Results Template

```markdown
## Test Results - [Date]

### Backend Proxy Tests
- [ ] Token creation: PASS/FAIL
- [ ] Proxy with Elara: PASS/FAIL
- [ ] Proxy with Seraphina: PASS/FAIL
- [ ] Error handling: PASS/FAIL

### Frontend Tests
- [ ] Persona selection: PASS/FAIL
- [ ] Chat with Elara: PASS/FAIL
- [ ] Chat with Seraphina: PASS/FAIL
- [ ] Conversation context: PASS/FAIL

### Personality Tests
- [ ] Elara personality matches: PASS/FAIL
- [ ] Seraphina personality matches: PASS/FAIL
- [ ] Personas are distinct: PASS/FAIL

### Notes:
[Add any observations or issues here]
```

---

## 🎉 Next Steps

Once all tests pass:

1. **Test all 8 personas** to verify each has distinct personality
2. **Performance testing**: Test with multiple concurrent users
3. **Long conversation testing**: Verify context is maintained
4. **Production deployment**: Update environment URLs

---

## 📚 Related Documentation

- **Plan**: `/home/bean12/.cursor/plans/persona_system_prompt_integration_98218a9b.plan.md`
- **API Reference**: `/home/bean12/Desktop/AI Service/COMPLETE_API_REFERENCE.md`
- **Database Schema**: `/home/bean12/CatalogAura/backend/db/002_personas_migration.sql`

---

**Implementation Status: ✅ COMPLETE**
**Testing Status: ⏳ READY TO TEST**

All code changes have been implemented. Start your services and begin testing! 🚀

