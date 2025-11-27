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
 * Stop recording for an interview
 * POST /api/interviews/recording/stop
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
      console.log('[Recording] Test mode - skipping stop recording');
      return NextResponse.json({
        success: true,
        message: 'Test mode - stop recording skipped',
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

    if (!interview.recording || !interview.recording.resourceId || !interview.recording.sid) {
      return NextResponse.json(
        { error: 'No active recording found for this interview' },
        { status: 400 }
      );
    }

    // Generate channel name from interview ID
    const channelName = AgoraService.generateChannelName(interviewId);
    
    console.log('[Recording] Stopping recording for channel:', channelName);

    // Stop recording
    const recordingStatus = await AgoraService.stopRecording(
      channelName,
      interview.recording.recordingUid,
      interview.recording.resourceId,
      interview.recording.sid
    );

    // Update interview with recording files
    interview.recording.status = 'completed';
    interview.recording.stoppedAt = new Date();
    interview.recording.files = recordingStatus.serverResponse.fileList;

    await interview.save();

    console.log('[Recording] Recording stopped successfully for interview:', interviewId);

    return NextResponse.json({
      success: true,
      message: 'Recording stopped successfully',
      data: {
        files: recordingStatus.serverResponse.fileList,
        status: 'completed'
      }
    });

  } catch (error) {
    console.error('[Recording] Error stopping recording:', error);
    return NextResponse.json(
      { 
        error: 'Failed to stop recording',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
