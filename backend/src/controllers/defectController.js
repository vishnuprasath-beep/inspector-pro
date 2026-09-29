const db = require('../config/db');
const { TABLES, SEVERITIES, DEFECT_STATUSES } = require('../models/schema');
const { v4: uuidv4 } = require('uuid');

/**
 * Helper to detect recurring issues at the same site, zone, and location
 */
function analyzeRecurrence(defect, allDefects, inspections) {
  const allSites = db.getAll(TABLES.SITES);
  const currentInsp = inspections.find(i => i.id === defect.inspection_id) || {};
  let rawSite = defect.site_id || currentInsp.site_id || defect.site_name;
  const matchedSite = allSites.find(s => s.id === rawSite || s.code === rawSite || (defect.site_name && s.name.toLowerCase().includes(defect.site_name.toLowerCase())));
  const siteId = matchedSite ? matchedSite.id : rawSite;
  const zoneId = defect.zone_id || currentInsp.zone_id;
  const locationText = (defect.location_details || '').toLowerCase().trim();
  const descText = `${defect.title || ''} ${defect.description || ''} ${defect.component || ''}`.toLowerCase();

  // Core defect keywords
  const keywords = ['crack', 'spalling', 'corrosion', 'rebar', 'seepage', 'leak', 'helmet', 'vest', 'scaffold', 'guardrail', 'electrical', 'pier', 'beam'];
  const matchedKeywords = keywords.filter(k => descText.includes(k));

  if (!siteId || matchedKeywords.length === 0) {
    return { is_recurring: false, recurrence_count: 1, prior_defect_ids: [] };
  }

  const priorMatches = allDefects.filter(other => {
    if (other.id === defect.id) return false;
    const otherInsp = inspections.find(i => i.id === other.inspection_id) || {};
    let otherRawSite = other.site_id || otherInsp.site_id || other.site_name;
    const otherMatchedSite = allSites.find(s => s.id === otherRawSite || s.code === otherRawSite || (other.site_name && s.name.toLowerCase().includes(other.site_name.toLowerCase())));
    const otherSite = otherMatchedSite ? otherMatchedSite.id : otherRawSite;

    if (String(otherSite) !== String(siteId)) return false;

    // Check zone match if present
    const otherZone = other.zone_id || otherInsp.zone_id;
    if (zoneId && otherZone && String(zoneId) === String(otherZone)) {
      const otherDesc = `${other.title || ''} ${other.description || ''} ${other.component || ''}`.toLowerCase();
      return matchedKeywords.some(k => otherDesc.includes(k));
    }

    // Check location details similarity
    const otherLoc = (other.location_details || '').toLowerCase().trim();
    if (locationText && otherLoc && (locationText.includes(otherLoc) || otherLoc.includes(locationText))) {
      const otherDesc = `${other.title || ''} ${other.description || ''} ${other.component || ''}`.toLowerCase();
      return matchedKeywords.some(k => otherDesc.includes(k));
    }

    // Direct keyword match on same site
    const otherDesc = `${other.title || ''} ${other.description || ''} ${other.component || ''}`.toLowerCase();
    const common = matchedKeywords.filter(k => otherDesc.includes(k));
    return common.length >= 1;
  });

  return {
    is_recurring: priorMatches.length > 0,
    recurrence_count: priorMatches.length + 1,
    prior_defect_ids: priorMatches.map(d => d.id)
  };
}

/**
 * Get All Defects with Multi-criteria Filtering & Recurrence Analysis
 */
