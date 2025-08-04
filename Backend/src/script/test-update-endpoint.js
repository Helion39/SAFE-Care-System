require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const Resident = require('../models/Resident');

const app = express();
app.use(express.json());

// Test endpoint tanpa validasi
app.put('/test-update/:id', async (req, res) => {
  try {
    console.log('🔍 Request body:', JSON.stringify(req.body, null, 2));
    
    const resident = await Resident.findById(req.params.id);
    if (!resident) {
      return res.status(404).json({ error: 'Resident not found' });
    }

    const updatedResident = await Resident.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      data: updatedResident,
      message: 'Updated successfully'
    });

  } catch (error) {
    console.error('❌ Error:', error);
    res.status(400).json({
      success: false,
      error: error.message,
      details: error.errors
    });
  }
});

async function startServer() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    app.listen(3002, () => {
      console.log('🚀 Test server running on port 3002');
      console.log('📝 Test with: PUT http://localhost:3002/test-update/RESIDENT_ID');
    });

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

startServer();