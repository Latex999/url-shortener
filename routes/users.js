const express = require('express');
const router = express.Router();
const passport = require('passport');
const User = require('../models/User');
const { ensureAuthenticated, ensureNotAuthenticated, ensureAdmin } = require('../middleware/auth');

// Login Page
router.get('/login', ensureNotAuthenticated, (req, res) => {
  res.render('users/login', {
    title: 'Login'
  });
});

// Register Page
router.get('/register', ensureNotAuthenticated, (req, res) => {
  res.render('users/register', {
    title: 'Register'
  });
});

// Register Handle
router.post('/register', ensureNotAuthenticated, async (req, res) => {
  const { name, email, password, password2 } = req.body;
  let errors = [];

  // Check required fields
  if (!name || !email || !password || !password2) {
    errors.push({ msg: 'Please fill in all fields' });
  }

  // Check passwords match
  if (password !== password2) {
    errors.push({ msg: 'Passwords do not match' });
  }

  // Check password length
  if (password.length < 6) {
    errors.push({ msg: 'Password should be at least 6 characters' });
  }

  if (errors.length > 0) {
    return res.render('users/register', {
      title: 'Register',
      errors,
      name,
      email
    });
  }

  try {
    // Check if email already exists
    const userExists = await User.findOne({ email });
    
    if (userExists) {
      errors.push({ msg: 'Email is already registered' });
      return res.render('users/register', {
        title: 'Register',
        errors,
        name,
        email
      });
    }

    // Create new user
    const newUser = new User({
      name,
      email,
      password
    });

    await newUser.save();
    req.flash('success_msg', 'You are now registered and can log in');
    res.redirect('/users/login');
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'An error occurred during registration');
    res.redirect('/users/register');
  }
});

// Login Handle
router.post('/login', (req, res, next) => {
  passport.authenticate('local', {
    successRedirect: '/dashboard',
    failureRedirect: '/users/login',
    failureFlash: true
  })(req, res, next);
});

// Logout Handle
router.get('/logout', (req, res) => {
  req.logout(function(err) {
    if (err) { 
      console.error(err);
      return next(err); 
    }
    req.flash('success_msg', 'You are logged out');
    res.redirect('/users/login');
  });
});

// Profile Page
router.get('/profile', ensureAuthenticated, (req, res) => {
  res.render('users/profile', {
    title: 'My Profile',
    user: req.user
  });
});

// Update Profile
router.post('/profile', ensureAuthenticated, async (req, res) => {
  const { name, email } = req.body;
  
  try {
    // Check if new email is already used by another user
    if (email !== req.user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        req.flash('error_msg', 'Email is already in use');
        return res.redirect('/users/profile');
      }
    }
    
    // Update user
    req.user.name = name;
    req.user.email = email;
    await req.user.save();
    
    req.flash('success_msg', 'Profile updated successfully');
    res.redirect('/users/profile');
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'An error occurred while updating profile');
    res.redirect('/users/profile');
  }
});

// Change Password
router.post('/change-password', ensureAuthenticated, async (req, res) => {
  const { currentPassword, newPassword, confirmPassword } = req.body;
  
  try {
    // Validate inputs
    if (newPassword !== confirmPassword) {
      req.flash('error_msg', 'New passwords do not match');
      return res.redirect('/users/profile');
    }
    
    if (newPassword.length < 6) {
      req.flash('error_msg', 'Password should be at least 6 characters');
      return res.redirect('/users/profile');
    }
    
    // Verify current password
    const isMatch = await req.user.comparePassword(currentPassword);
    if (!isMatch) {
      req.flash('error_msg', 'Current password is incorrect');
      return res.redirect('/users/profile');
    }
    
    // Update password
    req.user.password = newPassword;
    await req.user.save();
    
    req.flash('success_msg', 'Password changed successfully');
    res.redirect('/users/profile');
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'An error occurred while changing password');
    res.redirect('/users/profile');
  }
});

// API Key Management
router.post('/generate-api-key', ensureAuthenticated, async (req, res) => {
  try {
    const apiKey = await req.user.generateApiKey();
    req.flash('success_msg', 'API key generated successfully');
    res.redirect('/users/profile');
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'An error occurred while generating API key');
    res.redirect('/users/profile');
  }
});

// Admin routes
// User management (admin only)
router.get('/admin/users', ensureAdmin, async (req, res) => {
  try {
    const users = await User.find().sort({ registrationDate: -1 });
    
    res.render('admin/users', {
      title: 'User Management',
      users
    });
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'An error occurred while fetching users');
    res.redirect('/dashboard');
  }
});

module.exports = router;