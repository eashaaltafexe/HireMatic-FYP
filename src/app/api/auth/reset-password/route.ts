import { NextRequest, NextResponse } from 'next/server';
import { dbConnect, User } from '@/data-access';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token, password } = body;
    
    if (!token || !password) {
      return NextResponse.json(
        { message: 'Token and password are required' },
        { status: 400 }
      );
    }
    
    // Validate password
    if (password.length < 6) {
      return NextResponse.json(
        { message: 'Password must be at least 6 characters long' },
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
    
    // Update password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    
    // Clear reset token and expiry
    user.resetToken = undefined;
    user.resetTokenExpiry = undefined;
    
    await user.save();
    
    // Return success response
    return NextResponse.json(
      { message: 'Password has been reset successfully' },
      { status: 200 }
    );
    
  } catch (error: any) {
    console.error('Password reset error:', error);
    return NextResponse.json(
      { message: error.message || 'Password reset failed' },
      { status: 500 }
    );
  }
} 