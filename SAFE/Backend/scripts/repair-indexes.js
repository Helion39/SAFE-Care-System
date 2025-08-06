const mongoose = require('mongoose');
const User = require('../src/models/User');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/safe_care_system';

async function repairIndexes() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        // Drop existing indexes
        console.log('Dropping existing indexes...');
        await User.collection.dropIndexes();

        // Create new indexes
        console.log('Creating new indexes...');
        await User.collection.createIndex({ username: 1 }, { unique: true });
        await User.collection.createIndex({ email: 1 }, { sparse: true });
        await User.collection.createIndex({ role: 1 });

        console.log('Indexes repaired successfully');

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
}

repairIndexes();
