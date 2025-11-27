import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/application';
import RecordingProcessorService from '@/application/services/recordingProcessor';
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
    const authResult = await verifyAuth(request);
    if (!authResult.isValid || !authResult.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const user = authResult.user;

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

    // Process the recording
    const result = await RecordingProcessorService.processRecording(
      interview.recording.url,
      interviewId
    );

    console.log('✅ Recording processed successfully');
    console.log('📝 Transcript length:', result.transcript.words.length, 'words');
    console.log('🎯 Overall score:', result.analysis.overallScore);
    console.log('💡 Recommendation:', result.analysis.recommendation);

    // Save transcript and analysis to interview document
    interview.transcript = {
      text: result.transcript.fullText,
      words: result.transcript.words,
      language: result.transcript.language,
      confidence: result.transcript.confidence
    };

    interview.analysis = {
      communicationScore: result.analysis.communicationScore,
      technicalScore: result.analysis.technicalScore,
      confidenceLevel: result.analysis.confidenceLevel,
      enthusiasm: result.analysis.enthusiasm,
      professionalismScore: result.analysis.professionalismScore,
      overallScore: result.analysis.overallScore,
      recommendation: result.analysis.recommendation,
      strengths: result.analysis.strengths,
      weaknesses: result.analysis.weaknesses,
      detailedFeedback: result.analysis.detailedFeedback,
      speakingMetrics: result.analysis.speakingMetrics,
      technicalKeywords: result.analysis.technicalKeywords,
      processedAt: new Date()
    };

    await interview.save();

    console.log('💾 Analysis saved to database');

    return NextResponse.json({
      success: true,
      message: 'Recording processed successfully',
      data: {
        interviewId,
        transcript: result.transcript,
        analysis: result.analysis,
        speakingMetrics: result.analysis.speakingMetrics
      }
    });

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
    const authResult = await verifyAuth(request);
    if (!authResult.isValid || !authResult.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
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
