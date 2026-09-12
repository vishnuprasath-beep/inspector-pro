const express = require('express');
const cors = require('cors');
const path = require('path');
const errorHandler = require('./middleware/errorHandler');

// Route imports
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const siteRoutes = require('./routes/siteRoutes');
const inspectionRoutes = require('./routes/inspectionRoutes');
const defectRoutes = require('./routes/defectRoutes');
const correctiveActionRoutes = require('./routes/correctiveActionRoutes');
const gpsRoutes = require('./routes/gpsRoutes');
const evidenceRoutes = require('./routes/evidenceRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const reportRoutes = require('./routes/reportRoutes');
const auditRoutes = require('./routes/auditRoutes');
const aiRoutes = require('./routes/aiRoutes');
const cctvRoutes = require('./routes/cctvRoutes');
const telemetryRoutes = require('./routes/telemetryRoutes');
const reinspectionRoutes = require('./routes/reinspectionRoutes');
const adminRoleRoutes = require('./routes/adminRoleRoutes');
const directorRoleRoutes = require('./routes/directorRoleRoutes');
const supervisorRoleRoutes = require('./routes/supervisorRoleRoutes');
const inspectorRoleRoutes = require('./routes/inspectorRoleRoutes');
const liveShareRoutes = require('./routes/liveShareRoutes');
const checklistRoutes = require('./routes/checklistRoutes');

const app = express();

// Middleware
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static file serving for uploads
app.use('/uploads', express.static(path.resolve(__dirname, '../uploads')));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'HEALTHY',
    service: 'Smart Asset Inspection & Compliance Monitoring API',
    edition: 'Enterprise Production Suite',
    modules: ['CCTV_EDGE_YOLO', 'FIELD_TELEMETRY_STREAM', 'GPS_GEOFENCE_LOCATOR', 'REINSPECTIONS', 'INSPECTOR_LIVE_SHARE', 'FIREBASE_SYNC'],
    timestamp: new Date().toISOString()
  });
});

// API Routes Mounting
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/sites', siteRoutes);
app.use('/api/inspections', inspectionRoutes);
app.use('/api/defects', defectRoutes);
app.use('/api/reinspections', reinspectionRoutes);
app.use('/api/corrective-actions', correctiveActionRoutes);
app.use('/api/gps', gpsRoutes);
app.use('/api/cctv', cctvRoutes);
app.use('/api/telemetry', telemetryRoutes);
app.use('/api/evidence', evidenceRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/audit-logs', auditRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/checklists', checklistRoutes);

// Dedicated Role-Protected Barriers
app.use('/api/admin', adminRoleRoutes);
app.use('/api/director', directorRoleRoutes);
app.use('/api/supervisor', supervisorRoleRoutes);
app.use('/api/inspector', inspectorRoleRoutes);

// Inspector Live Share (WebRTC Real-Time Camera & Screen Sharing)
app.use('/api/live-share', liveShareRoutes);


// Fallback 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    error: `API Route '${req.originalUrl}' not found.`
  });
});

// Global Error Handler
app.use(errorHandler);

module.exports = app;
