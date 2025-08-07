const Assignment = require('../models/Assignment');
const User = require('../models/User');
const Resident = require('../models/Resident');
const logger = require('../utils/logger');

const createAssignment = async (req, res, next) => {
  try {
    const { caregiverId, residentId, shift, priority, specialInstructions, notes } = req.body;

    console.log('🔍 Assignment creation request:');
    console.log('  - caregiverId:', caregiverId, 'type:', typeof caregiverId);
    console.log('  - residentId:', residentId, 'type:', typeof residentId);
    console.log('  - assignedBy (req.user.id):', req.user.id, 'type:', typeof req.user.id);
    console.log('  - shift:', shift);
    console.log('  - priority:', priority);

    // Verify caregiver exists and is active
    const caregiver = await User.findById(caregiverId);
    console.log('🔍 Caregiver found:', caregiver ? caregiver.name : 'NOT FOUND');
    if (!caregiver || caregiver.role !== 'caregiver' || !caregiver.isActive) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or inactive caregiver'
      });
    }

    // Verify resident exists and is active
    const resident = await Resident.findById(residentId);
    console.log('🔍 Resident found:', resident ? resident.name : 'NOT FOUND');
    if (!resident || !resident.isActive) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or inactive resident'
      });
    }

    // Check for existing assignments (1:1 validation)
    const existingResidentAssignment = await Assignment.findOne({
      residentId,
      isActive: true
    });

    const existingCaregiverAssignment = await Assignment.findOne({
      caregiverId,
      isActive: true
    });

    if (existingResidentAssignment) {
      console.log('🔍 Existing resident assignment found, ending it first');
      await Assignment.findByIdAndUpdate(existingResidentAssignment._id, {
        isActive: false,
        endDate: new Date()
      });
      console.log('✅ Previous resident assignment ended');
    }

    if (existingCaregiverAssignment) {
      console.log('🔍 Existing caregiver assignment found, ending it first');
      await Assignment.findByIdAndUpdate(existingCaregiverAssignment._id, {
        isActive: false,
        endDate: new Date()
      });
      // Remove caregiver from previous resident
      await Resident.findByIdAndUpdate(existingCaregiverAssignment.residentId, {
        assignedCaregiver: null
      });
      console.log('✅ Previous caregiver assignment ended');
    }

    // Create assignment
    console.log('🔍 Creating assignment with data:', {
      caregiverId,
      residentId,
      assignedBy: req.user.id,
      shift: shift || 'full_time',
      priority: priority || 'normal'
    });

    const assignment = await Assignment.create({
      caregiverId,
      residentId,
      assignedBy: req.user.id,
      shift: shift || 'full_time',
      priority: priority || 'normal',
      specialInstructions,
      notes
    });

    console.log('✅ Assignment created successfully:', assignment._id);

    // Update resident's assigned caregiver
    await Resident.findByIdAndUpdate(residentId, {
      assignedCaregiver: caregiverId
    });

    // Populate the assignment
    await assignment.populate([
      { path: 'caregiverId', select: 'name email' },
      { path: 'residentId', select: 'name room age' },
      { path: 'assignedBy', select: 'name' }
    ]);

    logger.info(`Assignment created: ${caregiver.name} assigned to ${resident.name} by ${req.user.name}`);

    res.status(201).json({
      success: true,
      data: assignment,
      message: 'Assignment created successfully'
    });
  } catch (error) {
    console.error('❌ Assignment creation failed:', error);
    logger.error('Create assignment error:', error);
    
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        details: validationErrors.join(', ')
      });
    }
    
    if (error.code === 11000) {
      // Check which unique constraint was violated
      if (error.message.includes('resident_active_unique_idx')) {
        return res.status(400).json({
          success: false,
          error: 'This resident already has an active caregiver assignment'
        });
      } else if (error.message.includes('caregiver_active_unique_idx')) {
        return res.status(400).json({
          success: false,
          error: 'This caregiver is already assigned to another resident'
        });
      } else {
        return res.status(400).json({
          success: false,
          error: 'Assignment conflict: 1:1 assignment rule violated'
        });
      }
    }
    
    next(error);
  }
};

const getAssignments = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;

    // Build query
    let query = {};

    // Filter by active status
    if (req.query.isActive !== undefined) {
      query.isActive = req.query.isActive === 'true';
    } else {
      query.isActive = true;
    }

    // Filter by caregiver
    if (req.query.caregiverId) {
      query.caregiverId = req.query.caregiverId;
    }

    // Filter by resident
    if (req.query.residentId) {
      query.residentId = req.query.residentId;
    }

    // Filter by shift
    if (req.query.shift) {
      query.shift = req.query.shift;
    }

    const total = await Assignment.countDocuments(query);
    const assignments = await Assignment.find(query)
      .populate('caregiverId', 'name email')
      .populate('residentId', 'name room age medicalConditions')
      .populate('assignedBy', 'name')
      .sort({ startDate: -1 })
      .limit(limit)
      .skip(startIndex);

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
      count: assignments.length,
      total,
      pagination,
      data: assignments
    });
  } catch (error) {
    logger.error('Get assignments error:', error);
    next(error);
  }
};

const getCaregiverAssignments = async (req, res, next) => {
  try {
    const caregiverId = req.params.id;

    // Verify caregiver exists
    const caregiver = await User.findById(caregiverId);
    if (!caregiver || caregiver.role !== 'caregiver') {
      return res.status(404).json({
        success: false,
        error: 'Caregiver not found'
      });
    }

    // Get active assignments
    const assignments = await Assignment.getActiveForCaregiver(caregiverId);

    // Get assignment history if requested
    let history = [];
    if (req.query.includeHistory === 'true') {
      history = await Assignment.find({
        caregiverId,
        isActive: false
      })
      .populate('residentId', 'name room')
      .populate('assignedBy', 'name')
      .sort({ endDate: -1 })
      .limit(10);
    }

    res.status(200).json({
      success: true,
      data: {
        caregiver: {
          id: caregiver._id,
          name: caregiver.name,
          email: caregiver.email
        },
        activeAssignments: assignments,
        assignmentHistory: history,
        totalActive: assignments.length
      }
    });
  } catch (error) {
    logger.error('Get caregiver assignments error:', error);
    next(error);
  }
};

