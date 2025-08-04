const express = require('express');
const {
  generateReport,
  scheduleReport,
  getScheduledReports,
  exportReport
} = require('../controllers/reportController');
const { protect, authorize } = require('../middleware/auth');
const { validate, reportSchemas } = require('../middleware/validation');

const router = express.Router();

// All routes are protected and admin only
router.use(protect);
router.use(authorize('admin'));

router.post('/generate', validate(reportSchemas.generate), generateReport);
router.post('/schedule', validate(reportSchemas.schedule), scheduleReport);
router.get('/scheduled', getScheduledReports);
router.get('/export/:reportId', exportReport);

module.exports = router;