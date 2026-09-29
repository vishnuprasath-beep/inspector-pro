const db = require('../config/db');
const { TABLES, ACTION_STATUSES, DEFECT_STATUSES } = require('../models/schema');
const { v4: uuidv4 } = require('uuid');

/**
 * Get All Corrective Actions with Defect Details
 */
async function getAllCorrectiveActions(req, res) {
  try {
    const actions = db.getAll(TABLES.CORRECTIVE_ACTIONS);
    const defects = db.getAll(TABLES.DEFECTS);
    const users = db.getAll(TABLES.USERS);

    const enriched = actions.map(act => {
      const defect = defects.find(d => d.id === act.defect_id) || {};
      const assignee = users.find(u => u.id === act.assigned_to_user_id) || {};
      const verifier = users.find(u => u.id === act.verified_by_id) || null;

      return {
        ...act,
        defect_title: defect.title || 'Untitled Defect',
        defect_severity: defect.severity,
        defect_photo: defect.photo_url,
        assigned_user_name: assignee.name || 'Unassigned',
        assigned_user_email: assignee.email,
        verifier_name: verifier ? verifier.name : null
      };
    });

    res.json({ success: true, count: enriched.length, data: enriched });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * Create/Assign Corrective Action
 */
async function createCorrectiveAction(req, res) {
  try {
    const defect_id = req.body.defect_id;
    const action_taken = req.body.action_taken || req.body.directive_title;
    const assigned_to_user_id = req.body.assigned_to_user_id || req.body.assigned_supervisor_id || 'usr-insp-vp01';
    const action_type = req.body.action_type || 'REPAIR';
    const estimated_cost = req.body.estimated_cost;
    const notes = req.body.notes || req.body.instructions || '';

    if (!defect_id || !action_taken) {
      return res.status(400).json({ success: false, error: 'Defect ID and action taken are required.' });
    }

    const defect = db.getById(TABLES.DEFECTS, defect_id);
    if (!defect) {
      return res.status(404).json({ success: false, error: 'Defect does not exist.' });
    }

    const newAction = {
      id: `act-${uuidv4().slice(0, 8)}`,
      defect_id,
      assigned_to_user_id: assigned_to_user_id || 'usr-insp-01',
      action_taken,
      action_type: action_type || 'REPAIR',
      status: ACTION_STATUSES.IN_PROGRESS,
      proof_image_url: null,
      verified_by_id: null,
      verified_at: null,
      notes: notes || '',
      estimated_cost: Number(estimated_cost) || 0.0
    };

    db.insert(TABLES.CORRECTIVE_ACTIONS, newAction);

    // Update defect status to ACTION_REQUIRED or IN_REVIEW
    db.update(TABLES.DEFECTS, defect_id, { status: DEFECT_STATUSES.ACTION_REQUIRED });

    res.status(201).json({ success: true, message: 'Corrective action created.', data: newAction });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * Verify / Complete Corrective Action (Supervisor Action)
 */
async function verifyCorrectiveAction(req, res) {
  try {
    const { id } = req.params;
    const { status = ACTION_STATUSES.VERIFIED, proof_image_url, notes } = req.body;

    const action = db.getById(TABLES.CORRECTIVE_ACTIONS, id);
    if (!action) {
      return res.status(404).json({ success: false, error: 'Corrective action not found.' });
    }

    const updates = {
      status: status.toUpperCase(),
      verified_by_id: req.user ? req.user.id : 'usr-supervisor-01',
      verified_at: new Date().toISOString()
    };
    if (proof_image_url) updates.proof_image_url = proof_image_url;
    if (notes) updates.notes = notes;

    const updated = db.update(TABLES.CORRECTIVE_ACTIONS, id, updates);

    // If verified, close or resolve corresponding defect
    if (status === ACTION_STATUSES.VERIFIED) {
      db.update(TABLES.DEFECTS, action.defect_id, { status: DEFECT_STATUSES.RESOLVED });
    }

    res.json({
      success: true,
      message: `Corrective action marked as ${updated.status}.`,
      data: updated
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

module.exports = {
  getAllCorrectiveActions,
  createCorrectiveAction,
  verifyCorrectiveAction
};
