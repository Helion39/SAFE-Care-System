const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn.connection.db;
  } catch (error) {
    console.error('Database connection failed:', error);
    process.exit(1);
  }
};

const createIndexes = async () => {
  try {
    const db = await connectDB();
    
    console.log('🔍 Creating indexes for 1:1 assignment enforcement...');
    
    // Create unique index for resident assignments
    try {
      await db.collection('assignments').createIndex(
        { residentId: 1, isActive: 1 },
        { 
          unique: true,
          partialFilterExpression: { isActive: true },
          name: 'resident_active_unique_idx'
        }
      );
      console.log('✅ Created unique index for resident assignments');
    } catch (error) {
      if (error.code === 85) {
        console.log('ℹ️ Resident unique index already exists');
      } else {
        throw error;
      }
    }

    // Create unique index for caregiver assignments
    try {
      await db.collection('assignments').createIndex(
        { caregiverId: 1, isActive: 1 },
        { 
          unique: true,
          partialFilterExpression: { isActive: true },
          name: 'caregiver_active_unique_idx'
        }
      );
      console.log('✅ Created unique index for caregiver assignments');
    } catch (error) {
      if (error.code === 85) {
        console.log('ℹ️ Caregiver unique index already exists');
      } else {
        throw error;
      }
    }

    // List all indexes to verify
    const indexes = await db.collection('assignments').indexes();
    console.log('\n📋 Current indexes on assignments collection:');
    indexes.forEach(index => {
      console.log(`  - ${index.name}: ${JSON.stringify(index.key)}`);
    });

    console.log('\n✅ Index creation completed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating indexes:', error);
    process.exit(1);
  }
};

createIndexes();