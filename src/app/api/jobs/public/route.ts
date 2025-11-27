import { NextRequest, NextResponse } from 'next/server';
import { dbConnect, Job } from '@/data-access';

// GET /api/jobs/public - Get published jobs (no auth required)
export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const jobs = await Job.find({ status: 'published' })
      .select('title department location employmentType experienceLevel description skills')
      .sort({ createdAt: -1 })
      .limit(50);

    return NextResponse.json({ 
      success: true,
      jobs 
    });

  } catch (error) {
    console.error('Error fetching public jobs:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Internal server error' 
    }, { status: 500 });
  }
}


