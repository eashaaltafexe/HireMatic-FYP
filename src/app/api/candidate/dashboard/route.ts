import { NextRequest, NextResponse } from 'next/server';
import { dbConnect, User, Application, Job } from '@/data-access';
import { jwtVerify } from 'jose';

interface JwtPayload {
  userId: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

// Helper function to verify token using jose (consistent with token creation)
const verifyToken = async (token: string): Promise<JwtPayload | null> => {
  const secret = process.env.JWT_SECRET || 'your_default_secret_change_this';
  
  if (!secret) {
    console.error('JWT_SECRET is not defined in environment variables');
    return null;
  }

  try {
    const encoder = new TextEncoder();
    const { payload } = await jwtVerify(token, encoder.encode(secret));
    
    // Convert payload to our expected format
    const jwtPayload = payload as any;
    return {
      userId: jwtPayload.userId,
      email: jwtPayload.email,
      role: jwtPayload.role,
      iat: jwtPayload.iat,
      exp: jwtPayload.exp
    };
  } catch (error) {
    console.error('Token verification error:', error);
    return null;
  }
};

// Get candidate dashboard data
export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const decoded = await verifyToken(token);

    if (!decoded || !decoded.userId) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Only allow candidates to access their dashboard
    if (decoded.role !== 'candidate') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await dbConnect();

    // Get user profile
    const user = await User.findById(decoded.userId).select('-password');

    // Get application statistics
    const applications = await Application.find({ userId: decoded.userId })
      .populate({
        path: 'jobId',
        select: 'title department location employmentType'
      })
      .sort({ appliedDate: -1 });

    // Calculate statistics
    const stats = {
      totalApplications: applications.length,
      pendingApplications: applications.filter(app => app.status === 'Pending').length,
      underReview: applications.filter(app => app.status === 'Under Review').length,
      interviewScheduled: applications.filter(app => app.status === 'Interview Scheduled').length,
      accepted: applications.filter(app => app.status === 'Accepted').length,
      rejected: applications.filter(app => app.status === 'Rejected').length
    };

    // Get recent applications (last 5)
    const recentApplications = applications.slice(0, 5);

    // Get upcoming interviews
    const upcomingInterviews = applications
      .filter(app => app.interview && app.interview.date && new Date(app.interview.date) > new Date())
      .sort((a, b) => new Date(a.interview.date).getTime() - new Date(b.interview.date).getTime())
      .slice(0, 3);

    // Get unread notifications count
    const unreadNotifications = applications.reduce((total, app) => {
      return total + (app.notifications?.filter((notif: any) => !notif.read).length || 0);
    }, 0);

    // Get recent job recommendations (jobs in same department as applied jobs)
    const appliedDepartments = [...new Set(applications.map(app => app.jobId?.department))];
    const recommendedJobs = await Job.find({
      status: 'published',
      department: { $in: appliedDepartments },
      _id: { $nin: applications.map(app => app.jobId?._id) }
    })
    .sort({ createdAt: -1 })
    .limit(5)
    .select('title department location employmentType salaryRange createdAt');

    // Get application timeline for the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentTimeline = applications
      .flatMap(app => 
        app.timeline?.map((event: any) => ({
          ...event,
          jobTitle: app.jobId?.title,
          applicationId: app._id
        })) || []
      )
      .filter(event => new Date(event.date) >= thirtyDaysAgo)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10);

    return NextResponse.json({
      success: true,
      data: {
        user,
        stats,
        recentApplications,
        upcomingInterviews,
        unreadNotifications,
        recommendedJobs,
        recentTimeline,
        isEmpty: applications.length === 0
      }
    });

  } catch (error: any) {
    console.error('Error fetching dashboard data:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Failed to fetch dashboard data',
        data: {
          user: null,
          stats: {
            totalApplications: 0,
            pendingApplications: 0,
            underReview: 0,
            interviewScheduled: 0,
            accepted: 0,
            rejected: 0
          },
          recentApplications: [],
          upcomingInterviews: [],
          unreadNotifications: 0,
          recommendedJobs: [],
          recentTimeline: [],
          isEmpty: true
        }
      },
      { status: 500 }
    );
  }
}
