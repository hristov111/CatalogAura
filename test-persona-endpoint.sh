#!/bin/bash

echo "========================================="
echo "Testing Persona Integration Endpoint"
echo "========================================="
echo ""

# Check if AI backend is running
echo "1. Checking AI Backend (port 8000)..."
if lsof -i :8000 2>/dev/null | grep -q LISTEN; then
    echo "   ✅ AI Backend is running"
else
    echo "   ❌ AI Backend is NOT running!"
    echo "   Please start it with:"
    echo "   cd '/home/bean12/Desktop/AI Service'"
    echo "   source venv/bin/activate"
    echo "   python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"
    exit 1
fi

# Check if Node.js backend is running
echo "2. Checking Node.js Backend (port 3000)..."
if lsof -i :3000 2>/dev/null | grep -q LISTEN; then
    echo "   ✅ Node.js Backend is running"
else
    echo "   ❌ Node.js Backend is NOT running!"
    exit 1
fi

echo ""
echo "3. Creating JWT token..."
TOKEN_RESPONSE=$(curl -s -X POST http://localhost:8000/auth/token \
  -H "Content-Type: application/json" \
  -d '{"user_id": "test-user-123"}')

TOKEN=$(echo "$TOKEN_RESPONSE" | jq -r '.access_token')

if [ "$TOKEN" = "null" ] || [ -z "$TOKEN" ]; then
    echo "   ❌ Failed to create token"
    echo "   Response: $TOKEN_RESPONSE"
    exit 1
fi

echo "   ✅ Token created: ${TOKEN:0:50}..."
echo ""

echo "4. Testing /api/ai-chat endpoint with persona_id=1 (Elara)..."
echo "   Sending: 'Hello, who are you?'"
echo ""

curl -N -X POST http://localhost:3000/api/ai-chat \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Hello, who are you?",
    "persona_id": 1
  }' 2>&1 | head -50

echo ""
echo ""
echo "========================================="
echo "Test Complete!"
echo "========================================="
echo ""
echo "If you saw SSE events above, it's working! ✅"
echo "If you see errors, check the backend logs."

