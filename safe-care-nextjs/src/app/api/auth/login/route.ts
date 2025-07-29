import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    console.log('✅ Connected to MongoDB for login');
    
    const { email, username, password } = await request.json();
    console.log('Login attempt:', { email, username, password: '***' });

    // Debug: Check all users in database
    const allUsers = await User.find({});
    console.log('🔍 All users in database during login:', allUsers.length);
    allUsers.forEach(user => {
      console.log(`  - ${user.username} (${user.email}) - Role: ${user.role}`);
    });

    // Validate credentials
    if ((!email && !username) || !password) {
      return NextResponse.json({
        success: false,
        error: 'Please provide email/username and password'
      }, { status: 400 });
    }

    // Check for user by email or username
    const query = email ? { email } : { username };
    console.log('Searching for user with query:', query);
    const user = await User.findOne(query).select('+password');
    console.log('User found:', user ? 'Yes' : 'No');

    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'Invalid credentials'
      }, { status: 401 });
    }

    // Check if user is active
    if (!user.isActive) {
      return NextResponse.json({
        success: false,
        error: 'Account is deactivated'
      }, { status: 401 });
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return NextResponse.json({
        success: false,
        error: 'Invalid credentials'
      }, { status: 401 });
    }

    // Update last login
    await user.updateLastLogin();

    // Generate tokens
    const token = user.getSignedJwtToken();
    const refreshToken = user.getRefreshToken();

    // Save refresh token to user
    user.refreshToken = refreshToken;
    await user.save();

    console.log(`User logged in: ${user.email}`);

    return NextResponse.json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        username: user.username,
        role: user.role,
        lastLogin: user.lastLogin
      },
      token,
      refreshToken
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({
      success: false,
      error: 'Server error'
    }, { status: 500 });
  }
}