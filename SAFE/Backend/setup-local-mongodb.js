require('dotenv').config();
const mongoose = require('mongoose');

// Use local MongoDB instead of Atlas
const LOCAL_MONGODB_URI = 'mongodb://localhost:27017/safecare';

const setupLocalMongoDB = async () => {
  try {
    console.log('🔍 Setting up local MongoDB...');
    console.log('📍 Local MongoDB URI:', LOCAL_MONGODB_URI);
    
    console.log('⏳ Attempting connection to local MongoDB...');
    await mongoose.connect(LOCAL_MONGODB_URI);
    
    console.log('✅ Local MongoDB connection successful!');
    
    // Test the connection
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('📊 Available collections:', collections.map(c => c.name));
    
    await mongoose.connection.close();
    console.log('✅ Local MongoDB setup completed!');
    
    console.log('\n💡 To use local MongoDB:');
    console.log('1. Make sure MongoDB is installed and running locally');
    console.log('2. Update your .env file:');
    console.log('   # Comment out Atlas URI:');
    console.log('   # MONGODB_URI=mongodb+srv://...');
    console.log('   # Use local URI instead:');
    console.log('   MONGODB_URI=mongodb://localhost:27017/safecare');
    
  } catch (error) {
    console.error('❌ Local MongoDB connection failed:');
    console.error('Error:', error.message);
    
    console.log('\n💡 To install MongoDB locally:');
    console.log('1. Download MongoDB Community Server');
    console.log('2. Install and start MongoDB service');
    console.log('3. Or use Docker: docker run -d -p 27017:27017 mongo');
    
    process.exit(1);
  }
};

setupLocalMongoDB();