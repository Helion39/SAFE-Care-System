const express = require('express');
const router = express.Router();
const { generateHealthAnalysis } = require('../controllers/healthAnalysisController');
const { protect } = require('../middleware/auth');

// Generate AI health analysis for a resident
router.post('/generate', protect, generateHealthAnalysis);

module.exports = router;