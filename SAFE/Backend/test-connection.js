const mongoose = require('mongoose');
const logger = require('./src/utils/logger');
require('dotenv').config();

const testMongoConnection = async () => {
  console.log('🔍 Testing SAFE MongoDB Connection...');
  console.log('📍 MongoDB URI:', process.env.MONGODB_URI ? 'Set' : 'Not set');
  
  if (!process.env.MONGODB_URI) {
    console.error('❌ MONGODB_URI environment variable is not set');
    process.exit(1);
  }

  try {
    console.log('🔄 Attempting to connect...');
    
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });

    console.log('✅ Successfully connected to MongoDB!');
    console.log(`📊 Host: ${conn.connection.host}`);
    console.log(`📊 Database: ${conn.connection.name}`);
    console.log(`📊 Port: ${conn.connection.port}`);
    console.log(`📊 Ready State: ${conn.connection.readyState}`);

    // Test a simple operation
    console.log('🏓 Testing ping...');
    await mongoose.connection.db.admin().ping();
    console.log('✅ Ping successful!');

    // List collections
    console.log('📋 Listing collections...');
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log(`📊 Found ${collections.length} collections:`, collections.map(c => c.name));

    // Test basic operations
    console.log('🧪 Testing basic database operations...');
    const testCollection = mongoose.connection.db.collection('connection_test');
    
    // Insert test document
    const insertResult = await testCollection.insertOne({ 
      test: true, 
      timestamp: new Date(),
      message: 'SAFE connection test'
    });
    console.log('✅ Insert test successful:', insertResult.insertedId);

    // Find test document
    const findResult = await testCollection.findOne({ _id: insertResult.insertedId });
    console.log('✅ Find test successful:', findResult.message);

    // Delete test document
    await testCollection.deleteOne({ _id: insertResult.insertedId });
    console.log('✅ Delete test successful');

    console.log('🎉 All connection tests passed successfully!');
    
  } catch (error) {
    console.error('❌ Connection test failed:', error.message);
    
    if (error.name === 'MongoServerSelectionError') {
      console.error('🔍 This usually means:');
      console.error('   - Network connectivity issues');
      console.error('   - Incorrect connection string');
      console.error('   - MongoDB server is down');
      console.error('   - Firewall blocking the connection');
      console.error('   - IP not whitelisted in MongoDB Atlas');
    } else if (error.name === 'MongoParseError') {
      console.error('🔍 This usually means:');
      console.error('   - Invalid MongoDB URI format');
      console.error('   - Missing or incorrect credentials');
    }
    
    console.error('🔧 Troubleshooting steps:');
    console.error('   1. Check your internet connection');
    console.error('   2. Verify the MongoDB URI is correct');
    console.error('   3. Ensure your IP is whitelisted in MongoDB Atlas');
    console.error('   4. Check if the database user has proper permissions');
    console.error('   5. Try connecting from MongoDB Compass with the same URI');
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Connection closed');
    process.exit(0);
  }
};

testMongoConnection();