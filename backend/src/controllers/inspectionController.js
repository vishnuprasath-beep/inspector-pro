const db = require('../config/db');
const { TABLES, INSPECTION_STATUSES, SEVERITIES, DEFECT_STATUSES } = require('../models/schema');
const { verifyGeofence } = require('../services/geofenceService');
const { v4: uuidv4 } = require('uuid');

/**
 * Get All Inspections with Relational Lookups & Filters
 */
async function getAllInspections(req, res) {
  try {
    const { status, site_id, inspector_id, limit = 50 } = req.query;
    let inspections = db.getAll(TABLES.INSPECTIONS);

    if (status) {
      inspections = inspections.filter(i => i.status.toUpperCase() === status.toUpperCase());
    }
    if (site_id) {
      inspections = inspections.filter(i => String(i.site_id) === String(site_id));
    }
    if (inspector_id) {
      inspections = inspections.filter(i => String(i.inspector_id) === String(inspector_id));
    }

    const sites = db.getAll(TABLES.SITES);
    const inspectors = db.getAll(TABLES.INSPECTORS);
    const users = db.getAll(TABLES.USERS);
    const defects = db.getAll(TABLES.DEFECTS);

    const enriched = inspections.map(i => {
      const site = sites.find(s => s.id === i.site_id) || {};
      const inspRecord = inspectors.find(ins => ins.id === i.inspector_id || ins.user_id === i.inspector_id) || {};
      const inspUser = users.find(u => u.id === inspRecord.user_id || u.id === i.inspector_id) || {};
      const relatedDefects = defects.filter(d => d.inspection_id === i.id);

      return {
        ...i,
        site_name: i.site_name || site.name || 'Unknown Site',
        site_code: i.site_code || site.code || 'N/A',
        city: site.city,
        state: site.state,
        inspector_name: i.inspector_name || inspUser.name || inspRecord.name || 'Field Inspector',
        inspector_code: inspRecord.employee_code || 'N/A',
        defects_count: relatedDefects.length,
        critical_defects_count: relatedDefects.filter(d => d.severity === SEVERITIES.CRITICAL).length
      };
    });

    // Sort descending by date
    enriched.sort((a, b) => new Date(b.scheduled_date) - new Date(a.scheduled_date));

    res.json({ success: true, count: enriched.length, data: enriched.slice(0, Number(limit)) });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * Get Single Inspection by ID with Full Hierarchy
 */
async function getInspectionById(req, res) {
  try {
    const { id } = req.params;
    const inspection = db.getById(TABLES.INSPECTIONS, id);
    if (!inspection) {
      return res.status(404).json({ success: false, error: 'Inspection record not found.' });
    }

    const site = db.getById(TABLES.SITES, inspection.site_id) || {};
    const inspector = db.getById(TABLES.INSPECTORS, inspection.inspector_id) || {};
    const inspectorUser = db.getById(TABLES.USERS, inspector.user_id) || {};
    const template = db.getById(TABLES.INSPECTION_TEMPLATES, inspection.template_id) || {};
    const checklists = db.find(TABLES.CHECKLISTS, { template_id: inspection.template_id });
    const defects = db.find(TABLES.DEFECTS, { inspection_id: inspection.id });
    const evidence = db.find(TABLES.INSPECTION_EVIDENCE, { inspection_id: inspection.id });

    res.json({
      success: true,
      data: {
        ...inspection,
        site,
        inspector: {
          ...inspector,
          name: inspectorUser.name,
          email: inspectorUser.email,
          phone: inspectorUser.phone
        },
        template,
        checklists,
        defects,
        evidence
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * Submit Field Inspection (from Mobile App / Simulator)
 * Handles automatic compliance calculation, GPS geofencing fraud check, and defect logging
 */
async function submitInspection(req, res) {
  try {
    const {
      template_id,
      site_id,
      inspector_id,
      title,
      gps_lat,
      gps_lng,
      checklist_results = [],
      detected_defects = [],
      signature_url,
      summary,
      sync_client_uuid
    } = req.body;

    // Idempotent deduplication check for offline sync transactions
    if (sync_client_uuid) {
      const existing = db.getAll(TABLES.INSPECTIONS).find(i => i.sync_client_uuid === sync_client_uuid);
      if (existing) {
        return res.status(200).json({
          success: true,
          message: 'Inspection was already synchronized (deduplicated).',
          data: existing,
          deduplicated: true
        });
      }
    }

    const allSites = db.getAll(TABLES.SITES);
    const site = db.getById(TABLES.SITES, site_id) || 
                 allSites.find(s => s.id === site_id || s.code === site_id || (s.name && site_id && s.name.toLowerCase().includes(String(site_id).toLowerCase()))) ||
                 allSites[0];

    if (!site) {
      return res.status(404).json({ success: false, error: 'No operational target sites registered.' });
    }

    // Determine inspector ID from token or payload
    const activeInspectorId = req.user ? req.user.id : (inspector_id || 'usr-insp-vp01');
    const inspectorName = req.user ? req.user.name : (req.body.inspector_name || 'Vishnu Prasath');

    // 1. Geofence Verification Check
    const geofenceResult = verifyGeofence(
      gps_lat,
      gps_lng,
      site.geo_fence_lat,
      site.geo_fence_lng,
      site.geo_fence_radius_meters
    );

    // 2. Score Calculation
    const totalItems = checklist_results.length || 5;
    const passedItems = checklist_results.filter(r => r.passed === true || r.status === 'PASS').length;
    const failedItems = totalItems - passedItems;
    const score = totalItems > 0 ? Math.round((passedItems / totalItems) * 1000) / 10 : 100;

    let inspectionStatus = INSPECTION_STATUSES.COMPLETED;
    if (!geofenceResult.isValid) {
      inspectionStatus = INSPECTION_STATUSES.FLAGGED;
    } else if (failedItems > 1 || detected_defects.some(d => d.severity === 'CRITICAL')) {
      inspectionStatus = INSPECTION_STATUSES.FLAGGED;
    }

    const inspectionId = `insp-${Date.now()}-${uuidv4().slice(0, 4)}`;

    const newInspection = {
      id: inspectionId,
      sync_client_uuid: sync_client_uuid || null,
      template_id: template_id || 'tpl-01',
      site_id: site.id,
      site_name: site.name,
      site_code: site.code,
      inspector_id: activeInspectorId,
      inspector_name: inspectorName,
      title: title || `Statutory Compliance Audit - ${site.name}`,
      scheduled_date: new Date().toISOString(),
      completed_date: new Date().toISOString(),
      status: inspectionStatus,
      compliance_score: req.body.compliance_score || score,
      total_items_checked: totalItems,
      passed_items_count: passedItems,
      failed_items_count: failedItems,
      defect_count: detected_defects.length,
      geofence_verified: geofenceResult.isValid,
      geofence_distance_meters: geofenceResult.distanceMeters,
      photo_evidence_url: req.body.photo_evidence_url || req.body.photo_url || null,
      ai_analysis: req.body.ai_analysis || null,
      digital_signature: signature_url || req.body.digital_signature || `PKI-SIG // ${inspectorName}`,
      signature_url: signature_url || null,
      supervisor_remarks: !geofenceResult.isValid
        ? `AUTOMATED FLAGGED: GPS variance of ${geofenceResult.varianceMeters}m outside authorized geofence boundary.`
        : 'Submitted and registered for Supervisor & Director verification.',
      summary: summary || req.body.notes || `Field statutory inspection completed for ${site.name}.`
    };

    db.insert(TABLES.INSPECTIONS, newInspection);

    // 3. Insert Defects if provided
    const insertedDefects = [];
    for (const defect of detected_defects) {
      const defectRecord = {
        id: `def-${uuidv4().slice(0, 8)}`,
        inspection_id: inspectionId,
        asset_id: defect.asset_id || null,
        title: defect.title || 'Field Identified Defect',
        description: defect.description || '',
        severity: defect.severity || SEVERITIES.MEDIUM,
        status: DEFECT_STATUSES.OPEN,
        photo_url: defect.photo_url || 'https://images.unsplash.com/photo-1541888946425-d0fbb186156f?w=600',
        location_details: defect.location_details || site.name,
        deadline: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
        root_cause: defect.root_cause || 'Identified during periodic audit cycle.'
      };
      db.insert(TABLES.DEFECTS, defectRecord);
      insertedDefects.push(defectRecord);
    }

    // 4. Record GPS Log
    if (gps_lat && gps_lng) {
      db.insert(TABLES.GPS_LOGS, {
        id: `gps-${uuidv4()}`,
        inspector_id: newInspection.inspector_id,
        inspection_id: inspectionId,
        lat: Number(gps_lat),
        lng: Number(gps_lng),
        accuracy: 12.0,
        is_within_geofence: geofenceResult.isValid,
        distance_to_site_meters: geofenceResult.distanceMeters,
        timestamp: new Date().toISOString()
      });
    }

    res.status(201).json({
      success: true,
      message: geofenceResult.isValid
        ? 'Inspection submitted successfully and verified within geofence.'
        : 'Inspection submitted with WARNING: Coordinates fall outside geofence perimeter and require supervisor review.',
      data: {
        ...newInspection,
        inspection: newInspection,
        geofenceAudit: geofenceResult,
        defects: insertedDefects
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * Update Inspection Status (Approve / Reject / Flag)
 */
async function updateStatus(req, res) {
  try {
    const { id } = req.params;
    const { status, supervisor_remarks } = req.body;

    const inspection = db.getById(TABLES.INSPECTIONS, id);
    if (!inspection) {
      return res.status(404).json({ success: false, error: 'Inspection record not found.' });
    }

    const updates = {};
    if (status) updates.status = status.toUpperCase();
    if (supervisor_remarks) updates.supervisor_remarks = supervisor_remarks;

    const updated = db.update(TABLES.INSPECTIONS, id, updates);

    res.json({
      success: true,
      message: `Inspection status updated to ${updated.status}.`,
      data: updated
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

module.exports = {
  getAllInspections,
  getInspectionById,
  submitInspection,
  updateStatus
};
