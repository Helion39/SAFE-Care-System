const User = require('../models/User');
const logger = require('../utils/logger');
const bcrypt = require('bcryptjs');

// @desc    Create new caregiver account (Admin only)
// @route   POST /api/users/create-caregiver
// @access  Private/Admin
const createCaregiver = async (req, res, next) => {
  try {
    const { name, email, password, temporaryPassword } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'User already exists with this email'
      });
    }

    // Create caregiver account
    const user = await User.create({
      name,
      email,
      password: password || temporaryPassword || 'TempPass123!', // Default temp password
      role: 'caregiver',
      isActive: true
    });

    logger.info(`New caregiver account created by admin: ${email}`);

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          isActive: user.isActive,
          createdAt: user.createdAt
        }
      },
      message: 'Caregiver account created successfully'
    });
  } catch (error) {
    logger.error('Create caregiver error:', error);
    next(error);
  }
};

// @desc    Create multiple caregiver accounts (Bulk creation)
// @route   POST /api/users/bulk-create-caregivers
// @access  Private/Admin
const bulkCreateCaregivers = async (req, res, next) => {
  try {
    const { caregivers } = req.body; // Array of caregiver objects

    if (!Array.isArray(caregivers) || caregivers.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Please provide an array of caregivers'
      });
    }

    const results = {
      created: [],
      failed: []
    };

    for (const caregiverData of caregivers) {
      try {
        const { name, email, password } = caregiverData;

        // Check if user exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
          results.failed.push({
            email,
            error: 'User already exists with this email'
          });
          continue;
        }

        // Create caregiver account
        const user = await User.create({
          name,
          email,
          password: password || 'TempPass123!',
          role: 'caregiver',
          isActive: true
        });

        results.created.push({
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role
        });

        logger.info(`Bulk caregiver account created: ${email}`);
      } catch (error) {
        results.failed.push({
          email: caregiverData.email,
          error: error.message
        });
      }
    }

    res.status(201).json({
      success: true,
      data: results,
      message: `Created ${results.created.length} caregivers, ${results.failed.length} failed`
    });
  } catch (error) {
    logger.error('Bulk create caregivers error:', error);
    next(error);
  }
};

// @desc    Reset caregiver password (Admin only)
// @route   PUT /api/users/:id/reset-password
// @access  Private/Admin
const resetCaregiverPassword = async (req, res, next) => {
  try {
    const { newPassword } = req.body;
    const userId = req.params.id;

    if (!newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Please provide a new password'
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    if (user.role !== 'caregiver') {
      return res.status(400).json({
        success: false,
        error: 'Can only reset passwords for caregivers'
      });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    logger.info(`Password reset for caregiver: ${user.email} by admin: ${req.user.email}`);

    res.status(200).json({
      success: true,
      message: 'Password reset successfully'
    });
  } catch (error) {
    logger.error('Reset password error:', error);
    next(error);
  }
};

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
const getUsers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;

    // Build query
    let query = {};
    
    // Filter by role if specified
    if (req.query.role) {
      query.role = req.query.role;
    }

    // Filter by active status
    if (req.query.isActive !== undefined) {
      query.isActive = req.query.isActive === 'true';
    }

    // Search by name or email
    if (req.query.search) {
      query.$or = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { email: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    const total = await User.countDocuments(query);
    const users = await User.find(query)
      .select('-refreshToken')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(startIndex);

    // Pagination result
    const pagination = {};

    if (startIndex + limit < total) {
      pagination.next = {
        page: page + 1,
        limit
      };
    }

    if (startIndex > 0) {
      pagination.prev = {
        page: page - 1,
        limit
      };
    }

    res.status(200).json({
      success: true,
      count: users.length,
      total,
      pagination,
      data: users
    });
  } catch (error) {
    logger.error('Get users error:', error);
    next(error);
  }
};

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Private/Admin
const getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-refreshToken');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    logger.error('Get user error:', error);
    next(error);
  }
};

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private/Admin
const updateUser = async (req, res, next) => {
  try {
    const { name, email, role, isActive } = req.body;

    const fieldsToUpdate = {};
    if (name) fieldsToUpdate.name = name;
    if (email) fieldsToUpdate.email = email;
    if (role) fieldsToUpdate.role = role;
    if (isActive !== undefined) fieldsToUpdate.isActive = isActive;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      fieldsToUpdate,
      {
        new: true,
        runValidators: true
      }
    ).select('-refreshToken');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    logger.info(`User updated by admin: ${user.email}`);

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    logger.error('Update user error:', error);
    next(error);
  }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Don't allow deletion of the last admin
    if (user.role === 'admin') {
      const adminCount = await User.countDocuments({ role: 'admin', isActive: true });
      if (adminCount <= 1) {
        return res.status(400).json({
          success: false,
          error: 'Cannot delete the last admin user'
        });
      }
    }

    await user.deleteOne();

    logger.info(`User deleted by admin: ${user.email}`);

    res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    logger.error('Delete user error:', error);
    next(error);
  }
};

// @desc    Get caregivers
// @route   GET /api/users/caregivers
// @access  Private
const getCaregivers = async (req, res, next) => {
  try {
    const caregivers = await User.find({ 
      role: 'caregiver', 
      isActive: true 
    }).select('name email createdAt');

    res.status(200).json({
      success: true,
      count: caregivers.length,
      data: caregivers
    });
  } catch (error) {
    logger.error('Get caregivers error:', error);
    next(error);
  }
};

// @desc    Get user statistics
// @route   GET /api/users/stats
// @access  Private/Admin
const getUserStats = async (req, res, next) => {
  try {
    const stats = await User.aggregate([
      {
        $group: {
          _id: null,
          totalUsers: { $sum: 1 },
          activeUsers: {
            $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] }
          },
          adminCount: {
            $sum: { $cond: [{ $eq: ['$role', 'admin'] }, 1, 0] }
          },
          caregiverCount: {
            $sum: { $cond: [{ $eq: ['$role', 'caregiver'] }, 1, 0] }
          }
        }
      }
    ]);

    const result = stats[0] || {
      totalUsers: 0,
      activeUsers: 0,
      adminCount: 0,
      caregiverCount: 0
    };

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Get user stats error:', error);
    next(error);
  }
};

module.exports = {
  createCaregiver,
  bulkCreateCaregivers,
  resetCaregiverPassword,
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  getCaregivers,
  getUserStats
};