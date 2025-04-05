const { verifyToken } = require('../utils/jwt');
const prisma = require('../prisma/client');

const protect = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1] || req.cookies.jwt;
    
    if (!token) {
      return res.status(401).json({ 
        success: false,
        error: 'Not authorized - please login' 
      });
    }

    const decoded = verifyToken(token);
    
    // Fetch fresh user data including role
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

    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'User no longer exists'
      });
    }

    next();
  } catch (err) {
    res.status(401).json({ 
      success: false,
      error: 'Invalid or expired token' 
    });
  }
};

module.exports = { protect };