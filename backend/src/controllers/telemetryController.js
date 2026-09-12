let latestTelemetry = {
  inspectorId: 'usr-insp-01',
  inspectorName: 'R. Saravanan',
  badge: 'INSP-2024-001',
  siteName: 'Delhi Metro Phase 2 — Track Pier P-14',
  siteId: 'site-001',
  latitude: 28.7041,
  longitude: 77.1025,
  isGeofenceLocked: true,
  distanceToSite: 142.3,
  fps: 28.2,
  battery: 88,
  activeChecklistProgress: 40,
  currentDetections: [
    {
      id: 'det-live-01',
      name: 'CONCRETE_SPALLING',
      severity: 'CRITICAL',
      confidence: 0.964,
      statutorySpec: 'IS 456:2000 / IRC:SP:40',
      bbox: { x: 22, y: 34, width: 44, height: 38 }
    }
  ],
  lastUpdated: new Date().toISOString()
};

let activeDirectives = [];

/**
 * Stream field inspector telemetry packet
 * POST /api/telemetry/stream
 */
async function streamTelemetry(req, res) {
  try {
    const data = req.body;
    latestTelemetry = {
      ...latestTelemetry,
      ...data,
      lastUpdated: new Date().toISOString()
    };

    res.json({
      success: true,
      message: 'Field telemetry packet received and mirrored.',
      directivesCount: activeDirectives.length
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * Get latest field telemetry for Admin Command Center
 * GET /api/telemetry/latest
 */
async function getLatestTelemetry(req, res) {
  res.json({
    success: true,
    data: latestTelemetry
  });
}

/**
 * Send administrative directive to field inspector's viewfinder
 * POST /api/telemetry/directive
 */
async function sendDirective(req, res) {
  try {
    const { message, type = 'INSTRUCTION', sender = 'K. Selvakumar, IAS' } = req.body;
    const directive = {
      id: `dir-${Date.now()}`,
      message,
      type,
      sender,
      timestamp: new Date().toISOString(),
      status: 'PENDING'
    };
    activeDirectives.push(directive);

    res.status(201).json({
      success: true,
      message: 'Directive transmitted to field inspector viewfinder.',
      data: directive
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * Get active directives for field inspector
 * GET /api/telemetry/directives
 */
async function getDirectives(req, res) {
  res.json({
    success: true,
    data: activeDirectives
  });
}

module.exports = {
  streamTelemetry,
  getLatestTelemetry,
  sendDirective,
  getDirectives
};
