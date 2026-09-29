const express = require('express');
const router = express.Router();
const siteController = require('../controllers/siteController');
const authenticateJWT = require('../middleware/authMiddleware');
const authorizeRoles = require('../middleware/roleMiddleware');

router.get('/', authenticateJWT, siteController.getAllSites);
router.post('/verify-qr', authenticateJWT, siteController.verifyQrCode);
router.get('/:id', authenticateJWT, siteController.getSiteById);
router.get('/:id/safety-score', authenticateJWT, siteController.getSiteSafetyScore);
router.get('/:id/geofence', authenticateJWT, siteController.getSiteGeofence);
router.post('/', authenticateJWT, authorizeRoles('ADMIN'), siteController.createSite);

module.exports = router;
