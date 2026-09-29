const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authenticateJWT = require('../middleware/authMiddleware');
const authorizeRoles = require('../middleware/roleMiddleware');

router.get('/', authenticateJWT, authorizeRoles('ADMIN', 'DIRECTOR', 'SUPERVISOR'), userController.getAllUsers);
router.post('/', authenticateJWT, authorizeRoles('ADMIN'), userController.createUser);
router.delete('/:id', authenticateJWT, authorizeRoles('ADMIN'), userController.deleteUser);
router.put('/:id/role', authenticateJWT, authorizeRoles('ADMIN'), userController.updateUserRole);
router.put('/:id/status', authenticateJWT, authorizeRoles('ADMIN'), userController.updateUserStatus);
router.get('/inspectors', authenticateJWT, userController.getAllInspectors);
router.get('/inspectors/:id', authenticateJWT, userController.getInspectorById);
router.put('/inspectors/:id', authenticateJWT, authorizeRoles('ADMIN', 'SUPERVISOR'), userController.updateInspector);
router.put('/:id', authenticateJWT, userController.updateUser);

module.exports = router;
