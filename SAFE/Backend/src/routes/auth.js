const express = require('express');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const {
  register,
  login,
  logout,
  getMe,
  refreshToken,
  updateProfile,
  changePassword,
  familyLogin,
  familyGoogleLogin,
  getFamilyDataByEmail
} = require('../controllers/authController');
const { protect, authorize, devAdminHeader } = require('../middleware/auth');
const { validate, userSchemas } = require('../middleware/validation');
const User = require('../models/User');

const router = express.Router();

// Debug middleware for all auth routes
router.use((req, res, next) => {
  console.log(`🔍 Auth route hit: ${req.method} ${req.path}`);
  console.log('🔍 Request body:', req.body);
  next();
});

// Public routes
router.post('/login', validate(userSchemas.login), login);
router.post('/family-login', familyLogin);
router.post('/family-google-login', familyGoogleLogin);
router.get('/family/data/:email', protect, getFamilyDataByEmail);
router.post('/refresh', refreshToken);



// Admin-only registration (secured)
router.post(
  '/register',
  devAdminHeader,
  authorize('admin'),
  validate(userSchemas.register),
  register
);

// Configure Google OAuth Strategy
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.GOOGLE_CALLBACK_URL
}, async (accessToken, refreshToken, profile, done) => {
  try {
    const email = profile.emails[0].value;
    
    // Check if user already exists
    let user = await User.findOne({ email: email });
    
    if (user) {
      return done(null, user);
    }
    
    // Find resident by family email
    const Resident = require('../models/Resident');
    const resident = await Resident.findOne({ 
      familyEmails: { $in: [email.toLowerCase()] },
      isActive: true 
    });
    
    if (!resident) {
      return done(new Error('No resident found for this email'), null);
    }
    
    console.log('🔍 Found resident for OAuth:', { id: resident._id, name: resident.name, email: email });
    
    // Create new family user WITHOUT assignedResidentId (we use familyEmails now)
    const username = email.split('@')[0].substring(0, 20);
    
    const userData = {
      name: profile.displayName,
      email: email,
      username: username,
      password: 'google_oauth_' + Date.now(),
      role: 'family',
      googleId: profile.id
    };
    
    console.log('🔍 Creating user with data:', userData);
    
    user = await User.create(userData);
    
    return done(null, user);
  } catch (error) {
    return done(error, null);
  }
}));

passport.serializeUser((user, done) => {
  done(null, user._id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// Google OAuth routes
router.get('/google', (req, res, next) => {
  const residentId = req.query.residentId;
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    state: residentId
  })(req, res, next);
});

router.get('/google/callback', 
  (req, res, next) => {
    const residentId = req.query.state;
    console.log('🔍 OAuth callback - residentId from state:', residentId);
    req.residentId = residentId;
    passport.authenticate('google', { session: false })(req, res, next);
  },
  async (req, res) => {
    try {
      const user = req.user;
      const residentId = req.residentId;
      
      console.log('🔍 OAuth callback - user:', { id: user._id, assignedResidentId: user.assignedResidentId, email: user.email });
      
      const token = user.getSignedJwtToken();
      const refreshToken = user.getRefreshToken();
      
      user.refreshToken = refreshToken;
      await user.save();
      
      const userPayload = {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      };
      
      console.log('🔍 OAuth callback - final user payload:', userPayload);
      
      // Redirect to frontend with token and user data
      const redirectUrl = `http://localhost:3000/family-login?token=${token}&user=${encodeURIComponent(JSON.stringify(userPayload))}`;
      console.log('🔍 OAuth redirect URL:', redirectUrl);
      res.redirect(redirectUrl);
    } catch (error) {
      console.error('🔍 OAuth callback error:', error);
      res.redirect('http://localhost:3000?error=oauth_failed');
    }
  }
);

// Protected routes
router.use(protect);

router.get('/me', getMe);
router.post('/logout', logout);
router.put('/profile', updateProfile);
router.put('/password', changePassword);

module.exports = router;