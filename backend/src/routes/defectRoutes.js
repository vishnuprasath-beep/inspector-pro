const express = require('express');
const router = express.Router();
const defectController = require('../controllers/defectController');
const authenticateJWT = require('../middleware/authMiddleware');

router.get('/', authenticateJWT, defectController.getAllDefects);
router.get('/:id', authenticateJWT, defectController.getDefectById);
router.post('/', authenticateJWT, defectController.createDefect);
router.post('/:id/assign', authenticateJWT, defectController.assignDefect);
router.put('/:id/status', authenticateJWT, defectController.updateDefectStatus);

module.exports = router;
