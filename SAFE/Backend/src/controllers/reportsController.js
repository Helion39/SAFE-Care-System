const Resident = require('../models/Resident');
const Vitals = require('../models/Vitals');
const Incident = require('../models/Incident');
const Assignment = require('../models/Assignment');
const User = require('../models/User');
const logger = require('../utils/logger');

// @desc    Generate custom report
// @route   POST /api/reports/generate
// @access  Private/Admin
const generateReport = async (req, res, next) => {
  try {
    const {
      reportType,
      startDate,
      endDate,
      residentIds,
      caregiverIds,
      includeVitals,
      includeIncidents,
      includeAssignments,
      format = 'json'
    } = req.body;

    if (!reportType || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'Report type, start date, and end date are required'
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    let reportData = {
      reportType,
      period: {
        startDate: start,
        endDate: end,
        days: Math.ceil((end - start) / (1000 * 60 * 60 * 24))
      },
      generatedAt: new Date(),
      generatedBy: req.user.name
    };

    // Build resident filter
    let residentFilter = {};
    if (residentIds && residentIds.length > 0) {
      residentFilter._id = { $in: residentIds };
    }

    // Get residents data
    const residents = await Resident.find(residentFilter)
      .populate('assignments', 'caregiverId status assignedAt')
      .lean();

    reportData.residents = residents;

    // Include vitals data if requested
    if (includeVitals) {
      let vitalsFilter = {
        recordedAt: { $gte: start, $lte: end }
      };
      if (residentIds && residentIds.length > 0) {
        vitalsFilter.residentId = { $in: residentIds };
      }
      if (caregiverIds && caregiverIds.length > 0) {
        vitalsFilter.recordedBy = { $in: caregiverIds };
      }

      const vitals = await Vitals.find(vitalsFilter)
        .populate('residentId', 'name room')
        .populate('recordedBy', 'name')
        .sort({ recordedAt: -1 })
        .lean();

      reportData.vitals = {
        total: vitals.length,
        data: vitals
      };
    }

    // Include incidents data if requested
    if (includeIncidents) {
      let incidentsFilter = {
        detectionTime: { $gte: start, $lte: end }
      };
      if (residentIds && residentIds.length > 0) {
        incidentsFilter.residentId = { $in: residentIds };
      }

      const incidents = await Incident.find(incidentsFilter)
        .populate('residentId', 'name room')
        .populate('claimedBy', 'name')
        .populate('resolvedBy', 'name')
        .sort({ detectionTime: -1 })
        .lean();

      reportData.incidents = {
        total: incidents.length,
        byStatus: {
          active: incidents.filter(i => i.status === 'active').length,
          claimed: incidents.filter(i => i.status === 'claimed').length,
          resolved: incidents.filter(i => i.status === 'resolved').length
        },
        byType: incidents.reduce((acc, incident) => {
          acc[incident.type] = (acc[incident.type] || 0) + 1;
          return acc;
        }, {}),
        data: incidents
      };
    }

    // Include assignments data if requested
    if (includeAssignments) {
      let assignmentsFilter = {
        assignedAt: { $gte: start, $lte: end }
      };
      if (residentIds && residentIds.length > 0) {
        assignmentsFilter.residentId = { $in: residentIds };
      }
      if (caregiverIds && caregiverIds.length > 0) {
        assignmentsFilter.caregiverId = { $in: caregiverIds };
      }

      const assignments = await Assignment.find(assignmentsFilter)
        .populate('residentId', 'name room')
        .populate('caregiverId', 'name')
        .sort({ assignedAt: -1 })
        .lean();

      reportData.assignments = {
        total: assignments.length,
        active: assignments.filter(a => a.status === 'active').length,
        data: assignments
      };
    }

    // Generate summary statistics
    reportData.summary = {
      totalResidents: residents.length,
      vitalsRecorded: reportData.vitals?.total || 0,
      incidentsReported: reportData.incidents?.total || 0,
      assignmentsCreated: reportData.assignments?.total || 0
    };

    res.status(200).json({
      success: true,
      data: reportData
    });
  } catch (error) {
    logger.error('Generate report error:', error);
    next(error);
  }
};

// @desc    Get vitals report
// @route   GET /api/reports/vitals
// @access  Private
const getVitalsReport = async (req, res, next) => {
  try {
    const days = parseInt(req.query.days, 10) || 30;
    const residentId = req.query.residentId;
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    let matchQuery = { recordedAt: { $gte: startDate } };
    if (residentId) {
      matchQuery.residentId = residentId;
    }

    // Get vitals with aggregated statistics
    const vitalsReport = await Vitals.aggregate([
      { $match: matchQuery },
      {
        $lookup: {
          from: 'residents',
          localField: 'residentId',
          foreignField: '_id',
          as: 'resident'
        }
      },
      { $unwind: '$resident' },
      {
        $lookup: {
          from: 'users',
          localField: 'recordedBy',
          foreignField: '_id',
          as: 'caregiver'
        }
      },
      { $unwind: '$caregiver' },
      {
        $group: {
          _id: {
            residentId: '$residentId',
            residentName: '$resident.name',
            residentRoom: '$resident.room'
          },
          vitalsCount: { $sum: 1 },
          avgSystolic: { $avg: '$bloodPressure.systolic' },
          avgDiastolic: { $avg: '$bloodPressure.diastolic' },
          avgHeartRate: { $avg: '$heartRate' },
          avgTemperature: { $avg: '$temperature' },
          maxSystolic: { $max: '$bloodPressure.systolic' },
          minSystolic: { $min: '$bloodPressure.systolic' },
          maxHeartRate: { $max: '$heartRate' },
          minHeartRate: { $min: '$heartRate' },
          lastRecorded: { $max: '$recordedAt' },
          caregivers: { $addToSet: '$caregiver.name' }
        }
      },
      {
        $project: {
          residentName: '$_id.residentName',
          residentRoom: '$_id.residentRoom',
          vitalsCount: 1,
          averages: {
            systolic: { $round: ['$avgSystolic', 0] },
            diastolic: { $round: ['$avgDiastolic', 0] },
            heartRate: { $round: ['$avgHeartRate', 0] },
            temperature: { $round: ['$avgTemperature', 1] }
          },
          ranges: {
            systolic: { min: '$minSystolic', max: '$maxSystolic' },
            heartRate: { min: '$minHeartRate', max: '$maxHeartRate' }
          },
          lastRecorded: 1,
          caregivers: 1
        }
      },
      { $sort: { residentName: 1 } }
    ]);

    // Get overall statistics
    const overallStats = await Vitals.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: null,
          totalVitals: { $sum: 1 },
          uniqueResidents: { $addToSet: '$residentId' },
          uniqueCaregivers: { $addToSet: '$recordedBy' },
          avgSystolic: { $avg: '$bloodPressure.systolic' },
          avgDiastolic: { $avg: '$bloodPressure.diastolic' },
          avgHeartRate: { $avg: '$heartRate' },
          avgTemperature: { $avg: '$temperature' }
        }
      },
      {
        $project: {
          totalVitals: 1,
          uniqueResidents: { $size: '$uniqueResidents' },
          uniqueCaregivers: { $size: '$uniqueCaregivers' },
          overallAverages: {
            systolic: { $round: ['$avgSystolic', 0] },
            diastolic: { $round: ['$avgDiastolic', 0] },
            heartRate: { $round: ['$avgHeartRate', 0] },
            temperature: { $round: ['$avgTemperature', 1] }
          }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        period: `${days} days`,
        summary: overallStats[0] || {},
        residents: vitalsReport
      }
    });
  } catch (error) {
    logger.error('Get vitals report error:', error);
    next(error);
  }
};

