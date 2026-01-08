const supabase = require('../supabaseClient');

// Event types for audit logging
const AuditEventTypes = {
  LOGIN_SUCCESS: 'login_success',
  LOGIN_FAILED: 'login_failed',
  LOGOUT: 'logout',
  LOGOUT_ALL: 'logout_all_devices',
  REGISTER: 'register',
  PASSWORD_CHANGE: 'password_change',
  PASSWORD_RESET_REQUEST: 'password_reset_request',
  PASSWORD_RESET_COMPLETE: 'password_reset_complete',
  EMAIL_CHANGE: 'email_change',
  PROFILE_UPDATE: 'profile_update',
  SESSION_REVOKE: 'session_revoke',
  EMAIL_VERIFICATION: 'email_verification',
  TWO_FACTOR_ENABLED: '2fa_enabled',
  TWO_FACTOR_DISABLED: '2fa_disabled',
  ACCOUNT_DELETED: 'account_deleted',
};

/**
 * Log an audit event
 * @param {string} userId - The user ID (can be null for failed login attempts)
 * @param {string} eventType - The type of event (use AuditEventTypes)
 * @param {object} req - Express request object
 * @param {object} metadata - Additional metadata to store
 * @returns {Promise<void>}
 */
async function logAuditEvent(userId, eventType, req, metadata = {}) {
  try {
    // Extract IP address (handle various proxy scenarios)
    const ipAddress = 
      req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
      req.headers['x-real-ip'] ||
      req.ip ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      null;

    // Extract user agent
    const userAgent = req.headers['user-agent'] || null;

    // Prepare audit log entry
    const auditLog = {
      user_id: userId || null,
      event_type: eventType,
      ip_address: ipAddress,
      user_agent: userAgent,
      metadata: metadata,
      created_at: new Date().toISOString(),
    };

    // Insert into audit_logs table
    const { error } = await supabase
      .from('audit_logs')
      .insert(auditLog);

    if (error) {
      console.error('Error logging audit event:', error);
      // Don't throw - we don't want audit logging failures to break the application
    }
  } catch (err) {
    console.error('Unexpected error in logAuditEvent:', err);
    // Silently fail - audit logging should not break application flow
  }
}

/**
 * Log successful login
 */
async function logLoginSuccess(userId, req, metadata = {}) {
  return logAuditEvent(userId, AuditEventTypes.LOGIN_SUCCESS, req, {
    ...metadata,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Log failed login attempt
 */
async function logLoginFailed(email, req, reason = 'Invalid credentials') {
  return logAuditEvent(null, AuditEventTypes.LOGIN_FAILED, req, {
    email,
    reason,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Log logout
 */
async function logLogout(userId, req, metadata = {}) {
  return logAuditEvent(userId, AuditEventTypes.LOGOUT, req, {
    ...metadata,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Log logout from all devices
 */
async function logLogoutAll(userId, req) {
  return logAuditEvent(userId, AuditEventTypes.LOGOUT_ALL, req, {
    timestamp: new Date().toISOString(),
  });
}

/**
 * Log new user registration
 */
async function logRegistration(userId, req, metadata = {}) {
  return logAuditEvent(userId, AuditEventTypes.REGISTER, req, {
    ...metadata,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Log password change
 */
async function logPasswordChange(userId, req) {
  return logAuditEvent(userId, AuditEventTypes.PASSWORD_CHANGE, req, {
    timestamp: new Date().toISOString(),
  });
}

/**
 * Log password reset request
 */
async function logPasswordResetRequest(email, req) {
  return logAuditEvent(null, AuditEventTypes.PASSWORD_RESET_REQUEST, req, {
    email,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Log password reset completion
 */
async function logPasswordResetComplete(userId, req) {
  return logAuditEvent(userId, AuditEventTypes.PASSWORD_RESET_COMPLETE, req, {
    timestamp: new Date().toISOString(),
  });
}

/**
 * Log profile update
 */
async function logProfileUpdate(userId, req, changes = {}) {
  return logAuditEvent(userId, AuditEventTypes.PROFILE_UPDATE, req, {
    changes,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Log session revocation
 */
async function logSessionRevoke(userId, req, sessionId) {
  return logAuditEvent(userId, AuditEventTypes.SESSION_REVOKE, req, {
    session_id: sessionId,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Get audit logs for a user
 * @param {string} userId - The user ID
 * @param {number} limit - Maximum number of logs to return (default: 50)
 * @returns {Promise<Array>} Array of audit log entries
 */
async function getUserAuditLogs(userId, limit = 50) {
  try {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching audit logs:', error);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error('Unexpected error in getUserAuditLogs:', err);
    return [];
  }
}

/**
 * Clean up old audit logs (for maintenance tasks)
 * @param {number} daysToKeep - Number of days of logs to keep (default: 90)
 */
async function cleanupOldAuditLogs(daysToKeep = 90) {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const { error } = await supabase
      .from('audit_logs')
      .delete()
      .lt('created_at', cutoffDate.toISOString());

    if (error) {
      console.error('Error cleaning up audit logs:', error);
    } else {
      console.log(`Cleaned up audit logs older than ${daysToKeep} days`);
    }
  } catch (err) {
    console.error('Unexpected error in cleanupOldAuditLogs:', err);
  }
}

module.exports = {
  AuditEventTypes,
  logAuditEvent,
  logLoginSuccess,
  logLoginFailed,
  logLogout,
  logLogoutAll,
  logRegistration,
  logPasswordChange,
  logPasswordResetRequest,
  logPasswordResetComplete,
  logProfileUpdate,
  logSessionRevoke,
  getUserAuditLogs,
  cleanupOldAuditLogs,
};


