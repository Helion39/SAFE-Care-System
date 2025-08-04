require('dotenv').config();
const mongoose = require('mongoose');
const Resident = require('./src/models/Resident');
const User = require('./src/models/User');
const Vitals = require('./src/models/Vitals');

const addComprehensiveVitals = async () => {
  try {
    console.log('📊 Adding comprehensive vitals data for all residents...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get all residents and caregivers
    const residents = await Resident.find({});
    const caregivers = await User.find({ role: 'caregiver' });
    
    if (residents.length === 0 || caregivers.length === 0) {
      console.log('❌ No residents or caregivers found.');
      await mongoose.connection.close();
      return;
    }

    console.log(`📊 Found ${residents.length} residents and ${caregivers.length} caregivers`);

    // Clear existing vitals to avoid duplicates
    await Vitals.deleteMany({});
    console.log('🗑️  Cleared existing vitals data');

    // Generate comprehensive vitals for the last 10 days (6+ timestamps per resident)
    const now = new Date();
    const vitalsData = [];

    for (const resident of residents) {
      console.log(`📈 Generating vitals for ${resident.name} (Room ${resident.room})`);

      // Define baseline vitals based on medical conditions
      let baseSystolic = 130, baseDiastolic = 80, baseHeartRate = 75, baseTemp = 98.6, baseO2 = 98;
      
      // Adjust baselines based on medical conditions
      if (resident.medicalConditions.includes('Hypertension')) {
        baseSystolic += 20;
        baseDiastolic += 15;
      }
      if (resident.medicalConditions.includes('Heart Disease') || resident.medicalConditions.includes('Heart Failure')) {
        baseHeartRate += 15;
        baseO2 -= 3;
      }
      if (resident.medicalConditions.includes('COPD')) {
        baseHeartRate += 10;
        baseO2 -= 5;
      }
      if (resident.medicalConditions.includes('Anxiety') || resident.medicalConditions.includes('Anxiety Disorder')) {
        baseHeartRate += 12;
      }
      if (resident.medicalConditions.includes('Diabetes')) {
        baseTemp += 0.3; // Slightly higher baseline
      }
      if (resident.medicalConditions.includes('Parkinson\'s Disease')) {
        baseHeartRate -= 5; // Often lower due to medication
      }

      // Generate 8-12 vitals readings over 10 days (varying frequency)
      const numReadings = 8 + Math.floor(Math.random() * 5); // 8-12 readings
      
      for (let i = 0; i < numReadings; i++) {
        // Distribute readings over 10 days with some clustering
        const daysBack = Math.floor(Math.random() * 10);
        const hoursBack = Math.floor(Math.random() * 24);
        const date = new Date(now.getTime() - (daysBack * 24 * 60 * 60 * 1000) - (hoursBack * 60 * 60 * 1000));
        
        const randomCaregiver = caregivers[Math.floor(Math.random() * caregivers.length)];

        // Create realistic variations and trends
        let trendFactor = 1;
        if (i < numReadings / 3) {
          // Earlier readings - potentially worse
          trendFactor = 1.1;
        } else if (i > (2 * numReadings) / 3) {
          // Recent readings - potentially improving
          trendFactor = 0.95;
        }

        // Add daily and individual variation
        const dailyVariation = Math.sin((i / numReadings) * Math.PI * 2) * 0.1; // Cyclical variation
        const randomVariation = (Math.random() - 0.5) * 0.3; // Random variation
        const totalVariation = (dailyVariation + randomVariation) * trendFactor;

        // Calculate vitals with realistic ranges
        const systolic = Math.round(baseSystolic + (totalVariation * 25));
        const diastolic = Math.round(baseDiastolic + (totalVariation * 15));
        const heartRate = Math.round(baseHeartRate + (totalVariation * 20));
        const temperature = baseTemp + (totalVariation * 1.5);
        const oxygenSaturation = Math.round(baseO2 + (totalVariation * 5));

        // Ensure values are within realistic bounds
        const finalSystolic = Math.max(90, Math.min(200, systolic));
        const finalDiastolic = Math.max(50, Math.min(120, diastolic));
        const finalHeartRate = Math.max(45, Math.min(130, heartRate));
        const finalTemperature = Math.max(96.0, Math.min(103.0, temperature));
        const finalO2Sat = Math.max(85, Math.min(100, oxygenSaturation));

        // Generate notes for some readings
        let notes = '';
        if (Math.random() < 0.3) { // 30% chance of notes
          const noteOptions = [
            'Patient resting comfortably',
            'Slight elevation noted',
            'Within normal range',
            'Patient reports feeling well',
            'Medication administered as scheduled',
            'Patient active and alert',
            'Monitoring closely',
            'Stable condition'
          ];
          notes = noteOptions[Math.floor(Math.random() * noteOptions.length)];
        }

        vitalsData.push({
          residentId: resident._id,
          systolicBP: finalSystolic,
          diastolicBP: finalDiastolic,
          heartRate: finalHeartRate,
          temperature: Math.round(finalTemperature * 10) / 10, // Round to 1 decimal
          oxygenSaturation: finalO2Sat,
          caregiverId: randomCaregiver._id,
          timestamp: date,
          notes: notes
        });
      }
    }

    // Sort vitals by timestamp
    vitalsData.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    // Insert all vitals data
    await Vitals.insertMany(vitalsData);
    console.log(`✅ Added ${vitalsData.length} comprehensive vitals records`);

    // Show summary by resident
    console.log('\n📋 Vitals Summary by Resident:');
    for (const resident of residents) {
      const residentVitals = vitalsData.filter(v => v.residentId.toString() === resident._id.toString());
      const latest = residentVitals[residentVitals.length - 1];
      
      console.log(`   ${resident.name} (Room ${resident.room}): ${residentVitals.length} readings`);
      if (latest) {
        console.log(`     Latest: ${latest.systolicBP}/${latest.diastolicBP} BP, ${latest.heartRate} HR, ${latest.temperature}°F, ${latest.oxygenSaturation}% O2`);
      }
    }

    // Show total count
    const totalVitals = await Vitals.countDocuments();
    console.log(`\n📊 Total vitals records in database: ${totalVitals}`);

    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
    console.log('🎉 Comprehensive vitals data added successfully!');
    console.log('\n💡 Features added:');
    console.log('   - 8-12 vitals readings per resident');
    console.log('   - Realistic medical condition-based baselines');
    console.log('   - Trending patterns (improvement/decline)');
    console.log('   - Daily and random variations');
    console.log('   - Comprehensive graph data for caregiver dashboard');

  } catch (error) {
    console.error('❌ Error adding vitals:', error);
    process.exit(1);
  }
};

// Run the script
addComprehensiveVitals();