// @desc    Get incidents report
// @route   GET /api/reports/incidents
// @access  Private
const getIncidentsReport = async (req, res, next) => {
  try {
    const days = parseInt(req.query.days, 10) || 30;
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const incidentsReport = await Incident.aggregate([
      { $match: { detectionTime: { $gte: startDate } } },
      {
        $lookup: {
          from: 'residents',
          localField: 'residentId',
          foreignField: '_id',
          as: 'resident'
        }
      },
      { $unwind: '$resident' },
      {
        $lookup: {
          from: 'users',
          localField: 'claimedBy',
          foreignField: '_id',
          as: 'claimedByUser'
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'resolvedBy',
          foreignField: '_id',
          as: 'resolvedByUser'
        }
      },
      {
        $addFields: {
          responseTime: {
            $cond: [
              '$claimedAt',
              { $divide: [{ $subtract: ['$claimedAt', '$detectionTime'] }, 60000] },
              null
            ]
          },
          resolutionTime: {
            $cond: [
              '$resolvedAt',
              { $divide: [{ $subtract: ['$resolvedAt', '$detectionTime'] }, 60000] },
              null
            ]
          }
        }
      },
      {
        $project: {
          residentName: '$resident.name',
          residentRoom: '$resident.room',
          type: 1,
          severity: 1,
          status: 1,
          description: 1,
          location: 1,
          detectionMethod: 1,
          detectionTime: 1,
          claimedBy: { $arrayElemAt: ['$claimedByUser.name', 0] },
          claimedAt: 1,
          resolvedBy: { $arrayElemAt: ['$resolvedByUser.name', 0] },
          resolvedAt: 1,
          resolution: 1,
          responseTime: { $round: ['$responseTime', 1] },
          resolutionTime: { $round: ['$resolutionTime', 1] }
        }
      },
      { $sort: { detectionTime: -1 } }
    ]);

    // Calculate summary statistics
    const summary = {
      totalIncidents: incidentsReport.length,
      byStatus: incidentsReport.reduce((acc, incident) => {
        acc[incident.status] = (acc[incident.status] || 0) + 1;
        return acc;
      }, {}),
      byType: incidentsReport.reduce((acc, incident) => {
        acc[incident.type] = (acc[incident.type] || 0) + 1;
        return acc;
      }, {}),
      bySeverity: incidentsReport.reduce((acc, incident) => {
        acc[incident.severity] = (acc[incident.severity] || 0) + 1;
        return acc;
      }, {}),
      avgResponseTime: Math.round(
        incidentsReport
          .filter(i => i.responseTime)
          .reduce((sum, i) => sum + i.responseTime, 0) /
        incidentsReport.filter(i => i.responseTime).length || 0
      ),
      avgResolutionTime: Math.round(
        incidentsReport
          .filter(i => i.resolutionTime)
          .reduce((sum, i) => sum + i.resolutionTime, 0) /
        incidentsReport.filter(i => i.resolutionTime).length || 0
      )
    };

    res.status(200).json({
      success: true,
      data: {
        period: `${days} days`,
        summary,
        incidents: incidentsReport
      }
    });
  } catch (error) {
    logger.error('Get incidents report error:', error);
    next(error);
  }
};

