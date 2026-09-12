const db = require('../config/db');
const { TABLES, SEVERITIES, DEFECT_STATUSES } = require('../models/schema');
const { v4: uuidv4 } = require('uuid');

/**
 * Helper to detect recurring issues at the same site, zone, and location
 */
function analyzeRecurrence(defect, allDefects, inspections) {
  const currentInsp = inspections.find(i => i.id === defect.inspection_id) || {};
  const siteId = defect.site_id || currentInsp.site_id;
  const zoneId = defect.zone_id || currentInsp.zone_id;
  const locationText = (defect.location_details || '').toLowerCase().trim();
  const descText = `${defect.title || ''} ${defect.description || ''}`.toLowerCase();

  // Core defect keywords
  const keywords = ['crack', 'spalling', 'corrosion', 'rebar', 'seepage', 'leak', 'helmet', 'vest', 'scaffold', 'guardrail', 'electrical'];
  const matchedKeywords = keywords.filter(k => descText.includes(k));

  if (!siteId || matchedKeywords.length === 0) {
    return { is_recurring: false, recurrence_count: 1, prior_defect_ids: [] };
  }

  const priorMatches = allDefects.filter(other => {
    if (other.id === defect.id) return false;
    const otherInsp = inspections.find(i => i.id === other.inspection_id) || {};
    const otherSite = other.site_id || otherInsp.site_id;
    if (String(otherSite) !== String(siteId)) return false;

    // Check zone match if present
    const otherZone = other.zone_id || otherInsp.zone_id;
    if (zoneId && otherZone && String(zoneId) === String(otherZone)) {
      const otherDesc = `${other.title || ''} ${other.description || ''}`.toLowerCase();
      return matchedKeywords.some(k => otherDesc.includes(k));
    }

    // Check location details similarity
    const otherLoc = (other.location_details || '').toLowerCase().trim();
    if (locationText && otherLoc && (locationText.includes(otherLoc) || otherLoc.includes(locationText))) {
      const otherDesc = `${other.title || ''} ${other.description || ''}`.toLowerCase();
      return matchedKeywords.some(k => otherDesc.includes(k));
    }

    // Direct keyword match on same site
    const otherDesc = `${other.title || ''} ${other.description || ''}`.toLowerCase();
    const common = matchedKeywords.filter(k => otherDesc.includes(k));
    return common.length >= 2;
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
        site_name: site.name || 'Unknown Site',
        site_code: site.code,
        inspection_title: inspection.title,
        asset_name: asset ? asset.name : 'General Structure',
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

    res.json({ success: true, count: enriched.length, data: enriched.slice(0, Number(limit)) });
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
      return res.status(404).json({ success: false, error: 'Defect record not found.' });
    }

    const inspections = db.getAll(TABLES.INSPECTIONS);
    const inspection = inspections.find(i => i.id === defect.inspection_id) || {};
    const site = db.getById(TABLES.SITES, defect.site_id || inspection.site_id) || {};
    const asset = defect.asset_id ? db.getById(TABLES.ASSETS, defect.asset_id) : null;
    const actions = db.find(TABLES.CORRECTIVE_ACTIONS, { defect_id: defect.id });
    const allDefects = db.getAll(TABLES.DEFECTS);
    const recurrence = analyzeRecurrence(defect, allDefects, inspections);

    res.json({
      success: true,
      data: {
        ...defect,
        inspection,
        site,
        asset,
        corrective_actions: actions,
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
 * Create Manual Defect
 */
async function createDefect(req, res) {
  try {
    const { inspection_id, site_id, zone_id, asset_id, title, description, severity, photo_url, location_details, deadline, assigned_to, assigned_officer_name, ai_detection, sync_client_uuid } = req.body;

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

    const allDefects = db.getAll(TABLES.DEFECTS);
    const inspections = db.getAll(TABLES.INSPECTIONS);
    const tempDefect = {
      site_id,
      zone_id,
      title,
      description,
      location_details,
      inspection_id
    };
    const recurrence = analyzeRecurrence(tempDefect, allDefects, inspections);

    const newDefect = {
      id: `def-${uuidv4().slice(0, 8)}`,
      sync_client_uuid: sync_client_uuid || null,
      inspection_id: inspection_id || 'insp-rec-01',
      site_id: site_id || null,
      zone_id: zone_id || null,
      asset_id: asset_id || null,
      title,
      description,
      severity: severity || SEVERITIES.MEDIUM,
      status: assigned_to ? DEFECT_STATUSES.ASSIGNED : DEFECT_STATUSES.OPEN,
      photo_url: photo_url || 'https://images.unsplash.com/photo-1541888946425-d0fbb186156f?w=600',
      location_details: location_details || '',
      deadline: deadline || new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
      root_cause: req.body.root_cause || 'Logged via Field Defect Reporting',
      risk_score: severity === 'CRITICAL' ? 90 : severity === 'HIGH' ? 70 : 40,
      assigned_to: assigned_to || null,
      assigned_officer_name: assigned_officer_name || null,
      ai_detection: ai_detection || null,
      is_recurring: recurrence.is_recurring,
      recurrence_count: recurrence.recurrence_count,
      created_at: new Date().toISOString(),
      created_by: req.user?.id || 'usr-insp-01'
    };

    db.insert(TABLES.DEFECTS, newDefect);
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
