const mongoose = require('mongoose');

const VitalsSchema = new mongoose.Schema({
  residentId: {
    type: mongoose.Schema.ObjectId,
    ref: 'Resident',
    required: [true, 'Vitals must belong to a resident']
  },
  caregiverId: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'Vitals must be recorded by a caregiver']
  },
  systolicBP: {
    type: Number,
    required: [true, 'Please add systolic blood pressure'],
    min: [50, 'Systolic BP must be at least 50'],
    max: [300, 'Systolic BP cannot exceed 300']
  },
  diastolicBP: {
    type: Number,
    required: [true, 'Please add diastolic blood pressure'],
    min: [30, 'Diastolic BP must be at least 30'],
    max: [200, 'Diastolic BP cannot exceed 200']
  },
  heartRate: {
    type: Number,
    required: [true, 'Please add heart rate'],
    min: [30, 'Heart rate must be at least 30'],
    max: [200, 'Heart rate cannot exceed 200']
  },
  temperature: {
    type: Number,
    min: [90, 'Temperature must be at least 90°F'],
    max: [110, 'Temperature cannot exceed 110°F']
  },
  oxygenSaturation: {
    type: Number,
    min: [70, 'Oxygen saturation must be at least 70%'],
    max: [100, 'Oxygen saturation cannot exceed 100%']
  },
  timestamp: {
    type: Date,
    default: Date.now,
    required: true
  },
  notes: {
    type: String,
    maxlength: [500, 'Notes cannot be more than 500 characters']
  },
  alerts: [{
    type: {
      type: String,
      enum: ['high_bp', 'low_bp', 'high_hr', 'low_hr', 'fever', 'low_oxygen'],
      required: true
    },
    message: {
      type: String,
      required: true
    },
    severity: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium'
    }
  }],
  isValidated: {
    type: Boolean,
    default: false
  },
  validatedBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  },
  validatedAt: Date
}, {
  timestamps: true
});

// Index for efficient queries
VitalsSchema.index({ residentId: 1, timestamp: -1 });
VitalsSchema.index({ timestamp: -1 });
VitalsSchema.index({ caregiverId: 1, timestamp: -1 });

// Pre-save middleware to generate alerts
VitalsSchema.pre('save', function(next) {
  this.alerts = [];

  // Blood pressure alerts
  if (this.systolicBP >= 180 || this.diastolicBP >= 110) {
    this.alerts.push({
      type: 'high_bp',
      message: 'Critical high blood pressure detected',
      severity: 'high'
    });
  } else if (this.systolicBP >= 140 || this.diastolicBP >= 90) {
    this.alerts.push({
      type: 'high_bp',
      message: 'High blood pressure detected',
      severity: 'medium'
    });
  } else if (this.systolicBP < 90 || this.diastolicBP < 60) {
    this.alerts.push({
      type: 'low_bp',
      message: 'Low blood pressure detected',
      severity: 'medium'
    });
  }

  // Heart rate alerts
  if (this.heartRate > 120) {
    this.alerts.push({
      type: 'high_hr',
      message: 'High heart rate detected',
      severity: 'high'
    });
  } else if (this.heartRate > 100) {
    this.alerts.push({
      type: 'high_hr',
      message: 'Elevated heart rate detected',
      severity: 'medium'
    });
  } else if (this.heartRate < 50) {
    this.alerts.push({
      type: 'low_hr',
      message: 'Low heart rate detected',
      severity: 'medium'
    });
  }

  // Temperature alerts
  if (this.temperature && this.temperature >= 101) {
    this.alerts.push({
      type: 'fever',
      message: 'Fever detected',
      severity: 'high'
    });
  }

  // Oxygen saturation alerts
  if (this.oxygenSaturation && this.oxygenSaturation < 90) {
    this.alerts.push({
      type: 'low_oxygen',
      message: 'Low oxygen saturation detected',
      severity: 'high'
    });
  }

  next();
});

// Static method to get vitals trends
VitalsSchema.statics.getTrends = async function(residentId, days = 7) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const vitals = await this.find({
    residentId,
    timestamp: { $gte: startDate }
  }).sort({ timestamp: 1 });

  if (vitals.length === 0) {
    return { trend: 'no_data', data: [] };
  }

  // Calculate trends
  const first = vitals[0];
  const last = vitals[vitals.length - 1];

  const systolicTrend = last.systolicBP - first.systolicBP;
  const diastolicTrend = last.diastolicBP - first.diastolicBP;
  const heartRateTrend = last.heartRate - first.heartRate;

  let overallTrend = 'stable';
  if (Math.abs(systolicTrend) > 10 || Math.abs(diastolicTrend) > 5 || Math.abs(heartRateTrend) > 10) {
    overallTrend = systolicTrend > 0 || diastolicTrend > 0 || heartRateTrend > 0 ? 'increasing' : 'decreasing';
  }

  return {
    trend: overallTrend,
    data: vitals,
    changes: {
      systolic: systolicTrend,
      diastolic: diastolicTrend,
      heartRate: heartRateTrend
    }
  };
};

// Instance method to check if vitals are normal
VitalsSchema.methods.isNormal = function() {
  const normalRanges = {
    systolicBP: { min: 90, max: 140 },
    diastolicBP: { min: 60, max: 90 },
    heartRate: { min: 60, max: 100 }
  };

  return (
    this.systolicBP >= normalRanges.systolicBP.min &&
    this.systolicBP <= normalRanges.systolicBP.max &&
    this.diastolicBP >= normalRanges.diastolicBP.min &&
    this.diastolicBP <= normalRanges.diastolicBP.max &&
    this.heartRate >= normalRanges.heartRate.min &&
    this.heartRate <= normalRanges.heartRate.max
  );
};

module.exports = mongoose.model('Vitals', VitalsSchema);