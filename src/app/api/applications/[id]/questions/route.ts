import { NextRequest, NextResponse } from 'next/server';
import { dbConnect, Application } from '@/data-access';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key');

/**
 * GET /api/applications/[id]/questions
 * Retrieve generated questions for a specific application
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Get application with generated questions
    const application = await Application.findById(params.id)
      .select('generatedQuestions userId jobId parsedResume')
      .populate('jobId', 'title department')
      .populate('userId', 'name email');

    if (!application) {
      return NextResponse.json(
        { success: false, error: 'Application not found' },
        { status: 404 }
      );
    }

    // Check if user has access (candidate, HR, or admin)
    const isOwner = application.userId._id.toString() === payload.userId;
    const isAuthorized = isOwner || payload.role === 'admin' || payload.role === 'hr';

    if (!isAuthorized) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized to view these questions' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        applicationId: application._id,
        candidateName: application.userId.name,
        candidateEmail: application.userId.email,
        jobTitle: application.jobId.title,
        department: application.jobId.department,
        questions: application.generatedQuestions || [],
        count: application.generatedQuestions?.length || 0,
        resumeData: {
          name: application.parsedResume?.personalInfo?.name,
          skills: application.parsedResume?.skills,
          experience: application.parsedResume?.experience
        }
      }
    });
  } catch (error: any) {
    console.error('Error fetching questions:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch questions' },
      { status: 500 }
    );
  }
}
