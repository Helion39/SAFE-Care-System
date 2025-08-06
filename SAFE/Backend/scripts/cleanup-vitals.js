const mongoose = require('mongoose');
const Vitals = require('../src/models/Vitals');
const Resident = require('../src/models/Resident');
const User = require('../src/models/User');
require('dotenv').config();

const cleanupVitals = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find all vitals records
    const allVitals = await Vitals.find({});
    console.log(`Found ${allVitals.length} vitals records`);

    let invalidCount = 0;
    const invalidVitals = [];

    for (const vital of allVitals) {
      let isInvalid = false;

      // Check if resident exists
      if (vital.residentId) {
        const resident = await Resident.findById(vital.residentId);
        if (!resident) {
          console.log(`Invalid resident reference: ${vital.residentId} in vital ${vital._id}`);
          isInvalid = true;
        }
      } else {
        console.log(`Null resident reference in vital ${vital._id}`);
        isInvalid = true;
      }

      // Check if caregiver exists
      if (vital.caregiverId) {
        const caregiver = await User.findById(vital.caregiverId);
        if (!caregiver) {
          console.log(`Invalid caregiver reference: ${vital.caregiverId} in vital ${vital._id}`);
          isInvalid = true;
        }
      } else {
        console.log(`Null caregiver reference in vital ${vital._id}`);
        isInvalid = true;
      }

      if (isInvalid) {
        invalidCount++;
        invalidVitals.push(vital._id);
      }
    }

    console.log(`Found ${invalidCount} invalid vitals records`);

    if (invalidCount > 0) {
      console.log('Invalid vitals IDs:', invalidVitals);
      
      // Ask for confirmation before deleting
      const readline = require('readline');
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });

      rl.question(`Do you want to delete these ${invalidCount} invalid vitals records? (y/N): `, async (answer) => {
        if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
          try {
            const result = await Vitals.deleteMany({ _id: { $in: invalidVitals } });
            console.log(`Deleted ${result.deletedCount} invalid vitals records`);
          } catch (error) {
            console.error('Error deleting invalid vitals:', error);
          }
        } else {
          console.log('No records deleted');
        }
        
        rl.close();
        await mongoose.connection.close();
        console.log('Database connection closed');
      });
    } else {
      console.log('No invalid vitals records found');
      await mongoose.connection.close();
      console.log('Database connection closed');
    }

  } catch (error) {
    console.error('Error during cleanup:', error);
    process.exit(1);
  }
};

// Run the cleanup
cleanupVitals();