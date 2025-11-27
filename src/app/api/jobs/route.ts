import { NextResponse } from 'next/server';
import { dbConnect, Job } from '@/data-access';

export async function POST(request: Request) {
  try {
    await dbConnect();
    const body = await request.json();
    
    // Log the incoming job data
    console.log('Creating job with description:', body.description);
    
    const job = await Job.create(body);
    
    // Log the saved job data
    console.log('Job saved successfully. ID:', job._id);
    console.log('Saved description:', job.description);
    
    return NextResponse.json(job);
  } catch (error: any) {
    console.error('Error creating job:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create job listing' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    
    // Extract query parameters
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const department = searchParams.get('department');
    const employmentType = searchParams.get('employmentType');
    const location = searchParams.get('location');
    const experienceLevel = searchParams.get('experienceLevel');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    
    // Build query object
    const query: any = {};
    
    // Only show published jobs for public access
    if (status) {
      query.status = status;
    } else {
      query.status = 'published';
    }
    
    // Text search across multiple fields
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { department: { $regex: search, $options: 'i' } },
        { skills: { $in: [new RegExp(search, 'i')] } }
      ];
    }
    
    // Filter by department
    if (department && department !== 'All Departments') {
      query.department = department;
    }
    
    // Filter by employment type
    if (employmentType && employmentType !== 'All Types') {
      query.employmentType = employmentType;
    }
    
    // Filter by location
    if (location) {
      query.location = { $regex: location, $options: 'i' };
    }
    
    // Filter by experience level
    if (experienceLevel) {
      query.experienceLevel = experienceLevel;
    }
    
    // Build sort object
    const sort: any = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
    
    // Calculate pagination
    const skip = (page - 1) * limit;
    
    // Execute query with pagination
    const jobs = await Job.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean();
    
    // Get total count for pagination
    const totalJobs = await Job.countDocuments(query);
    const totalPages = Math.ceil(totalJobs / limit);
    
    // Get unique departments for filter options
    const departments = await Job.distinct('department', { status: 'published' });
    
    // Get unique employment types for filter options
    const employmentTypes = await Job.distinct('employmentType', { status: 'published' });
    
    // Get unique locations for filter options
    const locations = await Job.distinct('location', { status: 'published' });
    
    // Get unique experience levels for filter options
    const experienceLevels = await Job.distinct('experienceLevel', { status: 'published' });
    
    return NextResponse.json({
      jobs,
      pagination: {
        currentPage: page,
        totalPages,
        totalJobs,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      },
      filters: {
        departments: ['All Departments', ...departments],
        employmentTypes: ['All Types', ...employmentTypes],
        locations: [...locations],
        experienceLevels: [...experienceLevels]
      }
    });
  } catch (error: any) {
    console.error('Error fetching jobs:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch job listings' },
      { status: 500 }
    );
  }
} 