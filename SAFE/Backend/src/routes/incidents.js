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

router.use(protect);
router.post('/', createIncident);
router.get('/', getIncidents);
router.get('/active', getActiveIncidents);
router.get('/overdue', authorize('admin'), getOverdueIncidents);
router.get('/stats', authorize('admin'), getIncidentStats);
router.post('/simulate-fall', authorize('admin'), simulateFallDetection);
router.put('/:id/claim', authorize('caregiver'), claimIncident);
router.put('/:id/resolve', resolveIncident);
module.exports = router;