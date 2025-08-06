require('dotenv').config();
const mongoose = require('mongoose');
const seedData = require('../src/utils/seedData');
const User = require('../src/models/User');
const Resident = require('../src/models/Resident');

const forceSeedDatabase = async () => {
  try {
    console.log('🌱 Force seeding database with initial data...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Check current data
    const userCount = await User.countDocuments();
    const residentCount = await Resident.countDocuments();
    
    console.log(`📊 Current data:`);
    console.log(`   Users: ${userCount}`);
    console.log(`   Residents: ${residentCount}`);

    if (userCount === 0) {
      console.log('\n🌱 No users found. Running seed data...');
      await seedData();
      console.log('✅ Seed data completed!');
    } else {
      console.log('\n⚠️  Data already exists. To force re-seed:');
      console.log('1. Clear existing data first, or');
      console.log('2. Run check-and-create-admin.js to fix admin user only');
      
      // Show existing users
      const users = await User.find({}, 'name username role');
      console.log('\n👥 Existing users:');
      users.forEach(user => {
        console.log(`   - ${user.name} (${user.username}) - ${user.role}`);
      });
    }

    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

// Run the script
forceSeedDatabase();