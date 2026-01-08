const express = require('express');
const router = express.Router();
const supabase = require('../supabaseClient');
const authMiddleware = require('../authMiddleware');

/**
 * POST /api/ai-chat - Proxy chat requests to AI backend with persona context
 * 
 * Flow:
 * 1. Receive chat request from frontend with persona_id
 * 2. Fetch persona's system_prompt from Supabase
 * 3. Forward to AI backend with system_prompt
 * 4. Proxy SSE stream back to frontend
 */
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { message, persona_id, conversation_id, personality_name } = req.body;

    // Validate required fields
    if (!message) {
      return res.status(400).json({ 
        error: 'message is required' 
      });
    }

    if (!persona_id) {
      return res.status(400).json({ 
        error: 'persona_id is required' 
      });
    }

    // 1. Fetch persona system_prompt from Supabase
    console.log(`📝 Fetching persona ${persona_id} from Supabase...`);
    const { data: persona, error: personaError } = await supabase
      .from('personas')
      .select('system_prompt, name')
      .eq('id', persona_id)
      .single();

    if (personaError) {
      console.error('Error fetching persona:', personaError);
      return res.status(500).json({ 
        error: 'Failed to fetch persona',
        detail: personaError.message 
      });
    }

    if (!persona) {
      return res.status(404).json({ 
        error: 'Persona not found',
        persona_id: persona_id 
      });
    }

    console.log(`✅ Found persona: ${persona.name}`);

    // 2. Get or create JWT token for AI backend
    const aiBackendUrl = process.env.AI_BACKEND_URL || 'http://localhost:8000';
    console.log(`🔑 Getting JWT token for AI backend...`);
    
    const tokenResponse = await fetch(`${aiBackendUrl}/auth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: req.user.id, // Use authenticated user's ID
        expires_in_hours: 24
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error(`Token creation error: ${tokenResponse.status} - ${errorText}`);
      return res.status(500).json({ 
        error: 'Failed to create AI backend token',
        detail: errorText 
      });
    }

    const tokenData = await tokenResponse.json();
    const aiBackendToken = tokenData.access_token;
    console.log(`✅ AI backend token ready`);

    // 3. Forward to AI backend with system_prompt
    console.log(`🚀 Forwarding to AI backend: ${aiBackendUrl}/chat`);

    const aiRequestBody = {
      message,
      system_prompt: persona.system_prompt,
      personality_name: personality_name || persona.name.toLowerCase(), // Use provided or fallback to persona name
    };

    if (conversation_id) {
      aiRequestBody.conversation_id = conversation_id;
    }

    const response = await fetch(`${aiBackendUrl}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${aiBackendToken}`, // Use AI backend JWT token
      },
      body: JSON.stringify(aiRequestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`AI backend error: ${response.status} - ${errorText}`);
      return res.status(response.status).json({ 
        error: 'AI backend error',
        status: response.status,
        detail: errorText 
      });
    }

    // 4. Proxy SSE stream back to frontend
    console.log('📡 Streaming response back to frontend...');
    
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering

    // Pipe the response body to the client
    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    try {
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          console.log('✅ Stream complete');
          res.end();
          break;
        }

        const chunk = decoder.decode(value, { stream: true });
        res.write(chunk);
      }
    } catch (streamError) {
      console.error('Stream error:', streamError);
      res.end();
    }

  } catch (error) {
    console.error('AI chat proxy error:', error);
    
    // Check if AI backend is unreachable
    if (error.code === 'ECONNREFUSED' || error.message.includes('fetch')) {
      return res.status(503).json({ 
        error: 'AI service unavailable',
        detail: 'Could not connect to AI backend. Please ensure it is running on port 8000.'
      });
    }

    res.status(500).json({ 
      error: 'Internal server error',
      detail: error.message 
    });
  }
});

module.exports = router;

