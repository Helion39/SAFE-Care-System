import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import bcrypt from 'bcryptjs';

export async function seedDatabase() {
  try {
    await connectDB();
    
    // Debug: Check all users in database
    const allUsers = await User.find({});
    console.log('🔍 All users in database:', allUsers.length);
    allUsers.forEach(user => {
      console.log(`  - ${user.username} (${user.email}) - Role: ${user.role}`);
    });
    
    // Check if admin user already exists
    const existingAdmin = await User.findOne({ role: 'admin' });
    console.log('🔍 Admin user search result:', existingAdmin ? 'Found' : 'Not found');
    
    if (existingAdmin) {
      console.log('Admin user already exists:', existingAdmin.username);
      return;
    }

    // Create admin user (password will be hashed by the User model pre-save middleware)
    const admin = await User.create({
      name: 'System Administrator',
      email: 'admin@safecare.com',
      username: 'admin',
      password: 'admin123',
      role: 'admin'
    });

    console.log('✅ Admin user created successfully');
    console.log('Admin credentials: admin / admin123');
    
    return admin;
  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  }
}