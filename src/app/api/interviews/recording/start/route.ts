import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { AgoraService } from '@/application';
import Interview from '@/data-access/models/Interview';
import { connectDB } from '@/data-access';

interface JwtPayload {
  userId: string;
  email: string;
  role: string;
}

async function verifyToken(request: NextRequest): Promise<JwtPayload | null> {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) return null;

    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret');
    const { payload } = await jwtVerify(token, secret);
    
    const jwtPayload = payload as any;
    return {
      userId: jwtPayload.userId,
      email: jwtPayload.email,
      role: jwtPayload.role
    };
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}

/**
 * Start recording for an interview
 * POST /api/interviews/recording/start
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const decoded = await verifyToken(request);
    if (!decoded) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { interviewId } = body;

    if (!interviewId) {
      return NextResponse.json(
        { error: 'Interview ID is required' },
        { status: 400 }
      );
    }

    // Skip recording for test mode
    if (interviewId === 'TEST-INTERVIEW' || interviewId.startsWith('TEST-')) {
      console.log('[Recording] Test mode - skipping cloud recording');
      return NextResponse.json({
        success: true,
        message: 'Test mode - recording skipped',
        testMode: true
      });
    }

    // Connect to database
    await connectDB();

    // Get interview details
    const interview = await Interview.findById(interviewId);
    if (!interview) {
      return NextResponse.json(
        { error: 'Interview not found' },
        { status: 404 }
      );
    }

    // Generate channel name from interview ID
    const channelName = AgoraService.generateChannelName(interviewId);
    
    // Use a unique recording UID (string format for cloud recording)
    const recordingUid = `recorder_${Date.now()}`;

    // Generate token for recording bot
    const recordingToken = AgoraService.generateRtcToken({
      channelName,
      userId: recordingUid,
      role: 'publisher'
    });

    console.log('[Recording] Acquiring resource for channel:', channelName);

    // Step 1: Acquire recording resource
    const resource = await AgoraService.acquireRecordingResource(
      channelName,
      recordingUid
    );

    console.log('[Recording] Starting recording with resourceId:', resource.resourceId);

    // Step 2: Start recording
    const recording = await AgoraService.startRecording(
      channelName,
      recordingUid,
      resource.resourceId,
      recordingToken,
      {
        recordingMode: 'composite',
        maxIdleTime: 30,
        streamTypes: 2, // audio and video
        channelType: 0
      }
    );

    // Step 3: Save recording info to interview
    interview.recording = {
      resourceId: recording.resourceId,
      sid: recording.sid,
      recordingUid: recordingUid,
      startedAt: new Date(),
      status: 'recording'
    };

    await interview.save();

    console.log('[Recording] Recording started successfully for interview:', interviewId);

    return NextResponse.json({
      success: true,
      message: 'Recording started successfully',
      data: {
        resourceId: recording.resourceId,
        sid: recording.sid,
        channelName: channelName
      }
    });

  } catch (error) {
    console.error('[Recording] Error starting recording:', error);
    return NextResponse.json(
      { 
        error: 'Failed to start recording',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
