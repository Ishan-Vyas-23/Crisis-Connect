const { ForbiddenError, UnauthorizedError } = require('../utils/errors');

function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(new UnauthorizedError("Authentication required"));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(new ForbiddenError("Access denied: insufficient permissions"));
    }

    next();
  };
}

module.exports = requireRole;
