require('dotenv').config();
const mongoose = require('mongoose');

const testConnection = async () => {
  try {
    console.log('🔍 Testing MongoDB connection...');
    console.log('📍 MongoDB URI:', process.env.MONGODB_URI.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@'));
    
    // Set connection timeout
    const options = {
      serverSelectionTimeoutMS: 5000, // 5 seconds
      socketTimeoutMS: 45000, // 45 seconds
      bufferMaxEntries: 0,
      bufferCommands: false,
    };

    console.log('⏳ Attempting connection...');
    await mongoose.connect(process.env.MONGODB_URI, options);
    
    console.log('✅ MongoDB connection successful!');
    
    // Test a simple query
    console.log('🔍 Testing database query...');
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('📊 Available collections:', collections.map(c => c.name));
    
    // Test user collection specifically
    const User = mongoose.model('User', new mongoose.Schema({
      name: String,
      username: String,
      role: String
    }));
    
    const userCount = await User.countDocuments();
    console.log('👥 Total users in database:', userCount);
    
    if (userCount > 0) {
      const sampleUser = await User.findOne({});
      console.log('👤 Sample user:', {
        name: sampleUser.name,
        username: sampleUser.username,
        role: sampleUser.role
      });
    }
    
    await mongoose.connection.close();
    console.log('✅ Connection test completed successfully!');
    
  } catch (error) {
    console.error('❌ MongoDB connection failed:');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    
    if (error.name === 'MongoServerSelectionError') {
      console.log('\n💡 Possible solutions:');
      console.log('1. Check if MongoDB Atlas cluster is running');
      console.log('2. Verify IP address is whitelisted (0.0.0.0/0 for all IPs)');
      console.log('3. Check username/password in connection string');
      console.log('4. Ensure network connectivity');
    }
    
    process.exit(1);
  }
};

testConnection();