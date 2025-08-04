require('dotenv').config();
const mongoose = require('mongoose');
const Resident = require('../models/Resident');
const User = require('../models/User');

async function testResidentAPI() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Find a resident and admin user
        const resident = await Resident.findOne({ isActive: true });
        const admin = await User.findOne({ role: 'admin' });

        if (!resident || !admin) {
            console.log('❌ Missing resident or admin user');
            process.exit(1);
        }

        console.log(`🔍 Testing API update for resident: ${resident.name}`);
        console.log(`👤 Using admin: ${admin.name}`);

        // Simulate the controller logic
        const updateData = {
            name: resident.name,
            room: resident.room,
            age: resident.age,
            medicalConditions: resident.medicalConditions,
            emergencyContact: resident.emergencyContact,
            familyEmails: ['test@family.com', 'another@family.com'],
            notes: resident.notes
        };

        console.log('📝 Update data:', JSON.stringify(updateData, null, 2));

        // Test the update logic from controller
        const fieldsToUpdate = {};
        if (updateData.name) fieldsToUpdate.name = updateData.name;
        if (updateData.room) fieldsToUpdate.room = updateData.room;
        if (updateData.age) fieldsToUpdate.age = updateData.age;
        if (updateData.medicalConditions) fieldsToUpdate.medicalConditions = updateData.medicalConditions;
        if (updateData.emergencyContact) fieldsToUpdate.emergencyContact = updateData.emergencyContact;
        if (updateData.familyEmails !== undefined) fieldsToUpdate.familyEmails = updateData.familyEmails;
        if (updateData.notes !== undefined) fieldsToUpdate.notes = updateData.notes;

        console.log('🔧 Fields to update:', JSON.stringify(fieldsToUpdate, null, 2));

        const updatedResident = await Resident.findByIdAndUpdate(
            resident._id,
            fieldsToUpdate,
            {
                new: true,
                runValidators: true
            }
        ).populate('assignedCaregiver', 'name email');

        console.log('✅ API simulation successful');
        console.log(`📧 Updated family emails:`, updatedResident.familyEmails);

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

testResidentAPI();