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

// Resident Schema (simplified)
const ResidentSchema = new mongoose.Schema({
  residentId: String,
  name: String,
  room: String,
  age: Number,
  medicalConditions: [String],
  emergencyContact: {
    name: String,
    phone: String,
    relationship: String
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
  notes: String,
  familyEmails: [String]
}, {
  timestamps: true
});

const Resident = mongoose.model('Resident', ResidentSchema);

const updateResidentIds = async () => {
  try {
    await connectDB();
    
    // Find all residents without residentId
    const residentsWithoutId = await Resident.find({
      $or: [
        { residentId: { $exists: false } },
        { residentId: null },
        { residentId: '' }
      ]
    }).sort({ createdAt: 1 });

    console.log(`Found ${residentsWithoutId.length} residents without residentId`);

    if (residentsWithoutId.length === 0) {
      console.log('All residents already have residentId');
      process.exit(0);
    }

    // Update each resident with sequential ID
    for (let i = 0; i < residentsWithoutId.length; i++) {
      const resident = residentsWithoutId[i];
      const newResidentId = `RES${(i + 1).toString().padStart(3, '0')}`;
      
      await Resident.findByIdAndUpdate(resident._id, {
        residentId: newResidentId
      });
      
      console.log(`Updated ${resident.name} with residentId: ${newResidentId}`);
    }

    console.log('✅ All residents updated successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error updating residents:', error);
    process.exit(1);
  }
};

updateResidentIds();