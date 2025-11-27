import { NextRequest, NextResponse } from 'next/server';
import { dbConnect, User } from '@/data-access';
import { createToken } from '@/application';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, password, role, company } = body;
    
    // Validate required fields
    if (!name || !email || !password) {
      return NextResponse.json(
        { message: 'Please provide all required fields' },
        { status: 400 }
      );
    }
    
    // Connect to the database
    await dbConnect();
    
    // Check if user with this email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      // If user exists but email is not verified, allow resending OTP
      if (!existingUser.emailVerified) {
        return NextResponse.json(
          { 
            message: 'User exists but email not verified. OTP will be sent.',
            userExists: true,
            emailNotVerified: true
          },
          { status: 200 }
        );
      } else {
        return NextResponse.json(
          { message: 'Email already in use' },
          { status: 400 }
        );
      }
    }
    
    // Create new user (initially unverified)
    const user = await User.create({
      name,
      email,
      password,
      role: role || 'candidate', // Default to candidate if not provided
      company: role === 'hr' || role === 'admin' ? company : undefined,
      emailVerified: false, // Will be set to true after OTP verification
    });
    
    // Generate token
    const token = await createToken(user);
    
    // Return user info (excluding password) and token
    const userObj = user.toObject();
    delete userObj.password;
    
    return NextResponse.json(
      { 
        message: 'Registration successful',
        user: userObj,
        token
      },
      { status: 201 }
    );
    
  } catch (error: any) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { message: error.message || 'Registration failed' },
      { status: 500 }
    );
  }
} 