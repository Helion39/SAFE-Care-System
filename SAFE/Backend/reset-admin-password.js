// Script to reset admin password
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');

async function resetAdminPassword() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find admin user
    const adminUser = await User.findOne({ username: 'admin' });
    
    if (!adminUser) {
      console.log('❌ Admin user not found');
      process.exit(1);
    }

    console.log('🔍 Found admin user:', adminUser.username);
    
    // Reset password to 'admin123'
    adminUser.password = 'admin123';
    await adminUser.save();
    
    console.log('✅ Admin password reset to: admin123');
    
    // Test the new password
    const updatedAdmin = await User.findOne({ username: 'admin' }).select('+password');
    const isMatch = await updatedAdmin.matchPassword('admin123');
    console.log('🔐 Password verification test:', isMatch);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

resetAdminPassword();