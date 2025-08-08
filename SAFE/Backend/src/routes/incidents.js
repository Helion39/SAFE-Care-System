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

// @route   PUT /api/incidents/:id/admin-close
// @desc    Admin close incident (bypasses claim requirement)
// @access  Private/Admin
router.put('/:id/admin-close', authorize('admin'), async (req, res) => {
  try {
    const { adminAction } = req.body;
    const incidentId = req.params.id;
    
    console.log('🔍 Admin closing incident:', { incidentId, adminAction, adminId: req.user.id });
    
    const Incident = require('../models/Incident');
    
    // Find the incident
    const incident = await Incident.findById(incidentId);
    if (!incident) {
      return res.status(404).json({
        success: false,
        error: 'Incident not found'
      });
    }
    
    // Admin can close any incident regardless of status
    incident.status = 'resolved';
    incident.resolution = 'false_alarm';
    incident.resolved_time = new Date();
    incident.resolved_by = req.user.id;
    incident.admin_action = adminAction || 'Incident closed by admin';
    
    await incident.save();
    
    console.log('✅ Incident closed by admin:', incident._id);
    
    res.json({
      success: true,
      data: incident,
      message: 'Incident closed successfully by admin'
    });
    
  } catch (error) {
    console.error('❌ Error in admin close incident:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while closing incident'
    });
  }
});

module.exports = router;