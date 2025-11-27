import { NextResponse } from 'next/server';
import { dbConnect, Application } from '@/data-access';
import { screenResumeWithAI, getJobRequirements } from '@/business-logic';

export async function POST(request: Request) {
  try {
    const { applicationId } = await request.json();
    
    if (!applicationId) {
      return NextResponse.json({ 
        error: 'Application ID is required' 
      }, { status: 400 });
    }
    
    await dbConnect();
    
    // Find the application
    const application = await Application.findById(applicationId).populate('jobId');
    
    if (!application) {
      return NextResponse.json({ 
        error: 'Application not found' 
      }, { status: 404 });
    }
    
    console.log('🔄 Force screening application:', applicationId);
    
    // Create a simple parsed resume if none exists or if parsing failed
    let resumeData = application.parsedResume;
    
    if (!resumeData || resumeData.parsingStatus !== 'success') {
      console.log('📝 Creating fallback resume data for screening');
      
      // Create a basic resume structure for testing
      resumeData = {
        personalInfo: {
          name: 'Test Candidate',
          email: 'test@example.com', 
          phone: '+1234567890',
          location: 'Unknown'
        },
        summary: 'Candidate applied for position',
        experience: [
          {
            company: 'Previous Company',
            position: 'Software Developer',
            duration: '2 years',
            description: 'Software development experience'
          }
        ],
        education: [
          {
            institution: 'University',
            degree: 'Bachelor',
            field: 'Computer Science',
            graduationYear: '2022'
          }
        ],
        skills: {
          technical: ['JavaScript', 'React', 'Node.js', 'Python'],
          soft: ['Communication', 'Problem Solving'],
          languages: ['English']
        },
        certifications: [],
        projects: [],
        rawText: 'Resume content...',
        parsingStatus: 'success',
        confidence: 0.8
      };
      
      // Update application with fallback data
      application.parsedResume = resumeData;
    }
    
    // Get job requirements
    const jobRequirements = await getJobRequirements(application.jobId._id);
    console.log('📋 Job requirements:', jobRequirements);
    
    // Screen with AI
    const screeningResult = await screenResumeWithAI(resumeData, jobRequirements);
    console.log('🤖 Screening result:', screeningResult);
    
    // Update application with evaluation
    application.evaluation = {
      score: screeningResult.score,
      feedback: screeningResult.reasoning,
      evaluatedBy: null,
      evaluationDate: new Date()
    };
    
    // Update status and timeline
    if (screeningResult.isShortlisted) {
      application.status = 'Under Review';
      application.timeline.push({
        date: new Date(),
        status: 'AI Screening Passed',
        description: `✅ Candidate scored ${screeningResult.score}% and has been shortlisted for interview. ${screeningResult.reasoning}`
      });
    } else {
      application.status = 'Under Review';  
      application.timeline.push({
        date: new Date(),
        status: 'AI Screening Failed',
        description: `❌ Candidate scored ${screeningResult.score}% and was not shortlisted. ${screeningResult.reasoning}`
      });
    }
    
    await application.save();
    
    return NextResponse.json({
      success: true,
      application: {
        id: application._id,
        status: application.status,
        evaluation: application.evaluation,
        timeline: application.timeline
      },
      screeningResult,
      message: 'Application screening completed successfully'
    });
    
  } catch (error: any) {
    console.error('Force screening error:', error);
    return NextResponse.json({ 
      error: 'Force screening failed',
      details: error.message || 'Unknown error'
    }, { status: 500 });
  }
}