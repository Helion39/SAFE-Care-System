const User = require('../models/User');
const logger = require('../utils/logger');

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public (Admin only in production)
const register = async (req, res, next) => {
  try {
    const { name, email, password, role, username } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'User already exists with this email'
      });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      role,
      username
    });

    // Generate tokens
    const token = user.getSignedJwtToken();
    const refreshToken = user.getRefreshToken();

    // Save refresh token to user
    user.refreshToken = refreshToken;
    await user.save();

    logger.info(`New user registered: ${email} with role: ${role}`);

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          username: user.username,
          role: user.role
        },
        token,
        refreshToken
      }
    });
  } catch (error) {
    logger.error('Registration error:', error);
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res, next) => {
  try {
    const { email, username, password } = req.body;
    
    // Debug logging
    console.log('🔍 Login attempt:', { email, username, password: password ? '***' : 'missing' });

    // Validate credentials
    if ((!email && !username) || !password) {
      console.log('❌ Validation failed: missing credentials');
      return res.status(400).json({
        success: false,
        error: 'Please provide email/username and password'
      });
    }

    // Check for user by email or username
    const query = email ? { email } : { username };
    console.log('🔍 Database query:', JSON.stringify(query));
    
    const user = await User.findOne(query).select('+password');
    console.log('🔍 Query result:');
    console.log('- User found:', !!user);
    if (user) {
      console.log('- Username:', user.username);
      console.log('- Role:', user.role);
      console.log('- Active:', user.isActive);
      console.log('- Password hash exists:', !!user.password);
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'User not found'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        error: 'Account is deactivated'
      });
    }

    // Check if password matches
    console.log('🔍 Attempting password verification...');
    const isMatch = await user.matchPassword(password);
    console.log('🔍 Password match:', isMatch);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Password is incorrect'
      });
    }

    console.log('✅ Password verified successfully');

    // Update last login and set online status
    console.log('📝 Updating user status...');
    await user.updateLastLogin();
    user.isOnline = true;
    
    // Generate tokens
    const token = user.getSignedJwtToken();
    const refreshToken = user.getRefreshToken();

    // Save refresh token to user
    user.refreshToken = refreshToken;
    await user.save();

    logger.info(`User logged in: ${email}`);

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          username: user.username,
          role: user.role,
          lastLogin: user.lastLogin
        },
        token,
        refreshToken
      }
    });
  } catch (error) {
    logger.error('Login error:', error);
    next(error);
  }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
const logout = async (req, res, next) => {
  try {
    // Clear refresh token and set offline status
    await User.findByIdAndUpdate(req.user.id, {
      refreshToken: undefined,
      isOnline: false
    });

    logger.info(`User logged out: ${req.user.email}`);

    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    logger.error('Logout error:', error);
    next(error);
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          username: user.username,
          role: user.role,
          lastLogin: user.lastLogin,
          createdAt: user.createdAt
        }
      }
    });
  } catch (error) {
    logger.error('Get me error:', error);
    next(error);
  }
};

// @desc    Refresh access token
// @route   POST /api/auth/refresh
// @access  Public
const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        error: 'Refresh token is required'
      });
    }

    // Verify refresh token
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    // Get user and check if refresh token matches
    const user = await User.findById(decoded.id).select('+refreshToken');

    if (!user || user.refreshToken !== refreshToken) {
      return res.status(401).json({
        success: false,
        error: 'Invalid refresh token'
      });
    }

    // Generate new tokens
    const newToken = user.getSignedJwtToken();
    const newRefreshToken = user.getRefreshToken();

    // Update refresh token
    user.refreshToken = newRefreshToken;
    await user.save();

    res.status(200).json({
      success: true,
      data: {
        token: newToken,
        refreshToken: newRefreshToken
      }
    });
  } catch (error) {
    logger.error('Refresh token error:', error);
    res.status(401).json({
      success: false,
      error: 'Invalid refresh token'
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = async (req, res, next) => {
  try {
    const { name, email } = req.body;

    const fieldsToUpdate = {};
    if (name) fieldsToUpdate.name = name;
    if (email) fieldsToUpdate.email = email;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      fieldsToUpdate,
      {
        new: true,
        runValidators: true
      }
    );

    logger.info(`User profile updated: ${user.email}`);

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          username: user.username,
          role: user.role
        }
      }
    });
  } catch (error) {
    logger.error('Update profile error:', error);
    next(error);
  }
};

// @desc    Change password
// @route   PUT /api/auth/password
// @access  Private
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Please provide current and new password'
      });
    }

    // Get user with password
    const user = await User.findById(req.user.id).select('+password');

    // Check current password
    const isMatch = await user.matchPassword(currentPassword);

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        error: 'Current password is incorrect'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    logger.info(`Password changed for user: ${user.email}`);

    res.status(200).json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (error) {
    logger.error('Change password error:', error);
    next(error);
  }
};

// @desc    Family login - find resident by email
// @route   POST /api/auth/family-login
// @access  Public
const familyLogin = async (req, res, next) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email address'
      });
    }

    // Find resident by family email
    const Resident = require('../models/Resident');
    const resident = await Resident.findOne({ 
      familyEmails: { $in: [email.toLowerCase()] },
      isActive: true 
    }).populate('assignedCaregiver', 'name');

    if (!resident) {
      return res.status(404).json({
        success: false,
        message: 'No resident found for this email. Please contact the administrator.'
      });
    }

    // Create temporary family user object
    const familyUser = {
      id: `family_${resident._id}`,
      name: `Family of ${resident.name}`,
      email: email,
      role: 'family',
      assignedResidentId: resident._id,
      residentName: resident.name,
      residentRoom: resident.room
    };

    // Generate token for family user
    const jwt = require('jsonwebtoken');
    const token = jwt.sign(
      { id: familyUser.id, email: familyUser.email, role: 'family', residentId: resident._id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE }
    );

    logger.info(`Family member logged in for resident: ${resident.name}`);

    res.status(200).json({
      success: true,
      data: {
        user: familyUser,
        token
      }
    });
  } catch (error) {
    logger.error('Family login error:', error);
    next(error);
  }
};

module.exports = {
  register,
  login,
  logout,
  getMe,
  refreshToken,
  updateProfile,
  changePassword,
  familyLogin
};