const express = require('express');
const router = express.Router();
const telemetryController = require('../controllers/telemetryController');

router.post('/stream', telemetryController.streamTelemetry);
router.get('/latest', telemetryController.getLatestTelemetry);
router.post('/directive', telemetryController.sendDirective);
router.get('/directives', telemetryController.getDirectives);

module.exports = router;
