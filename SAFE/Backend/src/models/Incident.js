const mongoose = require('mongoose');

const IncidentSchema = new mongoose.Schema({
  residentId: {
    type: mongoose.Schema.ObjectId,
    ref: 'Resident',
    required: [true, 'Incident must be associated with a resident']
  },
  type: {
    type: String,
    enum: ['fall', 'medical', 'emergency', 'behavioral', 'other'],
    required: [true, 'Please specify incident type'],
    default: 'other'
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    required: [true, 'Please specify incident severity'],
    default: 'medium'
  },
  description: {
    type: String,
    required: [true, 'Please add incident description'],
    maxlength: [1000, 'Description cannot be more than 1000 characters']
  },
  detectionTime: {
    type: Date,
    default: Date.now,
    required: true
  },
  detectionMethod: {
    type: String,
    enum: ['ai_camera', 'manual_report', 'sensor', 'caregiver_observation'],
    default: 'manual_report'
  },
  location: {
    type: String,
    maxlength: [100, 'Location cannot be more than 100 characters']
  },
  status: {
    type: String,
    enum: ['active', 'claimed', 'resolved'],
    default: 'active'
  },
  claimedBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  },
  claimedAt: Date,
  resolvedBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  },
  resolvedAt: Date,
  resolution: {
    type: String,
    enum: ['true_emergency', 'false_alarm', 'resolved_internally'],
    validate: {
      validator: function(v) {
        return this.status === 'resolved' ? v != null : true;
      },
      message: 'Resolution is required when incident is resolved'
    }
  },
  resolutionNotes: {
    type: String,
    maxlength: [1000, 'Resolution notes cannot be more than 1000 characters']
  },
  adminAction: {
    type: String,
    maxlength: [500, 'Admin action cannot be more than 500 characters']
  },
  emergencyServicesContacted: {
    type: Boolean,
    default: false
  },
  emergencyServiceDetails: {
    service: {
      type: String,
      enum: ['ambulance', 'fire', 'police', 'hospital']
    },
    contactTime: Date,
    responseTime: Date,
    notes: String
  },
  familyNotified: {
    type: Boolean,
    default: false
  },
  familyNotificationTime: Date,
  responseTime: {
    type: Number, // in seconds
    validate: {
      validator: function(v) {
        return v >= 0;
      },
      message: 'Response time cannot be negative'
    }
  },
  priority: {
    type: Number,
    min: 1,
    max: 5,
    default: 3
  },
  attachments: [{
    filename: String,
    originalName: String,
    mimetype: String,
    size: Number,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Indexes for efficient queries
IncidentSchema.index({ residentId: 1, detectionTime: -1 });
IncidentSchema.index({ status: 1, detectionTime: -1 });
IncidentSchema.index({ claimedBy: 1, status: 1 });
IncidentSchema.index({ detectionTime: -1 });

// Pre-save middleware to calculate response time
IncidentSchema.pre('save', function(next) {
  if (this.isModified('claimedAt') && this.claimedAt && this.detectionTime) {
    this.responseTime = Math.floor((this.claimedAt - this.detectionTime) / 1000);
  }
  next();
});

// Virtual for time elapsed since detection
IncidentSchema.virtual('timeElapsed').get(function() {
  const now = new Date();
  const elapsed = now - this.detectionTime;
  const minutes = Math.floor(elapsed / (1000 * 60));
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  }
  return `${minutes}m`;
});

// Static method to get active incidents count
IncidentSchema.statics.getActiveCount = function() {
  return this.countDocuments({ status: { $in: ['active', 'claimed'] } });
};

// Static method to get incidents by status
IncidentSchema.statics.getByStatus = function(status, limit = 10) {
  return this.find({ status })
    .populate('residentId', 'name room')
    .populate('claimedBy', 'name')
    .populate('resolvedBy', 'name')
    .sort({ detectionTime: -1 })
    .limit(limit);
};

// Instance method to claim incident
IncidentSchema.methods.claimIncident = function(caregiverId) {
  if (this.status !== 'active') {
    throw new Error('Incident is not available for claiming');
  }
  
  this.status = 'claimed';
  this.claimedBy = caregiverId;
  this.claimedAt = new Date();
  
  return this.save();
};

// Instance method to resolve incident
IncidentSchema.methods.resolveIncident = function(resolution, notes, adminAction) {
  if (this.status !== 'claimed') {
    throw new Error('Incident must be claimed before resolving');
  }
  
  this.status = 'resolved';
  this.resolution = resolution;
  this.resolutionNotes = notes;
  this.adminAction = adminAction;
  this.resolvedAt = new Date();
  
  return this.save();
};

// Instance method to check if incident is overdue
IncidentSchema.methods.isOverdue = function(timeoutMinutes = 5) {
  if (this.status !== 'active') return false;
  
  const now = new Date();
  const elapsed = now - this.detectionTime;
  const minutes = elapsed / (1000 * 60);
  
  return minutes > timeoutMinutes;
};

// Static method to get incident statistics
IncidentSchema.statics.getStatistics = async function(days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  const stats = await this.aggregate([
    { $match: { detectionTime: { $gte: startDate } } },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        trueEmergencies: {
          $sum: { $cond: [{ $eq: ['$resolution', 'true_emergency'] }, 1, 0] }
        },
        falseAlarms: {
          $sum: { $cond: [{ $eq: ['$resolution', 'false_alarm'] }, 1, 0] }
        },
        avgResponseTime: { $avg: '$responseTime' },
        byType: {
          $push: {
            type: '$type',
            severity: '$severity'
          }
        }
      }
    }
  ]);
  
  return stats[0] || {
    total: 0,
    trueEmergencies: 0,
    falseAlarms: 0,
    avgResponseTime: 0,
    byType: []
  };
};

module.exports = mongoose.model('Incident', IncidentSchema);