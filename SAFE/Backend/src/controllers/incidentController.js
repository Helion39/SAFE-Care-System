const Incident = require('../models/Incident');
const Resident = require('../models/Resident');
const User = require('../models/User');
const logger = require('../utils/logger');

// @desc    Create new incident
// @route   POST /api/incidents
// @access  Private
const createIncident = async (req, res, next) => {
  try {
    const { residentId, type, severity, description, location, detectionMethod } = req.body;

    // Verify resident exists
    const resident = await Resident.findById(residentId);
    if (!resident) {
      return res.status(404).json({
        success: false,
        error: 'Resident not found'
      });
    }

    // Create incident
    const incident = await Incident.create({
      residentId,
      type: type || 'other',
      severity: severity || 'medium',
      description,
      location: location || resident.room,
      detectionMethod: detectionMethod || 'manual_report'
    });

    // Populate the incident
    await incident.populate('residentId', 'name room');

    // Emit real-time alert via Socket.IO
    const io = req.app.get('io');
    if (io) {
      io.emit('emergency-alert', {
        type: 'new_incident',
        data: incident,
        timestamp: new Date()
      });

      // Send to caregiver room specifically
      io.to('caregiver').emit('emergency-alert', {
        type: 'new_incident',
        data: incident,
        timestamp: new Date()
      });
    }

    logger.info(`New incident created for resident ${resident.name}: ${type} - ${severity}`);

    res.status(201).json({
      success: true,
      data: incident,
      message: 'Incident created and alert sent to caregivers'
    });
  } catch (error) {
    logger.error('Create incident error:', error);
    next(error);
  }
};

// @desc    Get all incidents
// @route   GET /api/incidents
// @access  Private
const getIncidents = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const startIndex = (page - 1) * limit;

    // Build query
    let query = {};

    // Filter by status
    if (req.query.status) {
      query.status = req.query.status;
    }

    // Filter by resident
    if (req.query.residentId) {
      query.residentId = req.query.residentId;
    }

    // Filter by type
    if (req.query.type) {
      query.type = req.query.type;
    }

    // Filter by severity
    if (req.query.severity) {
      query.severity = req.query.severity;
    }

    // Date range filtering
    if (req.query.startDate || req.query.endDate) {
      query.detectionTime = {};
      if (req.query.startDate) {
        query.detectionTime.$gte = new Date(req.query.startDate);
      }
      if (req.query.endDate) {
        query.detectionTime.$lte = new Date(req.query.endDate);
      }
    }

    const total = await Incident.countDocuments(query);
    const incidents = await Incident.find(query)
      .populate('residentId', 'name room age')
      .populate('claimedBy', 'name')
      .populate('resolvedBy', 'name')
      .sort({ detectionTime: -1 })
      .limit(limit)
      .skip(startIndex);

    // Add time elapsed for each incident
    const incidentsWithTime = incidents.map(incident => ({
      ...incident.toObject(),
      timeElapsed: incident.timeElapsed,
      isOverdue: incident.isOverdue()
    }));

    // Pagination
    const pagination = {};
    if (startIndex + limit < total) {
      pagination.next = { page: page + 1, limit };
    }
    if (startIndex > 0) {
      pagination.prev = { page: page - 1, limit };
    }

    res.status(200).json({
      success: true,
      count: incidents.length,
      total,
      pagination,
      data: incidentsWithTime
    });
  } catch (error) {
    logger.error('Get incidents error:', error);
    next(error);
  }
};

// @desc    Get active incidents
// @route   GET /api/incidents/active
// @access  Private
const getActiveIncidents = async (req, res, next) => {
  try {
    const incidents = await Incident.getByStatus('active', 50);

    // Add time elapsed and overdue status
    const incidentsWithStatus = incidents.map(incident => ({
      ...incident.toObject(),
      timeElapsed: incident.timeElapsed,
      isOverdue: incident.isOverdue()
    }));

    res.status(200).json({
      success: true,
      count: incidentsWithStatus.length,
      data: incidentsWithStatus
    });
  } catch (error) {
    logger.error('Get active incidents error:', error);
    next(error);
  }
};

// @desc    Claim incident
// @route   PUT /api/incidents/:id/claim
// @access  Private/Caregiver
const claimIncident = async (req, res, next) => {
  try {
    const incident = await Incident.findById(req.params.id);

    if (!incident) {
      return res.status(404).json({
        success: false,
        error: 'Incident not found'
      });
    }

    if (incident.status !== 'active') {
      return res.status(400).json({
        success: false,
        error: 'Incident is not available for claiming'
      });
    }

    // Claim the incident
    await incident.claimIncident(req.user.id);

    // Populate the updated incident
    await incident.populate([
      { path: 'residentId', select: 'name room' },
      { path: 'claimedBy', select: 'name' }
    ]);

    // Emit real-time update
    const io = req.app.get('io');
    if (io) {
      io.emit('incident-update', {
        type: 'incident_claimed',
        data: incident,
        claimedBy: req.user.name,
        timestamp: new Date()
      });
    }

    logger.info(`Incident ${incident._id} claimed by ${req.user.name} for resident ${incident.residentId.name}`);

    res.status(200).json({
      success: true,
      data: incident,
      message: 'Incident claimed successfully'
    });
  } catch (error) {
    logger.error('Claim incident error:', error);
    next(error);
  }
};

