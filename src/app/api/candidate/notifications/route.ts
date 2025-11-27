import { NextRequest, NextResponse } from 'next/server';
import { dbConnect, Application } from '@/data-access';
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

// Get all notifications for candidate
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

    // Only allow candidates to access their notifications
    if (decoded.role !== 'candidate') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await dbConnect();

    // Get all applications with notifications
    const applications = await Application.find({ userId: decoded.userId })
      .populate({
        path: 'jobId',
        select: 'title department'
      })
      .select('notifications jobId status');

    // Flatten all notifications
    const allNotifications = applications.flatMap(app => 
      app.notifications?.map((notification: any) => ({
        ...notification.toObject(),
        applicationId: app._id,
        jobTitle: app.jobId?.title,
        jobDepartment: app.jobId?.department,
        applicationStatus: app.status
      })) || []
    );

    // Sort by date (newest first)
    allNotifications.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Get unread count
    const unreadCount = allNotifications.filter(notif => !notif.read).length;

    return NextResponse.json({
      notifications: allNotifications,
      unreadCount,
      totalCount: allNotifications.length
    });

  } catch (error: any) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}

// Mark notifications as read
export async function PUT(request: Request) {
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

    // Only allow candidates to update their notifications
    if (decoded.role !== 'candidate') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await dbConnect();

    const { markAllAsRead, notificationIds } = await request.json();

    if (markAllAsRead) {
      // Mark all notifications as read
      await Application.updateMany(
        { userId: decoded.userId },
        { $set: { 'notifications.$[].read': true } }
      );
    } else if (notificationIds && notificationIds.length > 0) {
      // Mark specific notifications as read
      await Application.updateMany(
        { 
          userId: decoded.userId,
          'notifications._id': { $in: notificationIds }
        },
        { $set: { 'notifications.$[elem].read': true } },
        { arrayFilters: [{ 'elem._id': { $in: notificationIds } }] }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Notifications marked as read'
    });

  } catch (error: any) {
    console.error('Error updating notifications:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update notifications' },
      { status: 500 }
    );
  }
}
