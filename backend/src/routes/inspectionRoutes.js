const express = require('express');
const router = express.Router();
const inspectionController = require('../controllers/inspectionController');
const authenticateJWT = require('../middleware/authMiddleware');
const authorizeRoles = require('../middleware/roleMiddleware');

router.get('/', authenticateJWT, inspectionController.getAllInspections);
router.get('/:id', authenticateJWT, inspectionController.getInspectionById);
router.post('/', authenticateJWT, authorizeRoles('ADMIN', 'DIRECTOR', 'SUPERVISOR'), inspectionController.createInspection);
router.post('/submit', authenticateJWT, inspectionController.submitInspection);
router.put('/:id/status', authenticateJWT, authorizeRoles('ADMIN', 'DIRECTOR', 'SUPERVISOR'), inspectionController.updateStatus);

module.exports = router;
