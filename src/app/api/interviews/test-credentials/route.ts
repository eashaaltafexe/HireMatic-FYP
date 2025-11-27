import { NextResponse } from 'next/server';
import { AgoraService } from '@/application/services/agoraService';

// GET - Generate test Agora credentials for test interview
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const channel = searchParams.get('channel') || `test-interview-${Date.now()}`;
    
    console.log('[Test Credentials API] Generating credentials for channel:', channel);

    // Generate token for test user
    const testUserId = `test-user-${Math.floor(Math.random() * 10000)}`;
    const token = AgoraService.generateRtcToken({
      channelName: channel,
      userId: testUserId,
      role: 'publisher'
    });

    const uid = AgoraService.generateNumericUid(testUserId);
    const appId = process.env.NEXT_PUBLIC_AGORA_APP_ID || '';

    return NextResponse.json({
      success: true,
      data: {
        appId,
        channel,
        token,
        uid
      }
    });

  } catch (error) {
    console.error('[Test Credentials API] Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate credentials'
    }, { status: 500 });
  }
}
