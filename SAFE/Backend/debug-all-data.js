require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');
const Resident = require('./src/models/Resident');
const Assignment = require('./src/models/Assignment');

async function debugAllData() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Check Users
        const users = await User.find({});
        console.log(`\n👥 Users: ${users.length}`);
        users.forEach(user => {
            console.log(`   - ${user.name} (${user.role}) - ID: ${user._id}`);
        });

        // Check Residents
        const residents = await Resident.find({});
        console.log(`\n🏠 Residents: ${residents.length}`);
        residents.forEach(resident => {
            console.log(`   - ${resident.name} - Room: ${resident.room} - ID: ${resident._id}`);
            console.log(`     Assigned Caregiver: ${resident.assignedCaregiver || 'None'}`);
        });

        // Check Assignments
        const assignments = await Assignment.find({});
        console.log(`\n📋 Assignments: ${assignments.length}`);
        assignments.forEach(assignment => {
            console.log(`   - Caregiver: ${assignment.caregiverId} → Resident: ${assignment.residentId}`);
            console.log(`     Active: ${assignment.isActive}`);
        });

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

debugAllData();