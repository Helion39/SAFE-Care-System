const express = require('express');
const {
  createCaregiver,
  bulkCreateCaregivers,
  resetCaregiverPassword,
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  getCaregivers,
  getUserStats,
  toggleUserStatus
} = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');
const { validate, userSchemas } = require('../middleware/validation');

const router = express.Router();

// All routes are protected
router.use(protect);

// Routes accessible by both admin and caregiver
router.get('/caregivers', getCaregivers);

// Admin only routes
router.use(authorize('admin'));

router.route('/')
  .get(getUsers);

router.route('/stats')
  .get(getUserStats);

router.route('/create-caregiver')
  .post(validate(userSchemas.createCaregiver), createCaregiver);

router.route('/bulk-create-caregivers')
  .post(validate(userSchemas.bulkCreateCaregivers), bulkCreateCaregivers);

router.route('/:id')
  .get(getUser)
  .put(updateUser)
  .delete(deleteUser);

router.route('/:id/reset-password')
  .put(validate(userSchemas.resetPassword), resetCaregiverPassword);

router.route('/:id/toggle-status')
  .put(toggleUserStatus);

module.exports = router;