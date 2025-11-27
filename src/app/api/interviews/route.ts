import { NextRequest, NextResponse } from 'next/server';
import { dbConnect, Interview, Application, Job, User } from '@/data-access';
import { jwtVerify } from 'jose';
import { generateQuestionsForShortlistedCandidate, storeGeneratedQuestions } from '@/business-logic';
// import { generateAvailableSlots, findBestSlot, sendNotification } from '@/application';

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

// GET /api/interviews - Get candidate's interviews
export async function GET(request: NextRequest) {
  try {
    const decoded = await verifyToken(request);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const upcoming = searchParams.get('upcoming');

    const query: any = { candidateId: decoded.userId };
    
    if (status) {
      query.status = status;
    }

    if (upcoming === 'true') {
      query['slot.date'] = { $gte: new Date() };
    }

    console.log('Fetching interviews with query:', query);

    // Fetch interviews - populate is optional, won't fail if reference doesn't exist
    const interviews = await Interview.find(query)
      .populate('jobId', 'title company department')
      .sort({ 'slot.date': 1 })
      .lean(); // Use lean() for better performance and to avoid mongoose document issues

    console.log(`Found ${interviews.length} interviews for user ${decoded.userId}`);

    // Transform interviews to ensure jobId has required fields
    const transformedInterviews = interviews.map((interview: any) => {
      // If jobId is not populated (not found in DB), create a default structure
      if (!interview.jobId || typeof interview.jobId === 'string') {
        interview.jobId = {
          _id: interview.jobId || 'unknown',
          title: 'Position Not Found',
          department: 'N/A',
          company: 'N/A'
        };
      }
      return interview;
    });

    return NextResponse.json({ 
      success: true,
      interviews: transformedInterviews 
    });

  } catch (error: any) {
    console.error('Error fetching interviews:', error);
    console.error('Error details:', error.message, error.stack);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 });
  }
}

// POST /api/interviews - Create/Schedule new interview
export async function POST(request: NextRequest) {
  try {
    const decoded = await verifyToken(request);
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const { applicationId, candidateId, jobId, slotDate, interviewType } = await request.json();

    // Validate application exists
    const application = await Application.findById(applicationId);
    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    // Get candidate and job details
    const candidate = await User.findById(candidateId);
    const job = await Job.findById(jobId);

    if (!candidate || !job) {
      return NextResponse.json({ error: 'Candidate or Job not found' }, { status: 404 });
    }

    // Generate interview questions if not already generated
    if (!application.generatedQuestions || application.generatedQuestions.length === 0) {
      console.log(`🎯 Generating questions for interview: ${candidate.name} - ${job.title}`);
      
      try {
        const questionResult = await generateQuestionsForShortlistedCandidate(
          job.title,
          candidate.name,
          applicationId
        );

        if (questionResult.success && questionResult.questions.length > 0) {
          await storeGeneratedQuestions(applicationId, questionResult.questions);
          console.log(`✅ Generated and stored ${questionResult.questions.length} questions for interview`);
        } else {
          console.warn('⚠️ Using fallback questions for interview');
        }
      } catch (error) {
        console.error('Error generating questions for interview:', error);
        // Continue with interview scheduling even if question generation fails
      }
    } else {
      console.log(`✓ Using ${application.generatedQuestions.length} existing questions for interview`);
    }

    // Generate interview ID and token
    const interviewId = `INT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const token = Math.random().toString(36).substr(2, 32);

    // Create interview link
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const interviewLink = `${baseUrl}/interview/${interviewId}?token=${token}`;

    // Create interview record
    const interview = new Interview({
      applicationId,
      candidateId,
      jobId,
      interviewId,
      slot: {
        date: new Date(slotDate),
        duration: 45,
        type: interviewType || 'AI'
      },
      link: interviewLink,
      token,
      status: 'scheduled',
      confirmationStatus: 'pending'
    });

    await interview.save();

    // Update application status to 'Interview Scheduled'
    application.status = 'Interview Scheduled';
    application.interview = {
      date: new Date(slotDate),
      link: interviewLink,
      type: interviewType || 'AI',
      notes: `AI Interview scheduled with ${application.generatedQuestions?.length || 0} questions`
    };
    await application.save();

    // Send notification to candidate
    if (candidate && job) {
      // TODO: Send notification
      // await sendNotification({
      //   userId: candidateId,
      //   type: 'interview_scheduled',
      //   title: 'Interview Scheduled',
      //   message: `Your interview for ${job.title} has been scheduled for ${new Date(slotDate).toLocaleString()}`,
      //   data: {
      //     interviewId: interview._id,
      //     jobTitle: job.title,
      //     interviewDate: slotDate,
      //     interviewLink
      //   }
      // });

      // Add notification record
      interview.notifications.push({
        type: 'scheduled',
        sentAt: new Date(),
        channel: 'in-app',
        status: 'sent'
      });
      await interview.save();
    }

    return NextResponse.json({ 
      message: 'Interview scheduled successfully',
      interview: {
        id: interview._id,
        interviewId,
        date: interview.slot.date,
        link: interviewLink,
        status: interview.status
      }
    });

  } catch (error) {
    console.error('Error scheduling interview:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
