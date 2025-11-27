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

    const url = new URL(req.url);
    const reportType = url.searchParams.get('type') || 'overview';
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');

    // Set default date range (last 30 days if not specified)
    const defaultEndDate = new Date();
    const defaultStartDate = new Date();
    defaultStartDate.setDate(defaultStartDate.getDate() - 30);

    const dateFilter = {
      $gte: startDate ? new Date(startDate) : defaultStartDate,
      $lte: endDate ? new Date(endDate) : defaultEndDate
    };

    switch (reportType) {
      case 'overview':
        return await getOverviewReport(dateFilter);
      case 'applications':
        return await getApplicationsReport(dateFilter);
      case 'hiring':
        return await getHiringReport(dateFilter);
      case 'performance':
        return await getPerformanceReport(dateFilter);
      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid report type'
        }, { status: 400 });
    }

  } catch (error: any) {
    console.error('Error generating report:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to generate report'
    }, { status: 500 });
  }
}

async function getOverviewReport(dateFilter: any) {
  // Get basic counts
  const [totalUsers, totalJobs, totalApplications] = await Promise.all([
    User.countDocuments(),
    Job.countDocuments(),
    Application.countDocuments()
  ]);

  // Get applications in date range
  const applicationsInRange = await Application.countDocuments({
    appliedDate: dateFilter
  });

  // Get applications by status
  const applicationsByStatus = await Application.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);

  // Get applications by department
  const applicationsByDepartment = await Application.aggregate([
    {
      $lookup: {
        from: 'jobs',
        localField: 'jobId',
        foreignField: '_id',
        as: 'job'
      }
    },
    {
      $unwind: '$job'
    },
    {
      $group: {
        _id: '$job.department',
        count: { $sum: 1 }
      }
    },
    {
      $sort: { count: -1 }
    }
  ]);

  // Get top performing jobs (most applications)
  const topJobs = await Application.aggregate([
    {
      $group: {
        _id: '$jobId',
        applicationCount: { $sum: 1 }
      }
    },
    {
      $lookup: {
        from: 'jobs',
        localField: '_id',
        foreignField: '_id',
        as: 'job'
      }
    },
    {
      $unwind: '$job'
    },
    {
      $project: {
        title: '$job.title',
        company: '$job.company',
        department: '$job.department',
        applicationCount: 1
      }
    },
    {
      $sort: { applicationCount: -1 }
    },
    {
      $limit: 10
    }
  ]);

  // Get user registration trends (last 12 months)
  const userTrends = await User.aggregate([
    {
      $match: {
        createdAt: {
          $gte: new Date(new Date().setMonth(new Date().getMonth() - 12))
        }
      }
    },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' }
        },
        count: { $sum: 1 }
      }
    },
    {
      $sort: { '_id.year': 1, '_id.month': 1 }
    }
  ]);

  return NextResponse.json({
    success: true,
    data: {
      summary: {
        totalUsers,
        totalJobs,
        totalApplications,
        applicationsInRange
      },
      applicationsByStatus,
      applicationsByDepartment,
      topJobs,
      userTrends,
      dateRange: {
        start: dateFilter.$gte,
        end: dateFilter.$lte
      }
    }
  });
}

async function getApplicationsReport(dateFilter: any) {
  // Applications over time (daily)
  const applicationsOverTime = await Application.aggregate([
    {
      $match: {
        appliedDate: dateFilter
      }
    },
    {
      $group: {
        _id: {
          year: { $year: '$appliedDate' },
          month: { $month: '$appliedDate' },
          day: { $dayOfMonth: '$appliedDate' }
        },
        count: { $sum: 1 }
      }
    },
    {
      $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
    }
  ]);

  // Application conversion funnel
  const conversionFunnel = await Application.aggregate([
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        pending: {
          $sum: { $cond: [{ $eq: ['$status', 'Pending'] }, 1, 0] }
        },
        underReview: {
          $sum: { $cond: [{ $eq: ['$status', 'Under Review'] }, 1, 0] }
        },
        interviewScheduled: {
          $sum: { $cond: [{ $eq: ['$status', 'Interview Scheduled'] }, 1, 0] }
        },
        interviewCompleted: {
          $sum: { $cond: [{ $eq: ['$status', 'Interview Completed'] }, 1, 0] }
        },
        accepted: {
          $sum: { $cond: [{ $eq: ['$status', 'Accepted'] }, 1, 0] }
        },
        rejected: {
          $sum: { $cond: [{ $eq: ['$status', 'Rejected'] }, 1, 0] }
        }
      }
    }
  ]);

  // Average time to hire
  const avgTimeToHire = await Application.aggregate([
    {
      $match: {
        status: 'Accepted',
        appliedDate: dateFilter
      }
    },
    {
      $project: {
        timeToHire: {
          $divide: [
            { $subtract: ['$lastUpdate', '$appliedDate'] },
            1000 * 60 * 60 * 24 // Convert to days
          ]
        }
      }
    },
    {
      $group: {
        _id: null,
        avgDays: { $avg: '$timeToHire' },
        minDays: { $min: '$timeToHire' },
        maxDays: { $max: '$timeToHire' }
      }
    }
  ]);

  return NextResponse.json({
    success: true,
    data: {
      applicationsOverTime,
      conversionFunnel: conversionFunnel[0] || {},
      avgTimeToHire: avgTimeToHire[0] || { avgDays: 0, minDays: 0, maxDays: 0 },
      dateRange: {
        start: dateFilter.$gte,
        end: dateFilter.$lte
      }
    }
  });
}

