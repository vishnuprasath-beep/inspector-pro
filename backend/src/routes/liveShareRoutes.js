const express = require('express');
const router = express.Router();
const liveShareController = require('../controllers/liveShareController');
const authenticateJWT = require('../middleware/authMiddleware');
const authorizeRoles = require('../middleware/roleMiddleware');
const { ROLES } = require('../models/schema');

// All live-share operations require valid authenticated session
router.use(authenticateJWT);

// 1. Admin/Supervisor requests camera/screen access from an inspector
router.post('/request', authorizeRoles(ROLES.ADMIN, ROLES.SUPERVISOR), liveShareController.createRequest);

// 2. Query pending or active requests
router.get('/requests', liveShareController.getRequests);

// 3. Inspector responds (Accept / Decline) to access request
router.post('/respond', authorizeRoles(ROLES.INSPECTOR), liveShareController.respondRequest);

// 4. Inspector initiates active live share session
router.post('/start', authorizeRoles(ROLES.INSPECTOR), liveShareController.startSession);

// 5. Gracefully end active live share session
router.post('/stop', liveShareController.stopSession);

// 6. Real-time active live share sessions & inspector availability
router.get('/active', liveShareController.getActiveShares);

// 7. Live share historical sessions ledger
router.get('/history', liveShareController.getHistory);

// 8. WebRTC Signaling: post SDP Offer/Answer or ICE candidates
router.post('/signal', liveShareController.postSignal);

// 9. WebRTC Signaling: get SDP Offer/Answer or ICE candidates
router.get('/signals/:session_id', liveShareController.getSignals);

// 10. Voice Chat: Admin requests voice chat
router.post('/voice/request', authorizeRoles(ROLES.ADMIN, ROLES.SUPERVISOR), liveShareController.requestVoiceChat);

// 11. Voice Chat: Inspector responds to voice chat
router.post('/voice/respond', authorizeRoles(ROLES.INSPECTOR), liveShareController.respondVoiceChat);

// 12. Voice Chat: End voice chat
router.post('/voice/end', liveShareController.endVoiceChat);

// 13. Voice Chat: Status of voice chat
router.get('/voice/status/:session_id', liveShareController.getVoiceSessionStatus);
router.get('/voice/:session_id', liveShareController.getVoiceSessionStatus);

module.exports = router;
