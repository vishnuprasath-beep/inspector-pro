const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authenticateJWT = require('../middleware/authMiddleware');
const authorizeRoles = require('../middleware/roleMiddleware');

router.get('/', authenticateJWT, authorizeRoles('ADMIN', 'DIRECTOR', 'SUPERVISOR'), userController.getAllUsers);
router.get('/inspectors', authenticateJWT, userController.getAllInspectors);
router.get('/inspectors/:id', authenticateJWT, userController.getInspectorById);
router.put('/inspectors/:id', authenticateJWT, userController.updateInspector);
router.put('/:id', authenticateJWT, userController.updateUser);

module.exports = router;
