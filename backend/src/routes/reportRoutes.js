const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const authenticateJWT = require('../middleware/authMiddleware');

router.get('/pdf/:id', authenticateJWT, reportController.generateInspectionPdfReport);
router.get('/export/csv', authenticateJWT, reportController.exportCsv);
router.get('/compliance', authenticateJWT, reportController.getComplianceReport);

module.exports = router;
