const db = require('../config/db');
const { TABLES, REINSPECTION_STATUSES, REINSPECTION_RESULTS, DEFECT_STATUSES } = require('../models/schema');
const { v4: uuidv4 } = require('uuid');
const { logAuditAction } = require('../middleware/auditMiddleware');

/**
 * Create a Re-Inspection Request linked to an existing Defect / Issue
 * POST /api/reinspections
 */
async function createReinspectionRequest(req, res) {
  try {
    const { 
      defect_id, 
      assigned_inspector_id, 
      assigned_inspector_name, 
      priority = 'HIGH', 
      deadline, 
      instructions 
    } = req.body;

    if (!defect_id) {
      return res.status(400).json({ success: false, error: 'Defect ID is required.' });
    }

    const defect = db.getById(TABLES.DEFECTS, defect_id);
    if (!defect) {
      return res.status(404).json({ success: false, error: 'Target defect record not found.' });
    }

    // Identify the original inspection
    const originalInspection = db.getById(TABLES.INSPECTIONS, defect.inspection_id) || {};
    const site = db.getById(TABLES.SITES, originalInspection.site_id) || {};

    const reinspectionId = `reinsp-${uuidv4().slice(0, 8)}`;
    const newReinspection = {
      id: reinspectionId,
      defect_id: defect.id,
      original_inspection_id: defect.inspection_id,
      site_id: site.id || defect.site_id || 'site-001',
      site_name: site.name || defect.site_name || 'Main Construction Site',
      assigned_inspector_id: assigned_inspector_id || 'usr-insp-vp01',
      assigned_inspector_name: assigned_inspector_name || 'Vishnu Prasath',
      priority: priority.toUpperCase(),
      deadline: deadline || new Date(Date.now() + 86400000 * 2).toISOString(),
      instructions: instructions || 'Conduct physical site inspection and verify corrective actions.',
      original_defect: {
        id: defect.id,
        title: defect.title,
        description: defect.description,
        severity: defect.severity,
        photo_url: defect.photo_url,
        location_details: defect.location_details || defect.component || ''
      },
      status: REINSPECTION_STATUSES.ASSIGNED,
      result: null,
      new_evidence_photo: null,
      notes: null,
      yolo_detection: null,
      location_verified: false,
      coords: null,
      created_by: req.user ? req.user.name : 'Administrator',
      created_at: new Date().toISOString(),
      completed_at: null
    };

    db.insert(TABLES.REINSPECTIONS, newReinspection);

    // Update defect status to indicate re-inspection is active
    db.update(TABLES.DEFECTS, defect.id, {
      status: DEFECT_STATUSES.REINSPECTION_REQUIRED,
      reinspection_status: 'PENDING_INSPECTION',
      active_reinspection_id: reinspectionId
    });

    // Create Notification for the assigned Inspector
    try {
      db.insert(TABLES.NOTIFICATIONS, {
        id: `notif-${uuidv4().slice(0, 8)}`,
        user_id: newReinspection.assigned_inspector_id,
        type: 'REINSPECTION_ASSIGNED',
        title: 'New Re-Inspection Request',
        message: `New re-inspection request assigned for "${defect.title}" at ${newReinspection.site_name}.`,
        link: `/field-inspector?reinspection=${reinspectionId}`,
        read: false,
        created_at: new Date().toISOString()
      });
    } catch (e) {}

    // Audit log
    try {
      logAuditAction(
        req.user?.id || 'admin',
        'REINSPECTION_REQUEST_CREATED',
        'REINSPECTION',
        reinspectionId,
        { defect_id: defect.id, inspector: newReinspection.assigned_inspector_name },
        req
      );
    } catch (e) {}

    res.status(201).json({
      success: true,
      message: 'Re-inspection request dispatched to assigned field inspector.',
      data: newReinspection
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * Get All Re-Inspections
 * GET /api/reinspections
 */
async function getAllReinspections(req, res) {
  try {
    const { defect_id, assigned_inspector_id, status, limit = 100 } = req.query;
    let list = db.getAll(TABLES.REINSPECTIONS);

    if (defect_id) {
      list = list.filter(r => String(r.defect_id) === String(defect_id));
    }
    if (assigned_inspector_id) {
      list = list.filter(r => String(r.assigned_inspector_id) === String(assigned_inspector_id));
    }
    if (status) {
      list = list.filter(r => r.status.toUpperCase() === status.toUpperCase());
    }

    // Sort newest first
    list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    res.json({
      success: true,
      count: list.length,
      data: list.slice(0, Number(limit))
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * Get Specific Re-Inspection with Full Context
 * GET /api/reinspections/:id
 */
async function getReinspectionById(req, res) {
  try {
    const { id } = req.params;
    const reinspection = db.getById(TABLES.REINSPECTIONS, id);
    if (!reinspection) {
      return res.status(404).json({ success: false, error: 'Re-inspection record not found.' });
    }

    const defect = db.getById(TABLES.DEFECTS, reinspection.defect_id) || {};
    const originalInspection = db.getById(TABLES.INSPECTIONS, reinspection.original_inspection_id) || {};

    res.json({
      success: true,
      data: {
        ...reinspection,
        defect,
        original_inspection: originalInspection
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * Get Complete Issue History Chain (Original Inspection -> Defect -> Re-Inspection 1 -> Re-Inspection 2 -> ...)
 * GET /api/reinspections/history/:defectId
 */
async function getIssueHistory(req, res) {
  try {
    const { defectId } = req.params;
    const defect = db.getById(TABLES.DEFECTS, defectId);
    if (!defect) {
      return res.status(404).json({ success: false, error: 'Issue record not found.' });
    }

    const originalInspection = db.getById(TABLES.INSPECTIONS, defect.inspection_id) || null;
    const allReinspections = db.find(TABLES.REINSPECTIONS, { defect_id: defectId });
    // Sort chronologically ascending
    allReinspections.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

    res.json({
      success: true,
      data: {
        issue: defect,
        original_inspection: originalInspection,
        timeline: [
          {
            step: 'ORIGINAL_INSPECTION',
            title: 'Original Inspection Conducted',
            date: originalInspection ? originalInspection.created_at : defect.created_at,
            actor: originalInspection ? originalInspection.inspector_name : 'Field Auditor',
            details: originalInspection ? `Inspection #${originalInspection.id}` : 'Initial Finding',
            photo: defect.photo_url
          },
          {
            step: 'ISSUE_IDENTIFIED',
            title: `Issue Logged: ${defect.title}`,
            date: defect.created_at,
            actor: defect.inspector_name || 'Field Auditor',
            severity: defect.severity,
            details: defect.description,
            photo: defect.photo_url
          },
          ...allReinspections.map((r, idx) => ({
            step: `REINSPECTION_${idx + 1}`,
            reinspection_id: r.id,
            title: `Re-Inspection #${idx + 1}`,
            status: r.status,
            result: r.result,
            date: r.completed_at || r.created_at,
            actor: r.assigned_inspector_name,
            notes: r.notes || r.instructions,
            photo: r.new_evidence_photo || null,
            yolo: r.yolo_detection || null
          }))
        ],
        reinspections: allReinspections,
        current_status: defect.status
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * Submit Completed Re-Inspection
 * PUT /api/reinspections/:id/submit
 */
async function submitReinspection(req, res) {
  try {
    const { id } = req.params;
    const { 
      result, // 'FIXED', 'STILL_OPEN', 'NEEDS_MORE_WORK'
      new_photo_url, 
      notes, 
      yolo_result, 
      location_verified = true, 
      coords 
    } = req.body;

    const reinspection = db.getById(TABLES.REINSPECTIONS, id);
    if (!reinspection) {
      return res.status(404).json({ success: false, error: 'Re-inspection record not found.' });
    }

    const validResults = [REINSPECTION_RESULTS.FIXED, REINSPECTION_RESULTS.STILL_OPEN, REINSPECTION_RESULTS.NEEDS_MORE_WORK];
    const outcome = (result || '').toUpperCase();
    if (!validResults.includes(outcome)) {
      return res.status(400).json({ 
        success: false, 
        error: `Outcome must be one of: ${validResults.join(', ')}.` 
      });
    }

    const completedAt = new Date().toISOString();
    const inspectorName = req.user?.name || reinspection.assigned_inspector_name;

    // 1. Update the re-inspection record
    const updatedReinspection = db.update(TABLES.REINSPECTIONS, id, {
      status: REINSPECTION_STATUSES.COMPLETED,
      result: outcome,
      new_evidence_photo: new_photo_url || reinspection.original_defect?.photo_url,
      notes: notes || 'Re-inspection completed on site.',
      yolo_detection: yolo_result || null,
      location_verified: !!location_verified,
      coords: coords || null,
      completed_at: completedAt,
      completed_by: inspectorName
    });

    // 2. Update the parent defect status without touching the original inspection!
    let newDefectStatus = DEFECT_STATUSES.OPEN;
    if (outcome === REINSPECTION_RESULTS.FIXED) {
      newDefectStatus = DEFECT_STATUSES.CLOSED;
    } else if (outcome === REINSPECTION_RESULTS.NEEDS_MORE_WORK) {
      newDefectStatus = DEFECT_STATUSES.REINSPECTION_REQUIRED;
    }

    db.update(TABLES.DEFECTS, reinspection.defect_id, {
      status: newDefectStatus,
      reinspection_status: outcome,
      last_reinspection_at: completedAt,
      last_reinspected_by: inspectorName,
      latest_evidence_photo: new_photo_url || null
    });

    // 3. Notify Admins
    try {
      db.insert(TABLES.NOTIFICATIONS, {
        id: `notif-${uuidv4().slice(0, 8)}`,
        user_id: 'usr-admin-01',
        type: 'REINSPECTION_SUBMITTED',
        title: `Re-Inspection Completed: ${outcome}`,
        message: `Inspector ${inspectorName} submitted re-inspection for "${reinspection.original_defect?.title || 'Issue'}": Result is ${outcome}.`,
        link: `/admin-dashboard?reinspection=${id}`,
        read: false,
        created_at: completedAt
      });
    } catch (e) {}

    // 4. Audit Log
    try {
      logAuditAction(
        req.user?.id || reinspection.assigned_inspector_id,
        'REINSPECTION_SUBMITTED',
        'REINSPECTION',
        id,
        { outcome, defect_id: reinspection.defect_id, inspector: inspectorName },
        req
      );
    } catch (e) {}

    res.json({
      success: true,
      message: `Re-inspection recorded with result: ${outcome}.`,
      data: updatedReinspection
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

module.exports = {
  createReinspectionRequest,
  getAllReinspections,
  getReinspectionById,
  getIssueHistory,
  submitReinspection
};
