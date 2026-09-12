const express = require('express');
const router = express.Router();
const cctvController = require('../controllers/cctvController');

// Ingestion from Edge-YOLO boxes (no restrictive token needed for high-frequency edge transmission)
router.post('/incident', cctvController.recordIncident);
router.get('/incidents', cctvController.getIncidents);
router.post('/auto-dispatch', cctvController.autoDispatchInspector);
router.get('/nodes', cctvController.getCctvNodes);
router.post('/stream/start', cctvController.startStream);
router.post('/stream/stop', cctvController.stopStream);

module.exports = router;
