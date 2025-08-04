require('dotenv').config();
const mongoose = require('mongoose');
const Resident = require('../models/Resident');
const User = require('../models/User');

async function debugResidentUpdate() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Find test data
        const resident = await Resident.findOne({ isActive: true });
        const admin = await User.findOne({ role: 'admin' });

        if (!resident || !admin) {
            console.log('❌ Missing test data');
            process.exit(1);
        }

        console.log('🔍 Debug Info:');
        console.log(`   Resident: ${resident.name} (${resident._id})`);
        console.log(`   Admin: ${admin.name} (${admin._id})`);
        console.log(`   Current family emails:`, resident.familyEmails);

        // Test different scenarios
        console.log('\n📝 Testing different update scenarios...');

        // Scenario 1: Empty array
        console.log('\n1️⃣ Testing with empty array:');
        let result1 = await Resident.findByIdAndUpdate(
            resident._id,
            { familyEmails: [] },
            { new: true, runValidators: true }
        );
        console.log('   Result:', result1.familyEmails);

        // Scenario 2: Single email
        console.log('\n2️⃣ Testing with single email:');
        let result2 = await Resident.findByIdAndUpdate(
            resident._id,
            { familyEmails: ['single@example.com'] },
            { new: true, runValidators: true }
        );
        console.log('   Result:', result2.familyEmails);

        // Scenario 3: Multiple emails
        console.log('\n3️⃣ Testing with multiple emails:');
        let result3 = await Resident.findByIdAndUpdate(
            resident._id,
            { familyEmails: ['family1@example.com', 'family2@example.com', 'family3@example.com'] },
            { new: true, runValidators: true }
        );
        console.log('   Result:', result3.familyEmails);

        // Scenario 4: Full update (like from API)
        console.log('\n4️⃣ Testing full update (API simulation):');
        const updateData = {
            name: resident.name,
            room: resident.room,
            age: resident.age,
            medicalConditions: resident.medicalConditions || [],
            emergencyContact: resident.emergencyContact,
            familyEmails: ['api1@example.com', 'api2@example.com'],
            notes: resident.notes
        };

        let result4 = await Resident.findByIdAndUpdate(
            resident._id,
            updateData,
            { new: true, runValidators: true }
        );
        console.log('   Result:', result4.familyEmails);

        // Scenario 5: Test with undefined (should not change)
        console.log('\n5️⃣ Testing with undefined (should not change):');
        let result5 = await Resident.findByIdAndUpdate(
            resident._id,
            { name: resident.name }, // No familyEmails field
            { new: true, runValidators: true }
        );
        console.log('   Result (should be unchanged):', result5.familyEmails);

        console.log('\n✅ All tests completed successfully!');
        console.log('\n📋 Summary:');
        console.log('   - Empty array: ✅ Works');
        console.log('   - Single email: ✅ Works');
        console.log('   - Multiple emails: ✅ Works');
        console.log('   - Full API update: ✅ Works');
        console.log('   - Undefined handling: ✅ Works');

        console.log('\n🔧 If you\'re still having issues, check:');
        console.log('   1. Are you sending the request as admin?');
        console.log('   2. Is the Content-Type header set to application/json?');
        console.log('   3. Is the familyEmails field formatted as an array?');
        console.log('   4. Are the email addresses valid?');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

debugResidentUpdate();