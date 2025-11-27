import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Simple endpoint to test if the server is working
    return NextResponse.json({
      success: true,
      message: 'Debug endpoint is working',
      timestamp: new Date().toISOString(),
      environment: {
        nodeEnv: process.env.NODE_ENV,
        mongodbConfigured: !!process.env.MONGODB_URI,
        jwtConfigured: !!process.env.JWT_SECRET
      }
    });
  } catch (error: any) {
    return NextResponse.json({ 
      error: 'Debug endpoint failed',
      details: error.message || 'Unknown error'
    }, { status: 500 });
  }
}