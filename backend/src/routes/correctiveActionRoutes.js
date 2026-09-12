const express = require('express');
const router = express.Router();
const correctiveActionController = require('../controllers/correctiveActionController');
const authenticateJWT = require('../middleware/authMiddleware');
const authorizeRoles = require('../middleware/roleMiddleware');

router.get('/', authenticateJWT, correctiveActionController.getAllCorrectiveActions);
router.post('/', authenticateJWT, authorizeRoles('ADMIN', 'SUPERVISOR', 'DIRECTOR'), correctiveActionController.createCorrectiveAction);
router.put('/:id/verify', authenticateJWT, authorizeRoles('ADMIN', 'SUPERVISOR', 'DIRECTOR'), correctiveActionController.verifyCorrectiveAction);

module.exports = router;
