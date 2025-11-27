import { NextResponse } from 'next/server';
import { dbConnect, Application, User, Job } from '@/data-access';
import mongoose from 'mongoose';
import { parseResume, screenResumeWithAI, getJobRequirements, generateQuestionsForShortlistedCandidate, storeGeneratedQuestions } from '@/business-logic';
import fs from 'fs/promises';
import path from 'path';
import { jwtVerify } from 'jose';
import { scheduleInterview, sendInterviewNotifications } from '@/application';

// Define the JWT payload interface to match the token creation
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

// Get all applications for the current user
export async function GET(req: Request) {
  try {
    // Extract and validate the authorization header
    const authHeader = req.headers.get('authorization');
    
    if (!authHeader?.startsWith('Bearer ')) {
      console.log('Missing or invalid authorization header');
      return NextResponse.json([], { status: 200 }); // Return empty array for no auth
    }

    // Extract and verify the token
    const token = authHeader.split(' ')[1];
    const decoded = await verifyToken(token);

    if (!decoded?.userId) {
      console.log('Invalid or expired token detected');
      return NextResponse.json([], { status: 200 }); // Return empty array for invalid token
    }

    // Connect to database and fetch applications
    await dbConnect();
    
    const applications = await Application.find({ userId: decoded.userId })
      .populate({
        path: 'jobId',
        select: 'title company department location type'
      })
      .sort({ appliedDate: -1 })
      .lean(); // Use lean() for better performance

    return NextResponse.json(applications);

  } catch (error) {
    console.error('Error in applications API:', error);
    // Return empty array instead of error for better user experience
    return NextResponse.json([], { status: 200 });
  }
}

