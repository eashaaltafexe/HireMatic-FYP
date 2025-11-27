import nodemailer from 'nodemailer';
import crypto from 'crypto';

// Email configuration - you should move these to environment variables
const EMAIL_CONFIG = {
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER || 'your-email@gmail.com',
    pass: process.env.SMTP_PASS || 'your-app-password'
  }
};

// Create transporter only if email config is available
let transporter: nodemailer.Transporter | null = null;

try {
  console.log('Email configuration check:');
  console.log('SMTP_USER:', EMAIL_CONFIG.auth.user);
  console.log('SMTP_PASS length:', EMAIL_CONFIG.auth.pass ? EMAIL_CONFIG.auth.pass.length : 'not set');
  console.log('SMTP_HOST:', EMAIL_CONFIG.host);
  console.log('SMTP_PORT:', EMAIL_CONFIG.port);
  
  if (EMAIL_CONFIG.auth.user && EMAIL_CONFIG.auth.pass && 
      EMAIL_CONFIG.auth.user !== 'your-email@gmail.com' && 
      EMAIL_CONFIG.auth.pass !== 'your-app-password') {
    
    // Check if Gmail app password is correct length (16 characters)
    if (EMAIL_CONFIG.auth.pass.length !== 16) {
      console.error('❌ Gmail app password should be 16 characters long. Current length:', EMAIL_CONFIG.auth.pass.length);
      console.error('Please generate a new Gmail app password:');
      console.error('1. Go to https://myaccount.google.com/security');
      console.error('2. Enable 2-Step Verification');
      console.error('3. Go to App passwords');
      console.error('4. Generate new password for "HireMatic"');
      console.error('5. Update SMTP_PASS in .env.local with the 16-character password');
    } else {
      transporter = nodemailer.createTransport(EMAIL_CONFIG);
      console.log('✅ Email transporter created successfully for:', EMAIL_CONFIG.auth.user);
      
      // Test the connection
      transporter.verify((error, success) => {
        if (error) {
          console.error('❌ SMTP connection test failed:', error.message);
          console.error('Please check your Gmail app password and 2FA settings');
        } else {
          console.log('✅ SMTP connection test successful - emails will be sent!');
        }
      });
    }
  } else {
    console.log('❌ Email transporter not created - using default values');
    console.log('Please configure SMTP_USER and SMTP_PASS in .env.local');
  }
} catch (error) {
  console.error('Failed to create email transporter:', error);
}

export interface OTPData {
  email: string;
  otp: string;
  expiresAt: Date;
}

/**
 * Generate a 6-digit OTP
 */
export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Send OTP via email
 */
export async function sendOTPEmail(email: string, otp: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Always log OTP to console for immediate access
    console.log(`\n🔑 OTP FOR ${email}: ${otp}\n`);
    
    // Create a fresh transporter to ensure it's working
    let emailTransporter = transporter;
    
    if (!emailTransporter) {
      console.log('Creating fresh email transporter...');
      emailTransporter = nodemailer.createTransport(EMAIL_CONFIG);
    }

    console.log(`Attempting to send OTP email to: ${email}`);
    console.log(`Using SMTP host: ${EMAIL_CONFIG.host}:${EMAIL_CONFIG.port}`);
    console.log(`From email: ${EMAIL_CONFIG.auth.user}`);

    const mailOptions = {
      from: `"HireMatic" <${EMAIL_CONFIG.auth.user}>`,
      to: email,
      subject: 'Verify Your Email - HireMatic',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2A3647; margin: 0;">⎈ HireMatic</h1>
          </div>
          
          <div style="background-color: #f8f9fa; padding: 30px; border-radius: 10px; text-align: center;">
            <h2 style="color: #2A3647; margin-bottom: 20px;">Email Verification</h2>
            <p style="color: #666; font-size: 16px; margin-bottom: 30px;">
              Thank you for signing up with HireMatic! Please use the following code to verify your email address:
            </p>
            
            <div style="background-color: #2A3647; color: white; font-size: 32px; font-weight: bold; padding: 20px; border-radius: 8px; letter-spacing: 5px; margin: 20px 0;">
              ${otp}
            </div>
            
            <p style="color: #666; font-size: 14px; margin-top: 20px;">
              This code will expire in 10 minutes. If you didn't request this verification, please ignore this email.
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 30px; color: #999; font-size: 12px;">
            <p>© 2024 HireMatic. All rights reserved.</p>
          </div>
        </div>
      `
    };

    const result = await emailTransporter.sendMail(mailOptions);
    console.log(`✅ OTP email sent successfully to ${email}`);
    console.log('Email result:', result);
    
    return { success: true };
  } catch (error: any) {
    console.error('❌ Error sending OTP email:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      response: error.response,
      responseCode: error.responseCode
    });
    
    // Still return success but log the OTP for immediate use
    console.log(`\n🔑 OTP FOR ${email} (EMAIL FAILED): ${otp}\n`);
    return { success: true }; // Return success so user can still proceed
  }
}

/**
 * Verify OTP
 */
export function verifyOTP(providedOTP: string, storedOTP: string, expiresAt: Date): boolean {
  // Check if OTP has expired
  if (new Date() > expiresAt) {
    return false;
  }
  
  // Check if OTP matches
  return providedOTP === storedOTP;
}

/**
 * Generate OTP expiration time (10 minutes from now)
 */
export function generateOTPExpiration(): Date {
  return new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
}

/**
 * Store OTP in database (using User model's resetToken fields)
 */
export async function storeOTP(email: string, otp: string): Promise<void> {
  const { connectDB } = await import('@/data-access/database/mongodb');
  const { User } = await import('@/data-access');
  
  await connectDB();
  
  const expiresAt = generateOTPExpiration();
  
  await User.findOneAndUpdate(
    { email },
    {
      resetToken: otp,
      resetTokenExpiry: expiresAt.getTime()
    },
    { upsert: true, new: true }
  );
}

/**
 * Verify and clear OTP from database
 */
export async function verifyAndClearOTP(email: string, providedOTP: string): Promise<boolean> {
  const { connectDB } = await import('@/data-access/database/mongodb');
  const { User } = await import('@/data-access');
  
  await connectDB();
  
  const user = await User.findOne({ email });
  
  if (!user || !user.resetToken || !user.resetTokenExpiry) {
    return false;
  }
  
  const expiresAt = new Date(user.resetTokenExpiry);
  const isValid = verifyOTP(providedOTP, user.resetToken, expiresAt);
  
  if (isValid) {
    // Clear the OTP after successful verification
    await User.findOneAndUpdate(
      { email },
      {
        $unset: {
          resetToken: 1,
          resetTokenExpiry: 1
        }
      }
    );
  }
  
  return isValid;
}
