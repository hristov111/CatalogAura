const supabase = require('./supabaseClient');

const GUEST_MESSAGE_LIMIT = 5;

const chatController = async (req, res) => {
  const { message } = req.body;
  const user = req.user;

  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  try {
    // 1. Get user profile to check guest status and message count
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('is_guest, message_count')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('Error fetching profile:', profileError);
      return res.status(500).json({ error: 'Failed to fetch user profile' });
    }

    // 2. Check limits
    if (profile.is_guest && profile.message_count >= GUEST_MESSAGE_LIMIT) {
      return res.status(403).json({ 
        error: 'Guest limit reached', 
        code: 'LIMIT_REACHED',
        message: 'Please create an account to continue chatting.'
      });
    }

    // 3. Process Chat (Mock AI Response for now)
    // In a real app, you would call OpenAI/Anthropic here
    const aiResponse = `I am an AI. You said: "${message}". (Message ${profile.message_count + 1})`;

    // 4. Save User Message
    const { error: msgError1 } = await supabase
      .from('chats')
      .insert({ user_id: user.id, role: 'user', content: message });

    if (msgError1) console.error('Error saving user message:', msgError1);

    // 5. Save AI Response
    const { error: msgError2 } = await supabase
      .from('chats')
      .insert({ user_id: user.id, role: 'assistant', content: aiResponse });

    if (msgError2) console.error('Error saving assistant message:', msgError2);

    // 6. Increment Message Count
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ message_count: profile.message_count + 1 })
      .eq('id', user.id);

    if (updateError) console.error('Error updating count:', updateError);

    res.json({ 
      response: aiResponse, 
      remaining: profile.is_guest ? GUEST_MESSAGE_LIMIT - (profile.message_count + 1) : null 
    });

  } catch (err) {
    console.error('Chat controller error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = { chatController };

