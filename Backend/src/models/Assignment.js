const mongoose = require('mongoose');

const AssignmentSchema = new mongoose.Schema({
  caregiverId: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'Assignment must have a caregiver']
  },
  residentId: {
    type: mongoose.Schema.ObjectId,
    ref: 'Resident',
    required: [true, 'Assignment must have a resident']
  },
  startDate: {
    type: Date,
    default: Date.now,
    required: true
  },
  endDate: {
    type: Date,
    validate: {
      validator: function(v) {
        return !v || v > this.startDate;
      },
      message: 'End date must be after start date'
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  assignedBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'Assignment must have an assigner']
  },
  shift: {
    type: String,
    enum: ['morning', 'afternoon', 'evening', 'night', 'full_time'],
    default: 'full_time'
  },
  priority: {
    type: String,
    enum: ['low', 'normal', 'high'],
    default: 'normal'
  },
  specialInstructions: {
    type: String,
    maxlength: [500, 'Special instructions cannot be more than 500 characters']
  },
  notes: {
    type: String,
    maxlength: [1000, 'Notes cannot be more than 1000 characters']
  }
}, {
  timestamps: true
});

// Compound indexes for efficient queries (with explicit names to avoid conflicts)
AssignmentSchema.index(
  { caregiverId: 1, isActive: 1 },
  { name: 'caregiver_active_idx' }
);
AssignmentSchema.index(
  { startDate: -1 },
  { name: 'start_date_idx' }
);

// Ensure only one active assignment per resident (unique partial index)
AssignmentSchema.index(
  { residentId: 1, isActive: 1 },
  { 
    unique: true,
    partialFilterExpression: { isActive: true },
    name: 'resident_active_unique_idx'
  }
);

// Simplified pre-save middleware
AssignmentSchema.pre('save', async function(next) {
  // Only set end date when deactivating
  if (this.isModified('isActive') && !this.isActive && !this.endDate) {
    this.endDate = new Date();
  }
  
  next();
});

// Virtual for assignment duration
AssignmentSchema.virtual('duration').get(function() {
  const end = this.endDate || new Date();
  const start = this.startDate;
  const diffTime = Math.abs(end - start);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

// Static method to get active assignments for a caregiver
AssignmentSchema.statics.getActiveForCaregiver = function(caregiverId) {
  return this.find({ caregiverId, isActive: true })
    .populate('residentId', 'name room age medicalConditions')
    .populate('assignedBy', 'name')
    .sort({ startDate: -1 });
};

// Static method to get assignment history for a resident
AssignmentSchema.statics.getHistoryForResident = function(residentId, limit = 10) {
  return this.find({ residentId })
    .populate('caregiverId', 'name email')
    .populate('assignedBy', 'name')
    .sort({ startDate: -1 })
    .limit(limit);
};

// Static method to get current assignment for a resident
AssignmentSchema.statics.getCurrentForResident = function(residentId) {
  return this.findOne({ residentId, isActive: true })
    .populate('caregiverId', 'name email role')
    .populate('assignedBy', 'name');
};

// Static method to get caregiver workload
AssignmentSchema.statics.getCaregiverWorkload = async function() {
  const workload = await this.aggregate([
    { $match: { isActive: true } },
    {
      $group: {
        _id: '$caregiverId',
        residentCount: { $sum: 1 },
        residents: { $push: '$residentId' }
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'caregiver'
      }
    },
    {
      $unwind: '$caregiver'
    },
    {
      $project: {
        caregiverName: '$caregiver.name',
        caregiverEmail: '$caregiver.email',
        residentCount: 1,
        residents: 1
      }
    },
    { $sort: { residentCount: -1 } }
  ]);
  
  return workload;
};

// Instance method to transfer assignment
AssignmentSchema.methods.transferTo = async function(newCaregiverId, transferredBy, notes) {
  // End current assignment
  this.isActive = false;
  this.endDate = new Date();
  this.notes = (this.notes || '') + `\nTransferred on ${new Date().toISOString()}: ${notes || 'No notes provided'}`;
  
  await this.save();
  
  // Create new assignment
  const newAssignment = new this.constructor({
    caregiverId: newCaregiverId,
    residentId: this.residentId,
    assignedBy: transferredBy,
    startDate: new Date(),
    shift: this.shift,
    priority: this.priority,
    notes: `Transferred from previous caregiver. ${notes || ''}`
  });
  
  return await newAssignment.save();
};

// Instance method to extend assignment
AssignmentSchema.methods.extend = function(newEndDate, notes) {
  this.endDate = newEndDate;
  if (notes) {
    this.notes = (this.notes || '') + `\nExtended on ${new Date().toISOString()}: ${notes}`;
  }
  return this.save();
};

// Static method to get assignment statistics
AssignmentSchema.statics.getStatistics = async function() {
  const stats = await this.aggregate([
    {
      $facet: {
        active: [
          { $match: { isActive: true } },
          { $count: 'count' }
        ],
        total: [
          { $count: 'count' }
        ],
        byShift: [
          { $match: { isActive: true } },
          {
            $group: {
              _id: '$shift',
              count: { $sum: 1 }
            }
          }
        ],
        avgDuration: [
          { $match: { isActive: false, endDate: { $exists: true } } },
          {
            $group: {
              _id: null,
              avgDuration: {
                $avg: {
                  $divide: [
                    { $subtract: ['$endDate', '$startDate'] },
                    1000 * 60 * 60 * 24 // Convert to days
                  ]
                }
              }
            }
          }
        ]
      }
    }
  ]);
  
  return {
    activeAssignments: stats[0].active[0]?.count || 0,
    totalAssignments: stats[0].total[0]?.count || 0,
    byShift: stats[0].byShift,
    avgDurationDays: Math.round(stats[0].avgDuration[0]?.avgDuration || 0)
  };
};

module.exports = mongoose.model('Assignment', AssignmentSchema);