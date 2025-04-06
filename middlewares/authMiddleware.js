// middlewares/authMiddleware.js
const { verifyToken } = require('../utils/jwt');
const prisma = require('../prisma/client');

// Authentication middleware
exports.protect = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1] || req.cookies.jwt;
    if (!token) throw new Error('No token provided');

    const decoded = verifyToken(token);
    req.user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        role: true,
        is_super_admin: true,
        is_verified: true
      }
    });
    if (!req.user) throw new Error('User not found');
    next();
  } catch (err) {
    res.status(401).json({ 
      success: false,
      error: err.message || 'Authentication failed'
    });
  }
};

// Role checking (flexible version)
exports.requireRoles = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ 
      success: false,
      error: `Required roles: ${roles.join(', ')}`,
      code: 'INSUFFICIENT_PERMISSIONS' 
    });
  }
  next();
};

// Special permissions
exports.requireSuperAdmin = (req, res, next) => {
  if (!req.user?.is_super_admin) {
    return res.status(403).json({
      success: false,
      error: 'Super admin privileges required',
      code: 'SUPER_ADMIN_REQUIRED'
    });
  }
  next();
};

exports.requireVerified = (req, res, next) => {
  if (!req.user?.is_verified) {
    return res.status(403).json({
      success: false,
      error: 'Account verification required',
      code: 'VERIFICATION_REQUIRED'
    });
  }
  next();
};

// Add to authMiddleware.js
exports.requireWorker = (req, res, next) => {
    if (req.user?.role !== 'WORKER') {
      return res.status(403).json({
        success: false,
        error: 'Worker access required',
        code: 'WORKER_ACCESS_REQUIRED'
      });
    }
    next();
  };