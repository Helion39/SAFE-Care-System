require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const Resident = require('../models/Resident');

const app = express();
app.use(express.json());

// Test endpoint
app.put('/test-resident/:id', async (req, res) => {
  try {
    console.log('🔍 Received request body:', JSON.stringify(req.body, null, 2));
    
    const { familyEmails } = req.body;
    
    if (!familyEmails) {
      return res.status(400).json({
        success: false,
        error: 'familyEmails is required for this test'
      });
    }

    const resident = await Resident.findById(req.params.id);
    if (!resident) {
      return res.status(404).json({
        success: false,
        error: 'Resident not found'
      });
    }

    console.log('📧 Current family emails:', resident.familyEmails);
    console.log('📧 New family emails:', familyEmails);

    const updatedResident = await Resident.findByIdAndUpdate(
      req.params.id,
      { familyEmails },
      { new: true, runValidators: true }
    );

    console.log('✅ Update successful');
    console.log('📧 Updated family emails:', updatedResident.familyEmails);

    res.json({
      success: true,
      data: {
        id: updatedResident._id,
        name: updatedResident.name,
        familyEmails: updatedResident.familyEmails
      },
      message: 'Family emails updated successfully'
    });

  } catch (error) {
    console.error('❌ Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Start server
async function startTestServer() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const resident = await Resident.findOne({ isActive: true });
    if (!resident) {
      console.log('❌ No resident found');
      process.exit(1);
    }

    console.log(`🏠 Test resident: ${resident.name} (${resident._id})`);
    console.log('📧 Current family emails:', resident.familyEmails);

    app.listen(3001, () => {
      console.log('🚀 Test server running on port 3001');
      console.log(`📝 Test with: PUT http://localhost:3001/test-resident/${resident._id}`);
      console.log('📝 Body: {"familyEmails": ["test1@example.com", "test2@example.com"]}');
    });

  } catch (error) {
    console.error('❌ Error starting server:', error);
    process.exit(1);
  }
}

startTestServer();