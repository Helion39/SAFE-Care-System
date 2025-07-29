import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({
        success: false,
        error: 'No token provided'
      }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string };
      const user = await User.findById(decoded.id);

      if (!user) {
        return NextResponse.json({
          success: false,
          error: 'User not found'
        }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        data: {
          id: user._id,
          name: user.name,
          email: user.email,
          username: user.username,
          role: user.role,
          lastLogin: user.lastLogin,
          createdAt: user.createdAt
        }
      });
    } catch (jwtError) {
      return NextResponse.json({
        success: false,
        error: 'Invalid token'
      }, { status: 401 });
    }
  } catch (error) {
    console.error('Get profile error:', error);
    return NextResponse.json({
      success: false,
      error: 'Server error'
    }, { status: 500 });
  }
}