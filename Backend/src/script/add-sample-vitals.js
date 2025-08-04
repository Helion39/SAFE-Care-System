const mongoose = require('mongoose');
const User = require('./src/models/User');
const Resident = require('./src/models/Resident');
const Vitals = require('./src/models/Vitals');
require('dotenv').config();

const addSampleVitals = async () => {
  try {
    console.log('📊 Adding sample vitals data...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get existing users and residents
    const caregivers = await User.find({ role: 'caregiver' });
    const residents = await Resident.find({});

    if (caregivers.length === 0 || residents.length === 0) {
      console.log('❌ No caregivers or residents found. Please run seed data first.');
      await mongoose.connection.close();
      return;
    }

    console.log(`Found ${caregivers.length} caregivers and ${residents.length} residents`);

    // Create vitals for the last 7 days
    const vitalsData = [];
    const now = new Date();

    for (let day = 0; day < 7; day++) {
      const date = new Date(now.getTime() - day * 24 * 60 * 60 * 1000);
      
      // Add 2-3 vitals per resident per day
      for (const resident of residents) {
        const numReadings = 2 + Math.floor(Math.random() * 2); // 2-3 readings per day
        
        for (let reading = 0; reading < numReadings; reading++) {
          const readingTime = new Date(date);
          readingTime.setHours(8 + reading * 6 + Math.floor(Math.random() * 2)); // Spread throughout day
          
          const caregiver = caregivers[Math.floor(Math.random() * caregivers.length)];
          
          vitalsData.push({
            residentId: resident._id,
            caregiverId: caregiver._id,
            systolicBP: 120 + Math.floor(Math.random() * 40), // 120-160
            diastolicBP: 70 + Math.floor(Math.random() * 25), // 70-95
            heartRate: 60 + Math.floor(Math.random() * 40), // 60-100
            temperature: 98.0 + Math.random() * 2, // 98.0-100.0
            oxygenSaturation: 95 + Math.floor(Math.random() * 6), // 95-100
            timestamp: readingTime,
            notes: Math.random() > 0.7 ? 'Regular check-up' : undefined
          });
        }
      }
    }

    // Insert all vitals
    const result = await Vitals.insertMany(vitalsData);
    console.log(`✅ Added ${result.length} vitals records`);

    // Show summary
    const totalVitals = await Vitals.countDocuments();
    console.log(`📊 Total vitals in database: ${totalVitals}`);

    // Show sample data
    console.log('\n📋 Sample vitals added:');
    const sampleVitals = await Vitals.find({})
      .populate('residentId', 'name room')
      .populate('caregiverId', 'name')
      .sort({ timestamp: -1 })
      .limit(5);

    sampleVitals.forEach(vital => {
      console.log(`  - ${vital.residentId.name} (${vital.residentId.room}): ${vital.systolicBP}/${vital.diastolicBP} BP, ${vital.heartRate} HR by ${vital.caregiverId.name}`);
    });

    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
    console.log('🎉 Sample vitals data added successfully!');

  } catch (error) {
    console.error('❌ Error adding sample vitals:', error);
    process.exit(1);
  }
};

// Run the script
addSampleVitals();