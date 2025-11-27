import { NextRequest, NextResponse } from 'next/server';
import { dbConnect, User } from '@/data-access';

export async function GET(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get('token');
    
    if (!token) {
      return NextResponse.json(
        { message: 'Reset token is required' },
        { status: 400 }
      );
    }
    
    // Connect to the database
    await dbConnect();
    
    // Find user with this token and check if it's still valid
    const user = await User.findOne({
      resetToken: token,
      resetTokenExpiry: { $gt: Date.now() }
    });
    
    if (!user) {
      return NextResponse.json(
        { message: 'Invalid or expired reset token' },
        { status: 400 }
      );
    }
    
    // Token is valid
    return NextResponse.json(
      { message: 'Token is valid' },
      { status: 200 }
    );
    
  } catch (error: any) {
    console.error('Token verification error:', error);
    return NextResponse.json(
      { message: error.message || 'Token verification failed' },
      { status: 500 }
    );
  }
} 