const express = require('express');
const {
  recordVitals,
  getAllVitals,
  getResidentVitals,
  getRecentVitals,
  getOverdueVitals,
  updateVitals,
  getVitalsStats,
  batchRecordVitals
} = require('../controllers/vitalsController');
const { protect, authorize } = require('../middleware/auth');
const { validate, vitalsSchemas } = require('../middleware/validation');

const router = express.Router();

// All routes are protected
router.use(protect);

// Routes accessible by both admin and caregiver (specific routes first)
router.get('/recent', getRecentVitals);
router.get('/overdue', getOverdueVitals);
router.get('/stats', authorize('admin'), getVitalsStats);
router.get('/resident/:id', getResidentVitals);
router.get('/', getAllVitals);

// Caregiver routes
router.post('/', authorize('caregiver'), validate(vitalsSchemas.create), recordVitals);
router.post('/batch', authorize('caregiver'), batchRecordVitals);
router.put('/:id', authorize('caregiver'), updateVitals);

module.exports = router;