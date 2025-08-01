require('dotenv').config();
const mongoose = require('mongoose');
const Resident = require('./src/models/Resident');

async function debugResidentActive() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        const residents = await Resident.find({});
        console.log(`\n🏠 All residents with isActive field:`);
        residents.forEach(resident => {
            console.log(`   - ${resident.name} (Room ${resident.room}): isActive = ${resident.isActive}`);
        });

        const activeResidents = await Resident.find({ isActive: true });
        console.log(`\n✅ Active residents: ${activeResidents.length}`);
        activeResidents.forEach(resident => {
            console.log(`   - ${resident.name} (Room ${resident.room})`);
        });

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

debugResidentActive();