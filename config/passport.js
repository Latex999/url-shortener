const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcryptjs');
const User = require('../models/User');

module.exports = function(passport) {
  passport.use(
    new LocalStrategy({ usernameField: 'email' }, async (email, password, done) => {
      try {
        // Find user by email
        const user = await User.findOne({ email });
        
        // Check if user exists
        if (!user) {
          return done(null, false, { message: 'That email is not registered' });
        }
        
        // Match password
        const isMatch = await user.comparePassword(password);
        
        if (isMatch) {
          // Update last login time
          user.lastLogin = Date.now();
          await user.save();
          
          return done(null, user);
        } else {
          return done(null, false, { message: 'Password incorrect' });
        }
      } catch (err) {
        console.error(err);
        return done(err);
      }
    })
  );
  
  // Serialize user for session
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });
  
  // Deserialize user from session
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });
  
  // Function to check for first-time setup and create admin user
  const initializeAdmin = async () => {
    try {
      // Count users
      const userCount = await User.countDocuments();
      
      // If no users exist and admin credentials are provided in env, create admin
      if (userCount === 0 && process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) {
        const adminUser = new User({
          name: 'Administrator',
          email: process.env.ADMIN_EMAIL,
          password: process.env.ADMIN_PASSWORD,
          role: 'admin'
        });
        
        await adminUser.save();
        console.log(`✅ Admin user created with email: ${process.env.ADMIN_EMAIL}`);
      }
    } catch (err) {
      console.error('Error creating admin user:', err);
    }
  };
  
  // Initialize admin user
  initializeAdmin();
};