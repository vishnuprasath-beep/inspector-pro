const { verifyToken } = require('../config/jwt');
const db = require('../config/db');
const { TABLES } = require('../models/schema');

/**
 * Authentication Middleware
 * Validates Bearer JWT tokens and sets req.user
 */
function authenticateJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  const queryToken = req.query.token;
  let token = null;

  if (authHeader) {
    const parts = authHeader.split(' ');
    if (parts.length === 2 && parts[0] === 'Bearer') {
      token = parts[1];
    } else {
      return res.status(401).json({
        success: false,
        error: 'Invalid Authorization header format. Expected "Bearer <token>"'
      });
    }
  } else if (queryToken) {
    token = queryToken;
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Access denied. Missing Authorization header or token query parameter.'
    });
  }

  try {
    const decoded = verifyToken(token);
    const user = db.getById(TABLES.USERS, decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'User associated with this token no longer exists.'
      });
    }

    if (user.status !== 'ACTIVE') {
      return res.status(403).json({
        success: false,
        error: 'Your account is suspended or inactive.'
      });
    }

    req.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    };

    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      error: 'Invalid, expired, or corrupted authentication token.',
      details: err.message
    });
  }
}

module.exports = authenticateJWT;
