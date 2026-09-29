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

    // Role-based Data Scoping:
    let scopedInspections = enriched;
    if (req.user && req.user.role === 'INSPECTOR') {
      const myInsp = inspectors.find(ins => ins.user_id === req.user.id || ins.id === req.user.id);
      scopedInspections = enriched.filter(i => 
        i.inspector_id === req.user.id || 
        (myInsp && i.inspector_id === myInsp.id) ||
        i.assigned_to === req.user.id
      );
    } else if (req.user && req.user.role === 'SUPERVISOR') {
      const supervisorSiteIds = sites.filter(s => s.supervisor_id === req.user.id).map(s => s.id);
      const filtered = enriched.filter(i => 
        supervisorSiteIds.includes(i.site_id) || 
        i.supervisor_id === req.user.id
      );
      scopedInspections = filtered.length > 0 ? filtered : enriched;
    }

    res.json({ success: true, count: scopedInspections.length, data: scopedInspections.slice(0, Number(limit)) });
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

    // 3. Insert Defects if provided or detected by YOLO
    const insertedDefects = [];
    for (const defect of detected_defects) {
      const sev = (defect.severity || SEVERITIES.MEDIUM).toUpperCase();
      const defectRecord = {
        id: `def-${uuidv4().slice(0, 8)}`,
        inspection_id: inspectionId,
        site_id: site.id,
        site_name: site.name,
        zone_id: req.body.zone_id || null,
        asset_id: defect.asset_id || null,
        category: defect.category || (defect.title?.toLowerCase().includes('ppe') || defect.title?.toLowerCase().includes('hardhat') || defect.title?.toLowerCase().includes('vest') ? 'SAFETY_PPE' : 'STRUCTURAL'),
        component: defect.component || defect.location_details || 'Inspected Area',
        title: defect.title || 'Field Identified Defect',
        description: defect.description || 'Defect recorded during field compliance audit.',
        severity: sev,
        status: DEFECT_STATUSES.OPEN,
        photo_url: defect.photo_url || req.body.photo_evidence_url || req.body.photo_url || 'https://images.unsplash.com/photo-1541888946425-d0fbb186156f?w=600',
        location_details: defect.location_details || `${site.name} — Inspection Corridor`,
        deadline: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
        root_cause: defect.root_cause || (defect.ai_detection ? 'Identified by neural vision analysis' : 'Identified during periodic audit cycle.'),
        risk_score: sev === 'CRITICAL' ? 92 : (sev === 'HIGH' ? 75 : 45),
        assigned_to: 'Regional Structural Remediation Team',
        ai_detection: defect.ai_detection || (req.body.ai_analysis ? {
          class: defect.title,
          confidence: 0.95,
          model_engine: req.body.ai_analysis.model_engine || 'construction_safety_yolov8.onnx',
          timestamp: new Date().toISOString()
        } : null),
        created_at: new Date().toISOString(),
        created_by: activeInspectorId
      };
      db.insert(TABLES.DEFECTS, defectRecord);
      insertedDefects.push(defectRecord);
    }

    // If no explicit defects but YOLO ai_analysis flagged infractions, automatically persist them
    if (insertedDefects.length === 0 && req.body.ai_analysis?.detections?.length > 0) {
      for (const det of req.body.ai_analysis.detections) {
        const sev = (det.severity || 'HIGH').toUpperCase();
        const autoDefect = {
          id: `def-${uuidv4().slice(0, 8)}`,
          inspection_id: inspectionId,
          site_id: site.id,
          site_name: site.name,
          zone_id: req.body.zone_id || null,
          category: det.class.toLowerCase().includes('ppe') || det.class.toLowerCase().includes('hardhat') || det.class.toLowerCase().includes('vest') ? 'SAFETY_PPE' : 'STRUCTURAL',
          component: req.body.zone_name || 'Hold Point Area',
          title: `${det.class} Non-Compliance`,
          description: `YOLOv8 detected ${det.class} (${((det.confidence || 0.9) * 100).toFixed(1)}% confidence) during statutory audit.`,
          severity: sev,
          status: DEFECT_STATUSES.OPEN,
          photo_url: req.body.photo_evidence_url || req.body.photo_url || 'https://images.unsplash.com/photo-1541888946425-d0fbb186156f?w=600',
          location_details: `${site.name} — ${req.body.zone_name || 'Corridor'}`,
          deadline: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
          root_cause: `Automated detection via ${req.body.ai_analysis.model_engine || 'YOLOv8'}`,
          risk_score: sev === 'CRITICAL' ? 92 : 75,
          assigned_to: 'Regional Structural Remediation Team',
          ai_detection: {
            class: det.class,
            confidence: det.confidence || 0.95,
            bbox: det.bbox || null,
            model_engine: req.body.ai_analysis.model_engine || 'construction_safety_yolov8.onnx',
            timestamp: new Date().toISOString()
          },
          created_at: new Date().toISOString(),
          created_by: activeInspectorId
        };
        db.insert(TABLES.DEFECTS, autoDefect);
        insertedDefects.push(autoDefect);
      }
    }

    // 4. Record GPS Log
    if (gps_lat && gps_lng) {
      db.insert(TABLES.GPS_LOGS, {
        id: `gps-${uuidv4().slice(0, 8)}`,
        user_id: activeInspectorId,
        latitude: gps_lat,
        longitude: gps_lng,
        recorded_at: new Date().toISOString(),
        site_id: site.id,
        in_geofence: geofenceResult.isValid
      });
    }

    // 5. Create In-App Notification for Directorate / Supervisors
    try {
      db.insert(TABLES.NOTIFICATIONS, {
        id: `notif-${uuidv4().slice(0, 8)}`,
        user_id: 'usr-supervisor-muthukumar',
        type: 'INSPECTION_SUBMITTED',
        title: `Audit Completed: ${site.name}`,
        message: `${inspectorName} submitted field audit. Score: ${newInspection.compliance_score}%. ${insertedDefects.length} defects logged. Status: ${inspectionStatus}.`,
        link: '/admin-dashboard',
        read: false,
        created_at: new Date().toISOString()
      });
    } catch (e) {}

    res.status(201).json({
      success: true,
      message: 'Inspection submitted and synchronized successfully.',
      data: {
        ...newInspection,
        defects: insertedDefects
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * Create / Schedule New Inspection Assignment (Admin / Supervisor)
 * POST /api/inspections
 */
async function createInspection(req, res) {
  try {
    const { site_id, inspector_id, scheduled_date, template_id, title, notes } = req.body;
    const allSites = db.getAll(TABLES.SITES);
    const site = allSites.find(s => s.id === site_id || s.code === site_id) || allSites[0];
    const inspectors = db.getAll(TABLES.INSPECTORS);
    const users = db.getAll(TABLES.USERS);
    const inspector = inspectors.find(i => i.id === inspector_id || i.user_id === inspector_id) || inspectors[0];
    const inspUser = inspector ? users.find(u => u.id === inspector.user_id || u.id === inspector.id) : null;

    const newInspId = `insp-${Date.now().toString().slice(-6)}`;
    const newInspection = {
      id: newInspId,
      template_id: template_id || 'tpl-01',
      site_id: site ? site.id : 'site-01',
      site_name: site ? site.name : 'Target Facility',
      site_code: site ? site.code : 'IND-SITE',
      inspector_id: inspector ? inspector.id : (inspUser ? inspUser.id : 'usr-insp-vp01'),
      inspector_name: inspUser ? inspUser.name : (inspector ? inspector.name : 'Vishnu Prasath'),
      title: title || `Mandatory Compliance Inspection — ${site ? site.name : 'Site'}`,
      scheduled_date: scheduled_date || new Date(Date.now() + 86400000 * 2).toISOString(),
      status: INSPECTION_STATUSES.SCHEDULED,
      compliance_score: null,
      total_items_checked: 0,
      passed_items_count: 0,
      failed_items_count: 0,
      defect_count: 0,
      geofence_verified: false,
      summary: notes || 'Statutory infrastructure inspection scheduled by Supervisory Directorate.'
    };

    db.insert(TABLES.INSPECTIONS, newInspection);

    // Create notification for assigned inspector
    try {
      db.insert(TABLES.NOTIFICATIONS, {
        id: `notif-${uuidv4().slice(0, 8)}`,
        user_id: newInspection.inspector_id,
        type: 'INSPECTION_ASSIGNED',
        title: 'New Statutory Inspection Assigned',
        message: `You have been assigned to conduct an audit at ${newInspection.site_name} scheduled for ${new Date(newInspection.scheduled_date).toLocaleDateString()}.`,
        link: '/field-inspector',
        read: false,
        created_at: new Date().toISOString()
      });
    } catch (e) {}

    res.status(201).json({ success: true, message: 'Inspection successfully scheduled and assigned.', data: newInspection });
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
  createInspection,
  updateStatus
};
