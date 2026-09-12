const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const authenticateJWT = require('../middleware/authMiddleware');
const authorizeRoles = require('../middleware/roleMiddleware');

router.get('/overview', authenticateJWT, authorizeRoles('ADMIN', 'DIRECTOR', 'SUPERVISOR'), analyticsController.getOverviewKpis);
router.get('/site-wise', authenticateJWT, authorizeRoles('ADMIN', 'DIRECTOR', 'SUPERVISOR'), analyticsController.getSiteWiseAnalytics);
router.get('/inspector-performance', authenticateJWT, authorizeRoles('ADMIN', 'DIRECTOR', 'SUPERVISOR'), analyticsController.getInspectorPerformance);
router.get('/historical', authenticateJWT, authorizeRoles('ADMIN', 'DIRECTOR', 'SUPERVISOR'), analyticsController.getHistoricalComparison);
router.get('/comprehensive', authenticateJWT, authorizeRoles('ADMIN', 'DIRECTOR', 'SUPERVISOR'), analyticsController.getComprehensiveAnalytics);

module.exports = router;
