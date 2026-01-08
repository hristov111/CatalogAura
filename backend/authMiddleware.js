const supabase = require('./supabaseClient');

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid authorization header' });
    }

    const token = authHeader.split(' ')[1];

    // Verify the token using Supabase Auth
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      console.error('Auth error:', error);
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Attach user to request
    req.user = user;
    
    // Update session activity (async, don't wait for it)
    updateSessionActivity(user.id, req).catch(err => {
      console.error('Error updating session activity:', err);
    });
    
    next();
  } catch (err) {
    console.error('Middleware error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Helper function to update session activity
async function updateSessionActivity(userId, req) {
  try {
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];
    const deviceInfo = userAgent ? userAgent.substring(0, 200) : 'Unknown';

    // Find or create session
    const { data: existingSessions, error: fetchError } = await supabase
      .from('sessions')
      .select('id')
      .eq('user_id', userId)
      .eq('device_info', deviceInfo)
      .limit(1);

    if (fetchError) {
      console.error('Error fetching session:', fetchError);
      return;
    }

    if (existingSessions && existingSessions.length > 0) {
      // Update existing session
      await supabase
        .from('sessions')
        .update({ last_activity: new Date().toISOString() })
        .eq('id', existingSessions[0].id);
    } else {
      // Create new session
      await supabase
        .from('sessions')
        .insert({
          user_id: userId,
          device_info: deviceInfo,
          ip_address: ipAddress,
          last_activity: new Date().toISOString(),
        });
    }
  } catch (err) {
    console.error('Error in updateSessionActivity:', err);
  }
}

module.exports = authMiddleware;

