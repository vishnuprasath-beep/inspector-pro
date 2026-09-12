/**
 * Role-Based Access Control (RBAC) Middleware
 * @param  {...string} allowedRoles - Roles permitted to access the route
 */
function authorizeRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized: Authentication required before checking permissions.'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `Forbidden: User role '${req.user.role}' is not authorized to access this resource. Required roles: [${allowedRoles.join(', ')}]`
      });
    }

    next();
  };
}

module.exports = authorizeRoles;
