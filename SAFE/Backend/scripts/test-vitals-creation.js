require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/User');
const Resident = require('../src/models/Resident');
const Vitals = require('../src/models/Vitals');

async function testVitalsCreation() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Find a caregiver and resident
        const caregiver = await User.findOne({ role: 'caregiver' });
        const resident = await Resident.findOne({});
        
        if (!caregiver || !resident) {
            console.log('❌ Need both caregiver and resident for test');
            process.exit(1);
        }

        console.log(`🔍 Testing vitals creation:`);
        console.log(`   - Caregiver: ${caregiver.name} (${caregiver._id})`);
        console.log(`   - Resident: ${resident.name} (${resident._id})`);

        // Create test vitals with the format frontend now sends
        const testVitals = {
            residentId: resident._id,
            caregiverId: caregiver._id,
            systolicBP: 120,
            diastolicBP: 80,
            heartRate: 72
        };

        const vitals = await Vitals.create(testVitals);
        console.log('✅ Vitals created successfully:', vitals._id);
        
        // Verify it was saved
        const savedVitals = await Vitals.findById(vitals._id)
            .populate('residentId', 'name')
            .populate('caregiverId', 'name');
            
        console.log('✅ Verified saved vitals:');
        console.log(`   - Resident: ${savedVitals.residentId.name}`);
        console.log(`   - Caregiver: ${savedVitals.caregiverId.name}`);
        console.log(`   - BP: ${savedVitals.systolicBP}/${savedVitals.diastolicBP}`);
        console.log(`   - HR: ${savedVitals.heartRate}`);
        console.log(`   - Timestamp: ${savedVitals.timestamp}`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

testVitalsCreation();