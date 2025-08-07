const Vitals = require('../models/Vitals');
const Resident = require('../models/Resident');
const logger = require('../utils/logger');

const recordVitals = async (req, res, next) => {
  try {
    const { residentId, systolicBP, diastolicBP, heartRate, temperature, oxygenSaturation, notes } = req.body;

    // Verify resident exists
    const resident = await Resident.findById(residentId);
    if (!resident) {
      return res.status(404).json({
        success: false,
        error: 'Resident not found'
      });
    }

    // Create vitals record
    const vitals = await Vitals.create({
      residentId,
      caregiverId: req.user.id,
      systolicBP,
      diastolicBP,
      heartRate,
      temperature,
      oxygenSaturation,
      notes
    });

    // Populate the created vitals
    await vitals.populate([
      { path: 'residentId', select: 'name room' },
      { path: 'caregiverId', select: 'name' }
    ]);

    // Emit real-time update via Socket.IO
    const io = req.app.get('io');
    if (io) {
      io.emit('vitals-update', {
        type: 'new_vitals',
        data: vitals,
        residentId,
        timestamp: new Date()
      });
    }

    logger.info(`Vitals recorded for resident ${resident.name} by ${req.user.name}`);

    res.status(201).json({
      success: true,
      data: vitals,
      message: 'Vitals recorded successfully'
    });
  } catch (error) {
    logger.error('Record vitals error:', error);
    next(error);
  }
};

const getResidentVitals = async (req, res, next) => {
  try {
    const { id } = req.params;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const startIndex = (page - 1) * limit;

    // Date range filtering
    let dateQuery = {};
    if (req.query.startDate || req.query.endDate) {
      dateQuery.timestamp = {};
      if (req.query.startDate) {
        dateQuery.timestamp.$gte = new Date(req.query.startDate);
      }
      if (req.query.endDate) {
        dateQuery.timestamp.$lte = new Date(req.query.endDate);
      }
    }

    const query = { residentId: id, ...dateQuery };

    const total = await Vitals.countDocuments(query);
    const vitals = await Vitals.find(query)
      .populate('caregiverId', 'name')
      .sort({ timestamp: -1 })
      .limit(limit)
      .skip(startIndex);

    // Get trends
    const trends = await Vitals.getTrends(id, 7);

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
      count: vitals.length,
      total,
      pagination,
      data: vitals,
      trends
    });
  } catch (error) {
    logger.error('Get resident vitals error:', error);
    next(error);
  }
};

