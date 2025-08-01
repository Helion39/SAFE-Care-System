const express = require('express');
const mongoose = require('mongoose');
const { authenticateFamily, logAccess } = require('../middleware/auth');

const router = express.Router();

// Import models from the existing SAFE system
const Resident = require('../../../SAFE/Backend/src/models/Resident');
const Vitals = require('../../../SAFE/Backend/src/models/Vitals');
const Incident = require('../../../SAFE/Backend/src/models/Incident');

// @route   GET /api/family/resident
// @desc    Get linked resident information
// @access  Private (Family Member)
router.get('/resident', authenticateFamily, logAccess('view_dashboard'), async (req, res) => {
  try {
    const resident = await Resident.findById(req.resident._id)
      .select('name room age medicalConditions emergencyContact admissionDate profileImage notes isActive')
      .populate('assignedCaregiver', 'name email');

    if (!resident || !resident.isActive) {
      return res.status(404).json({
        success: false,
        error: 'Resident information not available',
        code: 'RESIDENT_NOT_FOUND',
        timestamp: new Date().toISOString()
      });
    }

    // Get health summary
    const healthSummary = await resident.getHealthSummary();
    const vitalsStatus = await resident.getVitalsStatus();

    const residentData = {
      id: resident._id,
      name: resident.name,
      room: resident.room,
      age: resident.age,
      medicalConditions: resident.medicalConditions,
      emergencyContact: resident.emergencyContact,
      admissionDate: resident.admissionDate,
      profileImage: resident.profileImage,
      notes: resident.notes,
      assignedCaregiver: resident.assignedCaregiver ? {
        name: resident.assignedCaregiver.name,
        email: resident.assignedCaregiver.email
      } : null,
      healthSummary,
      vitalsStatus
    };

    res.json({
      success: true,
      data: residentData
    });

  } catch (error) {
    console.error('Get resident error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get resident information',
      code: 'RESIDENT_ERROR',
      timestamp: new Date().toISOString()
    });
  }
});

// @route   GET /api/family/vitals
// @desc    Get resident's vital signs
// @access  Private (Family Member)
router.get('/vitals', authenticateFamily, logAccess('view_vitals'), async (req, res) => {
  try {
    const { days = 7, limit = 50 } = req.query;
    
    // Calculate date range
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    // Get vitals for the resident
    const vitals = await Vitals.find({
      residentId: req.resident._id,
      timestamp: { $gte: startDate }
    })
    .populate('caregiverId', 'name')
    .sort({ timestamp: -1 })
    .limit(parseInt(limit));

    // Get latest vitals
    const latestVitals = vitals[0] || null;

    // Get vitals trends
    const trends = await Vitals.getTrends(req.resident._id, parseInt(days));

    // Format vitals data for family view (remove sensitive caregiver info)
    const formattedVitals = vitals.map(vital => ({
      id: vital._id,
      systolicBP: vital.systolicBP,
      diastolicBP: vital.diastolicBP,
      heartRate: vital.heartRate,
      temperature: vital.temperature,
      oxygenSaturation: vital.oxygenSaturation,
      timestamp: vital.timestamp,
      notes: vital.notes,
      alerts: vital.alerts,
      isNormal: vital.isNormal(),
      recordedBy: vital.caregiverId ? vital.caregiverId.name : 'Staff Member'
    }));

    res.json({
      success: true,
      data: {
        vitals: formattedVitals,
        latest: latestVitals ? {
          id: latestVitals._id,
          systolicBP: latestVitals.systolicBP,
          diastolicBP: latestVitals.diastolicBP,
          heartRate: latestVitals.heartRate,
          temperature: latestVitals.temperature,
          oxygenSaturation: latestVitals.oxygenSaturation,
          timestamp: latestVitals.timestamp,
          alerts: latestVitals.alerts,
          isNormal: latestVitals.isNormal()
        } : null,
        trends: {
          trend: trends.trend,
          changes: trends.changes
        },
        summary: {
          totalRecords: formattedVitals.length,
          dateRange: {
            from: startDate,
            to: new Date()
          },
          hasAlerts: formattedVitals.some(v => v.alerts && v.alerts.length > 0)
        }
      }
    });

  } catch (error) {
    console.error('Get vitals error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get vitals information',
      code: 'VITALS_ERROR',
      timestamp: new Date().toISOString()
    });
  }
});

