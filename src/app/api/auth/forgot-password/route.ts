import { NextRequest, NextResponse } from 'next/server';
import { dbConnect, User } from '@/data-access';
import crypto from 'crypto';

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
      // For security reasons, don't reveal if user exists or not
      return NextResponse.json(
        { message: 'If your email is registered, you will receive password reset instructions.' },
        { status: 200 }
      );
    }
    
    // Generate reset token and expiry
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = Date.now() + 3600000; // 1 hour from now
    
    // Save token to user
    user.resetToken = resetToken;
    user.resetTokenExpiry = resetTokenExpiry;
    await user.save();
    
    // In a real implementation, you would send an email with this token
    // For example using a service like SendGrid, AWS SES, etc.
    console.log(`RESET TOKEN: ${resetToken} for user ${email}`);
    
    // Return success response
    return NextResponse.json(
      { 
        message: 'If your email is registered, you will receive password reset instructions.',
        // For development purposes only, we're returning the token
        // In production, remove this and only send the token via email
        dev_token: resetToken 
      },
      { status: 200 }
    );
    
  } catch (error: any) {
    console.error('Password reset error:', error);
    return NextResponse.json(
      { message: error.message || 'Password reset request failed' },
      { status: 500 }
    );
  }
} 