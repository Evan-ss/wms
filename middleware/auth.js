const jwt = require('jsonwebtoken');
const db = require('../config/database');

// JWT Secret Key - should be in environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';

// Middleware to check if user is authenticated
const isAuthenticated = (req, res, next) => {
  // Check for token in cookies first, then in Authorization header
  const token = req.cookies.authToken || 
                (req.headers.authorization && req.headers.authorization.split(' ')[1]);

  if (!token) {
    return res.redirect('/login');
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // Store user info in req.user instead of req.session.user
    return next();
  } catch (error) {
    console.error('JWT verification error:', error.message);
    // Clear invalid token cookie
    res.clearCookie('authToken');
    return res.redirect('/login');
  }
};

// Middleware to check if user is super admin
const isSuperAdmin = (req, res, next) => {
  if (req.user && req.user.isSuperAdmin) {
    return next();
  }
  res.status(403).send('Access denied. Super Admin only.');
};

// Middleware to check user role
const hasRole = (roles) => {
  return (req, res, next) => {
    if (req.user) {
      if (req.user.isSuperAdmin) {
        return next(); // Super admin has all access
      }
      if (roles.includes(req.user.role_name)) {
        return next();
      }
    }
    res.status(403).send('Access denied. Insufficient permissions.');
  };
};

// Helper function to generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      name: user.name,
      whatsapp: user.whatsapp,
      role_name: user.role_name,
      branch_id: user.branch_id || null,
      branch_name: user.branch_name || null,
      jabatan: user.jabatan || null,
      isSuperAdmin: user.isSuperAdmin
    },
    JWT_SECRET,
    { 
      expiresIn: '7d' // Token expires in 7 days
    }
  );
};

module.exports = {
  isAuthenticated,
  isSuperAdmin,
  hasRole,
  generateToken
};
