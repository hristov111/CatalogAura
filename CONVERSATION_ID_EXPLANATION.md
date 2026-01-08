# 📋 Conversation ID Management

## 🎯 Quick Answer

**Yes**, the same conversation ID is used for **all messages to the same persona** during a session.

**It changes when**:
1. You switch to a different persona (each persona has its own conversation ID)
2. You clear the chat
3. You start a fresh conversation (first message after page load)

---

## 🔄 Conversation ID Lifecycle

### 1️⃣ First Message to a Persona

```typescript
// Initial state
conversationId = null

// User sends first message
sendMessage("Hello", personaId: 1)
  ↓
// Request to backend (NO conversation_id)
{
  "message": "Hello",
  "persona_id": 1,
  "personality_name": "elara"
  // conversation_id: NOT INCLUDED
}
  ↓
// AI Backend creates NEW conversation
// Returns in SSE stream:
{
  "type": "chunk",
  "chunk": "Hi!",
  "conversation_id": "abc-123-def-456"  ← Backend generates this
}
  ↓
// Frontend receives and stores it
conversationId.set("abc-123-def-456")
```

### 2️⃣ Second Message to Same Persona

```typescript
// conversationId is now set
conversationId = "abc-123-def-456"

// User sends second message
sendMessage("How are you?", personaId: 1)
  ↓
// Request to backend (WITH conversation_id)
{
  "message": "How are you?",
  "persona_id": 1,
  "personality_name": "elara",
  "conversation_id": "abc-123-def-456"  ← INCLUDED NOW
}
  ↓
// AI Backend continues same conversation
// Returns same conversation_id
{
  "type": "chunk",
  "chunk": "I'm great!",
  "conversation_id": "abc-123-def-456"  ← Same ID
}
```

### 3️⃣ All Subsequent Messages

```
Message 3, 4, 5... → All use "abc-123-def-456"
```

---

## 🔄 When Does Conversation ID Change?

### Scenario 1: Switching Personas

```typescript
// Chat with Elara (persona 1)
conversationId = "elara-conv-123"

// Switch to Seraphina (persona 2)
switchToPersona(2)
  ↓
// Save Elara's conversation ID
savePersonaChat(1)  // Saves: { conversationId: "elara-conv-123" }
  ↓
// Load Seraphina's conversation ID
loadPersonaChat(2)
  ↓
// If Seraphina has previous history:
conversationId = "seraphina-conv-456"  ← Different ID!

// If Seraphina is new:
conversationId = null  ← Will get new ID on first message
```

### Scenario 2: Clearing Chat

```typescript
// Clear button clicked
clearChat()
  ↓
conversationId.set(null)  ← Reset to null
  ↓
// Next message will create NEW conversation
```

### Scenario 3: Returning to Previous Persona

```typescript
// Chat with Elara
conversationId = "elara-conv-123"

// Switch to Seraphina
conversationId = "seraphina-conv-456"

// Switch back to Elara
loadPersonaChat(1)
  ↓
conversationId.set("elara-conv-123")  ← Restored!
  ↓
// Continue same conversation with Elara
```

---

## 📊 Conversation ID Per Persona

Each persona maintains its **own independent conversation ID**:

```typescript
chatHistoryByPersona = Map {
  1 (Elara) => {
    messages: [...],
    conversationId: "elara-conv-123"  ← Elara's ID
  },
  2 (Seraphina) => {
    messages: [...],
    conversationId: "seraphina-conv-456"  ← Seraphina's ID
  },
  5 (Luna) => {
    messages: [...],
    conversationId: "luna-conv-789"  ← Luna's ID
  }
}
```

---

## 🎯 Why This Matters

### On the AI Backend Side:

The conversation ID helps the AI backend:
1. **Retrieve conversation history** - Load previous messages
2. **Maintain context** - Know what was discussed before
3. **Track memory** - Associate memories with this conversation
4. **Continue seamlessly** - Pick up where you left off

### Example:

```
First message (no conversation_id):
  User: "Hello"
  AI Backend: Creates conversation "abc-123"
              Stores this message in conversation "abc-123"
              
Second message (with conversation_id: "abc-123"):
  User: "What did I just say?"
  AI Backend: Loads conversation "abc-123"
              Sees previous message: "Hello"
              Responds: "You said 'Hello'"  ← Has context!
```

---

## 🔍 Code Implementation

### Sending Conversation ID

**File**: `src/services/ai-chat.service.ts`

```typescript
// Line 267-275
const body: any = {
  message: message,
  persona_id: profileId,
  personality_name: profileName?.toLowerCase(),
};

if (this.conversationId()) {
  body.conversation_id = this.conversationId();  // ← Include if exists
}
```

### Receiving Conversation ID

```typescript
// Line 347-350
if (event.conversation_id && !this.conversationId()) {
  this.conversationId.set(event.conversation_id);  // ← Store it
  this.saveConversationToStorage();
}
```

### Saving Per Persona

```typescript
// Line 709-714
private savePersonaChat(personaId: number): void {
  this.chatHistoryByPersona.set(personaId, {
    messages: [...this.messages()],
    conversationId: this.conversationId(),  // ← Save with persona
  });
}
```

### Loading Per Persona

```typescript
// Line 721-730
private loadPersonaChat(personaId: number): void {
  const history = this.chatHistoryByPersona.get(personaId);
  if (history) {
    this.messages.set(history.messages);
    this.conversationId.set(history.conversationId);  // ← Restore persona's ID
  } else {
    this.messages.set([]);
    this.conversationId.set(null);  // ← Start fresh
  }
}
```

---

## 📋 Summary Table

| Action | Conversation ID | Behavior |
|--------|----------------|----------|
| **First message to Elara** | `null` → `"abc-123"` | Backend creates new conversation |
| **Second message to Elara** | `"abc-123"` | Backend continues same conversation |
| **Switch to Seraphina** | `"abc-123"` → `null` or `"def-456"` | Each persona has own ID |
| **Return to Elara** | `null` or `"def-456"` → `"abc-123"` | Restores Elara's conversation |
| **Clear chat** | Any → `null` | Resets, next message starts new conversation |
| **50th message to Elara** | Still `"abc-123"` | Same conversation throughout session |

---

## 🎯 Key Points

1. ✅ **Same persona = Same conversation ID** throughout session
2. ✅ **Different personas = Different conversation IDs**
3. ✅ **Conversation ID created by AI backend** on first message
4. ✅ **Persists across multiple messages** to maintain context
5. ✅ **Saved per persona** so each has independent conversation history
6. ✅ **Reset only when**: switching personas, clearing chat, or starting fresh

---

## 🧪 How to Verify

### In Browser Console:

```javascript
// Check current conversation ID
chatService.conversationId()

// After first message to Elara
// "abc-123-def-456"

// After switching to Seraphina
// "different-uuid-here"

// After returning to Elara
// "abc-123-def-456" (restored!)
```

### In Network Tab:

**First Request** (to Elara):
```json
{
  "message": "Hello",
  "persona_id": 1
  // No conversation_id
}
```

**Second Request** (to Elara):
```json
{
  "message": "How are you?",
  "persona_id": 1,
  "conversation_id": "abc-123-def-456"  ← NOW INCLUDED
}
```

---

**Status**: This is the correct behavior for maintaining conversation context! ✅

