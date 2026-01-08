#!/bin/bash

# AI Chat Endpoint Test Script
# This tests the AI backend chat functionality

echo "========================================="
echo "AI Backend Chat Endpoint Test"
echo "========================================="
echo ""

USER_ID="76aa71b0-8aae-48b4-9458-64dd75c9f630"
AI_BACKEND="http://localhost:8000"

echo "Step 1: Creating JWT token..."
echo "-----------------------------"

TOKEN_RESPONSE=$(curl -s -X POST "${AI_BACKEND}/auth/token" \
  -H "Content-Type: application/json" \
  -d "{\"user_id\": \"${USER_ID}\", \"expires_in_hours\": 24}")

echo "$TOKEN_RESPONSE" | jq '.' 2>/dev/null || echo "$TOKEN_RESPONSE"
echo ""

# Extract token
ACCESS_TOKEN=$(echo "$TOKEN_RESPONSE" | jq -r '.access_token' 2>/dev/null)

if [ "$ACCESS_TOKEN" = "null" ] || [ -z "$ACCESS_TOKEN" ]; then
  echo "❌ Failed to get token!"
  exit 1
fi

echo "✅ Token obtained: ${ACCESS_TOKEN:0:50}..."
echo ""

echo "Step 2: Testing /chat endpoint..."
echo "-----------------------------"

# Test chat with streaming (will show raw SSE output)
echo "Sending message: 'Hello, this is a test message'"
echo ""

curl -N -X POST "${AI_BACKEND}/chat" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -d '{
    "message": "Hello, this is a test message"
  }' 2>&1

echo ""
echo "========================================="
echo "Test complete"
echo "========================================="

