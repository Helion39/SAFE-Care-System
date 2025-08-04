require('dotenv').config();
const mongoose = require('mongoose');
const Resident = require('../models/Resident');

async function debugResidents() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        const residents = await Resident.find({}).populate('assignedCaregiver');
        console.log(`\n📊 Found ${residents.length} residents in database:\n`);

        residents.forEach((resident, index) => {
            console.log(`${index + 1}. Resident Details:`);
            console.log(`   - ID: ${resident._id}`);
            console.log(`   - Name: ${resident.name}`);
            console.log(`   - Room: ${resident.room}`);
            console.log(`   - Age: ${resident.age}`);
            console.log(`   - Medical Conditions: ${resident.medicalConditions || 'None'}`);
            console.log(`   - Assigned Caregiver: ${resident.assignedCaregiver ? resident.assignedCaregiver.name : 'None'}`);
            console.log(`   - Active: ${resident.isActive}`);
            console.log(`   - Created: ${resident.createdAt}`);
            console.log('');
        });

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

debugResidents();