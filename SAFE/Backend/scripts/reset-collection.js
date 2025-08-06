require('dotenv').config();
const mongoose = require('mongoose');

async function resetCollection() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Drop the users collection completely
        await mongoose.connection.db.dropCollection('users').catch(() => {
            console.log('Collection users does not exist, creating new one');
        });
        console.log('🗑️ Dropped users collection');

        console.log('✅ Collection reset complete');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error resetting collection:', error);
        process.exit(1);
    }
}

resetCollection();