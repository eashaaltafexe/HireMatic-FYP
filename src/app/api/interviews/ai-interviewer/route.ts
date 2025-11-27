import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import AIInterviewer from '@/business-logic/ai-services/aiInterviewer';
import type { Question } from '@/business-logic/ai-services/aiInterviewer';

// Store active interview sessions in memory (in production, use Redis or database)
const activeInterviews = new Map<string, AIInterviewer>();

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

// POST - Start or interact with AI interview
export async function POST(req: Request) {
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

    const body = await req.json();
    const { action, interviewId, applicationId, candidateInput } = body;

    if (!interviewId || !applicationId) {
      return NextResponse.json({ error: 'Interview ID and Application ID required' }, { status: 400 });
    }

    const sessionKey = `${interviewId}_${decoded.userId}`;

    // Initialize interview
    if (action === 'initialize') {
      const { questions, jobTitle, candidateName } = body;

      if (!questions || !Array.isArray(questions) || questions.length === 0) {
        return NextResponse.json({ error: 'Questions required' }, { status: 400 });
      }

      const interviewer = new AIInterviewer();
      interviewer.initializeInterview(questions, jobTitle || 'Position', candidateName || 'Candidate');
      
      activeInterviews.set(sessionKey, interviewer);

      const welcomeMessage = interviewer.getWelcomeMessage();
      const firstQuestion = interviewer.getCurrentQuestion();

      return NextResponse.json({
        success: true,
        data: {
          message: welcomeMessage,
          action: 'start',
          question: firstQuestion,
          progress: interviewer.getProgress()
        }
      });
    }

    // Process candidate response
    if (action === 'respond') {
      if (!candidateInput) {
        return NextResponse.json({ error: 'Candidate input required' }, { status: 400 });
      }

      const interviewer = activeInterviews.get(sessionKey);
      if (!interviewer) {
        return NextResponse.json({ 
          error: 'Interview session not found. Please refresh the page.' 
        }, { status: 404 });
      }

      const response = await interviewer.processResponse(candidateInput);
      const progress = interviewer.getProgress();

      // If interview is complete, save answers and clean up
      if (response.action === 'complete') {
        const answers = interviewer.getAnswers();
        
        // Clean up session
        activeInterviews.delete(sessionKey);

        return NextResponse.json({
          success: true,
          data: {
            ...response,
            progress,
            answers,
            completed: true
          }
        });
      }

      return NextResponse.json({
        success: true,
        data: {
          ...response,
          progress,
          completed: false
        }
      });
    }

    // Get current status
    if (action === 'status') {
      const interviewer = activeInterviews.get(sessionKey);
      if (!interviewer) {
        return NextResponse.json({ 
          success: true,
          data: { initialized: false }
        });
      }

      return NextResponse.json({
        success: true,
        data: {
          initialized: true,
          progress: interviewer.getProgress(),
          currentQuestion: interviewer.getCurrentQuestion()
        }
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    console.error('[AI Interview API] Error:', error);
    return NextResponse.json({ 
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    }, { status: 500 });
  }
}

// GET - Get interview answers (for saving to database)
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
    const interviewId = url.searchParams.get('interviewId');

    if (!interviewId) {
      return NextResponse.json({ error: 'Interview ID required' }, { status: 400 });
    }

    const sessionKey = `${interviewId}_${decoded.userId}`;
    const interviewer = activeInterviews.get(sessionKey);

    if (!interviewer) {
      return NextResponse.json({ 
        success: true,
        data: { answers: [], progress: { current: 0, total: 0, percentage: 0 } }
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        answers: interviewer.getAnswers(),
        progress: interviewer.getProgress()
      }
    });

  } catch (error) {
    console.error('[AI Interview API] Error:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Failed to get interview data'
    }, { status: 500 });
  }
}
