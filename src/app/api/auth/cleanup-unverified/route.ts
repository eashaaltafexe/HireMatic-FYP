import { NextRequest, NextResponse } from 'next/server';
import { dbConnect, User } from '@/data-access';

export async function GET(req: NextRequest) {
  return NextResponse.json(
    { message: 'Cleanup API is working' },
    { status: 200 }
  );
}

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
    
    const { email } = body;
    
    if (!email) {
      return NextResponse.json(
        { message: 'Email is required' },
        { status: 400 }
      );
    }
    
    // Connect to the database
    await dbConnect();
    
    // Find and delete unverified user
    const result = await User.findOneAndDelete({ 
      email, 
      emailVerified: false 
    });
    
    if (!result) {
      return NextResponse.json(
        { message: 'No unverified user found with this email' },
        { status: 404 }
      );
    }
    
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
    
  } catch (error: any) {
    console.error('Cleanup error:', error);
    return NextResponse.json(
      { message: error.message || 'Failed to cleanup user' },
      { status: 500 }
    );
  }
}
