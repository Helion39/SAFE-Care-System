const express = require('express');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// All routes are protected
router.use(protect);

// Placeholder routes - to be implemented in next tasks
router.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Reports routes - Coming soon',
    data: []
  });
});

module.exports = router;