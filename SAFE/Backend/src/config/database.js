const mongoose = require('mongoose');
const logger = require('../utils/logger');

const connectDB = async () => {
  try {
    // Check if MONGODB_URI is provided
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI environment variable is not defined');
    }

    logger.info('🔄 Attempting to connect to MongoDB...');
    
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
      heartbeatFrequencyMS: 10000,
      retryWrites: true,
      w: 'majority'
    });

    logger.info(`✅ MongoDB Connected: ${conn.connection.host}`);
    logger.info(`📊 Database: ${conn.connection.name}`);
    
    // Set up connection event listeners
    mongoose.connection.on('error', (err) => {
      logger.error('❌ MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('🔌 MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('🔄 MongoDB reconnected');
    });

    mongoose.connection.on('connected', () => {
      logger.info('🔗 Mongoose connected to MongoDB');
    });

    // Test the connection
    await mongoose.connection.db.admin().ping();
    logger.info('🏓 MongoDB ping successful');

    // Graceful shutdown
    process.on('SIGINT', async () => {
      try {
        await mongoose.connection.close();
        logger.info('🛑 MongoDB connection closed through app termination');
        process.exit(0);
      } catch (error) {
        logger.error('❌ Error closing MongoDB connection:', error);
        process.exit(1);
      }
    });

    return conn;
  } catch (error) {
    logger.error('❌ Database connection failed:', error.message);
    
    // Log specific connection errors
    if (error.name === 'MongoServerSelectionError') {
      logger.error('🔍 Server selection error - check your connection string and network');
      logger.error('💡 Common causes:');
      logger.error('   - IP not whitelisted in MongoDB Atlas');
      logger.error('   - Network connectivity issues');
      logger.error('   - MongoDB server is down');
    } else if (error.name === 'MongoParseError') {
      logger.error('🔍 Parse error - check your MongoDB URI format');
    } else if (error.name === 'MongoNetworkError') {
      logger.error('🔍 Network error - check your internet connection');
    }
    
    // Retry connection after 5 seconds instead of exiting
    logger.info('🔄 Retrying connection in 5 seconds...');
    setTimeout(connectDB, 5000);
  }
};

// Database indexes setup
const setupIndexes = async () => {
  try {
    // User indexes
    try {
      await mongoose.connection.db.collection('users').dropIndex('email_1');
    } catch (err) {

    }
    await mongoose.connection.db.collection('users').createIndex({ email: 1 }, { unique: true, sparse: true });
    
    // Resident indexes
    await mongoose.connection.db.collection('residents').createIndex({ room: 1 }, { unique: true });
    await mongoose.connection.db.collection('residents').createIndex({ name: 1 });
    
    // Vitals indexes
    await mongoose.connection.db.collection('vitals').createIndex({ residentId: 1, timestamp: -1 });
    await mongoose.connection.db.collection('vitals').createIndex({ timestamp: -1 });
    
    // Incident indexes
    await mongoose.connection.db.collection('incidents').createIndex({ residentId: 1, detectionTime: -1 });
    await mongoose.connection.db.collection('incidents').createIndex({ status: 1, detectionTime: -1 });
    
    // Assignment indexes
    
    logger.info('Database indexes created successfully');
  } catch (error) {
    logger.error('Error creating database indexes:', error);
  }
};

module.exports = { connectDB, setupIndexes };