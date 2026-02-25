import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/application';
// import RecordingProcessorService from '@/application/services/recordingProcessor';
import Interview from '@/data-access/models/Interview';

/**
 * POST /api/interviews/[id]/process-recording
 * Process Agora cloud recording for an interview
 * Extracts audio, transcribes, and analyzes with AI
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authentication check
    const token = request.cookies.get('token')?.value || 
                  request.headers.get('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const decoded = verifyAuthToken(token);
    if (!decoded) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    const user = decoded;

    // Only HR/Admin can process recordings
    if (user.role !== 'hr' && user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden - HR or Admin access required' },
        { status: 403 }
      );
    }

    const interviewId = params.id;
    console.log('🎬 Processing recording for interview:', interviewId);

    // Get interview from database
    const interview = await Interview.findById(interviewId);
    if (!interview) {
      return NextResponse.json(
        { error: 'Interview not found' },
        { status: 404 }
      );
    }

    // Check if recording exists
    if (!interview.recording?.url) {
      return NextResponse.json(
        { error: 'No recording found for this interview' },
        { status: 400 }
      );
    }

    console.log('📹 Recording URL:', interview.recording.url);

    // TODO: Process the recording - RecordingProcessorService not implemented
    return NextResponse.json(
      { error: 'Recording processing service not implemented yet' },
      { status: 501 }
    );

  } catch (error) {
    console.error('❌ Error processing recording:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process recording',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/interviews/[id]/process-recording
 * Get processed recording analysis
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authentication check
    const token = request.cookies.get('token')?.value || 
                  request.headers.get('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const decoded = verifyAuthToken(token);
    if (!decoded) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    const interviewId = params.id;

    // Get interview from database
    const interview = await Interview.findById(interviewId);
    if (!interview) {
      return NextResponse.json(
        { error: 'Interview not found' },
        { status: 404 }
      );
    }

    // Check if analysis exists
    if (!interview.analysis) {
      return NextResponse.json(
        { error: 'Recording has not been processed yet' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        interviewId,
        transcript: interview.transcript,
        analysis: interview.analysis,
        recording: interview.recording
      }
    });

  } catch (error) {
    console.error('❌ Error fetching analysis:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch analysis',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
