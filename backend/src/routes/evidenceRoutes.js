const express = require('express');
const router = express.Router();
const evidenceController = require('../controllers/evidenceController');
const authenticateJWT = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.post('/upload', authenticateJWT, upload.single('photo'), evidenceController.uploadEvidence);
router.get('/inspection/:inspectionId', authenticateJWT, evidenceController.getEvidenceByInspection);

module.exports = router;
