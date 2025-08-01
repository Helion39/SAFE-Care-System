const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const {
  createIncident,
  getIncidents,
  getActiveIncidents,
  claimIncident,
  resolveIncident,
  getIncidentStats,
  simulateFallDetection,
  getOverdueIncidents
} = require('../controllers/incidentController');

const router = express.Router();

// All routes are protected
router.use(protect);

// @route   POST /api/incidents
// @desc    Create new incident
// @access  Private
router.post('/', createIncident);

// @route   GET /api/incidents
// @desc    Get all incidents with filtering
// @access  Private
router.get('/', getIncidents);

// @route   GET /api/incidents/active
// @desc    Get active incidents
// @access  Private
router.get('/active', getActiveIncidents);

// @route   GET /api/incidents/overdue
// @desc    Get overdue incidents
// @access  Private/Admin
router.get('/overdue', authorize('admin'), getOverdueIncidents);

// @route   GET /api/incidents/stats
// @desc    Get incident statistics
// @access  Private/Admin
router.get('/stats', authorize('admin'), getIncidentStats);

// @route   POST /api/incidents/simulate-fall
// @desc    Simulate fall detection (for testing)
// @access  Private/Admin
router.post('/simulate-fall', authorize('admin'), simulateFallDetection);

// @route   PUT /api/incidents/:id/claim
// @desc    Claim incident
// @access  Private/Caregiver
router.put('/:id/claim', authorize('caregiver'), claimIncident);

// @route   PUT /api/incidents/:id/resolve
// @desc    Resolve incident
// @access  Private
router.put('/:id/resolve', resolveIncident);

module.exports = router;