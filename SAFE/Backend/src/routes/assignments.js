const express = require('express');
const {
  createAssignment,
  getAssignments,
  getCaregiverAssignments,
  updateAssignment,
  deleteAssignment,
  transferAssignment,
  getCaregiverWorkload,
  getAssignmentStats
} = require('../controllers/assignmentController');
const { protect, authorize } = require('../middleware/auth');
const { validate, assignmentSchemas } = require('../middleware/validation');

const router = express.Router();

// All routes are protected
router.use(protect);

// Routes accessible by both admin and caregiver (specific routes first)
router.get('/workload', authorize('admin'), getCaregiverWorkload);
router.get('/stats', authorize('admin'), getAssignmentStats);
router.get('/caregiver/:id', getCaregiverAssignments);
router.get('/', getAssignments);

// Admin only routes
router.post('/', authorize('admin'), validate(assignmentSchemas.create), createAssignment);
router.put('/:id', authorize('admin'), updateAssignment);
router.delete('/:id', authorize('admin'), deleteAssignment);
router.post('/:id/transfer', authorize('admin'), transferAssignment);

module.exports = router;