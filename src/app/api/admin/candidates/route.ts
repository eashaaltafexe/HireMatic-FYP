import { NextResponse } from 'next/server';
import { dbConnect, User, Application, Job } from '@/data-access';
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

// GET - Fetch candidate profiles with applications and statistics
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
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const search = url.searchParams.get('search') || '';
    const status = url.searchParams.get('status') || '';
    const department = url.searchParams.get('department') || '';

    // Build filter for candidates (users with role 'candidate')
    const candidateFilter: any = { role: 'candidate' };
    
    if (search) {
      candidateFilter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    if (department && department !== 'All Departments') {
      candidateFilter.department = department;
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Fetch candidates with their application statistics
    const candidates = await User.find(candidateFilter)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalCandidates = await User.countDocuments(candidateFilter);

    // Get application statistics for each candidate
    const candidatesWithStats = await Promise.all(
      candidates.map(async (candidate) => {
        const applications = await Application.find({ userId: candidate._id })
          .populate('jobId', 'title company department')
          .sort({ appliedDate: -1 });

        const stats = {
          totalApplications: applications.length,
          pending: applications.filter(app => app.status === 'Pending').length,
          underReview: applications.filter(app => app.status === 'Under Review').length,
          interviewScheduled: applications.filter(app => app.status === 'Interview Scheduled').length,
          accepted: applications.filter(app => app.status === 'Accepted').length,
          rejected: applications.filter(app => app.status === 'Rejected').length
        };

        // Get latest application
        const latestApplication = applications[0];
        
        // Get resume data from latest application
        const resumeData = latestApplication?.parsedResume || null;

        return {
          _id: candidate._id,
          name: candidate.name,
          email: candidate.email,
          department: candidate.department || 'Not Specified',
          phone: candidate.phone || 'Not Provided',
          createdAt: candidate.createdAt,
          lastLogin: candidate.lastLogin,
          stats,
          latestApplication: latestApplication ? {
            _id: latestApplication._id,
            jobTitle: (latestApplication.jobId as any)?.title || 'Unknown',
            company: (latestApplication.jobId as any)?.company || 'Unknown',
            status: latestApplication.status,
            appliedDate: latestApplication.appliedDate
          } : null,
          resumeData: resumeData ? {
            summary: resumeData.summary || '',
            experience: resumeData.experience?.length || 0,
            education: resumeData.education?.length || 0,
            skills: {
              technical: resumeData.skills?.technical?.length || 0,
              soft: resumeData.skills?.soft?.length || 0,
              languages: resumeData.skills?.languages?.length || 0
            }
          } : null
        };
      })
    );

    // Filter by application status if specified
    let filteredCandidates = candidatesWithStats;
    if (status && status !== 'All Status') {
      filteredCandidates = candidatesWithStats.filter(candidate => {
        if (status === 'Active Applicants') {
          return candidate.stats.totalApplications > 0 && 
                 (candidate.stats.pending > 0 || candidate.stats.underReview > 0 || candidate.stats.interviewScheduled > 0);
        }
        if (status === 'Hired') {
          return candidate.stats.accepted > 0;
        }
        if (status === 'No Applications') {
          return candidate.stats.totalApplications === 0;
        }
        return true;
      });
    }

    // Get filter options
    const [departments, applicationStatuses] = await Promise.all([
      User.distinct('department', { role: 'candidate' }),
      ['All Status', 'Active Applicants', 'Hired', 'No Applications']
    ]);

    const totalPages = Math.ceil(totalCandidates / limit);

    return NextResponse.json({
      success: true,
      data: {
        candidates: filteredCandidates,
        pagination: {
          currentPage: page,
          totalPages,
          totalCandidates,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        },
        filters: {
          departments: ['All Departments', ...departments.filter(d => d)],
          statuses: applicationStatuses
        },
        summary: {
          totalCandidates: candidatesWithStats.length,
          activeApplicants: candidatesWithStats.filter(c => c.stats.totalApplications > 0).length,
          hired: candidatesWithStats.filter(c => c.stats.accepted > 0).length,
          averageApplications: candidatesWithStats.length > 0 ? 
            Math.round(candidatesWithStats.reduce((sum, c) => sum + c.stats.totalApplications, 0) / candidatesWithStats.length) : 0
        }
      }
    });

  } catch (error: any) {
    console.error('Error fetching candidates:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to fetch candidates'
    }, { status: 500 });
  }
}

// GET specific candidate details
export async function POST(req: Request) {
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

    const { candidateId } = await req.json();

    if (!candidateId) {
      return NextResponse.json({
        success: false,
        error: 'Candidate ID is required'
      }, { status: 400 });
    }

    // Get candidate details
    const candidate = await User.findById(candidateId).select('-password');
    
    if (!candidate || candidate.role !== 'candidate') {
      return NextResponse.json({
        success: false,
        error: 'Candidate not found'
      }, { status: 404 });
    }

    // Get all applications for this candidate
    const applications = await Application.find({ userId: candidateId })
      .populate('jobId', 'title company department location employmentType')
      .sort({ appliedDate: -1 });

    // Get detailed resume data from the most recent application
    const latestApplication = applications[0];
    const resumeData = latestApplication?.parsedResume || null;

    return NextResponse.json({
      success: true,
      data: {
        candidate: {
          _id: candidate._id,
          name: candidate.name,
          email: candidate.email,
          phone: candidate.phone,
          department: candidate.department,
          createdAt: candidate.createdAt,
          lastLogin: candidate.lastLogin
        },
        applications: applications.map(app => ({
          _id: app._id,
          jobTitle: (app.jobId as any)?.title,
          company: (app.jobId as any)?.company,
          department: (app.jobId as any)?.department,
          location: (app.jobId as any)?.location,
          employmentType: (app.jobId as any)?.employmentType,
          status: app.status,
          appliedDate: app.appliedDate,
          lastUpdate: app.lastUpdate,
          interview: app.interview,
          evaluation: app.evaluation,
          timeline: app.timeline
        })),
        resumeData: resumeData ? {
          personalInfo: resumeData.personalInfo,
          summary: resumeData.summary,
          experience: resumeData.experience,
          education: resumeData.education,
          skills: resumeData.skills,
          certifications: resumeData.certifications,
          projects: resumeData.projects
        } : null,
        stats: {
          totalApplications: applications.length,
          pending: applications.filter(app => app.status === 'Pending').length,
          underReview: applications.filter(app => app.status === 'Under Review').length,
          interviewScheduled: applications.filter(app => app.status === 'Interview Scheduled').length,
          accepted: applications.filter(app => app.status === 'Accepted').length,
          rejected: applications.filter(app => app.status === 'Rejected').length
        }
      }
    });

  } catch (error: any) {
    console.error('Error fetching candidate details:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to fetch candidate details'
    }, { status: 500 });
  }
}
