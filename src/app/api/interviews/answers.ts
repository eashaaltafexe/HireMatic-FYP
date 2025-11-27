import { NextRequest, NextResponse } from 'next/server';
import { dbConnect, Application } from '@/data-access';

// POST /api/interviews/answers
export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const body = await request.json();
    const { applicationId, answers, startedAt, completedAt, overallScore, overallFeedback } = body;

    if (!applicationId || !Array.isArray(answers)) {
      return NextResponse.json({ error: 'Missing applicationId or answers' }, { status: 400 });
    }

    // Update Application with interviewSession
    const update = {
      interviewSession: {
        startedAt: startedAt ? new Date(startedAt) : new Date(),
        completedAt: completedAt ? new Date(completedAt) : new Date(),
        answers,
        overallScore: overallScore || null,
        overallFeedback: overallFeedback || '',
      }
    };

    const result = await Application.findByIdAndUpdate(applicationId, update, { new: true });
    if (!result) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, interviewSession: result.interviewSession });
  } catch (error) {
    console.error('Error saving interview answers:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
