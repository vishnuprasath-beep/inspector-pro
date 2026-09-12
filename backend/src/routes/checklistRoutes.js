const express = require('express');
const router = express.Router();
const checklistController = require('../controllers/checklistController');
const authenticateJWT = require('../middleware/authMiddleware');
const authorizeRoles = require('../middleware/roleMiddleware');

router.use(authenticateJWT);

// 1. Get all configurable checklists (Accessible to all authenticated roles)
router.get('/', checklistController.getChecklists);

// 2. Add / Edit / Remove checklist items (Admin / Supervisor only)
router.post('/item', authorizeRoles('ADMIN', 'SUPERVISOR'), checklistController.addChecklistItem);
router.put('/item/:id', authorizeRoles('ADMIN', 'SUPERVISOR'), checklistController.updateChecklistItem);
router.delete('/item/:id', authorizeRoles('ADMIN', 'SUPERVISOR'), checklistController.deleteChecklistItem);

module.exports = router;
