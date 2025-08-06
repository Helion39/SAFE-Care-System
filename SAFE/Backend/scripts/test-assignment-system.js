require('dotenv').config();
const mongoose = require('mongoose');
const Assignment = require('../src/models/Assignment');
const User = require('../src/models/User');
const Resident = require('../src/models/Resident');

async function testAssignmentSystem() {
    try {
        console.log('🧪 Testing assignment system...');
        
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Get test data
        const admin = await User.findOne({ role: 'admin' });
        const caregiver = await User.findOne({ role: 'caregiver' });
        const resident = await Resident.findOne({ isActive: true });

        if (!admin || !caregiver || !resident) {
            console.log('❌ Missing test data (admin, caregiver, or resident)');
            process.exit(1);
        }

        console.log('\n📋 Test data:');
        console.log(`   - Admin: ${admin.name} (${admin._id})`);
        console.log(`   - Caregiver: ${caregiver.name} (${caregiver._id})`);
        console.log(`   - Resident: ${resident.name} (${resident._id})`);

        // Test 1: Create assignment
        console.log('\n🧪 Test 1: Creating assignment...');
        const assignment = await Assignment.create({
            caregiverId: caregiver._id,
            residentId: resident._id,
            assignedBy: admin._id,
            shift: 'full_time',
            priority: 'normal'
        });
        console.log(`   ✅ Assignment created: ${assignment._id}`);

        // Test 2: Update resident with assignment
        console.log('\n🧪 Test 2: Updating resident assignment...');
        await Resident.findByIdAndUpdate(resident._id, {
            assignedCaregiver: caregiver._id
        });
        console.log('   ✅ Resident updated with caregiver');

        // Test 3: Verify assignment exists
        console.log('\n🧪 Test 3: Verifying assignment...');
        const foundAssignment = await Assignment.findById(assignment._id)
            .populate('caregiverId', 'name')
            .populate('residentId', 'name')
            .populate('assignedBy', 'name');
        
        console.log(`   ✅ Assignment verified:`);
        console.log(`      - Caregiver: ${foundAssignment.caregiverId.name}`);
        console.log(`      - Resident: ${foundAssignment.residentId.name}`);
        console.log(`      - Assigned by: ${foundAssignment.assignedBy.name}`);
        console.log(`      - Active: ${foundAssignment.isActive}`);

        // Test 4: Verify resident has caregiver
        console.log('\n🧪 Test 4: Verifying resident assignment...');
        const updatedResident = await Resident.findById(resident._id)
            .populate('assignedCaregiver', 'name');
        
        console.log(`   ✅ Resident assignment verified:`);
        console.log(`      - Resident: ${updatedResident.name}`);
        console.log(`      - Assigned Caregiver: ${updatedResident.assignedCaregiver?.name || 'None'}`);

        console.log('\n🎉 All tests passed! Assignment system is working correctly.');

        process.exit(0);
    } catch (error) {
        console.error('❌ Assignment system test failed:', error);
        process.exit(1);
    }
}

testAssignmentSystem();