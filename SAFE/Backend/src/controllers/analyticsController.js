const Resident = require('../models/Resident');
const Vitals = require('../models/Vitals');
const Incident = require('../models/Incident');
const Assignment = require('../models/Assignment');
const User = require('../models/User');
const asyncHandler = require('../middleware/asyncHandler');

// @desc    Get dashboard analytics
// @route   GET /api/analytics/dashboard
// @access  Private (Admin/Caregiver)
const getDashboardAnalytics = asyncHandler(async (req, res) => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
  const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Basic counts
  const totalResidents = await Resident.countDocuments();
  const totalCaregivers = await User.countDocuments({ role: 'caregiver' });
  const activeIncidents = await Incident.countDocuments({ status: 'active' });

  // Vitals statistics
  const vitalsToday = await Vitals.countDocuments({
    timestamp: { $gte: today }
  });

  const vitalsYesterday = await Vitals.countDocuments({
    timestamp: { $gte: yesterday, $lt: today }
  });

  // Recent incidents
  const recentIncidents = await Incident.find({
    detectionTime: { $gte: weekAgo }
  }).sort({ detectionTime: -1 }).limit(10);

  // Overdue vitals (residents not checked in last 8 hours)
  const eightHoursAgo = new Date(now.getTime() - 8 * 60 * 60 * 1000);
  const overdueVitals = await Resident.aggregate([
    {
      $lookup: {
        from: 'vitals',
        localField: '_id',
        foreignField: 'residentId',
        as: 'vitals'
      }
    },
    {
      $addFields: {
        lastVitals: {
          $max: '$vitals.timestamp'
        }
      }
    },
    {
      $match: {
        $or: [
          { lastVitals: { $lt: eightHoursAgo } },
          { lastVitals: { $exists: false } }
        ]
      }
    },
    {
      $project: {
        name: 1,
        room: 1,
        lastVitals: 1
      }
    }
  ]);

  // Assignment statistics
  const assignmentStats = await Assignment.aggregate([
    {
      $match: { isActive: true }
    },
    {
      $group: {
        _id: '$caregiverId',
        residentCount: { $sum: 1 }
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
    {
      $unwind: '$caregiver'
    },
    {
      $project: {
        caregiverName: '$caregiver.name',
        residentCount: 1
      }
    }
  ]);

  res.json({
    success: true,
    data: {
      overview: {
        totalResidents,
        totalCaregivers,
        activeIncidents,
        vitalsToday,
        vitalsChange: vitalsToday - vitalsYesterday
      },
      recentIncidents,
      overdueVitals: overdueVitals.length,
      overdueResidents: overdueVitals,
      assignmentStats
    }
  });
});

// @desc    Get vitals trends analysis
// @route   GET /api/analytics/vitals-trends
// @access  Private (Admin/Caregiver)
const getVitalsTrends = asyncHandler(async (req, res) => {
  const { period = '7d', residentId } = req.query;

  let startDate;
  const now = new Date();

  switch (period) {
    case '24h':
      startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      break;
    case '7d':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case '30d':
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    default:
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  }

  const matchConditions = {
    timestamp: { $gte: startDate }
  };

  if (residentId) {
    matchConditions.residentId = residentId;
  }

  const trends = await Vitals.aggregate([
    { $match: matchConditions },
    {
      $group: {
        _id: {
          date: { $dateToString: { format: "%Y-%m-%d", date: "$timestamp" } },
          residentId: "$residentId"
        },
        avgSystolic: { $avg: "$bloodPressure.systolic" },
        avgDiastolic: { $avg: "$bloodPressure.diastolic" },
        avgHeartRate: { $avg: "$heartRate" },
        avgTemperature: { $avg: "$temperature" },
        count: { $sum: 1 }
      }
    },
    {
      $lookup: {
        from: 'residents',
        localField: '_id.residentId',
        foreignField: '_id',
        as: 'resident'
      }
    },
    {
      $unwind: '$resident'
    },
    {
      $sort: { '_id.date': 1 }
    },
    {
      $project: {
        date: '$_id.date',
        residentName: '$resident.name',
        residentRoom: '$resident.room',
        avgSystolic: { $round: ['$avgSystolic', 1] },
        avgDiastolic: { $round: ['$avgDiastolic', 1] },
        avgHeartRate: { $round: ['$avgHeartRate', 1] },
        avgTemperature: { $round: ['$avgTemperature', 1] },
        count: 1
      }
    }
  ]);

  res.json({
    success: true,
    data: {
      period,
      trends
    }
  });
});

// @desc    Get resident health scores
// @route   GET /api/analytics/resident-health
// @access  Private (Admin/Caregiver)
const getResidentHealthScores = asyncHandler(async (req, res) => {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const healthScores = await Resident.aggregate([
    {
      $lookup: {
        from: 'vitals',
        localField: '_id',
        foreignField: 'residentId',
        as: 'vitals'
      }
    },
    {
      $lookup: {
        from: 'incidents',
        localField: '_id',
        foreignField: 'residentId',
        as: 'incidents'
      }
    },
    {
      $addFields: {
        recentVitals: {
          $filter: {
            input: '$vitals',
            cond: { $gte: ['$$this.timestamp', weekAgo] }
          }
        },
        recentIncidents: {
          $filter: {
            input: '$incidents',
            cond: { $gte: ['$$this.detectionTime', weekAgo] }
          }
        },
        lastVitals: {
          $max: '$vitals.timestamp'
        }
      }
    },
    {
      $addFields: {
        vitalsFrequency: { $size: '$recentVitals' },
        incidentCount: { $size: '$recentIncidents' },
        daysSinceLastVitals: {
          $divide: [
            { $subtract: [now, '$lastVitals'] },
            1000 * 60 * 60 * 24
          ]
        }
      }
    },
    {
      $addFields: {
        healthScore: {
          $max: [
            0,
            {
              $subtract: [
                100,
                {
                  $add: [
                    { $multiply: ['$incidentCount', 10] },
                    { $multiply: [{ $max: [0, { $subtract: ['$daysSinceLastVitals', 1] }] }, 5] },
                    { $cond: [{ $lt: ['$vitalsFrequency', 7] }, { $multiply: [{ $subtract: [7, '$vitalsFrequency'] }, 3] }, 0] }
                  ]
                }
              ]
            }
          ]
        }
      }
    },
    {
      $project: {
        name: 1,
        room: 1,
        age: 1,
        medicalConditions: 1,
        healthScore: { $round: ['$healthScore', 1] },
        vitalsFrequency: 1,
        incidentCount: 1,
        daysSinceLastVitals: { $round: ['$daysSinceLastVitals', 1] },
        lastVitals: 1
      }
    },
    {
      $sort: { healthScore: -1 }
    }
  ]);

  res.json({
    success: true,
    data: healthScores
  });
});

module.exports = {
  getDashboardAnalytics,
  getVitalsTrends,
  getResidentHealthScores
};