import { NextResponse } from 'next/server';
import { dbConnect, Application, User } from '@/data-access';
import { jwtVerify } from 'jose';
import mongoose from 'mongoose';

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

// Get specific application details
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
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

    await dbConnect();

    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json({ error: 'Invalid application ID' }, { status: 400 });
    }

    const application = await Application.findOne({
      _id: params.id,
      userId: decoded.userId
    }).populate({
      path: 'jobId',
      select: 'title department location employmentType salaryRange description skills'
    });

    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    return NextResponse.json(application);

  } catch (error: any) {
    console.error('Error fetching application:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch application details' },
      { status: 500 }
    );
  }
}

// Update application status (for HR/Admin)
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
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

    // Check if user is HR or Admin
    if (!['hr', 'admin'].includes(decoded.role)) {
      return NextResponse.json({ error: 'Unauthorized to update applications' }, { status: 403 });
    }

    await dbConnect();

    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json({ error: 'Invalid application ID' }, { status: 400 });
    }

    const data = await request.json();
    const { status, interview, evaluation, notes } = data;

    // Validate status
    const validStatuses = ['Pending', 'Under Review', 'Interview Scheduled', 'Rejected', 'Accepted'];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    // Get the application
    const application = await Application.findById(params.id);
    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    // Prepare update data
    const updateData: any = {};
    const timelineEntry: any = {
      date: new Date(),
      status: status || application.status,
      description: notes || `Application status updated to ${status || application.status}`
    };

    if (status) {
      updateData.status = status;
    }

    if (interview) {
      updateData.interview = {
        ...application.interview,
        ...interview
      };
      timelineEntry.description = `Interview scheduled for ${interview.date}`;
    }

    if (evaluation) {
      updateData.evaluation = {
        ...application.evaluation,
        ...evaluation,
        evaluatedBy: decoded.userId,
        evaluationDate: new Date()
      };
      timelineEntry.description = `Evaluation completed with score: ${evaluation.score}`;
    }

    // Add notification for candidate
    const candidate = await User.findById(application.userId);
    if (candidate) {
      const notification = {
        message: `Your application status has been updated to: ${status || application.status}`,
        date: new Date(),
        read: false
      };
      updateData.$push = { notifications: notification };
    }

    // Update application
    const updatedApplication = await Application.findByIdAndUpdate(
      params.id,
      {
        ...updateData,
        $push: { timeline: timelineEntry }
      },
      { new: true, runValidators: true }
    ).populate({
      path: 'jobId',
      select: 'title department location employmentType'
    }).populate({
      path: 'userId',
      select: 'name email'
    });

    return NextResponse.json({
      success: true,
      application: updatedApplication,
      message: 'Application updated successfully'
    });

  } catch (error: any) {
    console.error('Error updating application:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update application' },
      { status: 500 }
    );
  }
}

// Delete application (candidate can withdraw)
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
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

    await dbConnect();

    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json({ error: 'Invalid application ID' }, { status: 400 });
    }

    // Check if application belongs to user or user is admin/hr
    const application = await Application.findOne({
      _id: params.id,
      $or: [
        { userId: decoded.userId },
        ...(decoded.role === 'admin' || decoded.role === 'hr' ? [{}] : [])
      ]
    });

    if (!application) {
      return NextResponse.json({ error: 'Application not found or unauthorized' }, { status: 404 });
    }

    await Application.findByIdAndDelete(params.id);

    return NextResponse.json({
      success: true,
      message: 'Application deleted successfully'
    });

  } catch (error: any) {
    console.error('Error deleting application:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete application' },
      { status: 500 }
    );
  }
}
