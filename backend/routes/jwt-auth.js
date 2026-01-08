const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const supabase = require('../supabaseClient');

// JWT Secret (should be in .env)
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this';
const JWT_EXPIRY = process.env.JWT_EXPIRY || '24h';

/**
 * POST /auth/token - Create or get JWT token
 * Body: { user_id: string }
 * Returns: { access_token, token_type, expires_in, user_id }
 */
router.post('/token', async (req, res) => {
  try {
    const { user_id } = req.body;

    if (!user_id) {
      return res.status(400).json({ error: 'user_id is required' });
    }

    // Verify user exists in Supabase (optional but recommended)
    const { data: user, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user_id)
      .single();

    if (error || !user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Create JWT token
    const token = jwt.sign(
      { 
        user_id,
        type: 'chat_access'
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRY }
    );

    // Calculate expiry
    const expiresIn = JWT_EXPIRY === '24h' ? 86400 : parseInt(JWT_EXPIRY);
    const issuedAt = new Date();
    const expiresAt = new Date(issuedAt.getTime() + (expiresIn * 1000));

    res.json({
      access_token: token,
      token_type: 'Bearer',
      expires_in: expiresIn,
      user_id,
      issued_at: issuedAt.toISOString(),
      expires_at: expiresAt.toISOString()
    });
  } catch (err) {
    console.error('JWT token creation error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /auth/validate - Validate JWT token
 * Body: { token: string }
 * Returns: { valid, user_id, expires_at, issued_at }
 */
router.post('/validate', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ 
        valid: false,
        error: 'Token is required' 
      });
    }

    // Verify JWT
    const decoded = jwt.verify(token, JWT_SECRET);

    res.json({
      valid: true,
      user_id: decoded.user_id,
      issued_at: new Date(decoded.iat * 1000).toISOString(),
      expires_at: new Date(decoded.exp * 1000).toISOString()
    });
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.json({
        valid: false,
        error: 'Token expired'
      });
    }
    
    if (err.name === 'JsonWebTokenError') {
      return res.json({
        valid: false,
        error: 'Invalid token'
      });
    }

    console.error('JWT validation error:', err);
    res.status(500).json({ 
      valid: false,
      error: 'Internal server error' 
    });
  }
});

module.exports = router;


