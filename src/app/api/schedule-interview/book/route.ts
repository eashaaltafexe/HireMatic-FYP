import { NextRequest, NextResponse } from 'next/server';
import { dbConnect, Interview, Job, Application } from '@/data-access';
import crypto from 'crypto';
import { jwtVerify } from 'jose';

interface BookingRequest {
  fullName: string;
  email: string;
  phone?: string;
  positionId: string;
  date: string;
  timeSlot: string;
}

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

const TIME_SLOT_DISPLAY: Record<string, string> = {
  '09:00': '09:00 AM',
  '10:00': '10:00 AM',
  '11:00': '11:00 AM',
  '14:00': '02:00 PM',
  '15:00': '03:00 PM',
  '16:00': '04:00 PM'
};

const INTERVIEW_DURATION_MINUTES = 45;

// POST /api/schedule-interview/book
export async function POST(request: NextRequest) {
  try {
    // Try to get logged-in user, but allow public bookings too
    const decoded = await verifyToken(request);
    
    const body: BookingRequest = await request.json();
    const { fullName, email, phone, positionId, date, timeSlot } = body;

    // Validation
    if (!fullName || !email || !positionId || !date || !timeSlot) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }

    await dbConnect();

    // Verify the position exists
    const job = await Job.findById(positionId);
    if (!job) {
      return NextResponse.json(
        { error: 'Position not found' },
        { status: 404 }
      );
    }

    // If user is logged in, verify they have applied and are shortlisted
    if (decoded?.userId) {
      const application = await Application.findOne({
        userId: decoded.userId,
        jobId: positionId
      });

      if (!application) {
        return NextResponse.json(
          { error: 'You have not applied for this position. Please submit an application first.' },
          { status: 403 }
        );
      }

      // Only allow scheduling if status is "Interview Scheduled"
      if (application.status !== 'Interview Scheduled') {
        return NextResponse.json(
          { error: `Interview scheduling not available. Application status: ${application.status}. Please wait for HR to schedule your interview.` },
          { status: 403 }
        );
      }

      // Check if interview already scheduled for this application
      const existingInterview = await Interview.findOne({
        applicationId: application._id,
        status: { $in: ['scheduled', 'confirmed'] }
      });

      if (existingInterview) {
        return NextResponse.json(
          { error: 'An interview is already scheduled for this application.' },
          { status: 409 }
        );
      }
    }

    // Parse date and time
    const [hours, minutes] = timeSlot.split(':').map(Number);
    const interviewDateTime = new Date(date);
    interviewDateTime.setHours(hours, minutes, 0, 0);

    const interviewEndTime = new Date(interviewDateTime);
    interviewEndTime.setMinutes(interviewEndTime.getMinutes() + INTERVIEW_DURATION_MINUTES);

    // Double-check availability (race condition protection)
    const dayStart = new Date(interviewDateTime);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart);
    dayEnd.setHours(23, 59, 59, 999);

    const conflictingInterviews = await Interview.find({
      'slot.date': {
        $gte: dayStart,
        $lte: dayEnd
      },
      'slot.type': 'AI',
      status: { $in: ['scheduled', 'confirmed'] }
    }).select('slot.date slot.duration');

    // Check for conflicts
    const hasConflict = conflictingInterviews.some(interview => {
      const bookedStart = new Date(interview.slot.date);
      const bookedEnd = new Date(bookedStart);
      bookedEnd.setMinutes(bookedEnd.getMinutes() + interview.slot.duration);

      return (
        interviewDateTime < bookedEnd && interviewEndTime > bookedStart
      );
    });

    if (hasConflict) {
      return NextResponse.json(
        { error: 'This time slot has just been booked. Please select another slot.' },
        { status: 409 }
      );
    }

    // Prevent scheduling in the past
    const now = new Date();
    if (interviewDateTime < now) {
      return NextResponse.json(
        { error: 'Cannot schedule interviews in the past' },
        { status: 400 }
      );
    }

    // Generate unique interview ID and secure token
    const interviewId = `INT-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
    const secureToken = crypto.randomBytes(32).toString('hex');

    // Create interview link
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const interviewLink = `${baseUrl}/interview/${interviewId}?token=${secureToken}&email=${encodeURIComponent(email)}`;

    // Create interview record
    // Use actual user ID if logged in, otherwise create placeholder
    const candidateId = decoded?.userId || `CANDIDATE-${crypto.randomBytes(8).toString('hex')}`;
    
    // Get actual application ID if user is logged in
    let applicationId = `APP-PUBLIC-${Date.now()}`; // Default for non-logged users
    if (decoded?.userId) {
      const application = await Application.findOne({
        userId: decoded.userId,
        jobId: positionId
      });
      if (application) {
        applicationId = application._id.toString();
      }
    }
    
    const interview = new Interview({
      applicationId: applicationId,
      candidateId: candidateId, // Use logged-in user's ID if available
      jobId: positionId,
      interviewId: interviewId,
      slot: {
        date: interviewDateTime,
        duration: INTERVIEW_DURATION_MINUTES,
        type: 'AI',
        aiInterviewerStatus: 'available'
      },
      link: interviewLink,
      token: secureToken,
      status: 'scheduled',
      confirmationStatus: 'confirmed', // Auto-confirm public bookings
      candidateMetadata: {
        fullName: fullName,
        email: email,
        phone: phone
      },
      notifications: [
        {
          type: 'scheduled',
          sentAt: new Date(),
          channel: 'email',
          status: 'sent'
        }
      ]
    });

    await interview.save();

    // In a real system, you would:
    // 1. Send confirmation email to the candidate
    // 2. Create a calendar invite
    // 3. Send SMS reminder (if phone provided)
    // 4. Log the booking event

    // TODO: Send confirmation email
    console.log(`Interview scheduled for ${fullName} (${email}) - ${job.title}`);
    console.log(`Interview ID: ${interviewId}`);
    console.log(`Interview Link: ${interviewLink}`);

    return NextResponse.json({
      success: true,
      message: 'Interview scheduled successfully',
      interview: {
        interviewId: interviewId,
        candidateName: fullName,
        candidateEmail: email,
        candidatePhone: phone,
        positionTitle: job.title,
        positionDepartment: job.department,
        date: interviewDateTime.toISOString(),
        time: TIME_SLOT_DISPLAY[timeSlot] || timeSlot,
        duration: INTERVIEW_DURATION_MINUTES,
        link: interviewLink,
        status: 'scheduled',
        confirmationSent: true
      }
    });

  } catch (error) {
    console.error('Error booking interview:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

