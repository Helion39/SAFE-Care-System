// Script to fix the database by clearing and re-seeding with proper usernames
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');

async function fixDatabase() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Clear all users
        await User.deleteMany({});
        console.log('🗑️ Cleared all existing users');

        // Create admin user with proper username (let User model handle password hashing)
        const admin = await User.create({
            name: 'System Administrator',
            email: 'admin@safecare.com',
            username: 'admin',
            password: 'admin123', // Plain text - User model will hash it
            role: 'admin',
            isActive: true,
            isOnline: false
        });
        console.log('✅ Created admin user:', admin.username);

        // Create sample caregivers with proper usernames
        const caregiver1 = await User.create({
            name: 'Maria Garcia',
            email: 'maria@safecare.com',
            username: 'caregiver1',
            password: 'password123', // Plain text - User model will hash it
            role: 'caregiver',
            isActive: true,
            isOnline: false,
            phone: '+1-555-0101'
        });
        console.log('✅ Created caregiver1:', caregiver1.username);

        const caregiver2 = await User.create({
            name: 'James Wilson',
            email: 'james@safecare.com',
            username: 'caregiver2',
            password: 'password123', // Plain text - User model will hash it
            role: 'caregiver',
            isActive: true,
            isOnline: false,
            phone: '+1-555-0102'
        });
        console.log('✅ Created caregiver2:', caregiver2.username);

        // Verify users were created correctly
        const allUsers = await User.find({});
        console.log('\n📊 Verification - Users in database:');
        allUsers.forEach(user => {
            console.log(`   - ${user.username} (${user.email}) - Role: ${user.role}`);
        });

        console.log('\n🎉 Database fixed successfully!');
        console.log('\n🔑 Login credentials:');
        console.log('   Admin: admin / admin123');
        console.log('   Caregiver 1: caregiver1 / password123');
        console.log('   Caregiver 2: caregiver2 / password123');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error fixing database:', error);
        process.exit(1);
    }
}

fixDatabase();