require('dotenv').config();
const mongoose = require('mongoose');
const Incident = require('../models/Incident');
const Resident = require('../models/Resident');
const User = require('../models/User');

async function debugIncidents() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        const incidents = await Incident.find({});
        console.log(`\n📊 Found ${incidents.length} incidents in database:\n`);

        incidents.forEach((incident, index) => {
            console.log(`${index + 1}. Incident Details:`);
            console.log(`   - ID: ${incident._id}`);
            console.log(`   - Resident ID: ${incident.residentId}`);
            console.log(`   - Status: ${incident.status}`);
            console.log(`   - Type: ${incident.type}`);
            console.log(`   - Detection Time: ${incident.detectionTime}`);
            console.log(`   - Claimed By: ${incident.claimedBy || 'None'}`);
            console.log(`   - Resolution: ${incident.resolution || 'None'}`);
            console.log(`   - Created: ${incident.createdAt}`);
            console.log('');
        });

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

debugIncidents();