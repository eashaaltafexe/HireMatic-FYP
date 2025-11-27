import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { dbConnect, Application } from '@/data-access';

interface JwtPayload {
  userId: string;
  email: string;
  role: string;
}

async function verifyToken(token: string): Promise<JwtPayload | null> {
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret-key');
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as JwtPayload;
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}

// POST - Save interview answers
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { applicationId, transcript, answers, overallScore, overallFeedback } = body;

    // Support both new transcript format and legacy answers format
    const interviewAnswers = transcript || answers;

    if (!interviewAnswers || !Array.isArray(interviewAnswers)) {
      return NextResponse.json({ error: 'Invalid data: transcript or answers required' }, { status: 400 });
    }

    // If no applicationId, this is a test - just return success
    if (!applicationId || applicationId === 'test' || applicationId === 'demo') {
      console.log('[Save Interview API] Test mode - not saving to database');
      return NextResponse.json({
        success: true,
        data: {
          message: 'Test interview completed successfully',
          testMode: true,
          answerCount: interviewAnswers.length
        }
      });
    }

    // Real interview - verify auth
    const authHeader = req.headers.get('authorization');
    console.log('[Save Interview API] Authorization header present:', !!authHeader);
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.warn('[Save Interview API] Missing or invalid Authorization header');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const decoded = await verifyToken(token);
    console.log('[Save Interview API] Decoded token userId:', decoded?.userId);

    if (!decoded || !decoded.userId) {
      console.warn('[Save Interview API] Token invalid after verification');
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    await dbConnect();

    // Find the application and verify ownership
    const application = await Application.findById(applicationId);
    console.log('[Save Interview API] Found application:', !!application, 'applicationId:', applicationId);

    if (!application) {
      console.warn('[Save Interview API] Application not found for id:', applicationId);
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    const appUserId = application.userId?.toString ? application.userId.toString() : String(application.userId);
    console.log('[Save Interview API] application.userId:', appUserId, 'token.userId:', decoded.userId);

    if (appUserId !== decoded.userId) {
      console.warn('[Save Interview API] Unauthorized access: token user mismatch');
      return NextResponse.json({ error: 'Unauthorized access' }, { status: 403 });
    }

    // Update interview session with transcript
    application.interviewSession = {
      startedAt: application.interviewSession?.startedAt || new Date(),
      completedAt: new Date(),
      answers: interviewAnswers, // Can be either transcript format or legacy answers
      overallScore: overallScore || 0,
      overallFeedback: overallFeedback || 'Transcript recorded - pending review',
      aiInterviewerId: 'gemini-pro'
    };

    // Update application status if needed
    if (application.status === 'Interview Scheduled') {
      application.status = 'Under Review';
    }

    // Add timeline entry
    if (!application.timeline) {
      application.timeline = [];
    }
    application.timeline.push({
      date: new Date(),
      status: 'Interview Completed',
      description: `AI interview completed - ${interviewAnswers.length} questions answered`
    });

    await application.save();

    // Trigger evaluation and PDF generation (Python script)
    try {
      const { spawn } = require('child_process');
      const scriptPath = require('path').resolve(process.cwd(), 'scripts', 'auto_evaluate_and_report.py');
      const python = spawn('python', [scriptPath]);
      python.stdout.on('data', (data) => { console.log('[AutoEval]', data.toString()); });
      python.stderr.on('data', (data) => { console.error('[AutoEval][ERR]', data.toString()); });
      python.on('close', (code) => {
        if (code === 0) {
          console.log('[AutoEval] PDF generation complete.');
        } else {
          console.error('[AutoEval] PDF generation failed.');
        }
      });
    } catch (err) {
      console.error('[AutoEval] Failed to start evaluation script:', err);
    }

    return NextResponse.json({
      success: true,
      data: {
        message: 'Interview answers saved successfully',
        applicationId: application._id,
        answerCount: interviewAnswers.length
      }
    });

  } catch (error) {
    console.error('[Save Interview API] Error:', error);
    return NextResponse.json({ 
      success: false,
      error: error instanceof Error ? error.message : 'Failed to save interview answers'
    }, { status: 500 });
  }
}

// GET - Retrieve interview answers
export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const decoded = await verifyToken(token);

    if (!decoded || !decoded.userId) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const url = new URL(req.url);
    const applicationId = url.searchParams.get('applicationId');

    if (!applicationId) {
      return NextResponse.json({ error: 'Application ID required' }, { status: 400 });
    }

    await dbConnect();

    const application = await Application.findById(applicationId)
      .populate('userId', 'name email')
      .populate('jobId', 'title company');

    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    // Allow candidate, HR, and admin to view
    if (
      application.userId._id.toString() !== decoded.userId &&
      decoded.role !== 'admin' &&
      decoded.role !== 'hr'
    ) {
      return NextResponse.json({ error: 'Unauthorized access' }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      data: {
        interviewSession: application.interviewSession || null,
        candidate: application.userId,
        job: application.jobId,
        status: application.status
      }
    });

  } catch (error) {
    console.error('[Get Interview API] Error:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Failed to retrieve interview answers'
    }, { status: 500 });
  }
}
