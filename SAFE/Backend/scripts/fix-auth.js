const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../src/models/User');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/safe_care_system';

async function resetAuth() {
    try {
        console.log('🔄 Connecting to MongoDB...', MONGODB_URI);
        await mongoose.connect(MONGODB_URI, {
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });
        console.log('✅ Connected to MongoDB');

        // Delete existing admin user if any
        console.log('🗑️ Removing existing admin user...');
        const deleteResult = await User.deleteOne({ username: 'admin' });
        console.log('Delete result:', deleteResult);

        // Create new admin user
        console.log('👤 Creating new admin user...');
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('admin123', salt);
        
        const adminUser = new User({
            name: 'Administrator',
            username: 'admin',
            email: 'admin@safecare.com',
            password: hashedPassword,
            role: 'admin',
            isActive: true,
            isOnline: false
        });

        const savedUser = await adminUser.save();
        console.log('Created user:', {
            id: savedUser._id,
            username: savedUser.username,
            role: savedUser.role,
            isActive: savedUser.isActive
        });
        console.log('Admin user created successfully');
        console.log('Username: admin');
        console.log('Password: admin123');

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
}

resetAuth();
