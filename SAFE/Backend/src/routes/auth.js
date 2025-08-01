const express = require('express');
const {
  register,
  login,
  logout,
  getMe,
  refreshToken,
  updateProfile,
  changePassword
} = require('../controllers/authController');
const { protect, authorize, devAdminHeader } = require('../middleware/auth');
const { validate, userSchemas } = require('../middleware/validation');

const router = express.Router();

// Debug middleware for all auth routes
router.use((req, res, next) => {
  console.log(`🔍 Auth route hit: ${req.method} ${req.path}`);
  console.log('🔍 Request body:', req.body);
  next();
});

// Public routes
router.post('/login', validate(userSchemas.login), login);
router.post('/refresh', refreshToken);

// Admin-only registration (secured)

router.post(
  '/register',
  devAdminHeader, // Gantikan protect
  authorize('admin'),
  validate(userSchemas.register),
  register
);

// Protected routes
router.use(protect); // All routes after this middleware are protected

router.get('/me', getMe);
router.post('/logout', logout);
router.put('/profile', updateProfile);
router.put('/password', changePassword);

module.exports = router;