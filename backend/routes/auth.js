const express = require('express');
const router = express.Router();
const supabase = require('../supabaseClient');
const { 
  registerValidation, 
  loginValidation, 
  forgotPasswordValidation,
  resetPasswordValidation 
} = require('../middleware/validation');
const { 
  registerLimiter, 
  authLimiter, 
  passwordResetLimiter 
} = require('../middleware/rateLimiter');
const {
  logLoginSuccess,
  logLoginFailed,
  logLogout,
  logLogoutAll,
  logRegistration,
  logPasswordResetRequest,
  logPasswordResetComplete,
} = require('../utils/auditLogger');

// POST /api/auth/register - Register new user
router.post('/register', registerLimiter, registerValidation, async (req, res) => {
  try {
    const { email, password, fullName } = req.body;

    // Register user with Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    if (error) {
      console.error('Registration error:', error);
      return res.status(400).json({ 
        error: error.message || 'Registration failed' 
      });
    }

    // Log registration
    if (data.user) {
      await logRegistration(data.user.id, req, { email, full_name: fullName });
    }

    res.status(201).json({
      message: 'Registration successful. Please check your email to verify your account.',
      user: {
        id: data.user.id,
        email: data.user.email,
      },
      requiresEmailVerification: true,
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/login - Login user
router.post('/login', authLimiter, loginValidation, async (req, res) => {
  try {
    const { email, password } = req.body;

    // Sign in with Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('Login error:', error);
      await logLoginFailed(email, req, error.message);
      return res.status(401).json({ 
        error: 'Invalid email or password' 
      });
    }

    // Log successful login
    await logLoginSuccess(data.user.id, req, { email });

    res.json({
      message: 'Login successful',
      user: {
        id: data.user.id,
        email: data.user.email,
        emailVerified: data.user.email_confirmed_at ? true : false,
      },
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: data.session.expires_at,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/logout - Logout current session
router.post('/logout', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing authorization header' });
    }

    const token = authHeader.split(' ')[1];
    const { data: { user } } = await supabase.auth.getUser(token);

    if (user) {
      // Log logout
      await logLogout(user.id, req);
    }

    // Sign out from Supabase
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('Logout error:', error);
      return res.status(400).json({ error: error.message });
    }

    res.json({ message: 'Logout successful' });
  } catch (err) {
    console.error('Logout error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/logout-all - Logout from all devices
router.post('/logout-all', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing authorization header' });
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Delete all sessions for this user
    const { error: deleteError } = await supabase
      .from('sessions')
      .delete()
      .eq('user_id', user.id);

    if (deleteError) {
      console.error('Error deleting sessions:', deleteError);
    }

    // Log logout all
    await logLogoutAll(user.id, req);

    // Sign out from Supabase (current session)
    await supabase.auth.signOut();

    res.json({ message: 'Logged out from all devices successfully' });
  } catch (err) {
    console.error('Logout all error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/forgot-password - Request password reset
router.post('/forgot-password', passwordResetLimiter, forgotPasswordValidation, async (req, res) => {
  try {
    const { email } = req.body;

    // Request password reset from Supabase
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.FRONTEND_URL || 'http://localhost:4200'}/auth/reset-password`,
    });

    if (error) {
      console.error('Password reset request error:', error);
      // Don't reveal if email exists or not for security
    }

    // Always log the attempt (even if email doesn't exist)
    await logPasswordResetRequest(email, req);

    // Always return success to prevent email enumeration
    res.json({ 
      message: 'If an account with that email exists, a password reset link has been sent.' 
    });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/reset-password - Reset password with token
router.post('/reset-password', resetPasswordValidation, async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    // Verify the reset token and update password
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      console.error('Password reset error:', error);
      return res.status(400).json({ 
        error: 'Invalid or expired reset token' 
      });
    }

    // Log password reset completion
    if (data.user) {
      await logPasswordResetComplete(data.user.id, req);
    }

    res.json({ message: 'Password reset successful. You can now login with your new password.' });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/verify-email - Verify email address
router.post('/verify-email', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Verification token is required' });
    }

    // Verify email with Supabase (token is passed via email link)
    const { data, error } = await supabase.auth.verifyOtp({
      token_hash: token,
      type: 'email',
    });

    if (error) {
      console.error('Email verification error:', error);
      return res.status(400).json({ error: 'Invalid or expired verification token' });
    }

    res.json({ 
      message: 'Email verified successfully',
      user: data.user,
    });
  } catch (err) {
    console.error('Verify email error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/auth/me - Get current user info
router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing authorization header' });
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Fetch profile data
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('Error fetching profile:', profileError);
    }

    res.json({
      user: {
        id: user.id,
        email: user.email,
        emailVerified: user.email_confirmed_at ? true : false,
        createdAt: user.created_at,
      },
      profile: profile || null,
    });
  } catch (err) {
    console.error('Get user error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/social/google - Google OAuth (placeholder)
router.post('/social/google', async (req, res) => {
  try {
    // For Google OAuth, typically you'd redirect to the OAuth provider
    // Supabase handles this via their auth UI or client library
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${process.env.FRONTEND_URL || 'http://localhost:4200'}/auth/callback`,
      },
    });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ url: data.url });
  } catch (err) {
    console.error('Google OAuth error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/social/github - GitHub OAuth (placeholder)
router.post('/social/github', async (req, res) => {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: `${process.env.FRONTEND_URL || 'http://localhost:4200'}/auth/callback`,
      },
    });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ url: data.url });
  } catch (err) {
    console.error('GitHub OAuth error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;


