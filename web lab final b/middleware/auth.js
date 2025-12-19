const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect admin routes - require authentication
exports.protectAdmin = async (req, res, next) => {
  try {
    let token;

    // Check for token in cookies
    if (req.cookies && req.cookies.adminToken) {
      token = req.cookies.adminToken;
    }
    // Check for token in Authorization header
    else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    // Check for token in session
    else if (req.session && req.session.adminToken) {
      token = req.session.adminToken;
    }

    if (!token) {
      return res.redirect('/admin/login');
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-change-in-production');

      // Get user from token
      const user = await User.findById(decoded.id).select('-password');

      if (!user) {
        return res.redirect('/admin/login');
      }

      // Check if user is admin
      if (user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Admin privileges required.'
        });
      }

      // Attach user to request
      req.user = user;
      next();
    } catch (error) {
      return res.redirect('/admin/login');
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.redirect('/admin/login');
  }
};

// Generate JWT token
exports.generateToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET || 'your-secret-key-change-in-production',
    { expiresIn: '7d' }
  );
};


