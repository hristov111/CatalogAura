#!/bin/bash

# Test AI Backend User Creation
echo "========================================="
echo "Testing AI Backend User Creation"
echo "========================================="
echo ""

USER_ID="76aa71b0-8aae-48b4-9458-64dd75c9f630"
AI_BACKEND="http://localhost:8000"

echo "Step 1: Creating JWT token (should create user)..."
echo "---------------------------------------------------"

TOKEN_RESPONSE=$(curl -s -X POST "${AI_BACKEND}/auth/token" \
  -H "Content-Type: application/json" \
  -d "{\"user_id\": \"${USER_ID}\", \"expires_in_hours\": 24}")

echo "$TOKEN_RESPONSE" | jq '.' 2>/dev/null || echo "$TOKEN_RESPONSE"
echo ""

# Extract token
ACCESS_TOKEN=$(echo "$TOKEN_RESPONSE" | jq -r '.access_token' 2>/dev/null)

if [ "$ACCESS_TOKEN" = "null" ] || [ -z "$ACCESS_TOKEN" ]; then
  echo "❌ Failed to get token!"
  echo "This might mean user creation failed."
  exit 1
fi

echo "✅ Token created: ${ACCESS_TOKEN:0:50}..."
echo ""

echo "Step 2: Testing if user was created..."
echo "---------------------------------------------------"
echo "Attempting to send a test message..."
echo ""

# Try sending a message
CHAT_RESPONSE=$(curl -s -N -X POST "${AI_BACKEND}/chat" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -d '{
    "message": "Hello, test message to verify user creation"
  }' 2>&1 | head -20)

echo "$CHAT_RESPONSE"
echo ""

echo "========================================="
echo "Analysis:"
echo "========================================="
echo ""
echo "If you see:"
echo "  - 'user not found' → User wasn't created ❌"
echo "  - 'age verification' → User created but needs age verification ✅"
echo "  - SSE events → User created and working ✅"
echo "  - Other error → Check AI backend logs 🔍"
echo ""

echo "========================================="
echo "Next Steps:"
echo "========================================="
echo ""
echo "1. Check AI backend terminal logs for errors"
echo "2. Look for database creation errors"
echo "3. Check if AI backend database is writable"
echo "4. Verify user_id format is compatible"
echo ""

