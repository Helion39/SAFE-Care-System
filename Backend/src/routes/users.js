const express = require('express');
const {
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  getCaregivers,
  getUserStats
} = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');

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

router.route('/:id')
  .get(getUser)
  .put(updateUser)
  .delete(deleteUser);

module.exports = router;