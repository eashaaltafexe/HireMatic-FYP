import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
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
 * Upload recording to MEGA cloud storage
 * POST /api/interviews/recording/upload-mega
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
    const { interviewId, recordingPath } = body;

    if (!interviewId || !recordingPath) {
      return NextResponse.json(
        { error: 'Interview ID and recording path are required' },
        { status: 400 }
      );
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

    console.log('[MEGA Upload] Starting upload for interview:', interviewId);
    console.log('[MEGA Upload] Recording path:', recordingPath);

    // Check if file exists
    if (!fs.existsSync(recordingPath)) {
      return NextResponse.json(
        { error: 'Recording file not found' },
        { status: 404 }
      );
    }

    // Update status to uploading
    if (interview.recording) {
      interview.recording.status = 'uploading';
      interview.recording.localPath = recordingPath;
      await interview.save();
    }

    // Upload to MEGA
    const megaService = new MegaStorageService();
    const uploadResult = await megaService.uploadRecording(recordingPath);

    if (!uploadResult.success) {
      throw new Error(uploadResult.error || 'MEGA upload failed');
    }

    console.log('[MEGA Upload] ✅ Upload successful');
    console.log('[MEGA Upload] Link:', uploadResult.link);

    // Update interview with MEGA link
    if (interview.recording) {
      interview.recording.megaLink = uploadResult.link;
      interview.recording.status = 'completed';
      interview.recording.localPath = undefined; // Clear local path after upload
      await interview.save();
    }

    console.log('[MEGA Upload] Database updated with MEGA link');

    return NextResponse.json({
      success: true,
      message: 'Recording uploaded to MEGA successfully',
      data: {
        megaLink: uploadResult.link,
        interviewId: interviewId
      }
    });

  } catch (error) {
    console.error('[MEGA Upload] Error:', error);
    
    // Try to update interview status to failed
    try {
      const { interviewId } = await request.json();
      await connectDB();
      const interview = await Interview.findById(interviewId);
      if (interview?.recording) {
        interview.recording.status = 'failed';
        await interview.save();
      }
    } catch (updateError) {
      console.error('[MEGA Upload] Failed to update status:', updateError);
    }

    return NextResponse.json(
      { 
        error: 'Failed to upload recording to MEGA',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
