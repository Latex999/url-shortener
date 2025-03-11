const User = require('../models/User');

// Ensure user is authenticated
exports.ensureAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  req.flash('error_msg', 'Please log in to access this page');
  res.redirect('/users/login');
};

// Ensure user is NOT authenticated (for login/register pages)
exports.ensureNotAuthenticated = (req, res, next) => {
  if (!req.isAuthenticated()) {
    return next();
  }
  res.redirect('/dashboard');
};

// Ensure user is admin
exports.ensureAdmin = (req, res, next) => {
  if (req.isAuthenticated() && req.user.role === 'admin') {
    return next();
  }
  req.flash('error_msg', 'Access denied. Administrator privileges required');
  res.redirect('/dashboard');
};

// Verify API key
exports.verifyApiKey = async (req, res, next) => {
  const apiKey = req.headers['x-api-key'] || req.query.api_key;
  
  if (!apiKey) {
    return res.status(401).json({ 
      success: false, 
      message: 'API key is required' 
    });
  }
  
  try {
    const user = await User.findOne({ apiKey });
    
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid API key' 
      });
    }
    
    // Add user to request
    req.user = user;
    next();
  } catch (err) {
    console.error('API key verification error:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Server error during authentication' 
    });
  }
};

// Check URL ownership
exports.checkUrlOwnership = (model) => {
  return async (req, res, next) => {
    try {
      const item = await model.findById(req.params.id);
      
      // If item doesn't exist
      if (!item) {
        req.flash('error_msg', 'Item not found');
        return res.redirect('/dashboard');
      }
      
      // Check if user owns this item or is admin
      if (
        item.user && 
        item.user.toString() === req.user._id.toString() || 
        req.user.role === 'admin'
      ) {
        req.item = item; // Attach item to req for later use
        return next();
      }
      
      // User doesn't own this item
      req.flash('error_msg', 'You do not have permission to access this resource');
      res.redirect('/dashboard');
    } catch (err) {
      console.error('Ownership check error:', err);
      req.flash('error_msg', 'An error occurred');
      res.redirect('/dashboard');
    }
  };
};