const mongoose = require('mongoose');

const FamilyMemberSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  googleId: {
    type: String,
    required: true,
    unique: true
  },
  profilePicture: {
    type: String,
    default: null
  },
  residentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Resident',
    required: true
  },
  relationship: {
    type: String,
    enum: ['son', 'daughter', 'spouse', 'parent', 'sibling', 'grandchild', 'other'],
    default: 'other'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  addedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lastAccess: {
    type: Date,
    default: null
  },
  refreshToken: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

// Index for efficient lookups
FamilyMemberSchema.index({ email: 1 });
FamilyMemberSchema.index({ googleId: 1 });
FamilyMemberSchema.index({ residentId: 1 });
FamilyMemberSchema.index({ isActive: 1 });

// Virtual for resident information
FamilyMemberSchema.virtual('resident', {
  ref: 'Resident',
  localField: 'residentId',
  foreignField: '_id',
  justOne: true
});

// Ensure virtual fields are serialized
FamilyMemberSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('FamilyMember', FamilyMemberSchema);