const jwt = require('jsonwebtoken');
const User = require('../models/User');


const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    req.user = {
      userId: decoded.userId,
      customerId: decoded.customerId,
      role: decoded.role,
      email: decoded.email
    };

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};


const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'Admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};


const requireAdminForRoute = (req, res, next) => {
  if (req.path.startsWith('/admin') && req.user.role !== 'Admin') {
    return res.status(403).json({ error: 'Admin access required for this route' });
  }
  next();
};

module.exports = {
  authenticateToken,
  requireAdmin,
  requireAdminForRoute
};
