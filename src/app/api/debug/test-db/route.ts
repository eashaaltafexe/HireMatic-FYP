import { NextRequest, NextResponse } from 'next/server';
import { dbConnect, User } from '@/data-access';

export async function GET(req: NextRequest) {
  try {
    // Test database connection
    await dbConnect();
    console.log('✅ Database connected successfully');

    // Test if we can access the User model
    const userCount = await User.countDocuments();
    console.log(`📊 Total users in database: ${userCount}`);

    // Get first 5 users (without sensitive data)
    const users = await User.find({}, { email: 1, name: 1, role: 1 }).limit(5);
    console.log('👥 Sample users:', users);

    return NextResponse.json({
      success: true,
      message: 'Database connection successful',
      userCount,
      sampleUsers: users
    });

  } catch (error) {
    console.error('❌ Database test error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error
    }, { status: 500 });
  }
}