// @route   GET /api/family/incidents
// @desc    Get resident's incident reports
// @access  Private (Family Member)
router.get('/incidents', authenticateFamily, logAccess('view_incidents'), async (req, res) => {
  try {
    const { days = 30, limit = 20, status } = req.query;
    
    // Calculate date range
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    // Build query
    const query = {
      residentId: req.resident._id,
      detectionTime: { $gte: startDate }
    };

    if (status && ['active', 'claimed', 'resolved'].includes(status)) {
      query.status = status;
    }

    // Get incidents for the resident
    const incidents = await Incident.find(query)
      .populate('claimedBy', 'name')
      .populate('resolvedBy', 'name')
      .sort({ detectionTime: -1 })
      .limit(parseInt(limit));

    // Format incidents data for family view (remove sensitive internal info)
    const formattedIncidents = incidents.map(incident => ({
      id: incident._id,
      type: incident.type,
      severity: incident.severity,
      description: incident.description,
      detectionTime: incident.detectionTime,
      location: incident.location,
      status: incident.status,
      claimedAt: incident.claimedAt,
      resolvedAt: incident.resolvedAt,
      resolution: incident.resolution,
      resolutionNotes: incident.resolutionNotes,
      emergencyServicesContacted: incident.emergencyServicesContacted,
      familyNotified: incident.familyNotified,
      familyNotificationTime: incident.familyNotificationTime,
      responseTime: incident.responseTime,
      timeElapsed: incident.timeElapsed,
      handledBy: incident.claimedBy ? incident.claimedBy.name : 
                 incident.resolvedBy ? incident.resolvedBy.name : 'Staff Member'
    }));

    // Get summary statistics
    const activeIncidents = formattedIncidents.filter(i => i.status === 'active').length;
    const resolvedIncidents = formattedIncidents.filter(i => i.status === 'resolved').length;
    const emergencyIncidents = formattedIncidents.filter(i => i.emergencyServicesContacted).length;

    res.json({
      success: true,
      data: {
        incidents: formattedIncidents,
        summary: {
          total: formattedIncidents.length,
          active: activeIncidents,
          resolved: resolvedIncidents,
          emergencies: emergencyIncidents,
          dateRange: {
            from: startDate,
            to: new Date()
          }
        }
      }
    });

  } catch (error) {
    console.error('Get incidents error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get incident information',
      code: 'INCIDENTS_ERROR',
      timestamp: new Date().toISOString()
    });
  }
});

// @route   GET /api/family/profile
// @desc    Get family member profile and resident summary
// @access  Private (Family Member)
router.get('/profile', authenticateFamily, logAccess('view_profile'), async (req, res) => {
  try {
    // Get recent access logs for this family member
    const AccessLog = require('../models/AccessLog');
    const recentAccess = await AccessLog.find({
      familyMemberId: req.familyMember._id
    })
    .sort({ createdAt: -1 })
    .limit(10)
    .select('action timestamp success');

    const profile = {
      familyMember: {
        id: req.familyMember._id,
        name: req.familyMember.name,
        email: req.familyMember.email,
        profilePicture: req.familyMember.profilePicture,
        relationship: req.familyMember.relationship,
        lastAccess: req.familyMember.lastAccess,
        memberSince: req.familyMember.createdAt
      },
      resident: {
        id: req.resident._id,
        name: req.resident.name,
        room: req.resident.room,
        age: req.resident.age
      },
      recentActivity: recentAccess.map(log => ({
        action: log.action,
        timestamp: log.timestamp,
        success: log.success
      }))
    };

    res.json({
      success: true,
      data: profile
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get profile information',
      code: 'PROFILE_ERROR',
      timestamp: new Date().toISOString()
    });
  }
});

// @route   GET /api/family/dashboard
// @desc    Get dashboard summary data
// @access  Private (Family Member)
router.get('/dashboard', authenticateFamily, logAccess('view_dashboard'), async (req, res) => {
  try {
    // Get resident basic info
    const resident = await Resident.findById(req.resident._id)
      .select('name room age profileImage')
      .populate('assignedCaregiver', 'name');

    // Get latest vitals
    const latestVitals = await Vitals.findOne({ residentId: req.resident._id })
      .sort({ timestamp: -1 })
      .select('systolicBP diastolicBP heartRate temperature timestamp alerts');

    // Get recent incidents (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentIncidents = await Incident.find({
      residentId: req.resident._id,
      detectionTime: { $gte: sevenDaysAgo }
    })
    .sort({ detectionTime: -1 })
    .limit(5)
    .select('type severity status detectionTime resolution');

    // Get health summary
    const healthSummary = await resident.getHealthSummary();
    const vitalsStatus = await resident.getVitalsStatus();

    const dashboardData = {
      resident: {
        name: resident.name,
        room: resident.room,
        age: resident.age,
        profileImage: resident.profileImage,
        assignedCaregiver: resident.assignedCaregiver?.name || 'Not assigned'
      },
      vitals: {
        latest: latestVitals ? {
          systolicBP: latestVitals.systolicBP,
          diastolicBP: latestVitals.diastolicBP,
          heartRate: latestVitals.heartRate,
          temperature: latestVitals.temperature,
          timestamp: latestVitals.timestamp,
          hasAlerts: latestVitals.alerts && latestVitals.alerts.length > 0
        } : null,
        status: vitalsStatus,
        healthSummary
      },
      incidents: {
        recent: recentIncidents.map(incident => ({
          type: incident.type,
          severity: incident.severity,
          status: incident.status,
          detectionTime: incident.detectionTime,
          resolution: incident.resolution
        })),
        activeCount: recentIncidents.filter(i => i.status === 'active').length
      },
      lastUpdated: new Date()
    };

    res.json({
      success: true,
      data: dashboardData
    });

  } catch (error) {
    console.error('Get dashboard error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get dashboard information',
      code: 'DASHBOARD_ERROR',
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;