const updateAssignment = async (req, res, next) => {
  try {
    const { shift, priority, specialInstructions, notes, endDate } = req.body;

    const assignment = await Assignment.findById(req.params.id);

    if (!assignment) {
      return res.status(404).json({
        success: false,
        error: 'Assignment not found'
      });
    }

    // Update fields
    const fieldsToUpdate = {};
    if (shift) fieldsToUpdate.shift = shift;
    if (priority) fieldsToUpdate.priority = priority;
    if (specialInstructions !== undefined) fieldsToUpdate.specialInstructions = specialInstructions;
    if (notes !== undefined) fieldsToUpdate.notes = notes;
    if (endDate) {
      fieldsToUpdate.endDate = endDate;
      fieldsToUpdate.isActive = false;
    }

    const updatedAssignment = await Assignment.findByIdAndUpdate(
      req.params.id,
      fieldsToUpdate,
      {
        new: true,
        runValidators: true
      }
    ).populate([
      { path: 'caregiverId', select: 'name email' },
      { path: 'residentId', select: 'name room' },
      { path: 'assignedBy', select: 'name' }
    ]);

    // If assignment is being ended, remove caregiver from resident
    if (endDate) {
      await Resident.findByIdAndUpdate(assignment.residentId, {
        assignedCaregiver: null
      });
    }

    logger.info(`Assignment updated: ${updatedAssignment.caregiverId.name} - ${updatedAssignment.residentId.name}`);

    res.status(200).json({
      success: true,
      data: updatedAssignment,
      message: 'Assignment updated successfully'
    });
  } catch (error) {
    logger.error('Update assignment error:', error);
    next(error);
  }
};

const deleteAssignment = async (req, res, next) => {
  try {
    const assignment = await Assignment.findById(req.params.id);

    if (!assignment) {
      return res.status(404).json({
        success: false,
        error: 'Assignment not found'
      });
    }

    // End the assignment instead of deleting
    assignment.isActive = false;
    assignment.endDate = new Date();
    await assignment.save();

    // Remove caregiver from resident
    await Resident.findByIdAndUpdate(assignment.residentId, {
      assignedCaregiver: null
    });

    logger.info(`Assignment ended: ${assignment.caregiverId} - ${assignment.residentId}`);

    res.status(200).json({
      success: true,
      message: 'Assignment ended successfully'
    });
  } catch (error) {
    logger.error('Delete assignment error:', error);
    next(error);
  }
};

const transferAssignment = async (req, res, next) => {
  try {
    const { newCaregiverId, notes } = req.body;

    const assignment = await Assignment.findById(req.params.id);

    if (!assignment) {
      return res.status(404).json({
        success: false,
        error: 'Assignment not found'
      });
    }

    // Verify new caregiver exists and is active
    const newCaregiver = await User.findById(newCaregiverId);
    if (!newCaregiver || newCaregiver.role !== 'caregiver' || !newCaregiver.isActive) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or inactive caregiver'
      });
    }

    // Transfer assignment
    const newAssignment = await assignment.transferTo(newCaregiverId, req.user.id, notes);

    // Update resident's assigned caregiver
    await Resident.findByIdAndUpdate(assignment.residentId, {
      assignedCaregiver: newCaregiverId
    });

    await newAssignment.populate([
      { path: 'caregiverId', select: 'name email' },
      { path: 'residentId', select: 'name room' },
      { path: 'assignedBy', select: 'name' }
    ]);

    logger.info(`Assignment transferred from ${assignment.caregiverId} to ${newCaregiverId} by ${req.user.name}`);

    res.status(200).json({
      success: true,
      data: newAssignment,
      message: 'Assignment transferred successfully'
    });
  } catch (error) {
    logger.error('Transfer assignment error:', error);
    next(error);
  }
};

const getCaregiverWorkload = async (req, res, next) => {
  try {
    const workload = await Assignment.getCaregiverWorkload();

    // Get unassigned residents count
    const unassignedCount = await Resident.countDocuments({
      isActive: true,
      $or: [
        { assignedCaregiver: { $exists: false } },
        { assignedCaregiver: null }
      ]
    });

    res.status(200).json({
      success: true,
      data: {
        caregiverWorkload: workload,
        unassignedResidents: unassignedCount,
        totalCaregivers: workload.length
      }
    });
  } catch (error) {
    logger.error('Get caregiver workload error:', error);
    next(error);
  }
};

const getAssignmentStats = async (req, res, next) => {
  try {
    const stats = await Assignment.getStatistics();

    // Get additional metrics
    const totalResidents = await Resident.countDocuments({ isActive: true });
    const totalCaregivers = await User.countDocuments({ role: 'caregiver', isActive: true });

    const result = {
      ...stats,
      totalResidents,
      totalCaregivers,
      assignmentRate: totalResidents > 0 ? (stats.activeAssignments / totalResidents * 100).toFixed(1) : 0
    };

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Get assignment stats error:', error);
    next(error);
  }
};

module.exports = {
  createAssignment,
  getAssignments,
  getCaregiverAssignments,
  updateAssignment,
  deleteAssignment,
  transferAssignment,
  getCaregiverWorkload,
  getAssignmentStats
};