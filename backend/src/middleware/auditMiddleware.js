const db = require('../config/db');
const { TABLES } = require('../models/schema');
const { v4: uuidv4 } = require('uuid');

/**
 * Audit Logging Helper
 */
function logAuditAction(userId, action, entityType, entityId, details, req = null) {
  try {
    const log = {
      id: `aud-${uuidv4()}`,
      user_id: userId || 'anonymous',
      action: action,
      entity_type: entityType,
      entity_id: String(entityId || ''),
      ip_address: req ? (req.headers['x-forwarded-for']?.split(',')[0].trim() || req.socket.remoteAddress || 'CLIENT_EDGE') : 'SERVER_INTERNAL',
      user_agent: req ? (req.headers['user-agent'] || 'API Client') : 'System Internal',
      details: details || {},
      created_at: new Date().toISOString()
    };
    db.insert(TABLES.AUDIT_LOGS, log);
    return log;
  } catch (err) {
    console.error('[AuditLog] Failed to write audit record:', err.message);
  }
}

/**
 * Express Middleware to auto-audit mutating requests
 */
function auditMiddleware(entityType) {
  return (req, res, next) => {
    const originalSend = res.send;

    res.send = function (body) {
      res.send = originalSend;
      
      // If response is successful, log audit
      if (res.statusCode >= 200 && res.statusCode < 300) {
        let action = `${req.method}_${entityType}`;
        const userId = req.user ? req.user.id : null;
        let entityId = req.params.id || (req.body && req.body.id);

        try {
          const parsed = JSON.parse(body);
          if (parsed && parsed.data && parsed.data.id) {
            entityId = parsed.data.id;
          }
        } catch (e) {
          // not JSON, ignore
        }

        logAuditAction(userId, action, entityType, entityId, {
          path: req.originalUrl,
          method: req.method,
          query: req.query
        }, req);
      }

      return res.send(body);
    };

    next();
  };
}

module.exports = {
  logAuditAction,
  auditMiddleware
};
