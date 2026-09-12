const express = require('express');
const router = express.Router();
const auditController = require('../controllers/auditController');
const authenticateJWT = require('../middleware/authMiddleware');
const authorizeRoles = require('../middleware/roleMiddleware');

router.get('/', authenticateJWT, authorizeRoles('ADMIN', 'DIRECTOR'), auditController.getAuditLogs);

module.exports = router;
