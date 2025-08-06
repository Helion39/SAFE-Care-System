require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');
const bcrypt = require('bcryptjs');

const quickFixAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Delete existing admin if any
    await User.deleteOne({ username: 'admin' });
    
    // Create fresh admin user
    const hashedPassword = await bcrypt.hash('admin123', 12);
    await User.create({
      name: 'System Administrator',
      email: 'admin@safecare.com',
      username: 'admin',
      password: hashedPassword,
      role: 'admin',
      isActive: true
    });
    
    console.log('✅ Admin user created successfully!');
    console.log('Username: admin');
    console.log('Password: admin123');
    
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
};

quickFixAdmin();