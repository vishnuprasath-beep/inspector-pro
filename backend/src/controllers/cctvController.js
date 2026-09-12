const db = require('../config/db');
const { TABLES } = require('../models/schema');
const { v4: uuidv4 } = require('uuid');

// Default CCTV Nodes
const DEFAULT_CCTV_NODES = [
  {
    id: 'CAM-01',
    name: 'Delhi Metro Phase 2 — Track Pier P-14',
    site_id: 'site-001',
    status: 'ONLINE',
    fps: 28.4,
    resolution: '4K UHD (3840x2160)',
    statutory_spec: 'IS 456:2000 / IRC:SP:40',
    current_defect: 'CONCRETE_SPALLING',
    confidence: 0.964,
    last_ping: new Date().toISOString()
  },
  {
    id: 'CAM-02',
    name: 'NH-44 Highway Overpass — Pier P-04',
    site_id: 'site-002',
    status: 'ONLINE',
    fps: 29.1,
    resolution: '4K UHD (3840x2160)',
    statutory_spec: 'ASTM C1583 / IRC:83',
    current_defect: 'STRUCTURAL_CRACK',
    confidence: 0.912,
    last_ping: new Date().toISOString()
  },
  {
    id: 'CAM-03',
    name: 'Bhadla Solar Ultra Park — Sector 4 Substation',
    site_id: 'site-003',
    status: 'ONLINE',
    fps: 30.0,
    resolution: '4K UHD (3840x2160)',
    statutory_spec: 'ISO 12944 C5-M',
    current_defect: 'SURFACE_CORROSION',
    confidence: 0.887,
    last_ping: new Date().toISOString()
  },
  {
    id: 'CAM-04',
    name: 'Smart City Water Utility — Penstock Sump',
    site_id: 'site-004',
    status: 'ONLINE',
    fps: 27.8,
    resolution: '4K UHD (3840x2160)',
    statutory_spec: 'ACI 506.2-13',
    current_defect: 'WATER_SEEPAGE',
    confidence: 0.835,
    last_ping: new Date().toISOString()
  }
];

// In-memory incidents buffer (backed by DB table if available)
let cctvIncidents = [
  {
    id: 'CCTV-INC-101',
    camera_id: 'CAM-01',
    site_id: 'site-001',
    site_name: 'Delhi Metro Phase 2 — Track Pier P-14',
    defect_name: 'CONCRETE_SPALLING',
    severity: 'CRITICAL',
    confidence: 0.964,
    statutory_spec: 'IS 456:2000 / IRC:SP:40',
    status: 'DETECTED',
    timestamp: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    assigned_inspector: null
  },
  {
    id: 'CCTV-INC-102',
    camera_id: 'CAM-02',
    site_id: 'site-002',
    site_name: 'NH-44 Highway Overpass — Pier P-04',
    defect_name: 'STRUCTURAL_CRACK',
    severity: 'HIGH',
    confidence: 0.912,
    statutory_spec: 'ASTM C1583 / IRC:83',
    status: 'ASSIGNED',
    timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    assigned_inspector: 'R. Saravanan'
  }
];

// In-memory active streams set for cost control (streams OFF by default)
const activeStreams = new Set();

/**
 * Ingest incident alert from CCTV Edge-YOLO gateway with 15-minute debouncing
 * POST /api/cctv/incident
 */
