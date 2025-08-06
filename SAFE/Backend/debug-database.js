const mongoose = require('mongoose');
const User = require('./src/models/User');
const Resident = require('./src/models/Resident');
const Vitals = require('./src/models/Vitals');
const Incident = require('./src/models/Incident');
const Assignment = require('./src/models/Assignment');
require('dotenv').config();

const debugDatabase = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    console.log('Database:', mongoose.connection.name);
    console.log('Host:', mongoose.connection.host);
    console.log('');

    // Check collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('📁 Collections in database:');
    collections.forEach(col => console.log(`  - ${col.name}`));
    console.log('');

    // Count documents in each collection
    const userCount = await User.countDocuments();
    const residentCount = await Resident.countDocuments();
    const vitalsCount = await Vitals.countDocuments();
    const incidentCount = await Incident.countDocuments();
    const assignmentCount = await Assignment.countDocuments();

    console.log('📊 Document counts:');
    console.log(`  Users: ${userCount}`);
    console.log(`  Residents: ${residentCount}`);
    console.log(`  Vitals: ${vitalsCount}`);
    console.log(`  Incidents: ${incidentCount}`);
    console.log(`  Assignments: ${assignmentCount}`);
    console.log('');

    // Show sample users
    if (userCount > 0) {
      console.log('👥 Sample Users:');
      const users = await User.find().limit(5).select('name username email role isActive');
      users.forEach(user => {
        console.log(`  - ${user.name} (${user.username}) - ${user.role} - ${user.isActive ? 'Active' : 'Inactive'}`);
      });
      console.log('');
    }

    // Show sample residents
    if (residentCount > 0) {
      console.log('🏠 Sample Residents:');
      const residents = await Resident.find().limit(5).select('name room age assignedCaregiver');
      for (const resident of residents) {
        let caregiverName = 'Unassigned';
        if (resident.assignedCaregiver) {
          const caregiver = await User.findById(resident.assignedCaregiver).select('name');
          caregiverName = caregiver ? caregiver.name : 'Unknown Caregiver';
        }
        console.log(`  - ${resident.name} (Room ${resident.room}, Age ${resident.age}) - Caregiver: ${caregiverName}`);
      }
      console.log('');
    }

    // Show sample vitals
    if (vitalsCount > 0) {
      console.log('💓 Sample Vitals:');
      const vitals = await Vitals.find().limit(5).populate('residentId', 'name').populate('caregiverId', 'name');
      vitals.forEach(vital => {
        const residentName = vital.residentId?.name || 'Unknown Resident';
        const caregiverName = vital.caregiverId?.name || 'Unknown Caregiver';
        console.log(`  - ${residentName}: ${vital.systolicBP}/${vital.diastolicBP} BP, ${vital.heartRate} HR by ${caregiverName}`);
      });
      console.log('');
    }

    // Check for any vitals with null references
    const vitalsWithNullResident = await Vitals.countDocuments({ residentId: null });
    const vitalsWithNullCaregiver = await Vitals.countDocuments({ caregiverId: null });
    
    if (vitalsWithNullResident > 0 || vitalsWithNullCaregiver > 0) {
      console.log('⚠️  Issues found:');
      if (vitalsWithNullResident > 0) {
        console.log(`  - ${vitalsWithNullResident} vitals records with null resident reference`);
      }
      if (vitalsWithNullCaregiver > 0) {
        console.log(`  - ${vitalsWithNullCaregiver} vitals records with null caregiver reference`);
      }
      console.log('');
    }

    // Check for vitals with invalid references
    const allVitals = await Vitals.find({}).select('residentId caregiverId');
    let invalidResidentRefs = 0;
    let invalidCaregiverRefs = 0;

    for (const vital of allVitals) {
      if (vital.residentId) {
        const resident = await Resident.findById(vital.residentId);
        if (!resident) invalidResidentRefs++;
      }
      if (vital.caregiverId) {
        const caregiver = await User.findById(vital.caregiverId);
        if (!caregiver) invalidCaregiverRefs++;
      }
    }

    if (invalidResidentRefs > 0 || invalidCaregiverRefs > 0) {
      console.log('🚨 Invalid references found:');
      if (invalidResidentRefs > 0) {
        console.log(`  - ${invalidResidentRefs} vitals with invalid resident references`);
      }
      if (invalidCaregiverRefs > 0) {
        console.log(`  - ${invalidCaregiverRefs} vitals with invalid caregiver references`);
      }
      console.log('  Run "node cleanup-vitals.js" to clean up invalid records');
      console.log('');
    }

    await mongoose.connection.close();
    console.log('✅ Database connection closed');

  } catch (error) {
    console.error('❌ Error during database debug:', error);
    process.exit(1);
  }
};

// Run the debug
debugDatabase();