// @desc    Get assignments report
// @route   GET /api/reports/assignments
// @access  Private/Admin
const getAssignmentsReport = async (req, res, next) => {
  try {
    const days = parseInt(req.query.days, 10) || 30;
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const assignmentsReport = await Assignment.aggregate([
      {
        $lookup: {
          from: 'residents',
          localField: 'residentId',
          foreignField: '_id',
          as: 'resident'
        }
      },
      { $unwind: '$resident' },
      {
        $lookup: {
          from: 'users',
          localField: 'caregiverId',
          foreignField: '_id',
          as: 'caregiver'
        }
      },
      { $unwind: '$caregiver' },
      {
        $project: {
          residentName: '$resident.name',
          residentRoom: '$resident.room',
          caregiverName: '$caregiver.name',
          status: 1,
          assignedAt: 1,
          unassignedAt: 1,
          duration: {
            $cond: [
              '$unassignedAt',
              { $divide: [{ $subtract: ['$unassignedAt', '$assignedAt'] }, 86400000] },
              { $divide: [{ $subtract: [new Date(), '$assignedAt'] }, 86400000] }
            ]
          }
        }
      },
      { $sort: { assignedAt: -1 } }
    ]);

    // Get caregiver workload summary
    const caregiverWorkload = await Assignment.aggregate([
      { $match: { status: 'active' } },
      {
        $lookup: {
          from: 'users',
          localField: 'caregiverId',
          foreignField: '_id',
          as: 'caregiver'
        }
      },
      { $unwind: '$caregiver' },
      {
        $group: {
          _id: '$caregiverId',
          caregiverName: { $first: '$caregiver.name' },
          activeAssignments: { $sum: 1 },
          residents: { $push: '$residentId' }
        }
      },
      { $sort: { activeAssignments: -1 } }
    ]);

    const summary = {
      totalAssignments: assignmentsReport.length,
      activeAssignments: assignmentsReport.filter(a => a.status === 'active').length,
      avgAssignmentDuration: Math.round(
        assignmentsReport.reduce((sum, a) => sum + a.duration, 0) / assignmentsReport.length || 0
      ),
      caregiverWorkload
    };

    res.status(200).json({
      success: true,
      data: {
        period: `${days} days`,
        summary,
        assignments: assignmentsReport
      }
    });
  } catch (error) {
    logger.error('Get assignments report error:', error);
    next(error);
  }
};

module.exports = {
  generateReport,
  getVitalsReport,
  getIncidentsReport,
  getAssignmentsReport
};