const getRecentVitals = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 50;
    const hours = parseInt(req.query.hours, 10) || 24;

    const startTime = new Date();
    startTime.setHours(startTime.getHours() - hours);

    const vitals = await Vitals.find({
      timestamp: { $gte: startTime }
    })
    .populate('residentId', 'name room')
    .populate('caregiverId', 'name')
    .sort({ timestamp: -1 })
    .limit(limit);

    // Add time indicators
    const vitalsWithTimeIndicators = vitals.map(vital => {
      const now = new Date();
      const timeDiff = now - vital.timestamp;
      const hours = Math.floor(timeDiff / (1000 * 60 * 60));
      const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));

      let timeAgo;
      if (hours === 0) {
        timeAgo = minutes === 0 ? 'Just now' : `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
      } else if (hours < 24) {
        timeAgo = `${hours} hour${hours > 1 ? 's' : ''} ago`;
      } else {
        const days = Math.floor(hours / 24);
        timeAgo = days === 1 ? 'Yesterday' : `${days} days ago`;
      }

      return {
        ...vital.toObject(),
        timeAgo,
        isNormal: vital.isNormal()
      };
    });

    res.status(200).json({
      success: true,
      count: vitalsWithTimeIndicators.length,
      data: vitalsWithTimeIndicators
    });
  } catch (error) {
    logger.error('Get recent vitals error:', error);
    next(error);
  }
};

const getOverdueVitals = async (req, res, next) => {
  try {
    const hoursThreshold = parseInt(req.query.hours, 10) || 8; // Default 8 hours
    const cutoffTime = new Date();
    cutoffTime.setHours(cutoffTime.getHours() - hoursThreshold);

    // Get all active residents
    const residents = await Resident.find({ isActive: true })
      .populate('assignedCaregiver', 'name email')
      .sort({ room: 1 });

    const overdueResidents = [];

    for (const resident of residents) {
      // Get latest vitals for this resident
      const latestVitals = await Vitals.findOne({ residentId: resident._id })
        .sort({ timestamp: -1 });

      // Check if overdue
      const isOverdue = !latestVitals || latestVitals.timestamp < cutoffTime;

      if (isOverdue) {
        const vitalsStatus = await resident.getVitalsStatus();
        
        overdueResidents.push({
          resident: {
            id: resident._id,
            name: resident.name,
            room: resident.room,
            assignedCaregiver: resident.assignedCaregiver
          },
          vitalsStatus,
          lastVitalsTime: latestVitals ? latestVitals.timestamp : null,
          hoursOverdue: latestVitals 
            ? Math.floor((new Date() - latestVitals.timestamp) / (1000 * 60 * 60))
            : null
        });
      }
    }

    // Sort by most overdue first
    overdueResidents.sort((a, b) => {
      if (!a.hoursOverdue) return 1;
      if (!b.hoursOverdue) return -1;
      return b.hoursOverdue - a.hoursOverdue;
    });

    res.status(200).json({
      success: true,
      count: overdueResidents.length,
      data: overdueResidents,
      threshold: `${hoursThreshold} hours`
    });
  } catch (error) {
    logger.error('Get overdue vitals error:', error);
    next(error);
  }
};

const updateVitals = async (req, res, next) => {
  try {
    const { systolicBP, diastolicBP, heartRate, temperature, oxygenSaturation, notes } = req.body;

    const vitals = await Vitals.findById(req.params.id);

    if (!vitals) {
      return res.status(404).json({
        success: false,
        error: 'Vitals record not found'
      });
    }

    // Only allow the caregiver who created it or admin to update
    if (vitals.caregiverId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update this vitals record'
      });
    }

    // Update fields
    const fieldsToUpdate = {};
    if (systolicBP) fieldsToUpdate.systolicBP = systolicBP;
    if (diastolicBP) fieldsToUpdate.diastolicBP = diastolicBP;
    if (heartRate) fieldsToUpdate.heartRate = heartRate;
    if (temperature) fieldsToUpdate.temperature = temperature;
    if (oxygenSaturation) fieldsToUpdate.oxygenSaturation = oxygenSaturation;
    if (notes !== undefined) fieldsToUpdate.notes = notes;

    const updatedVitals = await Vitals.findByIdAndUpdate(
      req.params.id,
      fieldsToUpdate,
      {
        new: true,
        runValidators: true
      }
    ).populate([
      { path: 'residentId', select: 'name room' },
      { path: 'caregiverId', select: 'name' }
    ]);

    // Emit real-time update
    const io = req.app.get('io');
    if (io) {
      io.emit('vitals-update', {
        type: 'vitals_updated',
        data: updatedVitals,
        residentId: updatedVitals.residentId._id,
        timestamp: new Date()
      });
    }

    logger.info(`Vitals updated for resident ${updatedVitals.residentId.name} by ${req.user.name}`);

    res.status(200).json({
      success: true,
      data: updatedVitals,
      message: 'Vitals updated successfully'
    });
  } catch (error) {
    logger.error('Update vitals error:', error);
    next(error);
  }
};

const getVitalsStats = async (req, res, next) => {
  try {
    const days = parseInt(req.query.days, 10) || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Overall statistics
    const stats = await Vitals.aggregate([
      { $match: { timestamp: { $gte: startDate } } },
      {
        $group: {
          _id: null,
          totalReadings: { $sum: 1 },
          avgSystolic: { $avg: '$systolicBP' },
          avgDiastolic: { $avg: '$diastolicBP' },
          avgHeartRate: { $avg: '$heartRate' },
          alertCount: { $sum: { $size: '$alerts' } }
        }
      }
    ]);

    // Daily readings count
    const dailyReadings = await Vitals.aggregate([
      { $match: { timestamp: { $gte: startDate } } },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$timestamp' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Alert distribution
    const alertDistribution = await Vitals.aggregate([
      { $match: { timestamp: { $gte: startDate } } },
      { $unwind: '$alerts' },
      {
        $group: {
          _id: '$alerts.type',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Caregiver activity
    const caregiverActivity = await Vitals.aggregate([
      { $match: { timestamp: { $gte: startDate } } },
      {
        $group: {
          _id: '$caregiverId',
          readingsCount: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'caregiver'
        }
      },
      { $unwind: '$caregiver' },
      {
        $project: {
          caregiverName: '$caregiver.name',
          readingsCount: 1
        }
      },
      { $sort: { readingsCount: -1 } }
    ]);

    const result = {
      period: `${days} days`,
      overview: stats[0] || {
        totalReadings: 0,
        avgSystolic: 0,
        avgDiastolic: 0,
        avgHeartRate: 0,
        alertCount: 0
      },
      dailyReadings,
      alertDistribution,
      caregiverActivity
    };

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Get vitals stats error:', error);
    next(error);
  }
};

const batchRecordVitals = async (req, res, next) => {
  try {
    const { vitalsData } = req.body; // Array of vitals objects

    if (!Array.isArray(vitalsData) || vitalsData.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Please provide an array of vitals data'
      });
    }

    const results = {
      created: [],
      failed: []
    };

    for (const vitalData of vitalsData) {
      try {
        const { residentId, systolicBP, diastolicBP, heartRate, temperature, oxygenSaturation, notes } = vitalData;

        // Verify resident exists
        const resident = await Resident.findById(residentId);
        if (!resident) {
          results.failed.push({
            residentId,
            error: 'Resident not found'
          });
          continue;
        }

        // Create vitals record
        const vitals = await Vitals.create({
          residentId,
          caregiverId: req.user.id,
          systolicBP,
          diastolicBP,
          heartRate,
          temperature,
          oxygenSaturation,
          notes
        });

        await vitals.populate([
          { path: 'residentId', select: 'name room' },
          { path: 'caregiverId', select: 'name' }
        ]);

        results.created.push(vitals);

        logger.info(`Batch vitals recorded for resident ${resident.name} by ${req.user.name}`);
      } catch (error) {
        results.failed.push({
          residentId: vitalData.residentId,
          error: error.message
        });
      }
    }

    // Emit real-time update for successful entries
    const io = req.app.get('io');
    if (io && results.created.length > 0) {
      io.emit('vitals-update', {
        type: 'batch_vitals',
        data: results.created,
        timestamp: new Date()
      });
    }

    res.status(201).json({
      success: true,
      data: results,
      message: `Recorded ${results.created.length} vitals, ${results.failed.length} failed`
    });
  } catch (error) {
    logger.error('Batch record vitals error:', error);
    next(error);
  }
};

const getAllVitals = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 100;
    const startIndex = (page - 1) * limit;

    // Build query
    let query = {};

    // Filter by resident if specified
    if (req.query.residentId) {
      query.residentId = req.query.residentId;
    }

    // Filter by caregiver if specified
    if (req.query.caregiverId) {
      query.caregiverId = req.query.caregiverId;
    }

    // Filter by date range
    if (req.query.startDate || req.query.endDate) {
      query.timestamp = {};
      if (req.query.startDate) {
        query.timestamp.$gte = new Date(req.query.startDate);
      }
      if (req.query.endDate) {
        query.timestamp.$lte = new Date(req.query.endDate);
      }
    }

    const total = await Vitals.countDocuments(query);
    const vitals = await Vitals.find(query)
      .populate('residentId', 'name room')
      .populate('caregiverId', 'name')
      .sort({ timestamp: -1 })
      .limit(limit)
      .skip(startIndex);

    // Transform data to match frontend expectations
    const transformedVitals = vitals.map(vital => ({
      id: vital._id,
      resident_id: vital.residentId?._id || vital.residentId,
      systolic_bp: vital.systolicBP,
      diastolic_bp: vital.diastolicBP,
      heart_rate: vital.heartRate,
      temperature: vital.temperature,
      oxygen_saturation: vital.oxygenSaturation,
      timestamp: vital.timestamp,
      caregiver_id: vital.caregiverId?._id || vital.caregiverId,
      notes: vital.notes,
      resident_name: vital.residentId?.name || 'Unknown Resident',
      caregiver_name: vital.caregiverId?.name || 'Unknown Caregiver'
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
      count: vitals.length,
      total,
      pagination,
      data: transformedVitals
    });
  } catch (error) {
    logger.error('Get all vitals error:', error);
    next(error);
  }
};

module.exports = {
  recordVitals,
  getAllVitals,
  getResidentVitals,
  getRecentVitals,
  getOverdueVitals,
  updateVitals,
  getVitalsStats,
  batchRecordVitals
};