import { NextRequest, NextResponse } from 'next/server';
import { dbConnect, Application, Job, User } from '@/data-access';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

interface JwtPayload {
  id: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

// Helper function to verify token
const verifyToken = (token: string): JwtPayload | null => {
  const secret = process.env.JWT_SECRET;
  
  if (!secret) {
    console.error('JWT_SECRET is not defined in environment variables');
    return null;
  }

  try {
    const decoded = jwt.verify(token, secret) as JwtPayload;
    return decoded && decoded.id ? decoded : null;
  } catch (error) {
    console.error('Token verification error:', error);
    return null;
  }
};

// Get candidate dashboard data by candidateId
export async function GET(
  request: Request,
  { params }: { params: { candidateId: string } }
) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    if (!decoded || !decoded.id) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Check if user is candidate and accessing their own data, or if admin/hr
    if (decoded.role === 'candidate' && decoded.id !== params.candidateId) {
      return NextResponse.json({ error: 'Unauthorized to access this data' }, { status: 403 });
    }

    if (!mongoose.Types.ObjectId.isValid(params.candidateId)) {
      return NextResponse.json({ error: 'Invalid candidate ID' }, { status: 400 });
    }

    await dbConnect();

    // Get user profile
    const user = await User.findById(params.candidateId).select('-password');
    if (!user) {
      return NextResponse.json({ error: 'Candidate not found' }, { status: 404 });
    }

    // Get application statistics
    const applications = await Application.find({ userId: params.candidateId })
      .populate({
        path: 'jobId',
        select: 'title department location employmentType'
      })
      .sort({ appliedDate: -1 });

    // Calculate statistics - always return structured data
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
    const appliedDepartments = [...new Set(applications.map(app => app.jobId?.department).filter(Boolean))];
    const recommendedJobs = appliedDepartments.length > 0 
      ? await Job.find({
          status: 'published',
          department: { $in: appliedDepartments },
          _id: { $nin: applications.map(app => app.jobId?._id).filter(Boolean) }
        })
        .sort({ createdAt: -1 })
        .limit(5)
        .select('title department location employmentType salaryRange createdAt')
      : await Job.find({
          status: 'published'
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

    // Always return structured data, even if empty
    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          title: user.title,
          department: user.department,
          company: user.company
        },
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
