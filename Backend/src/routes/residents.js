const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const { createResident, getResident } = require('../controllers/residentController');

const router = express.Router();

router.use(protect);

router.post('/', authorize('admin'), createResident);
router.get('/', authorize('admin'), getResidents);
router.get('/', protect, getResidents);

router.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Residents routes - Coming soon',
    data: []
  });
});

module.exports = router;