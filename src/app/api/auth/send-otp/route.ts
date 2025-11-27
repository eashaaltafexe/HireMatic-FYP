import { NextRequest, NextResponse } from 'next/server';
import { sendOTPEmail, generateOTP, storeOTP } from '@/application';

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
    
    const { email, cleanup } = body;
    
    if (!email) {
      return NextResponse.json(
        { message: 'Email is required' },
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
    
    // If cleanup is requested, delete unverified user first
    if (cleanup) {
      const { connectDB } = await import('@/data-access/database/mongodb');
      const { User } = await import('@/data-access');
      
      await connectDB();
      
      const result = await User.findOneAndDelete({ 
        email, 
        emailVerified: false 
      });
      
      if (result) {
        return NextResponse.json(
          { 
            message: 'Unverified user deleted successfully',
            deletedUser: {
              email: result.email,
              name: result.name,
              createdAt: result.createdAt
            }
          },
          { status: 200 }
        );
      } else {
        return NextResponse.json(
          { message: 'No unverified user found with this email' },
          { status: 404 }
        );
      }
    }
    
    // Generate OTP
    const otp = generateOTP();
    
    // Send OTP via email
    const emailResult = await sendOTPEmail(email, otp);
    
    if (!emailResult.success) {
      return NextResponse.json(
        { message: 'Failed to send OTP email', error: emailResult.error },
        { status: 500 }
      );
    }
    
    // Store OTP in database
    await storeOTP(email, otp);
    
    return NextResponse.json(
      { message: 'OTP sent successfully' },
      { status: 200 }
    );
    
  } catch (error: any) {
    console.error('Send OTP error:', error);
    return NextResponse.json(
      { message: error.message || 'Failed to send OTP' },
      { status: 500 }
    );
  }
}
