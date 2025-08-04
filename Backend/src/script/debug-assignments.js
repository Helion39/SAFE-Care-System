require('dotenv').config();
const mongoose = require('mongoose');
const Assignment = require('../models/Assignment');
const User = require('../models/User');
const Resident = require('../models/Resident');

async function debugAssignments() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        const assignments = await Assignment.find({})
            .populate('caregiverId', 'name email username')
            .populate('residentId', 'name room')
            .populate('assignedBy', 'name username');
            
        console.log(`\n📊 Found ${assignments.length} assignments in database:\n`);

        assignments.forEach((assignment, index) => {
            console.log(`${index + 1}. Assignment Details:`);
            console.log(`   - ID: ${assignment._id}`);
            console.log(`   - Caregiver: ${assignment.caregiverId ? assignment.caregiverId.name : 'None'}`);
            console.log(`   - Resident: ${assignment.residentId ? assignment.residentId.name : 'None'}`);
            console.log(`   - Assigned By: ${assignment.assignedBy ? assignment.assignedBy.name : 'None'}`);
            console.log(`   - Active: ${assignment.isActive}`);
            console.log(`   - Shift: ${assignment.shift}`);
            console.log(`   - Priority: ${assignment.priority}`);
            console.log(`   - Start Date: ${assignment.startDate}`);
            console.log(`   - End Date: ${assignment.endDate || 'Ongoing'}`);
            console.log('');
        });

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

debugAssignments();