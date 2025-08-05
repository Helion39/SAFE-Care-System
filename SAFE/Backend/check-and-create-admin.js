require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');
const bcrypt = require('bcryptjs');

const checkAndCreateAdmin = async () => {
  try {
    console.log('🔍 Checking admin user in database...');

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Check if admin user exists
    const adminUser = await User.findOne({ username: 'admin' });

    if (adminUser) {
      console.log('👤 Admin user found:');
      console.log('   Name:', adminUser.name);
      console.log('   Username:', adminUser.username);
      console.log('   Email:', adminUser.email);
      console.log('   Role:', adminUser.role);
      console.log('   Active:', adminUser.isActive);

      // Test password
      console.log('\n🔐 Testing password...');
      const isPasswordValid = await bcrypt.compare('admin123', adminUser.password);
      console.log('   Password "admin123" is valid:', isPasswordValid);

      if (!isPasswordValid) {
        console.log('🔧 Updating admin password...');
        const hashedPassword = await bcrypt.hash('admin123', 12);
        await User.updateOne(
          { username: 'admin' },
          { password: hashedPassword }
        );
        console.log('✅ Admin password updated successfully!');
      }

    } else {
      console.log('❌ Admin user not found. Creating new admin user...');

      // Create admin user
      const hashedPassword = await bcrypt.hash('admin123', 12);
      const newAdmin = await User.create({
        name: 'System Administrator',
        email: 'admin@safecare.com',
        username: 'admin',
        password: hashedPassword,
        role: 'admin',
        isActive: true
      });

      console.log('✅ Admin user created successfully:');
      console.log('   Name:', newAdmin.name);
      console.log('   Username:', newAdmin.username);
      console.log('   Email:', newAdmin.email);
      console.log('   Role:', newAdmin.role);
    }

    // Check total users
    const totalUsers = await User.countDocuments();
    console.log(`\n📊 Total users in database: ${totalUsers}`);

    // List all users
    const allUsers = await User.find({}, 'name username role isActive');
    console.log('\n👥 All users in database:');
    allUsers.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.name} (${user.username}) - ${user.role} - ${user.isActive ? 'Active' : 'Inactive'}`);
    });

    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
    console.log('🎉 Admin user check completed!');
    console.log('\n💡 You can now login with:');
    console.log('   Username: admin');
    console.log('   Password: admin123');

  } catch (error) {
    console.error('❌ Error checking admin user:', error);
    process.exit(1);
  }
};

// Run the script
checkAndCreateAdmin();