require('dotenv').config();
const mongoose = require('mongoose');
const Resident = require('./src/models/Resident');
const User = require('./src/models/User');

const addComprehensiveResidents = async () => {
  try {
    console.log('🏥 Adding 10 comprehensive residents to MongoDB...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Check if we have caregivers to assign
    const caregivers = await User.find({ role: 'caregiver' });
    if (caregivers.length === 0) {
      console.log('❌ No caregivers found. Please run seed data first.');
      await mongoose.connection.close();
      return;
    }

    // 10 comprehensive residents with detailed profiles
    const newResidents = [
      {
        name: 'Eleanor Thompson',
        room: '104',
        age: 89,
        medicalConditions: ['Alzheimer\'s Disease', 'Osteoporosis', 'Hypertension'],
        emergencyContact: {
          name: 'Michael Thompson',
          phone: '+1-555-0204',
          relationship: 'Son'
        },
        admissionDate: new Date('2023-03-15'),
        notes: 'Stage 2 Alzheimer\'s, requires memory care assistance, fall risk due to osteoporosis. Enjoys classical music and photo albums. Former school teacher.',
        isActive: true
      },
      {
        name: 'Frank Martinez',
        room: '105',
        age: 73,
        medicalConditions: ['Parkinson\'s Disease', 'Depression', 'Sleep Apnea'],
        emergencyContact: {
          name: 'Carmen Martinez',
          phone: '+1-555-0205',
          relationship: 'Wife'
        },
        admissionDate: new Date('2023-07-22'),
        notes: 'Early-stage Parkinson\'s with tremors, uses walker for mobility. Takes Levodopa 3x daily. Former mechanic, enjoys working with hands when able.',
        isActive: true
      },
      {
        name: 'Dorothy Williams',
        room: '106',
        age: 85,
        medicalConditions: ['Diabetes Type 1', 'Chronic Kidney Disease', 'Diabetic Retinopathy'],
        emergencyContact: {
          name: 'Patricia Williams',
          phone: '+1-555-0206',
          relationship: 'Daughter'
        },
        admissionDate: new Date('2022-11-08'),
        notes: 'Insulin dependent since childhood, dialysis 3x per week (Mon/Wed/Fri). Vision impairment from retinopathy. Loves audiobooks and radio shows.',
        isActive: true
      },
      {
        name: 'Harold Johnson',
        room: '107',
        age: 79,
        medicalConditions: ['Stroke Recovery', 'Hypertension', 'Aphasia'],
        emergencyContact: {
          name: 'Linda Johnson',
          phone: '+1-555-0207',
          relationship: 'Wife'
        },
        admissionDate: new Date('2023-01-30'),
        notes: 'Stroke 8 months ago, left side weakness, speech therapy 2x weekly. Making good progress with communication. Former postal worker.',
        isActive: true
      },
      {
        name: 'Margaret Davis',
        room: '108',
        age: 91,
        medicalConditions: ['Vascular Dementia', 'Arthritis', 'Heart Failure', 'Osteoporosis'],
        emergencyContact: {
          name: 'David Davis',
          phone: '+1-555-0208',
          relationship: 'Son'
        },
        admissionDate: new Date('2022-05-12'),
        notes: 'Advanced dementia, requires full assistance with ADLs. Responds well to familiar music from the 1950s. Former nurse, has 3 children and 7 grandchildren.',
        isActive: true
      },
      {
        name: 'William Anderson',
        room: '109',
        age: 76,
        medicalConditions: ['COPD', 'Anxiety Disorder', 'Chronic Pain'],
        emergencyContact: {
          name: 'Betty Anderson',
          phone: '+1-555-0209',
          relationship: 'Wife'
        },
        admissionDate: new Date('2023-04-18'),
        notes: 'Oxygen therapy 24/7 at 2L, anxiety about breathing difficulties. Former construction worker, enjoys watching sports and card games.',
        isActive: true
      },
      {
        name: 'Rose Garcia',
        room: '110',
        age: 83,
        medicalConditions: ['Osteoarthritis', 'Glaucoma', 'Hearing Loss'],
        emergencyContact: {
          name: 'Carlos Garcia',
          phone: '+1-555-0210',
          relationship: 'Son'
        },
        admissionDate: new Date('2023-06-03'),
        notes: 'Severe arthritis in hands and knees, uses hearing aids, vision impairment from glaucoma. Loves cooking shows and has extensive recipe collection.',
        isActive: true
      },
      {
        name: 'Charles Wilson',
        room: '111',
        age: 87,
        medicalConditions: ['Prostate Cancer', 'High Cholesterol', 'Mild Cognitive Impairment'],
        emergencyContact: {
          name: 'Nancy Wilson',
          phone: '+1-555-0211',
          relationship: 'Daughter'
        },
        admissionDate: new Date('2022-09-25'),
        notes: 'Prostate cancer in remission, regular oncology follow-ups. Former bank manager, enjoys crossword puzzles and financial news.',
        isActive: true
      },
      {
        name: 'Helen Rodriguez',
        room: '112',
        age: 80,
        medicalConditions: ['Fibromyalgia', 'Chronic Insomnia', 'Depression'],
        emergencyContact: {
          name: 'Maria Rodriguez',
          phone: '+1-555-0212',
          relationship: 'Daughter'
        },
        admissionDate: new Date('2023-02-14'),
        notes: 'Chronic widespread pain, sleep difficulties, takes pain medication and antidepressants. Former librarian, enjoys reading and quiet activities.',
        isActive: true
      },
      {
        name: 'Arthur Lee',
        room: '113',
        age: 74,
        medicalConditions: ['Diabetes Type 2', 'Diabetic Neuropathy', 'Hypertension'],
        emergencyContact: {
          name: 'Susan Lee',
          phone: '+1-555-0213',
          relationship: 'Wife'
        },
        admissionDate: new Date('2023-08-07'),
        notes: 'Diabetic for 20+ years, neuropathy in feet requires special foot care. Former chef, still enjoys discussing recipes and food preparation.',
        isActive: true
      }
    ];

    // Check which residents already exist
    const existingResidents = await Resident.find({});
    const existingRooms = existingResidents.map(r => r.room);
    
    console.log(`📊 Found ${existingResidents.length} existing residents in rooms: ${existingRooms.join(', ')}`);

    // Filter out residents whose rooms already exist
    const residentsToAdd = newResidents.filter(resident => !existingRooms.includes(resident.room));
    
    if (residentsToAdd.length === 0) {
      console.log('ℹ️  All residents already exist in the database');
      await mongoose.connection.close();
      return;
    }

    // Add new residents
    const addedResidents = await Resident.insertMany(residentsToAdd);
    console.log(`✅ Added ${addedResidents.length} new comprehensive residents:`);
    console.log('');
    
    addedResidents.forEach((resident, index) => {
      console.log(`${index + 1}. ${resident.name} (Room ${resident.room})`);
      console.log(`   Age: ${resident.age} years old`);
      console.log(`   Medical Conditions: ${resident.medicalConditions.join(', ')}`);
      console.log(`   Emergency Contact: ${resident.emergencyContact.name} (${resident.emergencyContact.relationship})`);
      console.log(`   Phone: ${resident.emergencyContact.phone}`);
      console.log(`   Admission Date: ${resident.admissionDate.toDateString()}`);
      console.log(`   Notes: ${resident.notes}`);
      console.log('   ─────────────────────────────────────────────────────');
    });

    // Show total count
    const totalResidents = await Resident.countDocuments();
    console.log(`\n📊 Total residents in database: ${totalResidents}`);

    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
    console.log('🎉 Comprehensive resident data added successfully!');
    console.log('\n💡 Next steps:');
    console.log('   - Run: node add-vitals-for-new-residents.js (to add vitals data)');
    console.log('   - Check the admin dashboard to see the new residents');

  } catch (error) {
    console.error('❌ Error adding residents:', error);
    process.exit(1);
  }
};

// Run the script
addComprehensiveResidents();