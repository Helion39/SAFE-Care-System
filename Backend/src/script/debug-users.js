// Debug script to check users in database
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

async function checkUsers() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get all users
    const users = await User.find({}).select('+password');
    console.log(`\n📊 Found ${users.length} users in database:`);
    
    users.forEach((user, index) => {
      console.log(`\n${index + 1}. User Details:`);
      console.log(`   - ID: ${user._id}`);
      console.log(`   - Name: ${user.name}`);
      console.log(`   - Email: ${user.email}`);
      console.log(`   - Username: ${user.username}`);
      console.log(`   - Role: ${user.role}`);
      console.log(`   - Active: ${user.isActive}`);
      console.log(`   - Password Hash: ${user.password ? 'Present' : 'Missing'}`);
      console.log(`   - Created: ${user.createdAt}`);
    });

    // Test password verification for admin user
    const adminUser = await User.findOne({ username: 'admin' }).select('+password');
    if (adminUser) {
      console.log(`\n🔐 Testing admin password verification:`);
      const isMatch = await adminUser.matchPassword('admin123');
      console.log(`   - Password 'admin123' matches: ${isMatch}`);
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkUsers();