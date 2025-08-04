require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');
const bcrypt = require('bcryptjs');

const addCaregivers = async () => {
  try {
    console.log('👩‍⚕️ Adding 4 comprehensive caregivers to MongoDB...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Check existing caregivers
    const existingCaregivers = await User.find({ role: 'caregiver' });
    console.log(`📊 Found ${existingCaregivers.length} existing caregivers`);

    // Hash password for all caregivers
    const caregiverPassword = await bcrypt.hash('password123', 12);

    // 4 comprehensive caregivers with Indonesian details
    const newCaregivers = [
      {
        name: 'Sari Dewi',
        email: 'sari.dewi@safecare.com',
        username: 'caregiver3',
        password: caregiverPassword,
        role: 'caregiver',
        phone: '+62-812-3456-7890',
        isActive: true
      },
      {
        name: 'Budi Santoso',
        email: 'budi.santoso@safecare.com',
        username: 'caregiver4',
        password: caregiverPassword,
        role: 'caregiver',
        phone: '+62-813-4567-8901',
        isActive: true
      },
      {
        name: 'Rina Kusuma',
        email: 'rina.kusuma@safecare.com',
        username: 'caregiver5',
        password: caregiverPassword,
        role: 'caregiver',
        phone: '+62-814-5678-9012',
        isActive: true
      },
      {
        name: 'Ahmad Wijaya',
        email: 'ahmad.wijaya@safecare.com',
        username: 'caregiver6',
        password: caregiverPassword,
        role: 'caregiver',
        phone: '+62-815-6789-0123',
        isActive: true
      }
    ];

    // Check which caregivers already exist by username
    const existingUsernames = existingCaregivers.map(c => c.username);
    const caregiversToAdd = newCaregivers.filter(caregiver => !existingUsernames.includes(caregiver.username));
    
    if (caregiversToAdd.length === 0) {
      console.log('ℹ️  All caregivers already exist in the database');
      await mongoose.connection.close();
      return;
    }

    // Add new caregivers
    const addedCaregivers = await User.insertMany(caregiversToAdd);
    console.log(`✅ Added ${addedCaregivers.length} new caregivers:`);
    console.log('');
    
    addedCaregivers.forEach((caregiver, index) => {
      console.log(`${index + 1}. ${caregiver.name}`);
      console.log(`   Username: ${caregiver.username}`);
      console.log(`   Email: ${caregiver.email}`);
      console.log(`   Phone: ${caregiver.phone}`);
      console.log(`   Password: password123`);
      console.log('   ─────────────────────────────────────');
    });

    // Show total count
    const totalCaregivers = await User.countDocuments({ role: 'caregiver' });
    console.log(`\n📊 Total caregivers in database: ${totalCaregivers}`);

    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
    console.log('🎉 Caregiver data added successfully!');
    console.log('\n💡 Login credentials for new caregivers:');
    addedCaregivers.forEach(caregiver => {
      console.log(`   ${caregiver.username} / password123`);
    });

  } catch (error) {
    console.error('❌ Error adding caregivers:', error);
    process.exit(1);
  }
};

// Run the script
addCaregivers();