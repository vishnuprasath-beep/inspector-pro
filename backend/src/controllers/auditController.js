const db = require('../config/db');
const { TABLES } = require('../models/schema');

/**
 * Get Audit Trail Logs with filtering
 */
async function getAuditLogs(req, res) {
  try {
    const { action, entity_type, limit = 100 } = req.query;
    let logs = db.getAll(TABLES.AUDIT_LOGS);

    if (action) {
      logs = logs.filter(l => l.action.toLowerCase().includes(action.toLowerCase()));
    }
    if (entity_type) {
      logs = logs.filter(l => l.entity_type.toUpperCase() === entity_type.toUpperCase());
    }

    const users = db.getAll(TABLES.USERS);
    const enriched = logs.map(l => {
      const user = users.find(u => u.id === l.user_id) || {};
      return {
        ...l,
        user_name: user.name || (l.user_id === 'usr-admin-01' ? 'System Administrator' : 'Anonymous / System'),
        user_email: user.email,
        user_role: user.role
      };
    });

    enriched.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    res.json({ success: true, count: enriched.length, data: enriched.slice(0, Number(limit)) });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

module.exports = {
  getAuditLogs
};
