import { NextResponse } from 'next/server';
import { dbConnect, Application, Job } from '@/data-access';
import { screenResumeWithAI, getJobRequirements } from '@/business-logic';

export async function POST(request: Request) {
  try {
    const { userId, jobId } = await request.json();
    
    if (!userId || !jobId) {
      return NextResponse.json({ 
        error: 'userId and jobId are required' 
      }, { status: 400 });
    }
    
    await dbConnect();
    
    console.log('🧪 Creating test application for screening test...');
    
    // Create sample resume data for testing
    const sampleResumeData = {
      personalInfo: {
        name: 'Test Candidate',
        email: 'test@example.com',
        phone: '+1234567890',
        location: 'Test City'
      },
      summary: 'Experienced developer with 3+ years in software development',
      experience: [
        {
          company: 'Tech Company',
          position: 'Software Developer',
          duration: '2021-2024',
          description: 'Developed web applications using React, Node.js, and MongoDB'
        },
        {
          company: 'Another Tech Co',
          position: 'Junior Developer', 
          duration: '2020-2021',
          description: 'Worked on JavaScript projects and learned modern frameworks'
        }
      ],
      education: [
        {
          institution: 'Tech University',
          degree: 'Bachelor',
          field: 'Computer Science',
          graduationYear: '2020'
        }
      ],
      skills: {
        technical: ['JavaScript', 'React', 'Node.js', 'MongoDB', 'TypeScript', 'Python'],
        soft: ['Communication', 'Teamwork', 'Problem Solving'],
        languages: ['English', 'Spanish']
      },
      certifications: [
        {
          name: 'AWS Developer Associate',
          issuer: 'AWS',
          date: '2023'
        }
      ],
      projects: [
        {
          name: 'E-commerce Platform',
          description: 'Built a full-stack e-commerce platform using MERN stack',
          technologies: ['React', 'Node.js', 'MongoDB', 'Express']
        }
      ],
      rawText: 'Sample resume content...',
      parsingStatus: 'success',
      confidence: 0.9
    };
    
    // Create the application
    const application = new Application({
      userId: userId,
      jobId: jobId,
      status: 'Pending',
      documents: [{
        name: 'test-resume.pdf',
        url: '/uploads/test-resume.pdf',
        type: 'application/pdf'
      }],
      coverLetter: 'Test cover letter for screening demonstration',
      parsedResume: sampleResumeData,
      timeline: [{
        date: new Date(),
        status: 'Application Submitted',
        description: 'Test application created for screening demonstration'
      }]
    });

    await application.save();
    console.log('✅ Test application created:', application._id);

    // Now run AI screening
    console.log('🤖 Starting AI screening...');
    
    const jobRequirements = await getJobRequirements(jobId);
    console.log('📋 Job requirements:', jobRequirements);
    
    const screeningResult = await screenResumeWithAI(sampleResumeData, jobRequirements);
    console.log('🎯 Screening result:', screeningResult);
    
    // Update application with evaluation
    application.evaluation = {
      score: screeningResult.score,
      feedback: screeningResult.reasoning,
      evaluatedBy: null,
      evaluationDate: new Date()
    };
    
    // Update status and timeline based on screening result
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
    console.log('💾 Application updated with screening results');
    
    // Return the populated application
    const populatedApplication = await Application.findById(application._id)
      .populate('jobId', 'title company department location')
      .populate('userId', 'name email');
    
    return NextResponse.json({
      success: true,
      application: populatedApplication,
      screeningResult: screeningResult,
      message: 'Test application created and screened successfully'
    });
    
  } catch (error: any) {
    console.error('Test application creation error:', error);
    return NextResponse.json({ 
      error: 'Failed to create test application',
      details: error.message || 'Unknown error'
    }, { status: 500 });
  }
}