// @desc    Resolve incident
// @route   PUT /api/incidents/:id/resolve
// @access  Private
const resolveIncident = async (req, res, next) => {
  try {
    const { resolution, notes, adminAction } = req.body;

    if (!resolution || !['true_emergency', 'false_alarm', 'resolved_internally'].includes(resolution)) {
      return res.status(400).json({
        success: false,
        error: 'Valid resolution is required (true_emergency, false_alarm, or resolved_internally)'
      });
    }

    const incident = await Incident.findById(req.params.id);

    if (!incident) {
      return res.status(404).json({
        success: false,
        error: 'Incident not found'
      });
    }

    if (incident.status !== 'claimed') {
      return res.status(400).json({
        success: false,
        error: 'Incident must be claimed before resolving'
      });
    }

    // Only the caregiver who claimed it or admin can resolve
    if (incident.claimedBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to resolve this incident'
      });
    }

    // Resolve the incident
    incident.resolvedBy = req.user.id;
    await incident.resolveIncident(resolution, notes, adminAction);

    // Populate the resolved incident
    await incident.populate([
      { path: 'residentId', select: 'name room' },
      { path: 'claimedBy', select: 'name' },
      { path: 'resolvedBy', select: 'name' }
    ]);

    // Handle true emergency actions
    if (resolution === 'true_emergency') {
      // Mark for family notification
      incident.familyNotified = false; // Will be handled by notification system
      incident.familyNotificationTime = null;
      
      // Mark emergency services contact if admin action provided
      if (adminAction) {
        incident.emergencyServicesContacted = true;
        incident.emergencyServiceDetails = {
          service: 'hospital',
          contactTime: new Date(),
          notes: adminAction
        };
      }
      
      await incident.save();
    }

    // Emit real-time update
    const io = req.app.get('io');
    if (io) {
      io.emit('incident-update', {
        type: 'incident_resolved',
        data: incident,
        resolution,
        resolvedBy: req.user.name,
        timestamp: new Date()
      });

      // Notify admin if true emergency
      if (resolution === 'true_emergency') {
        io.to('admin').emit('emergency-alert', {
          type: 'true_emergency_confirmed',
          data: incident,
          timestamp: new Date()
        });
      }
    }

    logger.info(`Incident ${incident._id} resolved as ${resolution} by ${req.user.name}`);

    res.status(200).json({
      success: true,
      data: incident,
      message: `Incident resolved as ${resolution.replace('_', ' ')}`
    });
  } catch (error) {
    logger.error('Resolve incident error:', error);
    next(error);
  }
};

// @desc    Get incident statistics
// @route   GET /api/incidents/stats
// @access  Private/Admin
const getIncidentStats = async (req, res, next) => {
  try {
    const days = parseInt(req.query.days, 10) || 30;
    const stats = await Incident.getStatistics(days);

    // Get current active count
    const activeCount = await Incident.getActiveCount();

    // Get incidents by type distribution
    const typeDistribution = await Incident.aggregate([
      { $match: { detectionTime: { $gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000) } } },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Get daily incident counts
    const dailyIncidents = await Incident.aggregate([
      { $match: { detectionTime: { $gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000) } } },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$detectionTime' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const result = {
      period: `${days} days`,
      overview: {
        ...stats,
        currentActive: activeCount
      },
      typeDistribution,
      dailyIncidents
    };

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Get incident stats error:', error);
    next(error);
  }
};

// @desc    Simulate fall detection (for testing)
// @route   POST /api/incidents/simulate-fall
// @access  Private/Admin
const simulateFallDetection = async (req, res, next) => {
  try {
    const { residentId } = req.body;

    // Verify resident exists
    const resident = await Resident.findById(residentId);
    if (!resident) {
      return res.status(404).json({
        success: false,
        error: 'Resident not found'
      });
    }

    // Create simulated fall incident
    const incident = await Incident.create({
      residentId,
      type: 'fall',
      severity: 'high',
      description: `Simulated fall detection for ${resident.name} - AI camera system detected potential fall`,
      location: resident.room,
      detectionMethod: 'ai_camera',
      priority: 4
    });

    await incident.populate('residentId', 'name room');

    // Emit real-time alert
    const io = req.app.get('io');
    if (io) {
      io.emit('emergency-alert', {
        type: 'fall_detected',
        data: incident,
        timestamp: new Date()
      });

      io.to('caregiver').emit('emergency-alert', {
        type: 'fall_detected',
        data: incident,
        timestamp: new Date()
      });
    }

    logger.info(`Simulated fall detection for resident ${resident.name} by ${req.user.name}`);

    res.status(201).json({
      success: true,
      data: incident,
      message: 'Fall detection simulated and alert sent to caregivers'
    });
  } catch (error) {
    logger.error('Simulate fall detection error:', error);
    next(error);
  }
};

// @desc    Get overdue incidents (no response within timeout)
// @route   GET /api/incidents/overdue
// @access  Private/Admin
const getOverdueIncidents = async (req, res, next) => {
  try {
    const timeoutMinutes = parseInt(req.query.timeout, 10) || 5;

    const incidents = await Incident.find({ status: 'active' })
      .populate('residentId', 'name room')
      .sort({ detectionTime: 1 });

    const overdueIncidents = incidents.filter(incident => 
      incident.isOverdue(timeoutMinutes)
    );

    res.status(200).json({
      success: true,
      count: overdueIncidents.length,
      data: overdueIncidents,
      timeout: `${timeoutMinutes} minutes`
    });
  } catch (error) {
    logger.error('Get overdue incidents error:', error);
    next(error);
  }
};

module.exports = {
  createIncident,
  getIncidents,
  getActiveIncidents,
  claimIncident,
  resolveIncident,
  getIncidentStats,
  simulateFallDetection,
  getOverdueIncidents
};