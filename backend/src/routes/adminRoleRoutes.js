const express = require('express');
const router = express.Router();
const authenticateJWT = require('../middleware/authMiddleware');
const authorizeRoles = require('../middleware/roleMiddleware');
const db = require('../config/db');
const { TABLES, ROLES } = require('../models/schema');

// Strict ADMIN-only barrier
router.use(authenticateJWT);
router.use(authorizeRoles(ROLES.ADMIN));

/**
 * GET /api/admin/dashboard-stats
 * High-level system & user registry statistics (ADMIN only)
 */
router.get('/dashboard-stats', (req, res) => {
  try {
    const users = db.getAll(TABLES.USERS);
    const sites = db.getAll(TABLES.SITES);
    const inspections = db.getAll(TABLES.INSPECTIONS);
    const defects = db.getAll(TABLES.DEFECTS);
    const reinspections = db.getAll(TABLES.REINSPECTIONS);
    const cameras = db.getAll(TABLES.CAMERAS);

    res.json({
      success: true,
      data: {
        total_users: users.length,
        administrators: users.filter(u => u.role === ROLES.ADMIN).length,
        directors: users.filter(u => u.role === ROLES.DIRECTOR).length,
        supervisors: users.filter(u => u.role === ROLES.SUPERVISOR).length,
        inspectors: users.filter(u => u.role === ROLES.INSPECTOR).length,
        total_sites: sites.length,
        total_inspections: inspections.length,
        open_defects: defects.filter(d => d.status === 'OPEN').length,
        reinspections_count: reinspections.length,
        active_cameras: cameras.filter(c => c.status === 'CONNECTED').length,
        system_status: 'OPERATIONAL'
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/admin/system-config
 * Platform security and administrative configuration (ADMIN only)
 */
router.get('/system-config', (req, res) => {
  res.json({
    success: true,
    data: {
      auth_provider: 'JWT_HS256',
      token_expiry: '24h',
      strict_role_separation: true,
      allowed_roles: Object.values(ROLES),
      rbac_enforced: true,
      last_audit_sync: new Date().toISOString()
    }
  });
});

/**
 * GET /api/admin/audit-logs
 * Administrative audit logs (ADMIN only)
 */
router.get('/audit-logs', (req, res) => {
  try {
    const logs = db.getAll(TABLES.AUDIT_LOGS);
    res.json({
      success: true,
      count: logs.length,
      data: logs.slice(-50).reverse()
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
