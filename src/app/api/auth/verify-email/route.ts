import { NextRequest, NextResponse } from 'next/server';
import { dbConnect, User } from '@/data-access';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = body;
    
    if (!email) {
      return NextResponse.json(
        { message: 'Email is required' },
        { status: 400 }
      );
    }
    
    // Connect to the database
    await dbConnect();
    
    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json(
        { message: 'No account found with this email address' },
        { status: 404 }
      );
    }
    
    // Email exists
    return NextResponse.json(
      { message: 'Email verified successfully' },
      { status: 200 }
    );
    
  } catch (error: any) {
    console.error('Email verification error:', error);
    return NextResponse.json(
      { message: error.message || 'Email verification failed' },
      { status: 500 }
    );
  }
} 