const express = require('express');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const FamilyMember = require('../models/FamilyMember');
const AccessLog = require('../models/AccessLog');
const { authenticateFamily } = require('../middleware/auth');

const router = express.Router();

// Generate JWT tokens
const generateTokens = (familyMember) => {
  const payload = {
    id: familyMember._id,
    email: familyMember.email,
    residentId: familyMember.residentId._id
  };

  const accessToken = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });

  const refreshToken = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN
  });

  return { accessToken, refreshToken };
};

// @route   GET /api/auth/google
// @desc    Start Google OAuth flow
// @access  Public
router.get('/google', passport.authenticate('google', {
  scope: ['profile', 'email']
}));

// @route   GET /api/auth/google/callback
// @desc    Google OAuth callback
// @access  Public
router.get('/google/callback', 
  passport.authenticate('google', { session: false }),
  async (req, res) => {
    try {
      if (!req.user) {
        // Authentication failed - redirect to frontend with error
        return res.redirect(`${process.env.FRONTEND_URL}/auth/error?message=not_authorized`);
      }

      const familyMember = req.user;

      // Check if family member is active
      if (!familyMember.isActive) {
        await AccessLog.logAccess({
          familyMemberId: familyMember._id,
          residentId: familyMember.residentId._id,
          action: 'login',
          ipAddress: req.ip || req.connection.remoteAddress,
          userAgent: req.get('User-Agent'),
          success: false,
          errorMessage: 'Inactive family member login attempt'
        });

        return res.redirect(`${process.env.FRONTEND_URL}/auth/error?message=access_revoked`);
      }

      // Generate JWT tokens
      const { accessToken, refreshToken } = generateTokens(familyMember);

      // Update family member with refresh token
      familyMember.refreshToken = refreshToken;
      familyMember.lastAccess = new Date();
      await familyMember.save();

      // Log successful login
      await AccessLog.logAccess({
        familyMemberId: familyMember._id,
        residentId: familyMember.residentId._id,
        action: 'login',
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent'),
        success: true
      });

      // Redirect to frontend with tokens
      const redirectUrl = `${process.env.FRONTEND_URL}/auth/callback?token=${accessToken}&refresh=${refreshToken}`;
      res.redirect(redirectUrl);

    } catch (error) {
      console.error('OAuth callback error:', error);
      res.redirect(`${process.env.FRONTEND_URL}/auth/error?message=server_error`);
    }
  }
);

// @route   POST /api/auth/refresh
// @desc    Refresh access token
// @access  Private
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        error: 'Refresh token required',
        code: 'NO_REFRESH_TOKEN',
        timestamp: new Date().toISOString()
      });
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
    
    // Find family member
    const familyMember = await FamilyMember.findById(decoded.id)
      .populate('residentId');

    if (!familyMember || familyMember.refreshToken !== refreshToken) {
      return res.status(401).json({
        success: false,
        error: 'Invalid refresh token',
        code: 'INVALID_REFRESH_TOKEN',
        timestamp: new Date().toISOString()
      });
    }

    // Check if family member is still active
    if (!familyMember.isActive) {
      return res.status(403).json({
        success: false,
        error: 'Access has been revoked',
        code: 'ACCESS_REVOKED',
        timestamp: new Date().toISOString()
      });
    }

    // Generate new tokens
    const tokens = generateTokens(familyMember);

    // Update refresh token
    familyMember.refreshToken = tokens.refreshToken;
    familyMember.lastAccess = new Date();
    await familyMember.save();

    // Log token refresh
    await AccessLog.logAccess({
      familyMemberId: familyMember._id,
      residentId: familyMember.residentId._id,
      action: 'token_refresh',
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      success: true
    });

    res.json({
      success: true,
      data: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: process.env.JWT_EXPIRES_IN
      }
    });

  } catch (error) {
    console.error('Token refresh error:', error);
    
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired refresh token',
        code: 'INVALID_REFRESH_TOKEN',
        timestamp: new Date().toISOString()
      });
    }

    res.status(500).json({
      success: false,
      error: 'Token refresh failed',
      code: 'REFRESH_ERROR',
      timestamp: new Date().toISOString()
    });
  }
});

// @route   POST /api/auth/logout
// @desc    Logout family member
// @access  Private
router.post('/logout', authenticateFamily, async (req, res) => {
  try {
    // Clear refresh token
    req.familyMember.refreshToken = null;
    await req.familyMember.save();

    // Log logout
    await AccessLog.logAccess({
      familyMemberId: req.familyMember._id,
      residentId: req.resident._id,
      action: 'logout',
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      success: true
    });

    res.json({
      success: true,
      message: 'Logged out successfully'
    });

  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      error: 'Logout failed',
      code: 'LOGOUT_ERROR',
      timestamp: new Date().toISOString()
    });
  }
});

// @route   GET /api/auth/me
// @desc    Get current family member info
// @access  Private
router.get('/me', authenticateFamily, async (req, res) => {
  try {
    const familyMember = {
      id: req.familyMember._id,
      name: req.familyMember.name,
      email: req.familyMember.email,
      profilePicture: req.familyMember.profilePicture,
      relationship: req.familyMember.relationship,
      lastAccess: req.familyMember.lastAccess,
      resident: {
        id: req.resident._id,
        name: req.resident.name,
        room: req.resident.room
      }
    };

    res.json({
      success: true,
      data: familyMember
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get profile',
      code: 'PROFILE_ERROR',
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;