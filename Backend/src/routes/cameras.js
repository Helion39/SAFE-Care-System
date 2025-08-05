const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const asyncHandler = require('../middleware/asyncHandler');

const router = express.Router();

// Mock camera data - replace with actual camera integration
let cameraData = [
  {
    id: 1,
    room_number: "101",
    status: "active",
    last_checked: new Date().toISOString(),
    stream_url: "rtmp://localhost:1935/live/room101",
    fall_detection_enabled: true
  },
  {
    id: 2,
    room_number: "102", 
    status: "active",
    last_checked: new Date().toISOString(),
    stream_url: "rtmp://localhost:1935/live/room102",
    fall_detection_enabled: true
  },
  {
    id: 3,
    room_number: "103",
    status: "maintenance",
    last_checked: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    stream_url: null,
    fall_detection_enabled: false
  }
];

// @desc    Get all cameras
// @route   GET /api/cameras
// @access  Private (Admin/Caregiver)
router.get('/', protect, asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    data: cameraData
  });
}));

// @desc    Update camera status
// @route   PUT /api/cameras/:id/status
// @access  Private (Admin only)
router.put('/:id/status', protect, authorize('admin'), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const camera = cameraData.find(c => c.id === parseInt(id));
  if (!camera) {
    return res.status(404).json({
      success: false,
      error: 'Camera not found'
    });
  }

  camera.status = status;
  camera.last_checked = new Date().toISOString();

  res.status(200).json({
    success: true,
    data: camera
  });
}));

// @desc    Toggle fall detection for camera
// @route   PUT /api/cameras/:id/fall-detection
// @access  Private (Admin only)
router.put('/:id/fall-detection', protect, authorize('admin'), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { enabled } = req.body;

  const camera = cameraData.find(c => c.id === parseInt(id));
  if (!camera) {
    return res.status(404).json({
      success: false,
      error: 'Camera not found'
    });
  }

  camera.fall_detection_enabled = enabled;

  res.status(200).json({
    success: true,
    data: camera
  });
}));

// @desc    Simulate fall detection (for testing)
// @route   POST /api/cameras/:id/simulate-fall
// @access  Private (Admin only)
router.post('/:id/simulate-fall', protect, authorize('admin'), asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const camera = cameraData.find(c => c.id === parseInt(id));
  if (!camera) {
    return res.status(404).json({
      success: false,
      error: 'Camera not found'
    });
  }

  // This would trigger the fall detection alert
  // In real implementation, this would be called by the AI model
  const io = req.app.get('io');
  io.emit('fall_detected', {
    camera_id: camera.id,
    room_number: camera.room_number,
    timestamp: new Date().toISOString(),
    confidence: 0.95
  });

  res.status(200).json({
    success: true,
    message: 'Fall detection simulated',
    data: {
      camera_id: camera.id,
      room_number: camera.room_number
    }
  });
}));

module.exports = router;