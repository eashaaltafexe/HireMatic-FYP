import { NextRequest, NextResponse } from 'next/server';
import { dbConnect, User } from '@/data-access';
import { createToken } from '@/application';

export async function POST(req: NextRequest) {
  try {
    // Parse request body
    let body;
    try {
      body = await req.json();
    } catch (parseError) {
      return NextResponse.json(
        { message: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }
    
    const { email, otp } = body;
    
    if (!email || !otp) {
      return NextResponse.json(
        { message: 'Email and OTP are required' },
        { status: 400 }
      );
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { message: 'Invalid email format' },
        { status: 400 }
      );
    }
    
    // Validate OTP format (6 digits)
    if (!/^\d{6}$/.test(otp)) {
      return NextResponse.json(
        { message: 'OTP must be 6 digits' },
        { status: 400 }
      );
    }
    
    // Connect to the database
    await dbConnect();
    
    // Find the user
    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }
    
    // Check if OTP is valid and not expired
    if (!user.resetToken || !user.resetTokenExpiry) {
      return NextResponse.json(
        { message: 'No OTP found for this email' },
        { status: 400 }
      );
    }
    
    const expiresAt = new Date(user.resetTokenExpiry);
    if (new Date() > expiresAt) {
      return NextResponse.json(
        { message: 'OTP has expired' },
        { status: 400 }
      );
    }
    
    if (user.resetToken !== otp) {
      return NextResponse.json(
        { message: 'Invalid OTP' },
        { status: 400 }
      );
    }
    
    // Mark email as verified and clear OTP
    user.emailVerified = true;
    user.resetToken = undefined;
    user.resetTokenExpiry = undefined;
    await user.save();
    
    // Generate token
    const token = await createToken(user);
    
    // Return user info (excluding password) and token
    const userObj = user.toObject();
    delete userObj.password;
    
    return NextResponse.json(
      { 
        message: 'Registration completed successfully',
        user: userObj,
        token
      },
      { status: 200 }
    );
    
  } catch (error: any) {
    console.error('Complete registration error:', error);
    return NextResponse.json(
      { message: error.message || 'Failed to complete registration' },
      { status: 500 }
    );
  }
}