// Create a new application
export async function POST(req: Request) {
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

    await dbConnect();
    const data = await req.json();

    if (!data.jobId || !mongoose.Types.ObjectId.isValid(data.jobId)) {
      return NextResponse.json({ error: 'Invalid job ID' }, { status: 400 });
    }

    // Check if application already exists
    const existingApplication = await Application.findOne({
      userId: decoded.userId,
      jobId: data.jobId
    });

    if (existingApplication) {
      return NextResponse.json(
        { error: 'You have already applied for this position' },
        { status: 400 }
      );
    }

    // Parse resume first if documents are provided
    let parsedResumeData = {
      parsingStatus: 'failed',
      parsingError: 'No resume file provided',
      personalInfo: { name: '', email: '', phone: '', location: '' },
      summary: '',
      experience: [] as any[],
      education: [] as any[],
      skills: { technical: [] as string[], soft: [] as string[], languages: [] as string[] },
      certifications: [] as any[],
      projects: [] as any[],
      rawText: '',
      confidence: 0
    };

    if (data.documents && data.documents.length > 0) {
      try {
        console.log('Starting resume parsing before saving application');
        
        // Find the first resume file (PDF, DOC, DOCX, TXT)
        const resumeFile = data.documents.find((doc: any) => 
          doc.type === 'application/pdf' || 
          doc.type === 'application/msword' || 
          doc.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
          doc.type === 'text/plain'
        );

        if (resumeFile) {
          console.log('Found resume file:', resumeFile.name, 'Type:', resumeFile.type);
          
          // Construct file path from URL
          const fileName = resumeFile.url.split('/').pop();
          const filePath = path.join(process.cwd(), 'public', 'uploads', fileName);
          
          console.log('Resume file path:', filePath);
          
          // Check if file exists
          try {
            await fs.access(filePath);
            console.log('Resume file exists, proceeding with parsing');
          } catch (error) {
            console.error('Resume file not found:', filePath);
            throw new Error('Resume file not found');
          }
          
          // Determine file type
          let fileType = 'txt';
          if (resumeFile.type === 'application/pdf') {
            fileType = 'pdf';
          } else if (resumeFile.type === 'application/msword') {
            fileType = 'doc';
          } else if (resumeFile.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
            fileType = 'docx';
          }
          
          // Parse the resume using ML model
          console.log('🤖 Starting ML-powered resume parsing...');
          const parsedData = await parseResume(filePath, fileType);
          console.log('✅ Resume parsing completed successfully');
          
          // Set parsed data for storage
          parsedResumeData = {
            ...parsedData,
            parsingStatus: 'success',
            parsingError: ''
          };
          console.log('Resume parsed successfully, will store parsed data');
          
        } else {
          console.log('No resume file found in documents');
          parsedResumeData = {
            parsingStatus: 'failed',
            parsingError: 'No resume file found in uploaded documents',
            personalInfo: { name: '', email: '', phone: '', location: '' },
            summary: '',
            experience: [] as any[],
            education: [] as any[],
            skills: { technical: [] as string[], soft: [] as string[], languages: [] as string[] },
            certifications: [] as any[],
            projects: [] as any[],
            rawText: '',
            confidence: 0
          };
        }
        
      } catch (error: any) {
        console.error('Error parsing resume:', error);
        parsedResumeData = {
          parsingStatus: 'failed',
          parsingError: error.message || 'Failed to parse resume',
          personalInfo: { name: '', email: '', phone: '', location: '' },
          summary: '',
          experience: [] as any[],
          education: [] as any[],
          skills: { technical: [] as string[], soft: [] as string[], languages: [] as string[] },
          certifications: [] as any[],
          projects: [] as any[],
          rawText: '',
          confidence: 0
        };
      }
    }

    // Filter out resume files from documents array - only store non-resume documents
    const nonResumeDocuments = data.documents ? data.documents.filter((doc: any) => 
      !(doc.type === 'application/pdf' || 
        doc.type === 'application/msword' || 
        doc.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        doc.type === 'text/plain')
    ) : [];

    // Initialize application with parsed resume data (no raw resume file stored)
    const application = new Application({
      userId: decoded.userId,
      jobId: data.jobId,
      status: 'Pending',
      documents: nonResumeDocuments, // Only non-resume documents stored
      coverLetter: data.coverLetter || '',
      parsedResume: parsedResumeData, // Store parsed resume data instead of raw file
      timeline: [{
        date: new Date(),
        status: 'Application Submitted',
        description: 'Your application has been received and resume has been processed.'
      }]
    });

    await application.save();
    console.log('Application saved with parsed resume data, raw resume file not stored');

    // 🤖 AI SCREENING AND INTERVIEW SCHEDULING PIPELINE
    console.log('📊 Checking if AI screening should run. Parsing status:', parsedResumeData.parsingStatus);
    
    if (parsedResumeData.parsingStatus === 'success') {
      try {
        console.log('🚀 Starting AI screening pipeline for application:', application._id);
        
        // Step 1: Get job requirements
        console.log('📋 Fetching job requirements for job ID:', data.jobId);
        const jobRequirements = await getJobRequirements(data.jobId);
        console.log('📋 Job requirements fetched:', jobRequirements);
        
        // Step 2: Screen resume with AI
        console.log('🤖 Starting AI screening with parsed resume data');
        const screeningResult = await screenResumeWithAI(parsedResumeData, jobRequirements);
        console.log('🤖 AI screening completed:', screeningResult);
        
        // Step 3: Update application with screening results
        application.evaluation = {
          score: screeningResult.score,
          feedback: screeningResult.reasoning,
          evaluatedBy: null, // AI evaluation
          evaluationDate: new Date()
        };
        
        // Step 4: If shortlisted, automatically schedule interview
        if (screeningResult.isShortlisted) {
          console.log('✅ Candidate shortlisted! Scheduling interview...');
          
          // Update application status to shortlisted
          application.status = 'Under Review';
          application.timeline.push({
            date: new Date(),
            status: 'AI Screening Passed',
            description: `Candidate scored ${screeningResult.score}% and has been shortlisted for interview. ${screeningResult.reasoning} (Gemini AI - Parsing confidence: ${Math.round((screeningResult.mlConfidence || 0) * 100)}%)`
          });
          
          // Step 4.1: Generate interview questions automatically
          try {
            console.log('🤖 Generating interview questions...');
            const job = await Job.findById(data.jobId).select('title');
            const candidate = await User.findById(decoded.userId).select('name');
            
            if (job && candidate) {
              const questionResult = await generateQuestionsForShortlistedCandidate(
                job.title,
                candidate.name,
                application._id.toString()
              );
              
              if (questionResult.success && questionResult.questions.length > 0) {
                await storeGeneratedQuestions(application._id.toString(), questionResult.questions);
                console.log(`✅ Generated and stored ${questionResult.count} questions`);
              } else {
                console.warn('⚠️ Question generation failed, using fallback questions');
              }
            }
          } catch (questionError) {
            console.error('❌ Error generating questions:', questionError);
            // Continue with interview scheduling even if question generation fails
          }
          
          // Schedule interview
          const scheduledInterview = await scheduleInterview(
            application._id.toString(),
            decoded.userId,
            data.jobId
          );
          
          if (scheduledInterview) {
            // Update application with interview details - TEMPORARILY DISABLED DUE TO MONGOOSE VALIDATION ERROR
            /* application.interview = {
              date: scheduledInterview.slot.date,
              link: scheduledInterview.link,
              type: scheduledInterview.slot.type,
              notes: 'AI-powered interview automatically scheduled'
            } as any;
            application.markModified('interview'); */
            
            application.status = 'Interview Scheduled';
            application.timeline.push({
              date: new Date(),
              status: 'Interview Scheduled',
              description: `AI interview scheduled for ${scheduledInterview.slot.date.toLocaleDateString()} at ${scheduledInterview.slot.date.toLocaleTimeString()}`
            });
            
            // Get candidate and job details for notifications
            const candidate = await User.findById(decoded.userId).select('name email phone');
            const job = await Job.findById(data.jobId).select('title company');
            
            if (candidate && job) {
              // Send notifications (email + in-app + SMS)
              const notificationData = {
                candidateId: decoded.userId,
                candidateName: candidate.name,
                candidateEmail: candidate.email,
                candidatePhone: candidate.phone,
                jobTitle: job.title,
                companyName: job.company,
                interviewDate: scheduledInterview.slot.date,
                interviewLink: scheduledInterview.link,
                type: 'interview_scheduled' as const
              };
              
              const notificationResults = await sendInterviewNotifications(notificationData);
              console.log('📬 Notifications sent:', notificationResults);
              
              // Add in-app notification to application
              application.notifications.push({
                message: `🎉 Great news! Your AI interview for ${job.title} is scheduled for ${scheduledInterview.slot.date.toLocaleDateString()} at ${scheduledInterview.slot.date.toLocaleTimeString()}. Click to view details.`,
                date: new Date(),
                read: false
              });
            }
            
            console.log('🎉 Interview scheduled and notifications sent successfully!');
          } else {
            console.log('⚠️ Could not schedule interview - no available slots');
            application.timeline.push({
              date: new Date(),
              status: 'Scheduling Failed',
              description: 'Candidate shortlisted but no interview slots available. HR will contact manually.'
            });
          }
        } else {
          console.log('❌ Candidate not shortlisted');
          application.status = 'Under Review';
          application.timeline.push({
            date: new Date(),
            status: 'AI Screening Failed',
            description: `Candidate scored ${screeningResult.score}% and was not shortlisted. ${screeningResult.reasoning} (Gemini AI - Parsing confidence: ${Math.round((screeningResult.mlConfidence || 0) * 100)}%)`
          });
        }
        
        // Save updated application with screening results
        await application.save();
        console.log('💾 Application updated with AI screening results');
        
      } catch (screeningError) {
        console.error('❌ AI screening pipeline failed:', screeningError);
        // Continue without failing the application creation
        application.timeline.push({
          date: new Date(),
          status: 'Screening Error',
          description: 'AI screening failed due to technical issues. Application will be reviewed manually.'
        });
        await application.save();
      }
    } else {
      console.log('⚠️ AI screening skipped. Resume parsing status:', parsedResumeData.parsingStatus);
      console.log('⚠️ Parsing error:', parsedResumeData.parsingError);
      
      // Try fallback screening with basic resume data if we have documents
      if (data.documents && data.documents.length > 0) {
        try {
          console.log('🔄 Attempting fallback AI screening with basic resume data...');
          
          // Create basic resume structure for screening
          const fallbackResumeData = {
            personalInfo: {
              name: 'Candidate',
              email: 'candidate@example.com',
              phone: '',
              location: 'Unknown'
            },
            summary: 'Resume submitted for screening',
            experience: [{
              company: 'Previous Experience',
              position: 'Professional',
              duration: '1+ years',
              description: 'Work experience'
            }],
            education: [{
              institution: 'Educational Institution',
              degree: 'Degree',
              field: 'Field of Study',
              graduationYear: '2023'
            }],
            skills: {
              technical: ['General Skills'],
              soft: ['Communication'],
              languages: ['English']
            },
            certifications: [],
            projects: [],
            rawText: 'Resume content uploaded',
            parsingStatus: 'success',
            confidence: 0.5
          };
          
          const jobRequirements = await getJobRequirements(data.jobId);
          const screeningResult = await screenResumeWithAI(fallbackResumeData, jobRequirements);
          
          // Update application with fallback screening
          application.evaluation = {
            score: screeningResult.score,
            feedback: `${screeningResult.reasoning} (Note: Resume parsing failed, used basic screening)`,
            evaluatedBy: null,
            evaluationDate: new Date()
          };
          
          application.timeline.push({
            date: new Date(),
            status: screeningResult.isShortlisted ? 'Basic Screening Passed' : 'Basic Screening Failed',
            description: `Fallback screening: ${screeningResult.reasoning} (Resume parsing failed but basic screening applied)`
          });
          
          await application.save();
          console.log('🔄 Fallback AI screening completed successfully');
          
        } catch (fallbackError) {
          console.error('❌ Fallback screening also failed:', fallbackError);
        }
      }
    }

    const populatedApplication = await Application.findById(application._id)
      .populate({
        path: 'jobId',
        select: 'title company department location type'
      });

    return NextResponse.json(populatedApplication);
  } catch (error) {
    console.error('Error creating application:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// Update an application
export async function PUT(req: Request) {
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

    await dbConnect();
    const data = await req.json();
    const { id, ...updateData } = data;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid application ID' }, { status: 400 });
    }

    // Prepare the update data
    const update: any = { $set: updateData };
    if (updateData.timeline) {
      update.$push = { 
        timeline: {
          ...updateData.timeline,
          date: new Date()
        }
      };
      delete update.$set.timeline;
    }

    const application = await Application.findOneAndUpdate(
      { _id: id, userId: decoded.userId },
      update,
      { 
        new: true,
        runValidators: true
      }
    ).populate({
      path: 'jobId',
      select: 'title company department location type'
    });

    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    return NextResponse.json(application);
  } catch (error) {
    console.error('Error updating application:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 