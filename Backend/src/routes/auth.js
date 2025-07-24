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
const { protect, authorize } = require('../middleware/auth');
const { validate, userSchemas } = require('../middleware/validation');

const router = express.Router();

// Public routes
router.post('/register', validate(userSchemas.register), register);
router.post('/login', validate(userSchemas.login), login);
router.post('/refresh', refreshToken);

// Protected routes
router.use(protect); // All routes after this middleware are protected

router.get('/me', getMe);
router.post('/logout', logout);
router.put('/profile', updateProfile);
router.put('/password', changePassword);

module.exports = router;