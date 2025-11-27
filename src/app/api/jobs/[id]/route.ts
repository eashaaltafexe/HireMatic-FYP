import { NextResponse } from 'next/server';
import { dbConnect, Job, Application } from '@/data-access';
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
    console.log('Verifying token:', token.substring(0, 20) + '...');
    const decoded = jwt.verify(token, secret) as any;
    console.log('Full token payload:', decoded);
    console.log('Token decoded successfully:', { id: decoded.id, role: decoded.role });
    
    // Check for different possible ID field names
    const userId = decoded.id || decoded._id || decoded.userId;
    console.log('Extracted user ID:', userId);
    
    if (!userId) {
      console.log('No user ID found in token');
      return null;
    }
    
    return {
      id: userId,
      email: decoded.email,
      role: decoded.role
    };
  } catch (error) {
    console.error('Token verification error:', error);
    return null;
  }
};

// Get job details by ID
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    
    const { id } = await params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid job ID' }, { status: 400 });
    }

    const job = await Job.findById(id);
    
    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    // Check if this is a public request (no auth header) or authenticated request
    const authHeader = request.headers.get('authorization');
    
    // If no auth header, only return published jobs for public access
    if (!authHeader && job.status !== 'published') {
      return NextResponse.json({ error: 'Job not available' }, { status: 404 });
    }

    return NextResponse.json(job);
  } catch (error: any) {
    console.error('Error fetching job:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch job details' },
      { status: 500 }
    );
  }
}

// Apply for a job
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    console.log('Auth header present:', !!authHeader);
    console.log('Auth header starts with Bearer:', authHeader?.startsWith('Bearer '));
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('Missing or invalid authorization header');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    console.log('Extracted token:', token.substring(0, 20) + '...');
    const decoded = verifyToken(token);

    if (!decoded || !decoded.id) {
      console.log('Token verification failed');
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Check if user is candidate
    if (decoded.role !== 'candidate') {
      console.log('User role is not candidate:', decoded.role);
      return NextResponse.json({ error: 'Only candidates can apply for jobs' }, { status: 403 });
    }

    await dbConnect();

    const { id } = await params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid job ID' }, { status: 400 });
    }

    // Check if job exists and is published
    const job = await Job.findById(id);
    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    if (job.status !== 'published') {
      return NextResponse.json({ error: 'Job is not available for applications' }, { status: 400 });
    }

    // Check if application deadline has passed
    if (job.applicationDeadline && new Date() > new Date(job.applicationDeadline)) {
      return NextResponse.json({ error: 'Application deadline has passed' }, { status: 400 });
    }

    // Check if user has already applied for this job
    const existingApplication = await Application.findOne({
      userId: decoded.id,
      jobId: id
    });

    if (existingApplication) {
      return NextResponse.json(
        { error: 'You have already applied for this position' },
        { status: 400 }
      );
    }

    const data = await request.json();
    const { documents = [], coverLetter = '' } = data;

    // Create new application
    const application = new Application({
      userId: decoded.id,
      jobId: id,
      status: 'Pending',
      documents,
      coverLetter,
      timeline: [{
        date: new Date(),
        status: 'Application Submitted',
        description: 'Your application has been received and is under review.'
      }],
      notifications: [{
        message: `Your application for ${job.title} has been submitted successfully.`,
        date: new Date(),
        read: false
      }]
    });

    await application.save();

    // Populate the application with job details
    const populatedApplication = await Application.findById(application._id)
      .populate({
        path: 'jobId',
        select: 'title department location employmentType salaryRange'
      });

    return NextResponse.json({
      success: true,
      application: populatedApplication,
      message: 'Application submitted successfully'
    });

  } catch (error: any) {
    console.error('Error applying for job:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to submit application' },
      { status: 500 }
    );
  }
}

// Update job by ID
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    
    const { id } = await params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid job ID' }, { status: 400 });
    }

    const data = await request.json();
    
    // Remove _id from data if present to avoid conflicts
    delete data._id;
    delete data.__v;
    
    const updatedJob = await Job.findByIdAndUpdate(
      id,
      { ...data, updatedAt: new Date() },
      { new: true, runValidators: true }
    );
    
    if (!updatedJob) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      job: updatedJob,
      message: 'Job updated successfully'
    });
  } catch (error: any) {
    console.error('Error updating job:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update job' },
      { status: 500 }
    );
  }
}
