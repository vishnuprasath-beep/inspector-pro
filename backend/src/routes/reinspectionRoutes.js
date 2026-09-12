const express = require('express');
const router = express.Router();
const reinspectionController = require('../controllers/reinspectionController');
const authenticateJWT = require('../middleware/authMiddleware');

// Re-Inspection lifecycle endpoints
router.post('/', authenticateJWT, reinspectionController.createReinspectionRequest);
router.get('/', authenticateJWT, reinspectionController.getAllReinspections);
router.get('/history/:defectId', authenticateJWT, reinspectionController.getIssueHistory);
router.get('/:id', authenticateJWT, reinspectionController.getReinspectionById);
router.put('/:id/submit', authenticateJWT, reinspectionController.submitReinspection);

module.exports = router;
