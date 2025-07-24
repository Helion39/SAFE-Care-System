const mongoose = require('mongoose');
const logger = require('../utils/logger');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    logger.info(`MongoDB Connected: ${conn.connection.host}`);
    
    // Set up connection event listeners
    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB reconnected');
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      logger.info('MongoDB connection closed through app termination');
      process.exit(0);
    });

  } catch (error) {
    logger.error('Database connection failed:', error);
    process.exit(1);
  }
};

// Database indexes setup
const setupIndexes = async () => {
  try {
    // User indexes
    await mongoose.connection.db.collection('users').createIndex({ email: 1 }, { unique: true });
    
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
    await mongoose.connection.db.collection('assignments').createIndex({ caregiverId: 1, isActive: 1 });
    await mongoose.connection.db.collection('assignments').createIndex({ residentId: 1, isActive: 1 });
    
    logger.info('Database indexes created successfully');
  } catch (error) {
    logger.error('Error creating database indexes:', error);
  }
};

module.exports = { connectDB, setupIndexes };