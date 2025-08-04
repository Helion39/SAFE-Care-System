const express = require('express');
const {
  createResident,
  getResidents,
  getResident,
  updateResident,
  deleteResident,
  searchResidents,
  getUnassignedResidents,
  getResidentStats
} = require('../controllers/residentController');
const { protect, authorize } = require('../middleware/auth');
const { validate, residentSchemas } = require('../middleware/validation');

const router = express.Router();

// All routes are protected
router.use(protect);

// Routes accessible by both admin and caregiver (specific routes first)
router.get('/search', searchResidents);
router.get('/unassigned', authorize('admin'), getUnassignedResidents);
router.get('/stats', authorize('admin'), getResidentStats);
router.get('/', getResidents);
router.get('/:id', getResident);

// Admin only routes
router.post('/', authorize('admin'), validate(residentSchemas.create), createResident);
router.put('/:id', authorize('admin'), updateResident);
router.delete('/:id', authorize('admin'), deleteResident);

module.exports = router;