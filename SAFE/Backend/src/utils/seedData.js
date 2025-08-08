const User = require('../models/User');
const Resident = require('../models/Resident');
const Vitals = require('../models/Vitals');
const Assignment = require('../models/Assignment');
const bcrypt = require('bcryptjs');
const logger = require('./logger');

const seedData = async () => {
  try {
    // Check if data already exists
    const userCount = await User.countDocuments();
    if (userCount > 0) {
      logger.info('Data already exists, skipping seed');
      return;
    }

    logger.info('Seeding database with initial data...');

    // Create admin user
    const adminPassword = await bcrypt.hash('admin123', 12);
    const admin = await User.create({
      name: 'System Administrator',
      email: 'admin@safecare.com',
      username: 'admin',
      password: adminPassword,
      role: 'admin'
    });

    // Create sample caregivers
    const caregiverPassword = await bcrypt.hash('password123', 12);
    const caregiver1 = await User.create({
      name: 'Maria Garcia',
      email: 'maria@safecare.com',
      username: 'caregiver1',
      password: caregiverPassword,
      role: 'caregiver',
      phone: '+1-555-0101'
    });

    const caregiver2 = await User.create({
      name: 'James Wilson',
      email: 'james@safecare.com',
      username: 'caregiver2',
      password: caregiverPassword,
      role: 'caregiver',
      phone: '+1-555-0102'
    });

    // Create sample residents
    const resident1 = await Resident.create({
      name: 'John Doe',
      room: '101',
      age: 78,
      medicalConditions: ['Hypertension', 'Diabetes Type 2'],
      emergencyContact: {
        name: 'Jane Doe',
        phone: '+1-555-0201',
        relationship: 'Daughter'
      },
      notes: 'Requires assistance with mobility'
    });

    const resident2 = await Resident.create({
      name: 'Mary Smith',
      room: '102',
      age: 82,
      medicalConditions: ['Arthritis', 'Heart Disease'],
      emergencyContact: {
        name: 'Robert Smith',
        phone: '+1-555-0202',
        relationship: 'Son'
      }
    });

    const resident3 = await Resident.create({
      name: 'Robert Brown',
      room: '103',
      age: 75,
      medicalConditions: ['COPD'],
      emergencyContact: {
        name: 'Susan Brown',
        phone: '+1-555-0203',
        relationship: 'Wife'
      },
      notes: 'Uses oxygen therapy'
    });

    // Create sample vitals for the last few days
    const now = new Date();
    const vitalsData = [];

    for (let i = 0; i < 7; i++) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      
      // Vitals for resident1
      vitalsData.push({
        residentId: resident1._id,
        systolicBP: 130 + Math.floor(Math.random() * 20),
        diastolicBP: 80 + Math.floor(Math.random() * 15),
        heartRate: 70 + Math.floor(Math.random() * 20),
        temperature: 98.6 + (Math.random() - 0.5) * 2,
        caregiverId: caregiver1._id,
        timestamp: date
      });

      // Vitals for resident2
      vitalsData.push({
        residentId: resident2._id,
        systolicBP: 140 + Math.floor(Math.random() * 25),
        diastolicBP: 85 + Math.floor(Math.random() * 20),
        heartRate: 75 + Math.floor(Math.random() * 25),
        temperature: 98.6 + (Math.random() - 0.5) * 2,
        caregiverId: caregiver2._id,
        timestamp: date
      });

      // Vitals for resident3
      vitalsData.push({
        residentId: resident3._id,
        systolicBP: 125 + Math.floor(Math.random() * 15),
        diastolicBP: 75 + Math.floor(Math.random() * 10),
        heartRate: 65 + Math.floor(Math.random() * 15),
        temperature: 98.6 + (Math.random() - 0.5) * 2,
        caregiverId: caregiver1._id,
        timestamp: date
      });
    }

    await Vitals.insertMany(vitalsData);

    // Create assignments
    await Assignment.create({
      residentId: resident1._id,
      caregiverId: caregiver1._id,
      assignedBy: admin._id,
      shift: 'morning',
      isActive: true
    });

    await Assignment.create({
      residentId: resident2._id,
      caregiverId: caregiver2._id,
      assignedBy: admin._id,
      shift: 'afternoon',
      isActive: true
    });

    await Assignment.create({
      residentId: resident3._id,
      caregiverId: caregiver1._id,
      assignedBy: admin._id,
      shift: 'evening',
      isActive: true
    });

    logger.info('Database seeded successfully!');
    logger.info('Admin credentials: admin / admin123');
    logger.info('Caregiver credentials: caregiver1 / password123, caregiver2 / password123');

  } catch (error) {
    logger.error('Error seeding database:', error);
    throw error;
  }
};

module.exports = seedData;