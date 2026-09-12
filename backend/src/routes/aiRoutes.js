const express = require('express');
const router = express.Router();
const multer = require('multer');
const aiController = require('../controllers/aiController');
const authenticateJWT = require('../middleware/authMiddleware');

// In-memory Multer storage for uploaded image inspection buffers
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 } // 25MB max
});

// All AI endpoints require authenticated sessions
router.use(authenticateJWT);

// 1. Real YOLO Computer Vision Inference (supports file upload or base64)
router.post('/yolo/detect', upload.single('image'), aiController.detectYolo);
router.post('/detect-yolo', upload.single('image'), aiController.detectYolo);

// 2. Human Verification of AI Detections ([✓ Confirm] / [✗ False Detection])
router.post('/verify', aiController.verifyDetection);

// 3. AI Model Live Health Metrics & Telemetry
router.get('/model-status', aiController.getModelStatus);

// 4. Model Version History & Registry (v1.0, v1.1)
router.get('/models', aiController.getModelVersions);

// 5. Catalog of Verified Samples for Continuous Retraining
router.get('/verified-samples', aiController.getVerifiedSamples);

// 6. Institutional Safety Severity Rules
router.get('/severity-rules', aiController.getSeverityRules);

// 7. Legacy & Auxiliary Intelligence Endpoints
router.post('/detect-defects', aiController.detectDefects);
router.post('/predictive-maintenance', aiController.predictiveMaintenance);
router.post('/frequency-recommendations', aiController.frequencyRecommendations);

module.exports = router;
