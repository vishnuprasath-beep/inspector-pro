const express = require('express');
const router = express.Router();
const authenticateJWT = require('../middleware/authMiddleware');
const authorizeRoles = require('../middleware/roleMiddleware');
const db = require('../config/db');
const { TABLES, ROLES } = require('../models/schema');

// Strict SUPERVISOR-only barrier
router.use(authenticateJWT);
router.use(authorizeRoles(ROLES.SUPERVISOR));

/**
 * GET /api/supervisor/operations-summary
 * Operational inspections backlog and pending sign-offs (SUPERVISOR only)
 */
router.get('/operations-summary', (req, res) => {
  try {
    const inspections = db.getAll(TABLES.INSPECTIONS);
    const defects = db.getAll(TABLES.DEFECTS);
    const reinspections = db.getAll(TABLES.REINSPECTIONS);
    const inspectors = db.getAll(TABLES.INSPECTORS);

    res.json({
      success: true,
      data: {
        active_field_inspectors: inspectors.filter(i => i.status === 'AVAILABLE' || i.status === 'ON_INSPECTION').length,
        todays_inspections_pending: inspections.filter(i => i.status === 'PENDING' || i.status === 'IN_PROGRESS').length,
        pending_reinspections: reinspections.filter(r => r.status === 'ASSIGNED' || r.status === 'IN_PROGRESS').length,
        active_contractor_reworks: defects.filter(d => d.status === 'IN_PROGRESS' || d.status === 'CORRECTED').length,
        supervisor_station: 'Central Infrastructure Command Depot',
        generated_at: new Date().toISOString()
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/supervisor/remediation-queue
 * Contractor proof submissions requiring supervisory review (SUPERVISOR only)
 */
router.get('/remediation-queue', (req, res) => {
  try {
    const defects = db.getAll(TABLES.DEFECTS);
    const pendingReview = defects.filter(d => d.status === 'CORRECTED' || d.status === 'REINSPECTION_REQUIRED');
    res.json({
      success: true,
      count: pendingReview.length,
      data: pendingReview
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
