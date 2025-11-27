import { NextRequest, NextResponse } from 'next/server';
import { dbConnect, Interview } from '@/data-access';
import { jwtVerify } from 'jose';
import { generateAvailableSlots } from '@/application';

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
    
    // Convert payload to our expected format
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

// GET /api/interviews/available-slots - Get available interview slots
export async function GET(request: NextRequest) {
  try {
    const decoded = await verifyToken(request);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const daysAhead = parseInt(searchParams.get('days') || '14');
    const excludeInterviewId = searchParams.get('excludeId');

    // Generate all possible slots
    const allSlots = generateAvailableSlots(new Date(), daysAhead);

    // Get already booked slots (excluding current interview if rescheduling)
    const bookedQuery: any = {
      status: { $in: ['scheduled', 'confirmed'] },
      'slot.date': { $gte: new Date() }
    };

    if (excludeInterviewId) {
      bookedQuery._id = { $ne: excludeInterviewId };
    }

    const bookedInterviews = await Interview.find(bookedQuery, 'slot.date');
    const bookedTimes = new Set(
      bookedInterviews.map(interview => interview.slot.date.getTime())
    );

    // Filter out booked slots
    const availableSlots = allSlots.filter(slot => 
      !bookedTimes.has(slot.date.getTime())
    );

    // Group slots by date for better frontend handling
    const slotsByDate = availableSlots.reduce((acc, slot) => {
      const dateKey = slot.date.toISOString().split('T')[0];
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      acc[dateKey].push({
        time: slot.date.toISOString(),
        duration: slot.duration,
        type: slot.type,
        displayTime: slot.date.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit'
        })
      });
      return acc;
    }, {} as Record<string, any[]>);

    return NextResponse.json({ 
      availableSlots: slotsByDate,
      totalSlots: availableSlots.length,
      daysAhead
    });

  } catch (error) {
    console.error('Error fetching available slots:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
