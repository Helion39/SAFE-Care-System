const jwt = require('jsonwebtoken');
const FamilyMember = require('../models/FamilyMember');
const AccessLog = require('../models/AccessLog');

// Middleware to authenticate family members
const authenticateFamily = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Access denied. No token provided.',
        code: 'NO_TOKEN',
        timestamp: new Date().toISOString()
      });
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get family member from database
    const familyMember = await FamilyMember.findById(decoded.id)
      .populate('residentId')
      .populate('addedBy', 'name email');

    if (!familyMember) {
      return res.status(401).json({
        success: false,
        error: 'Invalid token. Family member not found.',
        code: 'INVALID_TOKEN',
        timestamp: new Date().toISOString()
      });
    }

    // Check if family member is active
    if (!familyMember.isActive) {
      // Log access attempt
      await AccessLog.logAccess({
        familyMemberId: familyMember._id,
        residentId: familyMember.residentId._id,
        action: 'auth_attempt',
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent'),
        success: false,
        errorMessage: 'Inactive family member attempted access'
      });

      return res.status(403).json({
        success: false,
        error: 'Your access has been revoked. Please contact the care facility.',
        code: 'ACCESS_REVOKED',
        timestamp: new Date().toISOString()
      });
    }

    // Update last access time
    familyMember.lastAccess = new Date();
    await familyMember.save();

    // Attach family member and resident info to request
    req.familyMember = familyMember;
    req.resident = familyMember.residentId;
    
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: 'Invalid token.',
        code: 'INVALID_TOKEN',
        timestamp: new Date().toISOString()
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Token expired. Please sign in again.',
        code: 'TOKEN_EXPIRED',
        timestamp: new Date().toISOString()
      });
    }

    return res.status(500).json({
      success: false,
      error: 'Authentication failed.',
      code: 'AUTH_ERROR',
      timestamp: new Date().toISOString()
    });
  }
};

// Middleware to log access attempts
const logAccess = (action) => {
  return async (req, res, next) => {
    try {
      if (req.familyMember && req.resident) {
        await AccessLog.logAccess({
          familyMemberId: req.familyMember._id,
          residentId: req.resident._id,
          action: action,
          ipAddress: req.ip || req.connection.remoteAddress,
          userAgent: req.get('User-Agent'),
          success: true
        });
      }
      next();
    } catch (error) {
      console.error('Error logging access:', error);
      next(); // Continue even if logging fails
    }
  };
};

module.exports = {
  authenticateFamily,
  logAccess
};