const mongoose = require('mongoose');

const AccessLogSchema = new mongoose.Schema({
  familyMemberId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FamilyMember',
    required: true
  },
  residentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Resident',
    required: true
  },
  action: {
    type: String,
    enum: [
      'login', 
      'logout', 
      'view_dashboard', 
      'view_vitals', 
      'view_incidents',
      'view_profile',
      'auth_attempt',
      'token_refresh'
    ],
    required: true
  },
  ipAddress: {
    type: String,
    required: true
  },
  userAgent: {
    type: String,
    default: null
  },
  success: {
    type: Boolean,
    default: true
  },
  errorMessage: {
    type: String,
    default: null
  },
  sessionId: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
AccessLogSchema.index({ familyMemberId: 1, createdAt: -1 });
AccessLogSchema.index({ residentId: 1, createdAt: -1 });
AccessLogSchema.index({ action: 1, createdAt: -1 });
AccessLogSchema.index({ createdAt: -1 });

// Static method to log access
AccessLogSchema.statics.logAccess = async function(data) {
  try {
    const log = new this(data);
    await log.save();
    return log;
  } catch (error) {
    console.error('Error logging access:', error);
    return null;
  }
};

module.exports = mongoose.model('AccessLog', AccessLogSchema);