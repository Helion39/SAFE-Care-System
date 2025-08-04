const mongoose = require('mongoose');
const seedData = require('./src/utils/seedData');
require('dotenv').config();

const fixDatabaseIssue = async () => {
  try {
    console.log('🔧 Fixing database issue...');
    console.log('');

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    console.log('Database:', mongoose.connection.name);
    console.log('');

    // Check current data
    const User = require('./src/models/User');
    const Resident = require('./src/models/Resident');
    const Vitals = require('./src/models/Vitals');

    const userCount = await User.countDocuments();
    const residentCount = await Resident.countDocuments();
    const vitalsCount = await Vitals.countDocuments();

    console.log('📊 Current database state:');
    console.log(`  Users: ${userCount}`);
    console.log(`  Residents: ${residentCount}`);
    console.log(`  Vitals: ${vitalsCount}`);
    console.log('');

    // If no data exists, seed the database
    if (userCount === 0) {
      console.log('🌱 No data found, seeding database...');
      await seedData();
      console.log('✅ Database seeded successfully!');
      console.log('');
    } else {
      console.log('📋 Data exists, checking for issues...');
      
      // Check for vitals with null references
      const vitalsWithNullResident = await Vitals.countDocuments({ residentId: null });
      const vitalsWithNullCaregiver = await Vitals.countDocuments({ caregiverId: null });
      
      if (vitalsWithNullResident > 0 || vitalsWithNullCaregiver > 0) {
        console.log('⚠️  Found vitals with null references:');
        if (vitalsWithNullResident > 0) {
          console.log(`  - ${vitalsWithNullResident} vitals with null resident reference`);
        }
        if (vitalsWithNullCaregiver > 0) {
          console.log(`  - ${vitalsWithNullCaregiver} vitals with null caregiver reference`);
        }
        
        // Delete vitals with null references
        const deleteResult = await Vitals.deleteMany({
          $or: [
            { residentId: null },
            { caregiverId: null }
          ]
        });
        
        console.log(`🗑️  Deleted ${deleteResult.deletedCount} vitals with null references`);
        console.log('');
      }

      // Check for vitals with invalid references
      console.log('🔍 Checking for invalid references...');
      const allVitals = await Vitals.find({}).select('_id residentId caregiverId');
      const invalidVitals = [];

      for (const vital of allVitals) {
        let isInvalid = false;

        if (vital.residentId) {
          const resident = await Resident.findById(vital.residentId);
          if (!resident) {
            isInvalid = true;
          }
        }

        if (vital.caregiverId) {
          const caregiver = await User.findById(vital.caregiverId);
          if (!caregiver) {
            isInvalid = true;
          }
        }

        if (isInvalid) {
          invalidVitals.push(vital._id);
        }
      }

      if (invalidVitals.length > 0) {
        console.log(`⚠️  Found ${invalidVitals.length} vitals with invalid references`);
        const deleteResult = await Vitals.deleteMany({ _id: { $in: invalidVitals } });
        console.log(`🗑️  Deleted ${deleteResult.deletedCount} vitals with invalid references`);
        console.log('');
      } else {
        console.log('✅ No invalid references found');
        console.log('');
      }
    }

    // Final count
    const finalUserCount = await User.countDocuments();
    const finalResidentCount = await Resident.countDocuments();
    const finalVitalsCount = await Vitals.countDocuments();

    console.log('📊 Final database state:');
    console.log(`  Users: ${finalUserCount}`);
    console.log(`  Residents: ${finalResidentCount}`);
    console.log(`  Vitals: ${finalVitalsCount}`);
    console.log('');

    // Show login credentials
    if (finalUserCount > 0) {
      console.log('🔑 Login credentials:');
      console.log('  Admin: admin / admin123');
      console.log('  Caregiver: caregiver1 / password123');
      console.log('  Caregiver: caregiver2 / password123');
      console.log('');
    }

    await mongoose.connection.close();
    console.log('✅ Database connection closed');
    console.log('🎉 Database issue fixed! You can now restart your backend server.');

  } catch (error) {
    console.error('❌ Error fixing database:', error);
    process.exit(1);
  }
};

// Run the fix
fixDatabaseIssue();