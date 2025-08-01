const Resident = require('../models/Resident');
const Vitals = require('../models/Vitals');
const Incident = require('../models/Incident');
const Assignment = require('../models/Assignment');
const User = require('../models/User');
const asyncHandler = require('../middleware/asyncHandler');

// @desc    Generate custom report
// @route   POST /api/reports/generate
// @access  Private (Admin)
const generateReport = asyncHandler(async (req, res) => {
  const {
    reportType,
    dateRange,
    residentIds,
    caregiverIds,
    includeVitals,
    includeIncidents,
    includeAssignments,
    format = 'json'
  } = req.body;

  const { startDate, endDate } = dateRange;
  const start = new Date(startDate);
  const end = new Date(endDate);

  let reportData = {};

  // Base resident data
  let residentQuery = {};
  if (residentIds && residentIds.length > 0) {
    residentQuery._id = { $in: residentIds };
  }

  const residents = await Resident.find(residentQuery);
  reportData.residents = residents;

  // Include vitals data
  if (includeVitals) {
    let vitalsQuery = {
      timestamp: { $gte: start, $lte: end }
    };
    
    if (residentIds && residentIds.length > 0) {
      vitalsQuery.residentId = { $in: residentIds };
    }

    const vitals = await Vitals.find(vitalsQuery)
      .populate('residentId', 'name room')
      .populate('caregiverId', 'name')
      .sort({ timestamp: -1 });

    reportData.vitals = vitals;

    // Vitals summary
    const vitalsSummary = await Vitals.aggregate([
      { $match: vitalsQuery },
      {
        $group: {
          _id: '$residentId',
          totalReadings: { $sum: 1 },
          avgSystolic: { $avg: '$bloodPressure.systolic' },
          avgDiastolic: { $avg: '$bloodPressure.diastolic' },
          avgHeartRate: { $avg: '$heartRate' },
          avgTemperature: { $avg: '$temperature' },
          lastReading: { $max: '$timestamp' }
        }
      },
      {
        $lookup: {
          from: 'residents',
          localField: '_id',
          foreignField: '_id',
          as: 'resident'
        }
      },
      {
        $unwind: '$resident'
      },
      {
        $project: {
          residentName: '$resident.name',
          residentRoom: '$resident.room',
          totalReadings: 1,
          avgSystolic: { $round: ['$avgSystolic', 1] },
          avgDiastolic: { $round: ['$avgDiastolic', 1] },
          avgHeartRate: { $round: ['$avgHeartRate', 1] },
          avgTemperature: { $round: ['$avgTemperature', 1] },
          lastReading: 1
        }
      }
    ]);

    reportData.vitalsSummary = vitalsSummary;
  }

  // Include incidents data
  if (includeIncidents) {
    let incidentsQuery = {
      detectionTime: { $gte: start, $lte: end }
    };
    
    if (residentIds && residentIds.length > 0) {
      incidentsQuery.residentId = { $in: residentIds };
    }

    const incidents = await Incident.find(incidentsQuery)
      .populate('residentId', 'name room')
      .populate('claimedBy', 'name')
      .sort({ detectionTime: -1 });

    reportData.incidents = incidents;

    // Incidents summary
    const incidentsSummary = await Incident.aggregate([
      { $match: incidentsQuery },
      {
        $group: {
          _id: {
            residentId: '$residentId',
            type: '$type'
          },
          count: { $sum: 1 },
          avgResponseTime: {
            $avg: {
              $cond: [
                { $ne: ['$claimedAt', null] },
                { $subtract: ['$claimedAt', '$detectionTime'] },
                null
              ]
            }
          }
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
        $project: {
          residentName: '$resident.name',
          residentRoom: '$resident.room',
          incidentType: '$_id.type',
          count: 1,
          avgResponseTimeMinutes: {
            $round: [{ $divide: ['$avgResponseTime', 60000] }, 1]
          }
        }
      }
    ]);

    reportData.incidentsSummary = incidentsSummary;
  }

  // Include assignments data
  if (includeAssignments) {
    let assignmentsQuery = {
      assignedAt: { $gte: start, $lte: end }
    };
    
    if (residentIds && residentIds.length > 0) {
      assignmentsQuery.residentId = { $in: residentIds };
    }
    
    if (caregiverIds && caregiverIds.length > 0) {
      assignmentsQuery.caregiverId = { $in: caregiverIds };
    }

    const assignments = await Assignment.find(assignmentsQuery)
      .populate('residentId', 'name room')
      .populate('caregiverId', 'name')
      .sort({ assignedAt: -1 });

    reportData.assignments = assignments;
  }

  // Add report metadata
  reportData.metadata = {
    reportType,
    generatedAt: new Date(),
    generatedBy: req.user.name,
    dateRange: { startDate: start, endDate: end },
    totalResidents: residents.length,
    filters: {
      residentIds: residentIds || [],
      caregiverIds: caregiverIds || []
    }
  };

  res.json({
    success: true,
    data: reportData
  });
});

// @desc    Schedule automated report
// @route   POST /api/reports/schedule
// @access  Private (Admin)
const scheduleReport = asyncHandler(async (req, res) => {
  const {
    name,
    reportConfig,
    schedule, // 'daily', 'weekly', 'monthly'
    recipients,
    isActive = true
  } = req.body;

  // In a real implementation, this would integrate with a job scheduler like node-cron
  // For now, we'll just store the schedule configuration
  
  const scheduledReport = {
    id: Date.now().toString(),
    name,
    reportConfig,
    schedule,
    recipients,
    isActive,
    createdBy: req.user.id,
    createdAt: new Date(),
    lastRun: null,
    nextRun: calculateNextRun(schedule)
  };

  // In a real app, this would be stored in the database
  // For demo purposes, we'll just return the configuration
  
  res.status(201).json({
    success: true,
    message: 'Report scheduled successfully',
    data: scheduledReport
  });
});

// @desc    Get scheduled reports
// @route   GET /api/reports/scheduled
// @access  Private (Admin)
const getScheduledReports = asyncHandler(async (req, res) => {
  // In a real implementation, this would fetch from database
  const scheduledReports = [
    {
      id: '1',
      name: 'Daily Vitals Summary',
      schedule: 'daily',
      isActive: true,
      lastRun: new Date(Date.now() - 24 * 60 * 60 * 1000),
      nextRun: new Date(Date.now() + 24 * 60 * 60 * 1000)
    },
    {
      id: '2',
      name: 'Weekly Incident Report',
      schedule: 'weekly',
      isActive: true,
      lastRun: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      nextRun: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    }
  ];

  res.json({
    success: true,
    data: scheduledReports
  });
});

// @desc    Export report data
// @route   GET /api/reports/export/:reportId
// @access  Private (Admin)
const exportReport = asyncHandler(async (req, res) => {
  const { reportId } = req.params;
  const { format = 'csv' } = req.query;

  // In a real implementation, this would fetch the report data and convert to requested format
  // For demo purposes, we'll return a sample CSV structure
  
  if (format === 'csv') {
    const csvData = `Name,Room,Age,Last Vitals,Incidents This Week
John Doe,101,75,2024-01-15 10:30,0
Jane Smith,102,82,2024-01-15 09:15,1
Bob Johnson,103,68,2024-01-14 16:45,0`;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=report-${reportId}.csv`);
    res.send(csvData);
  } else {
    res.status(400).json({
      success: false,
      message: 'Unsupported export format'
    });
  }
});

// Helper function to calculate next run time
const calculateNextRun = (schedule) => {
  const now = new Date();
  
  switch (schedule) {
    case 'daily':
      return new Date(now.getTime() + 24 * 60 * 60 * 1000);
    case 'weekly':
      return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    case 'monthly':
      return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    default:
      return new Date(now.getTime() + 24 * 60 * 60 * 1000);
  }
};

module.exports = {
  generateReport,
  scheduleReport,
  getScheduledReports,
  exportReport
};