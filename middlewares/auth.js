const { verifyToken } = require('../utils/jwt');

const protect = async (req, res, next) => {
  try {
    // 1. Get token from header
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'Not authorized' });
    }
    
    // 2. Verify token
    const decoded = verifyToken(token);
    
    // 3. Attach user to request
    req.user = decoded.id;
    next();
    
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

module.exports = { protect };