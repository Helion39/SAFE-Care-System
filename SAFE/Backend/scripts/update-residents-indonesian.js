require('dotenv').config();
const mongoose = require('mongoose');
const Resident = require('../src/models/Resident');

const updateResidentsIndonesian = async () => {
  try {
    console.log('🇮🇩 Updating residents with Indonesian phone numbers...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Indonesian phone number updates for emergency contacts
    const phoneUpdates = [
      { room: '101', phone: '+62-821-1234-5678' }, // John Doe
      { room: '102', phone: '+62-822-2345-6789' }, // Mary Smith  
      { room: '103', phone: '+62-823-3456-7890' }, // Robert Brown
      { room: '104', phone: '+62-824-4567-8901' }, // Eleanor Thompson
      { room: '105', phone: '+62-825-5678-9012' }, // Frank Martinez
      { room: '106', phone: '+62-826-6789-0123' }, // Dorothy Williams
      { room: '107', phone: '+62-827-7890-1234' }, // Harold Johnson
      { room: '108', phone: '+62-828-8901-2345' }, // Margaret Davis
      { room: '109', phone: '+62-829-9012-3456' }, // William Anderson
      { room: '110', phone: '+62-830-0123-4567' }, // Rose Garcia
      { room: '111', phone: '+62-831-1234-5678' }, // Charles Wilson
      { room: '112', phone: '+62-832-2345-6789' }, // Helen Rodriguez
      { room: '113', phone: '+62-833-3456-7890' }  // Arthur Lee
    ];

    let updatedCount = 0;

    for (const update of phoneUpdates) {
      const result = await Resident.updateOne(
        { room: update.room },
        { 
          $set: { 
            'emergencyContact.phone': update.phone 
          } 
        }
      );
      
      if (result.modifiedCount > 0) {
        updatedCount++;
        const resident = await Resident.findOne({ room: update.room });
        console.log(`✅ Updated ${resident.name} (Room ${update.room}): ${update.phone}`);
      }
    }

    console.log(`\n📊 Updated ${updatedCount} residents with Indonesian phone numbers`);

    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
    console.log('🎉 Indonesian phone numbers updated successfully!');

  } catch (error) {
    console.error('❌ Error updating residents:', error);
    process.exit(1);
  }
};

// Run the script
updateResidentsIndonesian();