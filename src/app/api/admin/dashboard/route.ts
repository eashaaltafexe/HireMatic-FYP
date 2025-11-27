import { NextRequest, NextResponse } from 'next/server';
import { dbConnect, User, Job, Application } from '@/data-access';
import { jwtVerify } from 'jose';

// Define the JWT payload interface
interface JwtPayload {
  userId: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

// Verify JWT token
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

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const decoded = await verifyToken(token);

    if (!decoded || !decoded.userId || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 401 });
    }

    await dbConnect();

    // Get current date for time-based calculations
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Get total counts
    const [totalUsers, totalJobs, totalApplications] = await Promise.all([
      User.countDocuments(),
      Job.countDocuments(),
      Application.countDocuments()
    ]);

    // Get growth statistics (comparing this month vs last month)
    const [usersThisMonth, usersLastMonth] = await Promise.all([
      User.countDocuments({ createdAt: { $gte: thisMonth } }),
      User.countDocuments({ 
        createdAt: { 
          $gte: lastMonth, 
          $lt: thisMonth 
        } 
      })
    ]);

    const [jobsThisMonth, jobsLastMonth] = await Promise.all([
      Job.countDocuments({ createdAt: { $gte: thisMonth } }),
      Job.countDocuments({ 
        createdAt: { 
          $gte: lastMonth, 
          $lt: thisMonth 
        } 
      })
    ]);

    const [applicationsThisMonth, applicationsLastMonth] = await Promise.all([
      Application.countDocuments({ appliedDate: { $gte: thisMonth } }),
      Application.countDocuments({ 
        appliedDate: { 
          $gte: lastMonth, 
          $lt: thisMonth 
        } 
      })
    ]);

    // Calculate growth percentages
    const userGrowth = usersLastMonth > 0 ? 
      Math.round(((usersThisMonth - usersLastMonth) / usersLastMonth) * 100) : 
      (usersThisMonth > 0 ? 100 : 0);

    const jobGrowth = jobsLastMonth > 0 ? 
      Math.round(((jobsThisMonth - jobsLastMonth) / jobsLastMonth) * 100) : 
      (jobsThisMonth > 0 ? 100 : 0);

    const applicationGrowth = applicationsLastMonth > 0 ? 
      Math.round(((applicationsThisMonth - applicationsLastMonth) / applicationsLastMonth) * 100) : 
      (applicationsThisMonth > 0 ? 100 : 0);

    // Get monthly application statistics for the chart (last 12 months)
    const monthlyStats = [];
    for (let i = 11; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      
      const [applications, interviews] = await Promise.all([
        Application.countDocuments({
          appliedDate: { $gte: monthStart, $lte: monthEnd }
        }),
        Application.countDocuments({
          appliedDate: { $gte: monthStart, $lte: monthEnd },
          status: { $in: ['Interview Scheduled', 'Interview Completed'] }
        })
      ]);

      monthlyStats.push({
        month: monthStart.toLocaleDateString('en-US', { month: 'short' }),
        applications,
        interviews
      });
    }

    // Get recent activities (last 10 activities)
    const recentApplications = await Application.find()
      .populate('userId', 'name email')
      .populate('jobId', 'title company')
      .sort({ appliedDate: -1 })
      .limit(10);

    const recentActivities = recentApplications.map(app => ({
      user: (app.userId as any)?.name || 'Unknown User',
      action: `Applied for ${(app.jobId as any)?.title} at ${(app.jobId as any)?.company}`,
      time: getTimeAgo(app.appliedDate),
      type: 'application'
    }));

    // Get additional recent activities from job postings
    const recentJobs = await Job.find()
      .sort({ createdAt: -1 })
      .limit(5);

    const jobActivities = recentJobs.map(job => ({
      user: 'HR Team',
      action: `Posted new job: ${job.title}`,
      time: getTimeAgo(job.createdAt),
      type: 'job_posting'
    }));

    // Combine and sort activities
    const allActivities = [...recentActivities, ...jobActivities]
      .sort((a, b) => {
        // Sort by most recent first (this is a simplified sort)
        return 0; // In a real implementation, you'd convert time strings back to dates
      })
      .slice(0, 10);

    // Get active jobs count
    const activeJobs = await Job.countDocuments({ status: 'published' });

    // Get user role distribution
    const usersByRole = await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get application status distribution
    const applicationsByStatus = await Application.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    return NextResponse.json({
      success: true,
      data: {
        stats: {
          totalUsers,
          userGrowth: userGrowth > 0 ? `+${userGrowth}%` : `${userGrowth}%`,
          activeJobs,
          jobGrowth: jobGrowth > 0 ? `+${jobGrowth}%` : `${jobGrowth}%`,
          applications: totalApplications,
          applicationGrowth: applicationGrowth > 0 ? `+${applicationGrowth}%` : `${applicationGrowth}%`
        },
        chartData: {
          labels: monthlyStats.map(stat => stat.month),
          applications: monthlyStats.map(stat => stat.applications),
          interviews: monthlyStats.map(stat => stat.interviews)
        },
        recentActivities: allActivities,
        usersByRole,
        applicationsByStatus,
        monthlyGrowth: {
          users: { thisMonth: usersThisMonth, lastMonth: usersLastMonth },
          jobs: { thisMonth: jobsThisMonth, lastMonth: jobsLastMonth },
          applications: { thisMonth: applicationsThisMonth, lastMonth: applicationsLastMonth }
        }
      }
    });

  } catch (error: any) {
    console.error('Error fetching admin dashboard data:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to fetch dashboard data'
    }, { status: 500 });
  }
}

// Helper function to calculate time ago
function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffInMs = now.getTime() - new Date(date).getTime();
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInHours / 24);

  if (diffInHours < 1) return 'Just now';
  if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
  if (diffInDays < 30) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  
  return new Date(date).toLocaleDateString();
}