async function getHiringReport(dateFilter: any) {
  // Hiring by department
  const hiringByDepartment = await Application.aggregate([
    {
      $match: {
        status: 'Accepted',
        appliedDate: dateFilter
      }
    },
    {
      $lookup: {
        from: 'jobs',
        localField: 'jobId',
        foreignField: '_id',
        as: 'job'
      }
    },
    {
      $unwind: '$job'
    },
    {
      $group: {
        _id: '$job.department',
        hiredCount: { $sum: 1 }
      }
    },
    {
      $sort: { hiredCount: -1 }
    }
  ]);

  // Hiring success rate by job
  const hiringSuccessRate = await Application.aggregate([
    {
      $lookup: {
        from: 'jobs',
        localField: 'jobId',
        foreignField: '_id',
        as: 'job'
      }
    },
    {
      $unwind: '$job'
    },
    {
      $group: {
        _id: {
          jobId: '$jobId',
          title: '$job.title',
          department: '$job.department'
        },
        totalApplications: { $sum: 1 },
        hired: {
          $sum: { $cond: [{ $eq: ['$status', 'Accepted'] }, 1, 0] }
        }
      }
    },
    {
      $project: {
        title: '$_id.title',
        department: '$_id.department',
        totalApplications: 1,
        hired: 1,
        successRate: {
          $multiply: [
            { $divide: ['$hired', '$totalApplications'] },
            100
          ]
        }
      }
    },
    {
      $match: {
        totalApplications: { $gte: 5 } // Only jobs with at least 5 applications
      }
    },
    {
      $sort: { successRate: -1 }
    },
    {
      $limit: 10
    }
  ]);

  // Interview to hire conversion
  const interviewConversion = await Application.aggregate([
    {
      $match: {
        appliedDate: dateFilter
      }
    },
    {
      $group: {
        _id: null,
        totalInterviews: {
          $sum: {
            $cond: [
              { $in: ['$status', ['Interview Scheduled', 'Interview Completed', 'Accepted']] },
              1,
              0
            ]
          }
        },
        totalHired: {
          $sum: { $cond: [{ $eq: ['$status', 'Accepted'] }, 1, 0] }
        }
      }
    },
    {
      $project: {
        totalInterviews: 1,
        totalHired: 1,
        conversionRate: {
          $multiply: [
            { $divide: ['$totalHired', '$totalInterviews'] },
            100
          ]
        }
      }
    }
  ]);

  return NextResponse.json({
    success: true,
    data: {
      hiringByDepartment,
      hiringSuccessRate,
      interviewConversion: interviewConversion[0] || { totalInterviews: 0, totalHired: 0, conversionRate: 0 },
      dateRange: {
        start: dateFilter.$gte,
        end: dateFilter.$lte
      }
    }
  });
}

async function getPerformanceReport(dateFilter: any) {
  // Most active recruiters (simplified - just count jobs by department)
  const activeRecruiters = await Job.aggregate([
    {
      $match: {
        createdAt: dateFilter
      }
    },
    {
      $group: {
        _id: '$department',
        jobsCreated: { $sum: 1 }
      }
    },
    {
      $project: {
        name: '$_id',
        email: 'HR Team',
        jobsCreated: 1
      }
    },
    {
      $sort: { jobsCreated: -1 }
    },
    {
      $limit: 10
    }
  ]);

  // Application response times
  const responseTimeStats = await Application.aggregate([
    {
      $match: {
        appliedDate: dateFilter,
        status: { $ne: 'Pending' }
      }
    },
    {
      $project: {
        responseTime: {
          $divide: [
            { $subtract: ['$lastUpdate', '$appliedDate'] },
            1000 * 60 * 60 * 24 // Convert to days
          ]
        }
      }
    },
    {
      $group: {
        _id: null,
        avgResponseTime: { $avg: '$responseTime' },
        minResponseTime: { $min: '$responseTime' },
        maxResponseTime: { $max: '$responseTime' }
      }
    }
  ]);

  // Job posting effectiveness
  const jobEffectiveness = await Job.aggregate([
    {
      $match: {
        createdAt: dateFilter
      }
    },
    {
      $lookup: {
        from: 'applications',
        localField: '_id',
        foreignField: 'jobId',
        as: 'applications'
      }
    },
    {
      $project: {
        title: 1,
        department: 1,
        createdAt: 1,
        applicationCount: { $size: '$applications' },
        hiredCount: {
          $size: {
            $filter: {
              input: '$applications',
              cond: { $eq: ['$$this.status', 'Accepted'] }
            }
          }
        }
      }
    },
    {
      $project: {
        title: 1,
        department: 1,
        createdAt: 1,
        applicationCount: 1,
        hiredCount: 1,
        effectiveness: {
          $cond: [
            { $gt: ['$applicationCount', 0] },
            { $multiply: [{ $divide: ['$hiredCount', '$applicationCount'] }, 100] },
            0
          ]
        }
      }
    },
    {
      $sort: { effectiveness: -1 }
    },
    {
      $limit: 10
    }
  ]);

  return NextResponse.json({
    success: true,
    data: {
      activeRecruiters,
      responseTimeStats: responseTimeStats[0] || { avgResponseTime: 0, minResponseTime: 0, maxResponseTime: 0 },
      jobEffectiveness,
      dateRange: {
        start: dateFilter.$gte,
        end: dateFilter.$lte
      }
    }
  });
}
