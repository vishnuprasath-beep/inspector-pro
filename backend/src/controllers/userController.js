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
 * Update User Profile with RBAC protection
 */
async function updateUser(req, res) {
  try {
    const { id } = req.params;
    const user = db.getById(TABLES.USERS, id) || db.getAll(TABLES.USERS).find(u => u.username === id);
    if (!user) return res.status(404).json({ success: false, error: 'User not found.' });

    const isAdmin = req.user?.role === ROLES.ADMIN;
    if (!isAdmin && req.user?.id !== user.id) {
      return res.status(403).json({ success: false, error: 'Forbidden: You may only update your own profile.' });
    }

    const allowedFields = ['name', 'email', 'phone', 'avatar_url', 'post'];
    const updates = {};
    for (const field of allowedFields) {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) updates[field] = req.body[field];
    }

    if (Object.prototype.hasOwnProperty.call(req.body, 'password')) {
      if (typeof req.body.password !== 'string' || req.body.password.length < 8) {
        return res.status(400).json({ success: false, error: 'Password must be at least 8 characters.' });
      }
      updates.password_hash = require('bcryptjs').hashSync(req.body.password, 10);
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ success: false, error: 'No valid profile fields provided.' });
    }

    db.update(TABLES.USERS, user.id, updates);
    const updated = db.getById(TABLES.USERS, user.id);
    const { password_hash, ...safe } = updated;
    res.json({ success: true, data: safe });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * Create New User (ADMIN only)
 */
async function createUser(req, res) {
  try {
    const { name, email, username, password, role, post, phone, assigned_site_id, assigned_site_name } = req.body;

    if (!name || !username || !email) {
      return res.status(400).json({ success: false, error: 'Name, username, and email are required.' });
    }
    if (typeof password !== 'string' || password.length < 8) {
      return res.status(400).json({ success: false, error: 'A password of at least 8 characters is required.' });
    }

    const allUsers = db.getAll(TABLES.USERS);
    const existing = allUsers.find(u => u.username.toLowerCase() === username.toLowerCase() || u.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      return res.status(400).json({ success: false, error: 'User with this username or email already exists.' });
    }

    const bcrypt = require('bcryptjs');
    const { v4: uuidv4 } = require('uuid');
    const userId = `usr-${uuidv4().slice(0, 8)}`;
    const userRole = role && Object.values(ROLES).includes(role.toUpperCase()) ? role.toUpperCase() : ROLES.INSPECTOR;

    const newUser = {
      id: userId,
      name,
      email,
      username,
      password_hash: bcrypt.hashSync(password, 10),
      role: userRole,
      post: post || (userRole === ROLES.ADMIN ? 'Administrator' : userRole === ROLES.SUPERVISOR ? 'Field Supervisor' : userRole === ROLES.DIRECTOR ? 'Director' : 'Field Inspector'),
      phone: phone || '+91 98401 00000',
      avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      status: 'ACTIVE',
      created_at: new Date().toISOString()
    };

    db.insert(TABLES.USERS, newUser);

    // If role is INSPECTOR, also create inspector record
    if (userRole === ROLES.INSPECTOR) {
      const inspId = `insp-${uuidv4().slice(0, 8)}`;
      const newInspector = {
        id: inspId,
        user_id: userId,
        name,
        employee_code: `INSP-${new Date().getFullYear()}-${username.toUpperCase()}`,
        specialization: req.body.specialization || 'Civil & Structural Engineering',
        qualification: req.body.qualification || 'B.Tech Civil Engineering',
        assigned_site_id: assigned_site_id || 'site-01',
        assigned_site_name: assigned_site_name || 'Delhi Metro Central Terminal (Phase 2)',
        current_lat: 28.6289,
        current_lng: 77.2219,
        last_active_at: new Date().toISOString(),
        assigned_sites_count: 1,
        status: 'AVAILABLE'
      };
      db.insert(TABLES.INSPECTORS, newInspector);
    }

    const { password_hash, ...safeUser } = newUser;
    res.status(201).json({ success: true, message: 'User created successfully', data: safeUser });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * Delete User (ADMIN only)
 */
async function deleteUser(req, res) {
  try {
    const { id } = req.params;

    if (req.user && req.user.id === id) {
      return res.status(400).json({ success: false, error: 'Cannot delete your own active administrator account.' });
    }

    const user = db.getById(TABLES.USERS, id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found.' });
    }

    db.delete(TABLES.USERS, id);

    // Delete associated inspector record if any
    const allInspectors = db.getAll(TABLES.INSPECTORS);
    const linkedInsp = allInspectors.find(i => i.user_id === id);
    if (linkedInsp) {
      db.delete(TABLES.INSPECTORS, linkedInsp.id);
    }

    res.json({ success: true, message: 'User deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * Update User Role (ADMIN only)
 */
async function updateUserRole(req, res) {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!role || !Object.values(ROLES).includes(role.toUpperCase())) {
      return res.status(400).json({ success: false, error: `Invalid role. Allowed roles: ${Object.values(ROLES).join(', ')}` });
    }

    const user = db.getById(TABLES.USERS, id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found.' });
    }

    db.update(TABLES.USERS, id, { role: role.toUpperCase() });
    const updated = db.getById(TABLES.USERS, id);
    const { password_hash, ...safe } = updated;
    res.json({ success: true, message: 'User role updated successfully', data: safe });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * Update User Status (Activate/Deactivate) (ADMIN only)
 */
async function updateUserStatus(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !['ACTIVE', 'INACTIVE', 'SUSPENDED'].includes(status.toUpperCase())) {
      return res.status(400).json({ success: false, error: 'Invalid status. Allowed: ACTIVE, INACTIVE, SUSPENDED' });
    }

    const user = db.getById(TABLES.USERS, id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found.' });
    }

    db.update(TABLES.USERS, id, { status: status.toUpperCase() });
    const updated = db.getById(TABLES.USERS, id);
    const { password_hash, ...safe } = updated;
    res.json({ success: true, message: `User status set to ${status.toUpperCase()}`, data: safe });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

module.exports = {
  getAllUsers,
  getAllInspectors,
  getInspectorById,
  updateInspector,
  updateUser,
  createUser,
  deleteUser,
  updateUserRole,
  updateUserStatus
};
