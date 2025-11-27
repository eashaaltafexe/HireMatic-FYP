import { NextRequest, NextResponse } from 'next/server';
import { dbConnect, User } from '@/data-access';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;
    
    console.log('Password reset attempt for email:', email);
    
    if (!email || !password) {
      console.log('Missing email or password');
      return NextResponse.json(
        { message: 'Email and password are required' },
        { status: 400 }
      );
    }
    
    // Validate password
    if (password.length < 6) {
      console.log('Password too short');
      return NextResponse.json(
        { message: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }
    
    // Connect to the database
    console.log('Connecting to database...');
    await dbConnect();
    
    // Find user by email - using case insensitive search
    const user = await User.findOne({ email: { $regex: new RegExp(`^${email}$`, 'i') } });
    
    if (!user) {
      console.log('User not found for email:', email);
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }
    
    console.log('User found, updating password for user ID:', user._id);
    
    // Update password directly instead of using the mongoose pre-save hook
    // This ensures the password is properly hashed
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Update the user document directly
    const updateResult = await User.updateOne(
      { _id: user._id },
      { 
        $set: { 
          password: hashedPassword,
          resetToken: undefined,
          resetTokenExpiry: undefined 
        } 
      }
    );
    
    console.log('Password update result:', updateResult);
    
    if (updateResult.modifiedCount === 0) {
      console.log('Password not updated - document not modified');
      return NextResponse.json(
        { message: 'Password update failed' },
        { status: 500 }
      );
    }
    
    // Return success response
    console.log('Password reset successful for user:', email);
    return NextResponse.json(
      { message: 'Password has been reset successfully' },
      { status: 200 }
    );
    
  } catch (error: any) {
    console.error('Direct password reset error:', error);
    return NextResponse.json(
      { message: error.message || 'Password reset failed' },
      { status: 500 }
    );
  }
} 