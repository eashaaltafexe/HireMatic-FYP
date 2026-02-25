import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { dbConnect } from '@/data-access';
import Interview from '@/layers/1-data-access/models/Interview';
import Application from '@/layers/1-data-access/models/Application';
import { verify } from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';

async function verifyToken(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7);
    const decoded = verify(token, JWT_SECRET);
    return decoded;
  } catch (error) {
    console.error('[Upload] Token verification failed:', error);
    return null;
  }
}

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

    const formData = await request.formData();
    const recording = formData.get('recording') as File;
    const interviewId = formData.get('interviewId') as string;
    const applicationId = formData.get('applicationId') as string;

    if (!recording) {
      return NextResponse.json(
        { error: 'No recording file provided' },
        { status: 400 }
      );
    }

    if (!interviewId) {
      return NextResponse.json(
        { error: 'Interview ID is required' },
        { status: 400 }
      );
    }

    console.log('[Upload] Received recording:', {
      filename: recording.name,
      size: `${(recording.size / 1024 / 1024).toFixed(2)} MB`,
      type: recording.type,
      interviewId,
      applicationId
    });

    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'recordings');
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
      console.log('[Upload] Created uploads directory:', uploadsDir);
    }

    // Generate unique filename
    const timestamp = Date.now();
    const filename = `interview-${interviewId}-${timestamp}.webm`;
    const filepath = path.join(uploadsDir, filename);

    // Convert File to Buffer and save
    const bytes = await recording.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filepath, buffer);

    console.log('[Upload] ✅ File saved to:', filepath);

    // Generate public URL
    const recordingUrl = `/uploads/recordings/${filename}`;

    // Connect to database and update records
    await dbConnect();

    // Update interview record if exists
    try {
      const interview = await Interview.findById(interviewId);
      if (interview) {
        interview.recording = {
          ...interview.recording,
          recordingUrl,
          fileSize: recording.size,
          uploadedAt: new Date(),
          status: 'completed'
        };
        await interview.save();
        console.log('[Upload] Updated interview record');
      }
    } catch (error) {
      console.log('[Upload] Interview record not found or update failed:', error);
    }

    // Update application record
    if (applicationId) {
      try {
        const application = await Application.findById(applicationId);
        if (application) {
          if (!application.interviewSession) {
            application.interviewSession = {};
          }
          application.interviewSession.recordingUrl = recordingUrl;
          application.interviewSession.recordingSize = recording.size;
          application.interviewSession.recordedAt = new Date();
          await application.save();
          console.log('[Upload] Updated application record');
        }
      } catch (error) {
        console.log('[Upload] Application record not found or update failed:', error);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Recording uploaded successfully',
      data: {
        recordingUrl,
        filename,
        fileSize: recording.size,
        fileSizeMB: (recording.size / 1024 / 1024).toFixed(2)
      }
    });

  } catch (error: any) {
    console.error('[Upload] Error uploading recording:', error);
    return NextResponse.json(
      {
        error: 'Failed to upload recording',
        details: error.message
      },
      { status: 500 }
    );
  }
}

// Configure to handle large files
export const config = {
  api: {
    bodyParser: false, // Disable default body parser
    responseLimit: '100mb', // Allow large responses
  },
};


