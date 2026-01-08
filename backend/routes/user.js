const express = require('express');
const router = express.Router();
const supabase = require('../supabaseClient');
const authMiddleware = require('../authMiddleware');
const { 
  updateProfileValidation, 
  changePasswordValidation 
} = require('../middleware/validation');
const {
  logPasswordChange,
  logProfileUpdate,
  logSessionRevoke,
  getUserAuditLogs,
} = require('../utils/auditLogger');

// All routes require authentication
router.use(authMiddleware);

// GET /api/user/profile - Get user profile
router.get('/profile', async (req, res) => {
  try {
    const userId = req.user.id;

    // Fetch profile from database
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching profile:', error);
      return res.status(404).json({ error: 'Profile not found' });
    }

    // Fetch user auth data
    const { data: { user }, error: userError } = await supabase.auth.getUser(req.headers.authorization.split(' ')[1]);

    if (userError) {
      console.error('Error fetching user:', userError);
    }

    res.json({
      profile,
      user: user ? {
        email: user.email,
        emailVerified: user.email_confirmed_at ? true : false,
        createdAt: user.created_at,
      } : null,
    });
  } catch (err) {
    console.error('Get profile error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/user/profile - Update user profile
router.put('/profile', updateProfileValidation, async (req, res) => {
  try {
    const userId = req.user.id;
    const { fullName, bio, avatarUrl } = req.body;

    // Prepare update data (only include provided fields)
    const updateData = {
      updated_at: new Date().toISOString(),
    };

    if (fullName !== undefined) updateData.full_name = fullName;
    if (bio !== undefined) updateData.bio = bio;
    if (avatarUrl !== undefined) updateData.avatar_url = avatarUrl;

    // Update profile
    const { data, error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating profile:', error);
      return res.status(400).json({ error: 'Failed to update profile' });
    }

    // Log profile update
    await logProfileUpdate(userId, req, updateData);

    res.json({
      message: 'Profile updated successfully',
      profile: data,
    });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/user/password - Change password
router.put('/password', changePasswordValidation, async (req, res) => {
  try {
    const userId = req.user.id;
    const { oldPassword, newPassword } = req.body;

    // Verify old password by attempting to sign in
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      req.headers.authorization.split(' ')[1]
    );

    if (authError || !user) {
      return res.status(401).json({ error: 'Authentication failed' });
    }

    // Attempt to sign in with old password to verify it
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: oldPassword,
    });

    if (signInError) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    // Update password
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (updateError) {
      console.error('Error updating password:', updateError);
      return res.status(400).json({ error: 'Failed to update password' });
    }

    // Log password change
    await logPasswordChange(userId, req);

    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    console.error('Change password error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/user/sessions - Get active sessions
router.get('/sessions', async (req, res) => {
  try {
    const userId = req.user.id;

    // Fetch all sessions for the user
    const { data: sessions, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('user_id', userId)
      .order('last_activity', { ascending: false });

    if (error) {
      console.error('Error fetching sessions:', error);
      return res.status(400).json({ error: 'Failed to fetch sessions' });
    }

    // Format sessions for response
    const formattedSessions = sessions.map(session => ({
      id: session.id,
      deviceInfo: session.device_info,
      ipAddress: session.ip_address,
      lastActivity: session.last_activity,
      createdAt: session.created_at,
      isCurrent: false, // We could enhance this by tracking session tokens
    }));

    res.json({ sessions: formattedSessions });
  } catch (err) {
    console.error('Get sessions error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/user/sessions/:id - Delete specific session
router.delete('/sessions/:id', async (req, res) => {
  try {
    const userId = req.user.id;
    const sessionId = req.params.id;

    // Verify the session belongs to the user before deleting
    const { data: session, error: fetchError } = await supabase
      .from('sessions')
      .select('user_id')
      .eq('id', sessionId)
      .single();

    if (fetchError || !session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    if (session.user_id !== userId) {
      return res.status(403).json({ error: 'Unauthorized to delete this session' });
    }

    // Delete the session
    const { error: deleteError } = await supabase
      .from('sessions')
      .delete()
      .eq('id', sessionId);

    if (deleteError) {
      console.error('Error deleting session:', deleteError);
      return res.status(400).json({ error: 'Failed to delete session' });
    }

    // Log session revocation
    await logSessionRevoke(userId, req, sessionId);

    res.json({ message: 'Session deleted successfully' });
  } catch (err) {
    console.error('Delete session error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/user/audit-logs - Get user's audit log history
router.get('/audit-logs', async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 50;

    // Fetch audit logs
    const logs = await getUserAuditLogs(userId, limit);

    // Format logs for response
    const formattedLogs = logs.map(log => ({
      id: log.id,
      eventType: log.event_type,
      ipAddress: log.ip_address,
      userAgent: log.user_agent,
      metadata: log.metadata,
      createdAt: log.created_at,
    }));

    res.json({ logs: formattedLogs });
  } catch (err) {
    console.error('Get audit logs error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/user/stats - Get user statistics
router.get('/stats', async (req, res) => {
  try {
    const userId = req.user.id;

    // Fetch user profile for message count
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('message_count, created_at, last_login')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.error('Error fetching profile:', profileError);
      return res.status(400).json({ error: 'Failed to fetch user stats' });
    }

    // Count active sessions
    const { count: sessionCount, error: sessionError } = await supabase
      .from('sessions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (sessionError) {
      console.error('Error counting sessions:', sessionError);
    }

    res.json({
      stats: {
        messageCount: profile.message_count || 0,
        activeSessions: sessionCount || 0,
        accountAge: calculateAccountAge(profile.created_at),
        lastLogin: profile.last_login,
        memberSince: profile.created_at,
      },
    });
  } catch (err) {
    console.error('Get stats error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Helper function to calculate account age
function calculateAccountAge(createdAt) {
  const now = new Date();
  const created = new Date(createdAt);
  const diffTime = Math.abs(now - created);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 30) {
    return `${diffDays} day${diffDays === 1 ? '' : 's'}`;
  } else if (diffDays < 365) {
    const months = Math.floor(diffDays / 30);
    return `${months} month${months === 1 ? '' : 's'}`;
  } else {
    const years = Math.floor(diffDays / 365);
    return `${years} year${years === 1 ? '' : 's'}`;
  }
}

module.exports = router;


