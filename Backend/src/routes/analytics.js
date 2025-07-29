const express = require('express');
const {
  getDashboardAnalytics,
  getVitalsTrends,
  getResidentHealthScores
} = require('../controllers/analyticsController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// All routes are protected
router.use(protect);

router.get('/dashboard', getDashboardAnalytics);
router.get('/vitals-trends', getVitalsTrends);
router.get('/resident-health', getResidentHealthScores);

module.exports = router;