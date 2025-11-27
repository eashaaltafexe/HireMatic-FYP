import { NextRequest, NextResponse } from 'next/server';
import { verifyAndClearOTP } from '@/application';

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
    
    // Verify OTP
    const isValid = await verifyAndClearOTP(email, otp);
    
    if (!isValid) {
      return NextResponse.json(
        { message: 'Invalid or expired OTP' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { message: 'OTP verified successfully' },
      { status: 200 }
    );
    
  } catch (error: any) {
    console.error('Verify OTP error:', error);
    return NextResponse.json(
      { message: error.message || 'Failed to verify OTP' },
      { status: 500 }
    );
  }
}
