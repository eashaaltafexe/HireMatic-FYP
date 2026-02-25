import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { AgoraService } from '@/application';
import { MegaStorageService } from '@/application/services/megaStorageService';
import Interview from '@/data-access/models/Interview';
import { connectDB } from '@/data-access';
import path from 'path';
import fs from 'fs';

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
 * Background function to download Agora recording and upload to MEGA
 */
async function uploadToMega(interviewId: string, fileInfo: any, channelName: string) {
  try {
    console.log('[MEGA] Starting background upload for interview:', interviewId);
    
    await connectDB();
    const interview = await Interview.findById(interviewId);
    if (!interview) {
      throw new Error('Interview not found');
    }

    // Update status to uploading
    if (interview.recording) {
      interview.recording.status = 'uploading';
      await interview.save();
    }

    // Get recording file URL from Agora
    const recordingUrl = `https://${process.env.AGORA_BUCKET_NAME}.s3.${process.env.AGORA_BUCKET_REGION}.amazonaws.com/${interview.recording?.resourceId}/${interview.recording?.sid}/${fileInfo.filename}`;
    
    console.log('[MEGA] Agora recording URL:', recordingUrl);

    // Download file from Agora to temp location
    const tempDir = path.join(process.cwd(), 'temp', 'recordings');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const tempFilePath = path.join(tempDir, `${interviewId}_${Date.now()}.mp4`);
    
    console.log('[MEGA] Downloading from Agora...');
    const response = await fetch(recordingUrl);
    if (!response.ok) {
      throw new Error(`Failed to download from Agora: ${response.statusText}`);
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    fs.writeFileSync(tempFilePath, buffer);
    
    console.log('[MEGA] Downloaded to:', tempFilePath);
    console.log('[MEGA] File size:', (buffer.length / 1024 / 1024).toFixed(2), 'MB');

    // Upload to MEGA
    const megaService = new MegaStorageService();
    const uploadResult = await megaService.uploadRecording(tempFilePath);

    if (!uploadResult.success) {
      throw new Error(uploadResult.error || 'MEGA upload failed');
    }

    console.log('[MEGA] ✅ Upload successful');
    console.log('[MEGA] Link:', uploadResult.link);

    // Update interview with MEGA link
    if (interview.recording) {
      interview.recording.megaLink = uploadResult.link;
      interview.recording.status = 'completed';
      await interview.save();
    }

    console.log('[MEGA] ✅ Background upload completed successfully');

  } catch (error) {
    console.error('[MEGA] Background upload error:', error);
    
    // Update status to failed
    try {
      await connectDB();
      const interview = await Interview.findById(interviewId);
      if (interview?.recording) {
        interview.recording.status = 'failed';
        await interview.save();
      }
    } catch (updateError) {
      console.error('[MEGA] Failed to update status:', updateError);
    }
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
    console.log('[Recording] Files:', recordingStatus.serverResponse.fileList);

    // Download and upload to MEGA in background (don't wait for completion)
    if (recordingStatus.serverResponse.fileList && recordingStatus.serverResponse.fileList.length > 0) {
      uploadToMega(interviewId, recordingStatus.serverResponse.fileList[0], channelName)
        .catch(error => console.error('[MEGA] Background upload failed:', error));
    }

    return NextResponse.json({
      success: true,
      message: 'Recording stopped successfully. Uploading to cloud storage...',
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
