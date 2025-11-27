import { NextRequest, NextResponse } from 'next/server';
import { dbConnect, Application, Interview, User, Job } from '@/data-access';
import { jwtVerify } from 'jose';
import { generateQuestionsForShortlistedCandidate, storeGeneratedQuestions } from '@/business-logic';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key');

/**
 * POST /api/interviews/start-now
 * Start an interview immediately without scheduling
 */
export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    // Verify authentication
    const token = request.cookies.get('token')?.value || 
                  request.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - No token provided' },
        { status: 401 }
      );
    }

    const { payload } = await jwtVerify(token, JWT_SECRET);
    const { applicationId } = await request.json();

    // Get application with job details
    const application = await Application.findById(applicationId)
      .populate('jobId', 'title department company')
      .populate('userId', 'name email');

    if (!application) {
      return NextResponse.json(
        { success: false, error: 'Application not found' },
        { status: 404 }
      );
    }

    // Verify user owns this application
    if (application.userId._id.toString() !== payload.userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Not your application' },
        { status: 403 }
      );
    }

    // Check if application is in correct status
    if (application.status !== 'Under Review' && application.status !== 'Interview Scheduled') {
      return NextResponse.json(
        { success: false, error: `Cannot start interview. Application status is: ${application.status}` },
        { status: 400 }
      );
    }

    // Generate questions if not already generated
    if (!application.generatedQuestions || application.generatedQuestions.length === 0) {
      console.log(`🎯 Generating questions for immediate interview: ${application.userId.name} - ${application.jobId.title}`);
      
      try {
        const questionResult = await generateQuestionsForShortlistedCandidate(
          application.jobId.title,
          application.userId.name,
          applicationId
        );

        if (questionResult.success && questionResult.questions.length > 0) {
          await storeGeneratedQuestions(applicationId, questionResult.questions);
          console.log(`✅ Generated and stored ${questionResult.questions.length} questions`);
        } else {
          console.warn('⚠️ Using fallback questions');
        }
      } catch (error) {
        console.error('Error generating questions:', error);
        // Continue anyway - fallback questions will be used
      }
    }

    // Create interview record
    const interviewId = `INT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const interviewToken = Math.random().toString(36).substr(2, 32);
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const interviewLink = `${baseUrl}/interview/${interviewId}?token=${interviewToken}`;

    const interview = new Interview({
      applicationId: application._id,
      candidateId: application.userId._id,
      jobId: application.jobId._id,
      interviewId,
      slot: {
        date: new Date(), // Immediate start
        duration: 45,
        type: 'AI'
      },
      link: interviewLink,
      token: interviewToken,
      status: 'confirmed', // Changed from 'in-progress' to match schema
      confirmationStatus: 'confirmed'
    });

    await interview.save();

    // Update application status
    application.status = 'Interview Scheduled';
    application.set('interview', {
      date: new Date(),
      link: interviewLink,
      type: 'AI',
      notes: 'Immediate interview started by candidate'
    });
    await application.save();

    // Reload application to get updated questions
    const updatedApplication = await Application.findById(applicationId);

    return NextResponse.json({
      success: true,
      data: {
        interviewId,
        interviewLink,
        token: interviewToken,
        questionsCount: updatedApplication?.generatedQuestions?.length || 0,
        jobTitle: application.jobId.title,
        message: 'Interview ready! You can start now.'
      }
    });

  } catch (error: any) {
    console.error('Error starting immediate interview:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to start interview' },
      { status: 500 }
    );
  }
}
