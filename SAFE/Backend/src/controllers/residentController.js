const Resident = require('../models/Resident');
const User = require('../models/User');
const Assignment = require('../models/Assignment');
const logger = require('../utils/logger');

// @desc    Create new resident
// @route   POST /api/residents
// @access  Private/Admin
const createResident = async (req, res, next) => {
  try {
    const { residentId, name, room, age, medicalConditions, emergencyContact, familyEmails, notes } = req.body;

    // Check if room number already exists
    const existingResident = await Resident.findOne({ room });
    if (existingResident) {
      return res.status(400).json({
        success: false,
        error: 'Room number already assigned to another resident'
      });
    }

    const resident = await Resident.create({
      residentId,
      name,
      room,
      age,
      medicalConditions: medicalConditions || [],
      emergencyContact,
      familyEmails: familyEmails || [],
      notes
    });

    logger.info(`New resident created: ${resident.name} in room ${resident.room}`);

    res.status(201).json({
      success: true,
      data: resident,
      message: 'Resident created successfully'
    });
  } catch (error) {
    logger.error('Create resident error:', error);
    next(error);
  }
};

// @desc    Get all residents
// @route   GET /api/residents
// @access  Private
const getResidents = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;

    // Build query
    let query = { isActive: true };

    // Search functionality
    if (req.query.search) {
      query.$or = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { room: { $regex: req.query.search, $options: 'i' } },
        { medicalConditions: { $in: [new RegExp(req.query.search, 'i')] } }
      ];
    }

    // Filter by room
    if (req.query.room) {
      query.room = req.query.room;
    }

    // Filter by assigned caregiver
    if (req.query.caregiverId) {
      query.assignedCaregiver = req.query.caregiverId;
    }

    // Filter by age range
    if (req.query.minAge || req.query.maxAge) {
      query.age = {};
      if (req.query.minAge) query.age.$gte = parseInt(req.query.minAge);
      if (req.query.maxAge) query.age.$lte = parseInt(req.query.maxAge);
    }

    const total = await Resident.countDocuments(query);
    const residents = await Resident.find(query)
      .populate('assignedCaregiver', 'name email username role isActive')
      .populate('latestVitals')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(startIndex);

    // Add vitals status for each resident
    const residentsWithStatus = await Promise.all(
      residents.map(async (resident) => {
        const vitalsStatus = await resident.getVitalsStatus();
        return {
          ...resident.toObject(),
          vitalsStatus
        };
      })
    );

    // Pagination result
    const pagination = {};
    if (startIndex + limit < total) {
      pagination.next = { page: page + 1, limit };
    }
    if (startIndex > 0) {
      pagination.prev = { page: page - 1, limit };
    }

    res.status(200).json({
      success: true,
      count: residents.length,
      total,
      pagination,
      data: residentsWithStatus
    });
  } catch (error) {
    logger.error('Get residents error:', error);
    next(error);
  }
};

// @desc    Get single resident
// @route   GET /api/residents/:id
// @access  Private
const getResident = async (req, res, next) => {
  try {
    const resident = await Resident.findById(req.params.id)
      .populate('assignedCaregiver', 'name email role')
      .populate('latestVitals')
      .populate('vitalsHistory', null, null, { limit: 20, sort: { timestamp: -1 } })
      .populate('activeIncidents');

    if (!resident) {
      return res.status(404).json({
        success: false,
        error: 'Resident not found'
      });
    }

    // Get vitals status and health summary
    const vitalsStatus = await resident.getVitalsStatus();
    const healthSummary = await resident.getHealthSummary();

    // Get assignment history
    const assignmentHistory = await Assignment.getHistoryForResident(resident._id, 5);

    res.status(200).json({
      success: true,
      data: {
        ...resident.toObject(),
        vitalsStatus,
        healthSummary,
        assignmentHistory
      }
    });
  } catch (error) {
    logger.error('Get resident error:', error);
    next(error);
  }
};

// @desc    Update resident
// @route   PUT /api/residents/:id
// @access  Private/Admin
const updateResident = async (req, res, next) => {
  try {
    console.log('🔍 Update resident request:', {
      id: req.params.id,
      body: JSON.stringify(req.body, null, 2),
      user: req.user?.role
    });

    const { name, room, age, medicalConditions, emergencyContact, familyEmails, notes } = req.body;

    const resident = await Resident.findById(req.params.id);

    if (!resident) {
      return res.status(404).json({
        success: false,
        error: 'Resident not found'
      });
    }

    // Check if room number is being changed and if it's already taken
    if (room && room !== resident.room) {
      const existingResident = await Resident.findOne({ room, _id: { $ne: req.params.id } });
      if (existingResident) {
        return res.status(400).json({
          success: false,
          error: 'Room number already assigned to another resident'
        });
      }
    }

    const fieldsToUpdate = {};
    if (name !== undefined) fieldsToUpdate.name = name;
    if (room !== undefined) fieldsToUpdate.room = room;
    if (age !== undefined) fieldsToUpdate.age = age;
    if (medicalConditions !== undefined) fieldsToUpdate.medicalConditions = medicalConditions;
    if (emergencyContact !== undefined) fieldsToUpdate.emergencyContact = emergencyContact;
    if (familyEmails !== undefined) fieldsToUpdate.familyEmails = familyEmails;
    if (notes !== undefined) fieldsToUpdate.notes = notes;

    console.log('🔧 Fields to update:', JSON.stringify(fieldsToUpdate, null, 2));

    const updatedResident = await Resident.findByIdAndUpdate(
      req.params.id,
      fieldsToUpdate,
      {
        new: true,
        runValidators: true
      }
    ).populate('assignedCaregiver', 'name email');

    logger.info(`Resident updated: ${updatedResident.name} in room ${updatedResident.room}`);

    res.status(200).json({
      success: true,
      data: updatedResident,
      message: 'Resident updated successfully'
    });
  } catch (error) {
    console.error('❌ Update resident error:', error);
    logger.error('Update resident error:', error);
    
    // Send detailed error for debugging
    res.status(400).json({
      success: false,
      error: error.message || 'Update failed',
      details: error.errors ? Object.values(error.errors).map(e => e.message) : undefined
    });
  }
};

