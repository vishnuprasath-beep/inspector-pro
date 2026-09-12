const express = require('express');
const router = express.Router();
const gpsController = require('../controllers/gpsController');
const authenticateJWT = require('../middleware/authMiddleware');

router.post('/log', gpsController.logGps);
router.post('/verify-geofence', gpsController.verifyGeofenceEndpoint);
router.post('/locate-nearest', gpsController.locateNearestDestination);
router.get('/destinations', gpsController.getDestinations);
router.get('/logs', gpsController.getGpsLogs);

module.exports = router;

