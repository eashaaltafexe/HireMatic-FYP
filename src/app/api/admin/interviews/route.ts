import { NextRequest, NextResponse } from 'next/server';
import { dbConnect, Interview } from '@/data-access';
import { jwtVerify } from 'jose';

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

// GET /api/admin/interviews - Get all interviews (admin only)
export async function GET(request: NextRequest) {
  try {
    const decoded = await verifyToken(request);
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const filter = searchParams.get('filter') || 'upcoming';

    const query: any = {};
    const now = new Date();

    switch (filter) {
      case 'today':
        const todayStart = new Date(now);
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date(now);
        todayEnd.setHours(23, 59, 59, 999);
        query['slot.date'] = { $gte: todayStart, $lte: todayEnd };
        break;
      
      case 'upcoming':
        query['slot.date'] = { $gte: now };
        query.status = { $in: ['scheduled', 'confirmed'] };
        break;
      
      case 'past':
        query['slot.date'] = { $lt: now };
        break;
      
      case 'all':
      default:
        // No additional filters
        break;
    }

    const interviews = await Interview.find(query)
      .populate('jobId', 'title department company')
      .sort({ 'slot.date': 1 })
      .lean();

    return NextResponse.json({ 
      success: true,
      interviews,
      count: interviews.length
    });

  } catch (error) {
    console.error('Error fetching interviews:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Internal server error' 
    }, { status: 500 });
  }
}




