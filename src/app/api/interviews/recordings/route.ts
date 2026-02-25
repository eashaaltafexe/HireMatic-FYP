import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import Interview from '@/data-access/models/Interview';
import Application from '@/data-access/models/Application';
import { connectDB } from '@/data-access';

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

/**
 * GET /api/interviews/recordings
 * Get all interview recordings with MEGA links
 */
export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const decoded = await verifyToken(request);
    if (!decoded) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Only HR and Admin can view all recordings
    if (decoded.role !== 'hr' && decoded.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden - HR or Admin access required' },
        { status: 403 }
      );
    }

    await connectDB();

    // Get all interviews with recordings
    const interviews = await Interview.find({
      'recording.megaLink': { $exists: true, $ne: null }
    })
      .sort({ 'recording.stoppedAt': -1 })
      .select('interviewId applicationId recording slot createdAt')
      .lean();

    // Get application and candidate details
    const enrichedInterviews = await Promise.all(
      interviews.map(async (interview: any) => {
        const application: any = await Application.findById(interview.applicationId)
          .populate('candidateId', 'name email')
          .populate('jobId', 'title')
          .lean();

        // Handle populated fields which can be either objects or arrays
        let candidateName = 'Unknown';
        let candidateEmail = 'Unknown';
        let jobTitle = 'Unknown';

        if (application) {
          const candidate = application.candidateId;
          if (candidate) {
            if (Array.isArray(candidate)) {
              candidateName = (candidate[0] as any)?.name || 'Unknown';
              candidateEmail = (candidate[0] as any)?.email || 'Unknown';
            } else {
              candidateName = (candidate as any)?.name || 'Unknown';
              candidateEmail = (candidate as any)?.email || 'Unknown';
            }
          }

          const job = application.jobId;
          if (job) {
            if (Array.isArray(job)) {
              jobTitle = (job[0] as any)?.title || 'Unknown';
            } else {
              jobTitle = (job as any)?.title || 'Unknown';
            }
          }
        }

        return {
          interviewId: interview.interviewId,
          candidateName,
          candidateEmail,
          jobTitle,
          interviewDate: interview.slot?.date,
          recordingDate: interview.recording?.stoppedAt,
          megaLink: interview.recording?.megaLink,
          status: interview.recording?.status,
          duration: interview.slot?.duration || 0
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: enrichedInterviews,
      count: enrichedInterviews.length
    });

  } catch (error) {
    console.error('[Recordings] Error fetching recordings:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch recordings',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
