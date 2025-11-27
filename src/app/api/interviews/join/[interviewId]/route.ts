import { NextRequest, NextResponse } from 'next/server';
import { dbConnect, Interview, Job, User } from '@/data-access';

// GET /api/interviews/join/[interviewId] - Validate interview access and get details
export async function GET(
  request: NextRequest,
  { params }: { params: { interviewId: string } }
) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    const candidateId = searchParams.get('candidate');

    if (!token || !candidateId) {
      return NextResponse.json({ 
        error: 'Missing required parameters',
        valid: false 
      }, { status: 400 });
    }

    // Find interview by interviewId and validate token
    const interview = await Interview.findOne({
      interviewId: params.interviewId,
      token: token,
      candidateId: candidateId
    })
    .populate('jobId', 'title company description requirements')
    .populate('candidateId', 'name email');

    if (!interview) {
      return NextResponse.json({ 
        error: 'Invalid interview link or token',
        valid: false 
      }, { status: 404 });
    }

    // Check if interview is still valid (not cancelled, not expired)
    if (interview.status === 'cancelled') {
      return NextResponse.json({ 
        error: 'This interview has been cancelled',
        valid: false,
        status: 'cancelled'
      }, { status: 410 });
    }

    if (interview.status === 'completed') {
      return NextResponse.json({ 
        error: 'This interview has already been completed',
        valid: false,
        status: 'completed'
      }, { status: 410 });
    }

    // Check if interview time has passed (allow 30 minutes grace period)
    const now = new Date();
    const interviewTime = new Date(interview.slot.date);
    const gracePeriod = 30 * 60 * 1000; // 30 minutes in milliseconds
    const maxEndTime = new Date(interviewTime.getTime() + interview.slot.duration * 60 * 1000 + gracePeriod);

    if (now > maxEndTime) {
      return NextResponse.json({ 
        error: 'This interview session has expired',
        valid: false,
        status: 'expired'
      }, { status: 410 });
    }

    // Check if interview hasn't started yet (allow 15 minutes early access)
    const earlyAccess = 15 * 60 * 1000; // 15 minutes in milliseconds
    const earliestStartTime = new Date(interviewTime.getTime() - earlyAccess);

    if (now < earliestStartTime) {
      return NextResponse.json({ 
        error: 'Interview has not started yet',
        valid: false,
        status: 'not_started',
        startTime: interviewTime.toISOString(),
        canJoinAt: earliestStartTime.toISOString()
      }, { status: 425 });
    }

    // Interview is valid - return interview details
    const interviewData = {
      id: interview._id,
      interviewId: interview.interviewId,
      candidate: {
        name: interview.candidateId.name,
        email: interview.candidateId.email
      },
      job: {
        title: interview.jobId.title,
        company: interview.jobId.company,
        description: interview.jobId.description,
        requirements: interview.jobId.requirements
      },
      slot: {
        date: interview.slot.date,
        duration: interview.slot.duration,
        type: interview.slot.type
      },
      status: interview.status,
      confirmationStatus: interview.confirmationStatus,
      valid: true,
      timeRemaining: Math.max(0, maxEndTime.getTime() - now.getTime()),
      canStart: now >= earliestStartTime && now <= maxEndTime
    };

    return NextResponse.json(interviewData);

  } catch (error) {
    console.error('Error validating interview access:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      valid: false 
    }, { status: 500 });
  }
}

// POST /api/interviews/join/[interviewId] - Start interview session
export async function POST(
  request: NextRequest,
  { params }: { params: { interviewId: string } }
) {
  try {
    await dbConnect();

    const { token, candidateId, action } = await request.json();

    if (!token || !candidateId) {
      return NextResponse.json({ 
        error: 'Missing required parameters' 
      }, { status: 400 });
    }

    const interview = await Interview.findOne({
      interviewId: params.interviewId,
      token: token,
      candidateId: candidateId
    });

    if (!interview) {
      return NextResponse.json({ 
        error: 'Invalid interview link or token' 
      }, { status: 404 });
    }

    switch (action) {
      case 'start':
        // Mark interview as in progress
        if (interview.status === 'scheduled' || interview.status === 'confirmed') {
          interview.status = 'in_progress';
          await interview.save();
        }
        break;

      case 'complete':
        // Mark interview as completed
        interview.status = 'completed';
        interview.notifications.push({
          type: 'completion',
          sentAt: new Date(),
          channel: 'in-app',
          status: 'sent'
        });
        await interview.save();
        break;

      default:
        return NextResponse.json({ 
          error: 'Invalid action' 
        }, { status: 400 });
    }

    return NextResponse.json({ 
      message: `Interview ${action}ed successfully`,
      status: interview.status 
    });

  } catch (error) {
    console.error('Error updating interview session:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
