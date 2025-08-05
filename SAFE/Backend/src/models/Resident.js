const mongoose = require('mongoose');

const ResidentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a resident name'],
    trim: true,
    maxlength: [100, 'Name cannot be more than 100 characters']
  },
  room: {
    type: String,
    required: [true, 'Please add a room number'],
    unique: true,
    trim: true,
    maxlength: [20, 'Room number cannot be more than 20 characters']
  },
  age: {
    type: Number,
    required: [true, 'Please add resident age'],
    min: [1, 'Age must be at least 1'],
    max: [150, 'Age cannot be more than 150']
  },
  medicalConditions: [{
    type: String,
    trim: true,
    maxlength: [100, 'Medical condition cannot be more than 100 characters']
  }],
  emergencyContact: {
    name: {
      type: String,
      trim: true,
      maxlength: [100, 'Contact name cannot be more than 100 characters']
    },
    phone: {
      type: String,
      trim: true,
      maxlength: [20, 'Phone number cannot be more than 20 characters']
    },
    relationship: {
      type: String,
      trim: true,
      maxlength: [50, 'Relationship cannot be more than 50 characters']
    }
  },
  assignedCaregiver: {
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  admissionDate: {
    type: Date,
    default: Date.now
  },
  profileImage: {
    type: String,
    default: 'default-resident.png'
  },
  notes: {
    type: String,
    maxlength: [1000, 'Notes cannot be more than 1000 characters']
  },
  familyEmails: [{
    type: String,
    trim: true,
    lowercase: true,
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please enter a valid email']
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for latest vitals
ResidentSchema.virtual('latestVitals', {
  ref: 'Vitals',
  localField: '_id',
  foreignField: 'residentId',
  justOne: true,
  options: { sort: { timestamp: -1 } }
});

// Virtual for vitals history
ResidentSchema.virtual('vitalsHistory', {
  ref: 'Vitals',
  localField: '_id',
  foreignField: 'residentId',
  options: { sort: { timestamp: -1 } }
});

// Virtual for active incidents
ResidentSchema.virtual('activeIncidents', {
  ref: 'Incident',
  localField: '_id',
  foreignField: 'residentId',
  match: { status: { $in: ['active', 'claimed'] } }
});

// Calculate time since last vitals check
ResidentSchema.methods.getVitalsStatus = async function() {
  const Vitals = mongoose.model('Vitals');
  const latestVitals = await Vitals.findOne({ residentId: this._id })
    .sort({ timestamp: -1 });

  if (!latestVitals) {
    return {
      status: 'never_checked',
      lastChecked: null,
      timeAgo: 'Never checked'
    };
  }

  const now = new Date();
  const lastCheck = latestVitals.timestamp;
  const timeDiff = now - lastCheck;
  
  const hours = Math.floor(timeDiff / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);
  
  let timeAgo;
  let status;
  
  if (hours < 1) {
    timeAgo = 'Less than 1 hour ago';
    status = 'recent';
  } else if (hours < 4) {
    timeAgo = `${hours} hour${hours > 1 ? 's' : ''} ago`;
    status = 'recent';
  } else if (hours < 24) {
    timeAgo = `${hours} hours ago`;
    status = 'moderate';
  } else if (days === 1) {
    timeAgo = 'Yesterday';
    status = 'old';
  } else if (days < 7) {
    timeAgo = `${days} days ago`;
    status = 'old';
  } else {
    timeAgo = `${Math.floor(days / 7)} week${Math.floor(days / 7) > 1 ? 's' : ''} ago`;
    status = 'very_old';
  }
  
  return {
    status,
    lastChecked: lastCheck,
    timeAgo
  };
};

// Get resident health summary
ResidentSchema.methods.getHealthSummary = async function() {
  const Vitals = mongoose.model('Vitals');
  const recentVitals = await Vitals.find({ residentId: this._id })
    .sort({ timestamp: -1 })
    .limit(10);

  if (recentVitals.length === 0) {
    return {
      status: 'no_data',
      message: 'No vitals data available'
    };
  }

  // Calculate averages
  const avgSystolic = recentVitals.reduce((sum, v) => sum + v.systolicBP, 0) / recentVitals.length;
  const avgDiastolic = recentVitals.reduce((sum, v) => sum + v.diastolicBP, 0) / recentVitals.length;
  const avgHeartRate = recentVitals.reduce((sum, v) => sum + v.heartRate, 0) / recentVitals.length;

  // Determine health status
  let healthStatus = 'normal';
  const alerts = [];

  if (avgSystolic > 140 || avgDiastolic > 90) {
    healthStatus = 'attention';
    alerts.push('High blood pressure detected');
  }

  if (avgHeartRate > 100 || avgHeartRate < 60) {
    healthStatus = 'attention';
    alerts.push('Irregular heart rate detected');
  }

  return {
    status: healthStatus,
    averages: {
      systolicBP: Math.round(avgSystolic),
      diastolicBP: Math.round(avgDiastolic),
      heartRate: Math.round(avgHeartRate)
    },
    alerts,
    dataPoints: recentVitals.length
  };
};

module.exports = mongoose.model('Resident', ResidentSchema);