// @desc    Delete resident
// @route   DELETE /api/residents/:id
// @access  Private/Admin
const deleteResident = async (req, res, next) => {
  try {
    const resident = await Resident.findById(req.params.id);

    if (!resident) {
      return res.status(404).json({
        success: false,
        error: 'Resident not found'
      });
    }

    // Soft delete - mark as inactive
    resident.isActive = false;
    await resident.save();

    // Deactivate any active assignments
    await Assignment.updateMany(
      { residentId: req.params.id, isActive: true },
      { isActive: false, endDate: new Date() }
    );

    logger.info(`Resident deleted: ${resident.name} in room ${resident.room}`);

    res.status(200).json({
      success: true,
      message: 'Resident deleted successfully'
    });
  } catch (error) {
    logger.error('Delete resident error:', error);
    next(error);
  }
};

// @desc    Search residents
// @route   GET /api/residents/search
// @access  Private
const searchResidents = async (req, res, next) => {
  try {
    const { q, room, medicalCondition, caregiverId } = req.query;

    let query = { isActive: true };

    if (q) {
      query.$or = [
        { name: { $regex: q, $options: 'i' } },
        { room: { $regex: q, $options: 'i' } }
      ];
    }

    if (room) {
      query.room = { $regex: room, $options: 'i' };
    }

    if (medicalCondition) {
      query.medicalConditions = { $in: [new RegExp(medicalCondition, 'i')] };
    }

    if (caregiverId) {
      query.assignedCaregiver = caregiverId;
    }

    const residents = await Resident.find(query)
      .populate('assignedCaregiver', 'name email')
      .limit(20)
      .sort({ name: 1 });

    res.status(200).json({
      success: true,
      count: residents.length,
      data: residents
    });
  } catch (error) {
    logger.error('Search residents error:', error);
    next(error);
  }
};

// @desc    Get unassigned residents
// @route   GET /api/residents/unassigned
// @access  Private/Admin
const getUnassignedResidents = async (req, res, next) => {
  try {
    const residents = await Resident.find({
      isActive: true,
      assignedCaregiver: null
    }).sort({ name: 1 });

    res.status(200).json({
      success: true,
      count: residents.length,
      data: residents
    });
  } catch (error) {
    logger.error('Get unassigned residents error:', error);
    next(error);
  }
};

// @desc    Get resident statistics
// @route   GET /api/residents/stats
// @access  Private/Admin
const getResidentStats = async (req, res, next) => {
  try {
    const stats = await Resident.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: null,
          totalResidents: { $sum: 1 },
          assignedResidents: {
            $sum: { $cond: [{ $ne: ['$assignedCaregiver', null] }, 1, 0] }
          },
          avgAge: { $avg: '$age' },
          ageGroups: {
            $push: {
              $switch: {
                branches: [
                  { case: { $lt: ['$age', 65] }, then: 'under_65' },
                  { case: { $lt: ['$age', 75] }, then: '65_74' },
                  { case: { $lt: ['$age', 85] }, then: '75_84' },
                  { case: { $gte: ['$age', 85] }, then: '85_plus' }
                ]
              }
            }
          }
        }
      }
    ]);

    const result = stats[0] || {
      totalResidents: 0,
      assignedResidents: 0,
      avgAge: 0,
      ageGroups: []
    };

    // Count age groups
    const ageGroupCounts = result.ageGroups.reduce((acc, group) => {
      acc[group] = (acc[group] || 0) + 1;
      return acc;
    }, {});

    res.status(200).json({
      success: true,
      data: {
        ...result,
        unassignedResidents: result.totalResidents - result.assignedResidents,
        avgAge: Math.round(result.avgAge || 0),
        ageGroupCounts
      }
    });
  } catch (error) {
    logger.error('Get resident stats error:', error);
    next(error);
  }
};

// @desc    Check room availability
// @route   GET /api/residents/check-room/:roomNumber
// @access  Private/Admin
const checkRoomAvailability = async (req, res, next) => {
  try {
    const { roomNumber } = req.params;
    const { excludeId } = req.query; // For editing existing resident
    
    let query = { room: roomNumber, isActive: true };
    if (excludeId) {
      query._id = { $ne: excludeId };
    }
    
    const existingResident = await Resident.findOne(query);
    
    res.status(200).json({
      success: true,
      available: !existingResident,
      occupiedBy: existingResident ? {
        id: existingResident._id,
        name: existingResident.name,
        residentId: existingResident.residentId
      } : null
    });
  } catch (error) {
    logger.error('Check room availability error:', error);
    next(error);
  }
};

module.exports = {
  createResident,
  getResidents,
  getResident,
  updateResident,
  deleteResident,
  searchResidents,
  getUnassignedResidents,
  getResidentStats,
  checkRoomAvailability
};