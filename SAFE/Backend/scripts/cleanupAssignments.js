const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('Database connection failed:', error);
    process.exit(1);
  }
};

// Assignment Schema (simplified)
const AssignmentSchema = new mongoose.Schema({
  caregiverId: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  residentId: {
    type: mongoose.Schema.ObjectId,
    ref: 'Resident',
    required: true
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  endDate: Date,
  isActive: {
    type: Boolean,
    default: true
  },
  assignedBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User'
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
  }
}, {
  timestamps: true
});

const Assignment = mongoose.model('Assignment', AssignmentSchema);

const cleanupAssignments = async () => {
  try {
    await connectDB();
    
    console.log('🔍 Checking for duplicate active assignments...');
    
    // Find duplicate resident assignments
    const duplicateResidents = await Assignment.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$residentId',
          count: { $sum: 1 },
          assignments: { $push: { id: '$_id', startDate: '$startDate' } }
        }
      },
      { $match: { count: { $gt: 1 } } }
    ]);

    console.log(`Found ${duplicateResidents.length} residents with multiple active assignments`);

    // Keep only the latest assignment for each resident
    for (const duplicate of duplicateResidents) {
      const assignments = duplicate.assignments.sort((a, b) => new Date(b.startDate) - new Date(a.startDate));
      const keepAssignment = assignments[0];
      const removeAssignments = assignments.slice(1);

      console.log(`Resident ${duplicate._id}: Keeping ${keepAssignment.id}, removing ${removeAssignments.length} duplicates`);

      for (const assignment of removeAssignments) {
        await Assignment.findByIdAndUpdate(assignment.id, {
          isActive: false,
          endDate: new Date()
        });
      }
    }

    // Find duplicate caregiver assignments
    const duplicateCaregivers = await Assignment.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$caregiverId',
          count: { $sum: 1 },
          assignments: { $push: { id: '$_id', startDate: '$startDate' } }
        }
      },
      { $match: { count: { $gt: 1 } } }
    ]);

    console.log(`Found ${duplicateCaregivers.length} caregivers with multiple active assignments`);

    // Keep only the latest assignment for each caregiver
    for (const duplicate of duplicateCaregivers) {
      const assignments = duplicate.assignments.sort((a, b) => new Date(b.startDate) - new Date(a.startDate));
      const keepAssignment = assignments[0];
      const removeAssignments = assignments.slice(1);

      console.log(`Caregiver ${duplicate._id}: Keeping ${keepAssignment.id}, removing ${removeAssignments.length} duplicates`);

      for (const assignment of removeAssignments) {
        await Assignment.findByIdAndUpdate(assignment.id, {
          isActive: false,
          endDate: new Date()
        });
      }
    }

    console.log('✅ Assignment cleanup completed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error cleaning up assignments:', error);
    process.exit(1);
  }
};

cleanupAssignments();