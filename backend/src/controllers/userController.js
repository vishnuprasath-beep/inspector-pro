const db = require('../config/db');
const { TABLES, ROLES } = require('../models/schema');

/**
 * Get All Users with optional role filter
 */
async function getAllUsers(req, res) {
  try {
    const { role } = req.query;
    let users = db.getAll(TABLES.USERS);

    if (role) {
      users = users.filter(u => u.role.toUpperCase() === role.toUpperCase());
    }

    const safeUsers = users.map(u => {
      const { password_hash, ...rest } = u;
      return rest;
    });

    res.json({ success: true, count: safeUsers.length, data: safeUsers });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * Get All Inspectors with Live Telemetry and Stats
 */
async function getAllInspectors(req, res) {
  try {
    const inspectors = db.getAll(TABLES.INSPECTORS);
    const users = db.getAll(TABLES.USERS);
    const inspections = db.getAll(TABLES.INSPECTIONS);

    const detailedInspectors = inspectors.map(insp => {
      const user = users.find(u => u.id === insp.user_id) || {};
      const inspInspections = inspections.filter(i => i.inspector_id === insp.id);
      const completed = inspInspections.filter(i => i.status === 'COMPLETED' || i.status === 'APPROVED').length;
      const totalScore = inspInspections.reduce((sum, i) => sum + (i.compliance_score || 0), 0);
      const avgScore = inspInspections.length > 0 ? (totalScore / inspInspections.length).toFixed(1) : '90.0';

      return {
        id: insp.id,
        user_id: insp.user_id,
        name: user.name || 'Inspector',
        email: user.email,
        phone: user.phone,
        avatar_url: user.avatar_url,
        employee_code: insp.employee_code,
        badge_number: insp.employee_code || insp.badge_number,
        specialization: insp.specialization,
        qualification: insp.qualification,
        current_lat: insp.current_lat,
        current_lng: insp.current_lng,
        latitude: insp.current_lat,
        longitude: insp.current_lng,
        is_simulated: Boolean(insp.is_simulated),
        assigned_site_id: insp.assigned_site_id,
        assigned_site_name: insp.assigned_site_name,
        last_active_at: insp.last_active_at,
        assigned_sites_count: insp.assigned_sites_count || 1,
        status: insp.status,
        total_inspections: inspInspections.length,
        completed_inspections: completed,
        average_compliance_score: parseFloat(avgScore)
      };
    });

    res.json({ success: true, count: detailedInspectors.length, data: detailedInspectors });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * Get Single Inspector by ID
 */
async function getInspectorById(req, res) {
  try {
    const { id } = req.params;
    const inspector = db.getById(TABLES.INSPECTORS, id);
    if (!inspector) {
      return res.status(404).json({ success: false, error: 'Inspector not found.' });
    }

    const user = db.getById(TABLES.USERS, inspector.user_id) || {};
    const inspections = db.find(TABLES.INSPECTIONS, { inspector_id: inspector.id });

    res.json({
      success: true,
      data: {
        ...inspector,
        name: user.name,
        email: user.email,
        phone: user.phone,
        avatar_url: user.avatar_url,
        inspections
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * Update Inspector by ID (Updates inspector and corresponding user record, including avatar)
 */
async function updateInspector(req, res) {
  try {
    const { id } = req.params;
    const updates = req.body;

    let inspector = db.getById(TABLES.INSPECTORS, id);
    let userId = inspector?.user_id;

    if (!inspector) {
      const allInspectors = db.getAll(TABLES.INSPECTORS);
      inspector = allInspectors.find(i => i.id === id || i.user_id === id);
      if (inspector) userId = inspector.user_id;
    }

    if (!userId) {
      const user = db.getById(TABLES.USERS, id);
      if (user) {
        userId = user.id;
      }
    }

    // Update user record if found
    if (userId) {
      const userUpdates = {};
      if (updates.name) userUpdates.name = updates.name;
      if (updates.email) userUpdates.email = updates.email;
      if (updates.phone) userUpdates.phone = updates.phone;
      if (updates.avatar_url) userUpdates.avatar_url = updates.avatar_url;
      db.update(TABLES.USERS, userId, userUpdates);
    }

    // Update inspector record if found
    if (inspector) {
      const inspUpdates = {};
      if (updates.specialization) inspUpdates.specialization = updates.specialization;
      if (updates.status) inspUpdates.status = updates.status;
      if (updates.badge_number) inspUpdates.employee_code = updates.badge_number;
      if (updates.avatar_url) inspUpdates.avatar_url = updates.avatar_url;
      if (updates.assigned_site_id) inspUpdates.assigned_site_id = updates.assigned_site_id;
      if (updates.assigned_site_name) inspUpdates.assigned_site_name = updates.assigned_site_name;
      if (updates.current_lat != null || updates.latitude != null) {
        inspUpdates.current_lat = updates.current_lat ?? updates.latitude;
      }
      if (updates.current_lng != null || updates.longitude != null) {
        inspUpdates.current_lng = updates.current_lng ?? updates.longitude;
      }
      if (updates.is_simulated != null) {
        inspUpdates.is_simulated = Boolean(updates.is_simulated);
      }
      if (updates.last_active_at) {
        inspUpdates.last_active_at = updates.last_active_at;
      }
      db.update(TABLES.INSPECTORS, inspector.id, inspUpdates);
    }

    const updatedUser = userId ? db.getById(TABLES.USERS, userId) : {};
    const updatedInsp = inspector ? db.getById(TABLES.INSPECTORS, inspector.id) : {};

    res.json({
      success: true,
      message: 'Inspector updated successfully',
      data: {
        ...updatedInsp,
        ...updatedUser,
        id: id,
        avatar_url: updates.avatar_url || updatedUser?.avatar_url || updatedInsp?.avatar_url
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * Update User Profile
 */
async function updateUser(req, res) {
  try {
    const { id } = req.params;
    const updates = req.body;

    const user = db.getById(TABLES.USERS, id);
    if (!user) {
      const allUsers = db.getAll(TABLES.USERS);
      const found = allUsers.find(u => u.id === id || u.username === id);
      if (!found) {
        return res.status(404).json({ success: false, error: 'User not found.' });
      }
      db.update(TABLES.USERS, found.id, updates);
      return res.json({ success: true, data: db.getById(TABLES.USERS, found.id) });
    }

    db.update(TABLES.USERS, id, updates);
    res.json({ success: true, data: db.getById(TABLES.USERS, id) });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

module.exports = {
  getAllUsers,
  getAllInspectors,
  getInspectorById,
  updateInspector,
  updateUser
};