async function getAllDefects(req, res) {
  try {
    const { severity, status, site_id, limit = 100 } = req.query;
    let defects = db.getAll(TABLES.DEFECTS);

    if (severity) {
      defects = defects.filter(d => d.severity.toUpperCase() === severity.toUpperCase());
    }
    if (status) {
      defects = defects.filter(d => d.status.toUpperCase() === status.toUpperCase());
    }

    const inspections = db.getAll(TABLES.INSPECTIONS);
    const sites = db.getAll(TABLES.SITES);
    const assets = db.getAll(TABLES.ASSETS);
    const actions = db.getAll(TABLES.CORRECTIVE_ACTIONS);
    const allDefects = db.getAll(TABLES.DEFECTS);

    let enriched = defects.map(d => {
      const inspection = inspections.find(i => i.id === d.inspection_id) || {};
      const site = sites.find(s => s.id === (d.site_id || inspection.site_id)) || {};
      const asset = assets.find(a => a.id === d.asset_id) || null;
      const relatedAction = actions.find(a => a.defect_id === d.id) || null;
      const recurrence = analyzeRecurrence(d, allDefects, inspections);

      return {
        ...d,
        site_id: site.id || d.site_id,
        site_name: d.site_name || site.name || 'Unknown Site',
        site_code: site.code || d.site_code,
        category: d.category || 'STRUCTURAL',
        inspection_title: inspection.title,
        asset_name: asset ? asset.name : (d.component || 'General Structure'),
        asset_tag: asset ? asset.asset_tag : 'N/A',
        has_corrective_action: !!relatedAction,
        corrective_action_status: relatedAction ? relatedAction.status : null,
        is_recurring: recurrence.is_recurring,
        recurrence_count: recurrence.recurrence_count,
        prior_defect_ids: recurrence.prior_defect_ids,
        assigned_to: d.assigned_to || null,
        assigned_officer_name: d.assigned_officer_name || null
      };
    });

    if (site_id) {
      enriched = enriched.filter(d => String(d.site_id) === String(site_id));
    }

    // Severity rank order: CRITICAL (1), HIGH (2), MEDIUM (3), LOW (4)
    const rank = { CRITICAL: 1, HIGH: 2, MEDIUM: 3, LOW: 4 };
    enriched.sort((a, b) => (rank[a.severity] || 5) - (rank[b.severity] || 5));

    res.json({
      success: true,
      count: enriched.length,
      data: enriched.slice(0, parseInt(limit))
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * Get Defect by ID
 */
async function getDefectById(req, res) {
  try {
    const { id } = req.params;
    const defect = db.getById(TABLES.DEFECTS, id);
    if (!defect) {
      return res.status(404).json({ success: false, error: 'Defect not found.' });
    }

    const allDefects = db.getAll(TABLES.DEFECTS);
    const inspections = db.getAll(TABLES.INSPECTIONS);
    const inspection = inspections.find(i => i.id === defect.inspection_id) || {};
    const site = db.getById(TABLES.SITES, defect.site_id || inspection.site_id) || {};
    const asset = db.getById(TABLES.ASSETS, defect.asset_id) || null;
    const correctiveAction = db.find(TABLES.CORRECTIVE_ACTIONS, { defect_id: defect.id })[0] || null;
    const recurrence = analyzeRecurrence(defect, allDefects, inspections);

    res.json({
      success: true,
      data: {
        ...defect,
        site_id: site.id || defect.site_id,
        site_name: defect.site_name || site.name || 'Unknown Site',
        site_code: site.code,
        category: defect.category || 'STRUCTURAL',
        inspection_title: inspection.title,
        asset_name: asset ? asset.name : 'General Structure',
        corrective_action: correctiveAction,
        is_recurring: recurrence.is_recurring,
        recurrence_count: recurrence.recurrence_count,
        prior_defect_ids: recurrence.prior_defect_ids
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * Create Manual or YOLO AI Defect
 */
async function createDefect(req, res) {
  try {
    const { 
      inspection_id, 
      site_id, 
      zone_id, 
      asset_id, 
      title, 
      description, 
      severity, 
      photo_url, 
      location_details, 
      deadline, 
      assigned_to, 
      assigned_officer_name, 
      ai_detection, 
      sync_client_uuid 
    } = req.body;

    if (!title || !description) {
      return res.status(400).json({ success: false, error: 'Title and description are required.' });
    }

    // Idempotent deduplication check for offline sync transactions
    if (sync_client_uuid) {
      const existing = db.getAll(TABLES.DEFECTS).find(d => d.sync_client_uuid === sync_client_uuid);
      if (existing) {
        return res.status(200).json({
          success: true,
          message: 'Defect already synchronized (deduplicated).',
          data: existing,
          deduplicated: true
        });
      }
    }

    const allSites = db.getAll(TABLES.SITES);
    const matchedSite = allSites.find(s => 
      s.id === site_id || 
      s.code === site_id || 
      (s.name && site_id && s.name.toLowerCase().includes(String(site_id).toLowerCase())) ||
      (req.body.site_name && s.name.toLowerCase().includes(String(req.body.site_name).toLowerCase()))
    );

    const resolvedSiteId = matchedSite ? matchedSite.id : (site_id || (allSites[0] ? allSites[0].id : null));
    const resolvedSiteName = matchedSite ? matchedSite.name : (req.body.site_name || (allSites[0] ? allSites[0].name : 'Designated Infrastructure Site'));

    const allDefects = db.getAll(TABLES.DEFECTS);
    const inspections = db.getAll(TABLES.INSPECTIONS);
    const tempDefect = {
      site_id: resolvedSiteId,
      site_name: resolvedSiteName,
      zone_id,
      title,
      description,
      location_details,
      inspection_id
    };
    const recurrence = analyzeRecurrence(tempDefect, allDefects, inspections);

    const normalizedSeverity = (severity || SEVERITIES.MEDIUM).toUpperCase();
    const riskScore = normalizedSeverity === 'CRITICAL' ? 92 : (normalizedSeverity === 'HIGH' ? 75 : (normalizedSeverity === 'MEDIUM' ? 45 : 20));

    // Preserve structured AI detection metadata if present
    const detectionMeta = ai_detection || (req.body.confidence != null || req.body.bbox ? {
      class: req.body.detection_class || title,
      confidence: req.body.confidence != null ? Number(req.body.confidence) : 0.95,
      bbox: req.body.bbox || null,
      model_engine: req.body.model_engine || 'construction_safety_yolov8.onnx',
      timestamp: new Date().toISOString()
    } : null);

    const category = req.body.category || (
      title.toLowerCase().includes('ppe') || 
      title.toLowerCase().includes('hardhat') || 
      title.toLowerCase().includes('vest') || 
      title.toLowerCase().includes('mask') || 
      title.toLowerCase().includes('glove') 
        ? 'SAFETY_PPE' 
        : (title.toLowerCase().includes('corrosion') ? 'CORROSION' : 'STRUCTURAL')
    );

    const newDefect = {
      id: `def-${uuidv4().slice(0, 8)}`,
      sync_client_uuid: sync_client_uuid || null,
      inspection_id: inspection_id || 'insp-rec-01',
      site_id: resolvedSiteId,
      site_name: resolvedSiteName,
      site: resolvedSiteName,
      zone_id: zone_id || null,
      asset_id: asset_id || null,
      category,
      component: req.body.component || location_details || 'Structural Section',
      title,
      defect_type: req.body.defect_type || req.body.detection_class || title,
      description,
      confidence: req.body.confidence != null ? Number(req.body.confidence) : (detectionMeta?.confidence || null),
      severity: normalizedSeverity,
      status: assigned_to ? DEFECT_STATUSES.ASSIGNED : DEFECT_STATUSES.OPEN,
      photo_url: photo_url || req.body.evidence_image || 'https://images.unsplash.com/photo-1541888946425-d0fbb186156f?w=600',
      evidence_image: req.body.evidence_image || photo_url || null,
      location: location_details || req.body.location || resolvedSiteName,
      location_details: location_details || resolvedSiteName,
      bounding_box: req.body.bounding_box || req.body.bbox || null,
      bbox: req.body.bbox || req.body.bounding_box || null,
      date_time: req.body.date_time || new Date().toISOString(),
      deadline: deadline || new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
      inspector: req.body.inspector || req.body.reported_by || req.user?.name || 'Field Inspector',
      reported_by: req.body.reported_by || req.body.inspector || req.user?.name || 'Field Inspector',
      ai_source: req.body.ai_source || (detectionMeta ? 'YOLOv8 Neural Detection' : 'Manual Inspection'),
      human_verification_status: req.body.human_verification_status || 'CONFIRMED',
      requires_human_verification: req.body.requires_human_verification ?? true,
      verification_advisory: req.body.verification_advisory || 'AI visual indication — requires inspector verification.',
      statutory_ref: req.body.statutory_ref || 'IS 456:2000',
      root_cause: req.body.root_cause || (detectionMeta ? `Identified by YOLOv8 model (${(detectionMeta.confidence * 100).toFixed(1)}% conf)` : 'Field inspection defect observation'),
      risk_score: riskScore,
      assigned_to: assigned_to || 'Regional Structural Remediation Team',
      assigned_officer_name: assigned_officer_name || null,
      ai_detection: detectionMeta,
      is_recurring: recurrence.is_recurring,
      recurrence_count: recurrence.recurrence_count,
      created_at: new Date().toISOString(),
      created_by: req.user?.id || 'usr-insp-01'
    };

    db.insert(TABLES.DEFECTS, newDefect);

    // Create notification for supervisors if CRITICAL or HIGH
    if (normalizedSeverity === 'CRITICAL' || normalizedSeverity === 'HIGH') {
      try {
        db.insert(TABLES.NOTIFICATIONS, {
          id: `notif-${uuidv4().slice(0, 8)}`,
          user_id: 'usr-supervisor-muthukumar',
          type: 'HIGH_RISK_DEFECT',
          title: `High-Risk Anomaly: ${newDefect.title}`,
          message: `${normalizedSeverity} severity issue identified at ${resolvedSiteName}. Immediate remediation required.`,
          link: '/admin-dashboard',
          read: false,
          created_at: new Date().toISOString()
        });
      } catch (e) {}
    }

    res.status(201).json({ success: true, message: 'Defect logged successfully.', data: newDefect });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * Assign Defect to Personnel
 * POST /api/defects/:id/assign
 */
async function assignDefect(req, res) {
  try {
    const { id } = req.params;
    const { assigned_to, assigned_officer_name, deadline } = req.body;

    const defect = db.getById(TABLES.DEFECTS, id);
    if (!defect) {
      return res.status(404).json({ success: false, error: 'Defect not found.' });
    }

    const updates = {
      assigned_to,
      assigned_officer_name: assigned_officer_name || 'Assigned Officer',
      status: DEFECT_STATUSES.ASSIGNED,
      assigned_at: new Date().toISOString(),
      assigned_by: req.user?.name || 'Administrator'
    };
    if (deadline) updates.deadline = deadline;

    const updated = db.update(TABLES.DEFECTS, id, updates);
    res.json({ success: true, message: 'Defect assigned successfully.', data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * Update Defect Status
 */
async function updateDefectStatus(req, res) {
  try {
    const { id } = req.params;
    const { status, root_cause, deadline, resolution } = req.body;

    const defect = db.getById(TABLES.DEFECTS, id);
    if (!defect) {
      return res.status(404).json({ success: false, error: 'Defect not found.' });
    }

    const updates = {};
    if (status) updates.status = status.toUpperCase();
    if (root_cause) updates.root_cause = root_cause;
    if (deadline) updates.deadline = deadline;
    if (resolution) {
      updates.resolution = resolution;
      updates.resolved_at = new Date().toISOString();
    }

    const updated = db.update(TABLES.DEFECTS, id, updates);
    res.json({ success: true, message: 'Defect updated.', data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

module.exports = {
  getAllDefects,
  getDefectById,
  createDefect,
  assignDefect,
  updateDefectStatus,
  analyzeRecurrence
};
