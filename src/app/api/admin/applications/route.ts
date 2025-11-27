import { NextResponse } from 'next/server';
import { dbConnect, Application } from '@/data-access';
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

// GET - Fetch all applications (admin only)
export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const decoded = await verifyToken(token);

    if (!decoded || !decoded.userId) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Allow both admin and hr roles
    if (decoded.role !== 'admin' && decoded.role !== 'hr') {
      return NextResponse.json({ error: 'Unauthorized - Admin or HR access required' }, { status: 403 });
    }

    await dbConnect();

    // Fetch all applications with populated job and user info
    const applications = await Application.find({})
      .populate({
        path: 'jobId',
        select: 'title company department location type'
      })
      .populate({
        path: 'userId',
        select: 'name email phone'
      })
      .sort({ appliedDate: -1 })
      .lean(); // Use lean() for better performance

    return NextResponse.json({
      success: true,
      data: applications
    });

  } catch (error) {
    console.error('Error in admin applications API:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch applications' 
    }, { status: 500 });
  }
}
