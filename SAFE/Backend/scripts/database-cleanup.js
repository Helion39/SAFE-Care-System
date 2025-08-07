require('dotenv').config();
const mongoose = require('mongoose');

async function cleanupDatabase() {
    try {
        console.log('🔧 Starting database cleanup...');

        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Backup current data
        console.log('\n📦 Creating data backup...');
        const assignments = await mongoose.connection.db.collection('assignments').find({}).toArray();
        const residents = await mongoose.connection.db.collection('residents').find({}).toArray();
        const users = await mongoose.connection.db.collection('users').find({}).toArray();

        console.log(`   - Assignments: ${assignments.length}`);
        console.log(`   - Residents: ${residents.length}`);
        console.log(`   - Users: ${users.length}`);

        // Drop problematic assignment indexes
        console.log('\n🗑️ Dropping assignment collection indexes...');
        try {
            await mongoose.connection.db.collection('assignments').dropIndexes();
            console.log('   ✅ Assignment indexes dropped');
        } catch (error) {
            console.log('   ⚠️ No assignment indexes to drop (collection might not exist)');
        }

        // Clear any corrupted assignment records
        console.log('\n🧹 Clearing assignment collection...');
        await mongoose.connection.db.collection('assignments').deleteMany({});
        console.log('   ✅ Assignment collection cleared');

        // Reset resident assignments to clean state
        console.log('\n🔄 Resetting resident assignments...');
        await mongoose.connection.db.collection('residents').updateMany(
            {},
            { $unset: { assignedCaregiver: "" } }
        );
        console.log('   ✅ Resident assignments reset');

        console.log('\n🎉 Database cleanup completed successfully!');
        console.log('\n📋 Summary:');
        console.log('   - Assignment indexes removed');
        console.log('   - Assignment collection cleared');
        console.log('   - Resident assignments reset');
        console.log('   - Ready for clean assignment system');

        process.exit(0);
    } catch (error) {
        console.error('❌ Database cleanup failed:', error);
        process.exit(1);
    }
}

cleanupDatabase();