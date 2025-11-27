import { NextRequest, NextResponse } from 'next/server';
import { dbConnect, Interview, Application, Job, User } from '@/data-access';
import { jwtVerify } from 'jose';
import { generateAvailableSlots, sendNotification } from '@/application';

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
    
    // Convert payload to our expected format
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

// GET /api/interviews/[id] - Get specific interview details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const decoded = await verifyToken(request);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const interview = await Interview.findById(params.id)
      .populate('jobId', 'title company description requirements')
      .populate('candidateId', 'name email')
      .populate('applicationId', 'status');

    if (!interview) {
      return NextResponse.json({ error: 'Interview not found' }, { status: 404 });
    }

    // Check if user has access to this interview
    if (interview.candidateId._id.toString() !== decoded.userId && decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({ interview });

  } catch (error) {
    console.error('Error fetching interview:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/interviews/[id] - Update interview (confirm/reschedule)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const decoded = await verifyToken(request);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const { action, newDate, reason } = await request.json();

    const interview = await Interview.findById(params.id)
      .populate('jobId', 'title company')
      .populate('candidateId', 'name email');

    if (!interview) {
      return NextResponse.json({ error: 'Interview not found' }, { status: 404 });
    }

    // Check if user has access to this interview
    if (interview.candidateId._id.toString() !== decoded.userId && decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    let responseMessage = '';
    const notificationData: any = {};

    switch (action) {
      case 'confirm':
        interview.confirmationStatus = 'confirmed';
        interview.status = 'confirmed';
        interview.notifications.push({
          type: 'confirmation',
          sentAt: new Date(),
          channel: 'in-app',
          status: 'sent'
        });
        responseMessage = 'Interview confirmed successfully';
        
        // Send confirmation notification
        await sendNotification({
          userId: interview.candidateId._id.toString(),
          type: 'interview_confirmed',
          title: 'Interview Confirmed',
          message: `You have confirmed your interview for ${interview.jobId.title} on ${interview.slot.date.toLocaleString()}`,
          data: {
            interviewId: interview._id,
            jobTitle: interview.jobId.title,
            interviewDate: interview.slot.date
          }
        });
        break;

      case 'reschedule':
        if (!newDate || !reason) {
          return NextResponse.json({ 
            error: 'New date and reason are required for rescheduling' 
          }, { status: 400 });
        }

        // Add reschedule request
        interview.rescheduleRequests.push({
          requestedDate: new Date(newDate),
          reason,
          status: 'pending',
          requestedAt: new Date()
        });

        interview.confirmationStatus = 'rescheduled';
        interview.notifications.push({
          type: 'reschedule',
          sentAt: new Date(),
          channel: 'in-app',
          status: 'sent'
        });

        responseMessage = 'Reschedule request submitted successfully';
        
        // Send reschedule notification
        await sendNotification({
          userId: interview.candidateId._id.toString(),
          type: 'interview_reschedule_requested',
          title: 'Reschedule Request Submitted',
          message: `Your reschedule request for ${interview.jobId.title} interview has been submitted`,
          data: {
            interviewId: interview._id,
            jobTitle: interview.jobId.title,
            originalDate: interview.slot.date,
            requestedDate: newDate,
            reason
          }
        });
        break;

      case 'decline':
        interview.confirmationStatus = 'declined';
        interview.status = 'cancelled';
        interview.notifications.push({
          type: 'cancellation',
          sentAt: new Date(),
          channel: 'in-app',
          status: 'sent'
        });
        responseMessage = 'Interview declined';
        
        // Send decline notification
        await sendNotification({
          userId: interview.candidateId._id.toString(),
          type: 'interview_declined',
          title: 'Interview Declined',
          message: `You have declined the interview for ${interview.jobId.title}`,
          data: {
            interviewId: interview._id,
            jobTitle: interview.jobId.title
          }
        });
        break;

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    await interview.save();

    return NextResponse.json({ 
      message: responseMessage,
      interview: {
        id: interview._id,
        status: interview.status,
        confirmationStatus: interview.confirmationStatus,
        rescheduleRequests: interview.rescheduleRequests
      }
    });

  } catch (error) {
    console.error('Error updating interview:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