async function recordIncident(req, res) {
  try {
    const payload = req.body;
    const targetCamera = payload.camera_id || 'CAM-01';
    const targetDefect = payload.defect_name || 'CONCRETE_SPALLING';

    // 15-minute cooldown debouncing to prevent spamming duplicate alerts
    const COOLDOWN_MS = 15 * 60 * 1000;
    const now = Date.now();
    const existing = cctvIncidents.find(i => 
      i.camera_id === targetCamera && 
      i.defect_name === targetDefect &&
      (now - new Date(i.timestamp).getTime()) < COOLDOWN_MS
    );

    if (existing) {
      existing.confidence = Number(payload.confidence || existing.confidence);
      existing.last_detected = new Date().toISOString();
      existing.detection_count = (existing.detection_count || 1) + 1;
      return res.status(200).json({
        success: true,
        debounced: true,
        message: `CCTV Alert for ${targetCamera} (${targetDefect}) updated (debounced).`,
        data: existing
      });
    }

    const incidentId = `CCTV-INC-${Date.now().toString().slice(-4)}`;
    const newIncident = {
      id: incidentId,
      source: 'cctv',
      camera_id: targetCamera,
      site_id: payload.site_id || 'site-001',
      site_name: payload.site_name || 'Delhi Metro Phase 2',
      defect_name: targetDefect,
      severity: payload.severity || 'CRITICAL',
      confidence: Number(payload.confidence || 0.92),
      statutory_spec: payload.statutory_spec || 'IS 456:2000',
      status: 'DETECTED',
      frame_preview: payload.frame_base64 || null,
      timestamp: payload.timestamp || new Date().toISOString(),
      detection_count: 1,
      assigned_inspector: null
    };

    cctvIncidents.unshift(newIncident);
    if (cctvIncidents.length > 50) cctvIncidents.pop();

    // Log to Audit trail
    try {
      db.insert(TABLES.AUDIT_LOGS, {
        id: `aud-${uuidv4().slice(0, 8)}`,
        action: 'CCTV_EDGE_INCIDENT_INGESTED',
        entity: 'CCTV_SURVEILLANCE',
        entity_id: incidentId,
        details: `CCTV ${newIncident.camera_id} detected ${newIncident.defect_name} (${(newIncident.confidence * 100).toFixed(1)}%)`,
        created_at: new Date().toISOString()
      });
    } catch (e) {}

    res.status(201).json({
      success: true,
      message: 'CCTV Defect Incident Ingested into Cloud Database.',
      data: newIncident
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * Get CCTV Incidents
 * GET /api/cctv/incidents
 */
async function getIncidents(req, res) {
  try {
    const { camera_id, severity, status } = req.query;
    let filtered = [...cctvIncidents];

    if (camera_id) filtered = filtered.filter(i => i.camera_id === camera_id);
    if (severity) filtered = filtered.filter(i => i.severity === severity.toUpperCase());
    if (status) filtered = filtered.filter(i => i.status === status.toUpperCase());

    res.json({
      success: true,
      count: filtered.length,
      data: filtered
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * Auto-Dispatch Inspector to Incident Site
 * POST /api/cctv/auto-dispatch
 */
async function autoDispatchInspector(req, res) {
  try {
    const { incident_id, inspector_id = 'usr-insp-01', inspector_name = 'Vishnu Prasath' } = req.body;
    const incident = cctvIncidents.find(i => i.id === incident_id);

    if (incident) {
      incident.status = 'DISPATCHED';
      incident.assigned_inspector = inspector_name;
      incident.dispatched_at = new Date().toISOString();

      // Create notification for inspector
      try {
        db.insert(TABLES.NOTIFICATIONS, {
          id: `notif-${uuidv4().slice(0, 8)}`,
          user_id: inspector_id,
          type: 'CCTV_DISPATCH',
          title: 'CCTV AI Alert Inspection Assigned',
          message: `CCTV AI detected possible ${incident.defect_name} at ${incident.site_name}. Physical check requested.`,
          link: '/field-inspector',
          read: false,
          created_at: new Date().toISOString()
        });
      } catch (e) {}
    }

    res.json({
      success: true,
      message: `Inspector ${inspector_name} dispatched to ${incident?.site_name || 'Facility'} with GPS coordinates.`,
      data: incident
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * Camera Stream Cost Control: Start live stream on explicit user view
 * POST /api/cctv/stream/start
 */
function startStream(req, res) {
  const { camera_id } = req.body;
  if (!camera_id) {
    return res.status(400).json({ success: false, error: 'Camera ID required.' });
  }
  activeStreams.add(camera_id);
  res.json({
    success: true,
    message: `Stream started for camera ${camera_id}. Bandwidth allocation active.`,
    active_streams: Array.from(activeStreams)
  });
}

/**
 * Camera Stream Cost Control: Stop live stream when user leaves page
 * POST /api/cctv/stream/stop
 */
function stopStream(req, res) {
  const { camera_id } = req.body;
  if (camera_id) {
    activeStreams.delete(camera_id);
  }
  res.json({
    success: true,
    message: `Stream terminated for camera ${camera_id || 'all'}. Bandwidth conserved.`,
    active_streams: Array.from(activeStreams)
  });
}

/**
 * Get CCTV Surveillance Nodes
 * GET /api/cctv/nodes
 */
async function getCctvNodes(req, res) {
  // Annotate nodes with dynamic active stream state
  const enrichedNodes = DEFAULT_CCTV_NODES.map(node => ({
    ...node,
    is_streaming: activeStreams.has(node.id)
  }));

  res.json({
    success: true,
    count: enrichedNodes.length,
    data: enrichedNodes,
    active_streams_count: activeStreams.size
  });
}

module.exports = {
  recordIncident,
  getIncidents,
  autoDispatchInspector,
  getCctvNodes,
  startStream,
  stopStream
};
