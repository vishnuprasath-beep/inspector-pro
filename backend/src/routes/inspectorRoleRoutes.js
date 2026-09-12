const express = require('express');
const router = express.Router();
const authenticateJWT = require('../middleware/authMiddleware');
const authorizeRoles = require('../middleware/roleMiddleware');
const db = require('../config/db');
const { TABLES, ROLES } = require('../models/schema');

// Strict INSPECTOR-only barrier
router.use(authenticateJWT);
router.use(authorizeRoles(ROLES.INSPECTOR));

/**
 * GET /api/inspector/assigned-inspections
 * Active inspections assigned specifically to the logged-in inspector (INSPECTOR only)
 */
router.get('/assigned-inspections', (req, res) => {
  try {
    const inspections = db.getAll(TABLES.INSPECTIONS);
    const myInspections = inspections.filter(i => 
      i.inspector_id === req.user.id || 
      (i.inspector_name && i.inspector_name.toLowerCase().includes((req.user.name || '').toLowerCase()))
    );

    res.json({
      success: true,
      count: myInspections.length,
      data: myInspections
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/inspector/my-reinspections
 * Re-inspections assigned specifically to the logged-in inspector (INSPECTOR only)
 */
router.get('/my-reinspections', (req, res) => {
  try {
    const reinspections = db.getAll(TABLES.REINSPECTIONS);
    const myQueue = reinspections.filter(r => 
      r.assigned_inspector_id === req.user.id || 
      (r.assigned_inspector && r.assigned_inspector.toLowerCase().includes((req.user.name || '').toLowerCase())) ||
      r.status === 'ASSIGNED'
    );

    res.json({
      success: true,
      count: myQueue.length,
      data: myQueue
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/inspector/profile
 * Inspector profile and assigned facility coordinates (INSPECTOR only)
 */
router.get('/profile', (req, res) => {
  try {
    const inspector = db.findOne(TABLES.INSPECTORS, { user_id: req.user.id });
    res.json({
      success: true,
      data: {
        user: req.user,
        inspector_record: inspector
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
