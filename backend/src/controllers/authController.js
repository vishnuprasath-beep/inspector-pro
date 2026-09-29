const bcrypt = require('bcryptjs');
const db = require('../config/db');
const { TABLES, ROLES } = require('../models/schema');
const { generateToken } = require('../config/jwt');
const { logAuditAction } = require('../middleware/auditMiddleware');
const { v4: uuidv4 } = require('uuid');

/**
 * User Login with JWT Token Issuance
 */
async function login(req, res) {
  try {
    const identifier = (req.body.email || req.body.username || req.body.identifier || '').toLowerCase().trim();
    const { password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({
        success: false,
        error: 'Identifier (Username or Email) and password are required.'
      });
    }

    const cleanId = identifier.replace(/[^a-z0-9]/g, '');

    const users = db.getAll(TABLES.USERS);
    const user = users.find(u => {
      const uEmail = (u.email || '').toLowerCase().trim();
      const uName = (u.username || '').toLowerCase().trim();
      const uClean = (u.name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      return uEmail === identifier || 
             uName === identifier || 
             uClean === cleanId ||
             (cleanId.includes('admin') && u.role === ROLES.ADMIN) ||
             (cleanId.includes('director') && u.role === ROLES.DIRECTOR) ||
             (cleanId.includes('supervisor') && u.role === ROLES.SUPERVISOR) ||
             (cleanId.includes('vishnup') && u.username === 'vishnu.p') ||
             (cleanId.includes('vishnuv') && u.username === 'vishnu.v') ||
             (cleanId.includes('siva') && u.username === 'siva.v') ||
             (cleanId.includes('sriram') && u.username === 'sriram') ||
             (cleanId.includes('maha') && u.username === 'maha.l') ||
             (cleanId.includes('sivamathi') && u.username === 'sivamathi');
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials: User not found.'
      });
    }

    const isMatch = typeof user.password_hash === 'string' && bcrypt.compareSync(password, user.password_hash);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials: Password incorrect.'
      });
    }

    if (user.status !== 'ACTIVE') {
      return res.status(403).json({
        success: false,
        error: 'Account is not active. Please contact administrator.'
      });
    }

    // Inspector profile details if role is INSPECTOR
    let inspectorProfile = null;
    if (user.role === ROLES.INSPECTOR) {
      inspectorProfile = db.findOne(TABLES.INSPECTORS, { user_id: user.id });
    }

    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name
    });

    let redirectPath = '/admin-dashboard';
    if (user.role === ROLES.INSPECTOR) {
      redirectPath = '/field-inspector';
    } else if (user.role === ROLES.DIRECTOR) {
      redirectPath = '/director-dashboard';
    } else if (user.role === ROLES.SUPERVISOR) {
      redirectPath = '/supervisor-dashboard';
    }

    logAuditAction(user.id, 'USER_LOGIN', 'USER', user.id, { email: user.email, role: user.role }, req);

    res.json({
      success: true,
      message: 'Login successful.',
      data: {
        token,
        role: user.role,
        redirectPath,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          username: user.username,
          role: user.role,
          post: user.post,
          badge: user.badge,
          redirectPath,
          phone: user.phone,
          avatar_url: user.avatar_url
        },
        inspectorProfile
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * Get Current Logged In User Profile
 */
async function getProfile(req, res) {
  try {
    const user = db.getById(TABLES.USERS, req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found.' });
    }

    let inspectorProfile = null;
    if (user.role === ROLES.INSPECTOR) {
      inspectorProfile = db.findOne(TABLES.INSPECTORS, { user_id: user.id });
    }

    let redirectPath = '/admin-dashboard';
    if (user.role === ROLES.INSPECTOR) {
      redirectPath = '/field-inspector';
    } else if (user.role === ROLES.DIRECTOR) {
      redirectPath = '/director-dashboard';
    } else if (user.role === ROLES.SUPERVISOR) {
      redirectPath = '/supervisor-dashboard';
    }

    res.json({
      success: true,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        username: user.username,
        role: user.role,
        post: user.post,
        badge: user.badge,
        redirectPath,
        phone: user.phone,
        avatar_url: user.avatar_url,
        inspectorProfile
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * Register New User (Admin or Self)
 */
async function register(req, res) {
  // Disabled as part of Phase 1 Security Remediation: Prevent anonymous role escalation.
  // Account provisioning is restricted to administrators via the /api/users endpoint.
  return res.status(410).json({ 
    success: false, 
    error: 'Public registration is disabled. Please contact your administrator for an account invitation.' 
  });
}

module.exports = {
  login,
  getProfile,
  register
};
