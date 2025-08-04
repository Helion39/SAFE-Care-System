require('dotenv').config();
const mongoose = require('mongoose');
const Resident = require('../models/Resident');

async function testResidentUpdate() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Find a resident to update
        const resident = await Resident.findOne({ isActive: true });
        if (!resident) {
            console.log('❌ No resident found for testing');
            process.exit(1);
        }

        console.log(`🔍 Testing update for resident: ${resident.name} (${resident._id})`);
        console.log(`📧 Current family emails:`, resident.familyEmails);

        // Test updating family emails
        const testEmails = ['family1@example.com', 'family2@example.com'];
        
        const updatedResident = await Resident.findByIdAndUpdate(
            resident._id,
            { familyEmails: testEmails },
            { new: true, runValidators: true }
        );

        console.log('✅ Resident updated successfully');
        console.log(`📧 New family emails:`, updatedResident.familyEmails);

        // Test adding more emails
        const moreEmails = [...testEmails, 'family3@example.com'];
        
        const finalUpdate = await Resident.findByIdAndUpdate(
            resident._id,
            { familyEmails: moreEmails },
            { new: true, runValidators: true }
        );

        console.log('✅ Second update successful');
        console.log(`📧 Final family emails:`, finalUpdate.familyEmails);

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

testResidentUpdate();