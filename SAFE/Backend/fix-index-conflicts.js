require('dotenv').config();
const mongoose = require('mongoose');

async function fixIndexConflicts() {
    try {
        console.log('🔧 Fixing database index conflicts...');
        
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // 1. Check current indexes on assignments collection
        console.log('\n🔍 Checking current assignment indexes...');
        const assignmentIndexes = await mongoose.connection.db.collection('assignments').indexes();
        console.log('Current assignment indexes:');
        assignmentIndexes.forEach((index, i) => {
            console.log(`   ${i + 1}. ${index.name}: ${JSON.stringify(index.key)} ${index.unique ? '(unique)' : ''} ${index.partialFilterExpression ? '(partial)' : ''}`);
        });

        // 2. Drop all assignment indexes except _id
        console.log('\n🗑️ Dropping all assignment indexes...');
        try {
            await mongoose.connection.db.collection('assignments').dropIndexes();
            console.log('   ✅ All assignment indexes dropped');
        } catch (error) {
            console.log('   ⚠️ Error dropping indexes (collection might not exist):', error.message);
        }

        // 3. Recreate only the necessary indexes manually
        console.log('\n🔨 Creating clean assignment indexes...');
        
        // Create caregiver + isActive index
        await mongoose.connection.db.collection('assignments').createIndex(
            { caregiverId: 1, isActive: 1 },
            { name: 'caregiver_active_idx' }
        );
        console.log('   ✅ Created caregiverId + isActive index');

        // Create start date index
        await mongoose.connection.db.collection('assignments').createIndex(
            { startDate: -1 },
            { name: 'start_date_idx' }
        );
        console.log('   ✅ Created startDate index');

        // Create unique partial index for resident + isActive
        await mongoose.connection.db.collection('assignments').createIndex(
            { residentId: 1, isActive: 1 },
            { 
                unique: true,
                partialFilterExpression: { isActive: true },
                name: 'resident_active_unique_idx'
            }
        );
        console.log('   ✅ Created unique partial index for residentId + isActive');

        // 4. Verify new indexes
        console.log('\n✅ Verifying new assignment indexes...');
        const newIndexes = await mongoose.connection.db.collection('assignments').indexes();
        console.log('New assignment indexes:');
        newIndexes.forEach((index, i) => {
            console.log(`   ${i + 1}. ${index.name}: ${JSON.stringify(index.key)} ${index.unique ? '(unique)' : ''} ${index.partialFilterExpression ? '(partial)' : ''}`);
        });

        console.log('\n🎉 Index conflicts fixed successfully!');
        console.log('\n📋 Summary:');
        console.log('   - Removed conflicting indexes');
        console.log('   - Created clean, named indexes');
        console.log('   - Maintained unique constraint for active assignments');
        console.log('   - Ready for assignment system to work properly');

        process.exit(0);
    } catch (error) {
        console.error('❌ Index conflict fix failed:', error);
        process.exit(1);
    }
}

fixIndexConflicts();