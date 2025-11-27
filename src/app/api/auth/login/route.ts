import { NextRequest, NextResponse } from 'next/server';
import { dbConnect, User } from '@/data-access';
import { createToken } from '@/application';
import mongoose from 'mongoose';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;
    
    console.log('Login attempt for email:', email);
    
    // Validate required fields
    if (!email || !password) {
      console.log('Missing email or password');
      return NextResponse.json(
        { message: 'Please provide email and password' },
        { status: 400 }
      );
    }
    
    try {
      // Connect to the database
      console.log('Connecting to database...');
      await dbConnect();
    } catch (dbError) {
      console.error('Database connection error:', dbError);
      return NextResponse.json(
        { message: 'Unable to connect to database. Please check your configuration.' },
        { status: 500 }
      );
    }
    
    // Debugging: Log which database we're connected to
    console.log('Connected to database:', mongoose.connection.name);
    
    // Try to find users with debug info
    const totalUsers = await User.countDocuments();
    console.log(`Total users in database: ${totalUsers}`);
    
    if (totalUsers === 0) {
      console.log('No users found in database. Database might be empty or wrong database selected.');
    } else {
      // Show a sample of users without exposing passwords
      const sampleUsers = await User.find().limit(3).select('email role');
      console.log('Sample users:', JSON.stringify(sampleUsers));
    }
    
    // Case insensitive search for email
    const user = await User.findOne({ email: { $regex: new RegExp(`^${email}$`, 'i') } });
    console.log('User found:', user ? 'Yes' : 'No');
    
    // Check if user exists
    if (!user) {
      console.log('User not found');
      return NextResponse.json(
        { message: 'Invalid credentials' },
        { status: 401 }
      );
    }
    
    // Check if password is correct
    const isPasswordValid = await user.comparePassword(password);
    console.log('Password valid:', isPasswordValid);
    if (!isPasswordValid) {
      console.log('Invalid password');
      return NextResponse.json(
        { message: 'Invalid credentials' },
        { status: 401 }
      );
    }
    
    // Generate token
    const token = await createToken(user);
    console.log('Token generated for user:', { id: user._id, role: user.role });
    
    // Return user info (excluding password) and token
    const userObj = user.toObject();
    delete userObj.password;
    
    console.log('Login successful for user with role:', user.role);
    
    return NextResponse.json({
      message: 'Login successful',
      user: userObj,
      token
    });
    
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json(
      { message: error.message || 'Login failed' },
      { status: 500 }
    );
  }
} 