import { NextResponse } from 'next/server';
import { screenResumeWithAI, getJobRequirements } from '@/business-logic';

export async function POST(request: Request) {
  try {
    const { resumeData, jobId } = await request.json();
    
    if (!resumeData || !jobId) {
      return NextResponse.json({ 
        error: 'Missing resumeData or jobId' 
      }, { status: 400 });
    }
    
    console.log('🧪 Testing AI screening with:', {
      candidateName: resumeData.personalInfo?.name,
      skillsCount: resumeData.skills?.technical?.length || 0,
      experienceCount: resumeData.experience?.length || 0,
      jobId
    });
    
    // Get job requirements
    const jobRequirements = await getJobRequirements(jobId);
    
    // Screen resume
    const screeningResult = await screenResumeWithAI(resumeData, jobRequirements);
    
    return NextResponse.json({
      success: true,
      jobRequirements,
      screeningResult,
      message: 'AI screening test completed successfully'
    });
    
  } catch (error: any) {
    console.error('AI screening test error:', error);
    return NextResponse.json({ 
      error: 'AI screening test failed',
      details: error.message || 'Unknown error'
    }, { status: 500 });
  }
}

// Test endpoint with sample data
export async function GET() {
  try {
    const sampleResumeData = {
      personalInfo: {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890',
        location: 'New York, NY'
      },
      summary: 'Experienced full-stack developer with 3+ years of experience',
      experience: [
        {
          company: 'Tech Corp',
          position: 'Software Developer',
          duration: '2021-2024',
          description: 'Developed React and Node.js applications'
        }
      ],
      education: [
        {
          institution: 'University of Tech',
          degree: 'Bachelor',
          field: 'Computer Science',
          graduationYear: '2021'
        }
      ],
      skills: {
        technical: ['JavaScript', 'React', 'Node.js', 'Python'],
        soft: ['Communication', 'Teamwork'],
        languages: ['English', 'Spanish']
      },
      certifications: [],
      projects: [],
      rawText: 'Sample resume text...',
      parsingStatus: 'success',
      confidence: 0.9
    };
    
    // Use a fake job ID for testing
    const testJobId = '507f1f77bcf86cd799439011';
    
    const jobRequirements = await getJobRequirements(testJobId);
    const screeningResult = await screenResumeWithAI(sampleResumeData, jobRequirements);
    
    return NextResponse.json({
      success: true,
      testData: {
        resumeData: sampleResumeData,
        jobRequirements,
        screeningResult
      },
      message: 'Sample AI screening test completed'
    });
    
  } catch (error: any) {
    console.error('Sample AI screening test error:', error);
    return NextResponse.json({ 
      error: 'Sample AI screening test failed',
      details: error.message || 'Unknown error'
    }, { status: 500 });
  }
}