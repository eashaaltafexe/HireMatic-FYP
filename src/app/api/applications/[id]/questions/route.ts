import { NextRequest, NextResponse } from 'next/server';
import { dbConnect, Application } from '@/data-access';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key');

/**
 * GET /api/applications/[id]/questions
 * Retrieve generated questions for a specific application
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();

    // Verify authentication
    const token = request.cookies.get('token')?.value || 
                  request.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - No token provided' },
        { status: 401 }
      );
    }

    const { payload } = await jwtVerify(token, JWT_SECRET);

    // Get application with generated questions
    const application = await Application.findById(params.id)
      .select('generatedQuestions userId jobId parsedResume')
      .populate('jobId', 'title department')
      .populate('userId', 'name email');

    if (!application) {
      return NextResponse.json(
        { success: false, error: 'Application not found' },
        { status: 404 }
      );
    }

    // Check if user has access (candidate, HR, or admin)
    const isOwner = application.userId._id.toString() === payload.userId;
    const isAuthorized = isOwner || payload.role === 'admin' || payload.role === 'hr';

    if (!isAuthorized) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized to view these questions' },
        { status: 403 }
      );
    }

    // ENSURE EXACTLY 10 QUESTIONS - If no generated questions or less than 10, provide default questions
    let questions = application.generatedQuestions || [];
    
    // Function to get default questions based on job title
    const getDefaultQuestions = (jobTitle: string) => {
      const title = jobTitle.toLowerCase();
      
      // Check AI/ML FIRST (before checking for 'engineer' or 'developer')
      if (title.includes('ai') || title.includes('machine learning') || title.includes('ml') || title.includes('artificial intelligence')) {
        return [
          { id: 1, text: "Tell me about your experience with machine learning and AI technologies.", difficulty: "medium", jobField: "AI/ML" },
          { id: 2, text: "Describe a machine learning project you've worked on from start to finish.", difficulty: "medium", jobField: "AI/ML" },
          { id: 3, text: "What machine learning frameworks and libraries are you most comfortable with?", difficulty: "medium", jobField: "AI/ML" },
          { id: 4, text: "How do you approach model selection and evaluation?", difficulty: "medium", jobField: "AI/ML" },
          { id: 5, text: "Explain your experience with deep learning and neural networks.", difficulty: "hard", jobField: "AI/ML" },
          { id: 6, text: "How do you handle overfitting and underfitting in your models?", difficulty: "medium", jobField: "AI/ML" },
          { id: 7, text: "Describe your experience with data preprocessing and feature engineering.", difficulty: "medium", jobField: "AI/ML" },
          { id: 8, text: "How do you stay current with the latest developments in AI and machine learning?", difficulty: "easy", jobField: "AI/ML" },
          { id: 9, text: "What are your career goals in the AI/ML field?", difficulty: "easy", jobField: "Career Goals" },
          { id: 10, text: "Do you have any questions for us about the role or the company?", difficulty: "easy", jobField: "General" }
        ];
      } else if (title.includes('software') || title.includes('developer') || title.includes('engineer')) {
        return [
          { id: 1, text: "Tell me about your experience with software development and the technologies you've worked with.", difficulty: "medium", jobField: "Software Development" },
          { id: 2, text: "Describe a challenging project you worked on. What was your role and how did you overcome the challenges?", difficulty: "medium", jobField: "Software Development" },
          { id: 3, text: "How do you approach debugging and troubleshooting issues in your code?", difficulty: "medium", jobField: "Software Development" },
          { id: 4, text: "What development methodologies are you familiar with (Agile, Scrum, etc.)?", difficulty: "easy", jobField: "Software Development" },
          { id: 5, text: "How do you stay updated with new technologies and programming trends?", difficulty: "easy", jobField: "Software Development" },
          { id: 6, text: "Describe your experience with version control systems like Git.", difficulty: "easy", jobField: "Software Development" },
          { id: 7, text: "How do you ensure code quality and maintainability in your projects?", difficulty: "medium", jobField: "Software Development" },
          { id: 8, text: "Tell me about a time you had to work with a difficult team member. How did you handle it?", difficulty: "medium", jobField: "Soft Skills" },
          { id: 9, text: "What are your career goals and how does this position align with them?", difficulty: "easy", jobField: "Career Goals" },
          { id: 10, text: "Do you have any questions for us about the role or the company?", difficulty: "easy", jobField: "General" }
        ];
      } else if (title.includes('data') || title.includes('analyst') || title.includes('scientist')) {
        return [
          { id: 1, text: "Tell me about your experience with data analysis and the tools you've used.", difficulty: "medium", jobField: "Data Analysis" },
          { id: 2, text: "Describe a data project where you had to extract insights from complex datasets.", difficulty: "medium", jobField: "Data Analysis" },
          { id: 3, text: "What statistical methods and techniques are you most comfortable with?", difficulty: "medium", jobField: "Data Analysis" },
          { id: 4, text: "How do you approach data cleaning and preprocessing?", difficulty: "medium", jobField: "Data Analysis" },
          { id: 5, text: "What data visualization tools have you worked with?", difficulty: "easy", jobField: "Data Analysis" },
          { id: 6, text: "Describe your experience with SQL and database management.", difficulty: "medium", jobField: "Data Analysis" },
          { id: 7, text: "How do you communicate technical findings to non-technical stakeholders?", difficulty: "medium", jobField: "Communication" },
          { id: 8, text: "Tell me about a time when your analysis led to a significant business decision.", difficulty: "medium", jobField: "Data Analysis" },
          { id: 9, text: "What are your career goals in the data field?", difficulty: "easy", jobField: "Career Goals" },
          { id: 10, text: "Do you have any questions for us about the role or the company?", difficulty: "easy", jobField: "General" }
        ];
      } else {
        // Generic questions for any role
        return [
          { id: 1, text: "Tell me about yourself and your professional background.", difficulty: "easy", jobField: "General" },
          { id: 2, text: "What interests you about this position and our company?", difficulty: "easy", jobField: "General" },
          { id: 3, text: "Describe your relevant experience for this role.", difficulty: "medium", jobField: "Experience" },
          { id: 4, text: "What are your key strengths that make you suitable for this position?", difficulty: "easy", jobField: "Skills" },
          { id: 5, text: "Tell me about a challenging situation you faced at work and how you handled it.", difficulty: "medium", jobField: "Problem Solving" },
          { id: 6, text: "How do you prioritize tasks when working on multiple projects?", difficulty: "medium", jobField: "Time Management" },
          { id: 7, text: "Describe a time when you had to work as part of a team to achieve a goal.", difficulty: "medium", jobField: "Teamwork" },
          { id: 8, text: "What are your career goals and how does this position fit into them?", difficulty: "easy", jobField: "Career Goals" },
          { id: 9, text: "How do you handle feedback and criticism?", difficulty: "medium", jobField: "Soft Skills" },
          { id: 10, text: "Do you have any questions for us about the role or the company?", difficulty: "easy", jobField: "General" }
        ];
      }
    };
    
    // If no questions or less than 10 questions, use defaults
    if (questions.length < 10) {
      if (questions.length === 0) {
        console.log(`⚠️ No generated questions found for application ${params.id}, using 10 default questions`);
      } else {
        console.log(`⚠️ Only ${questions.length} questions found for application ${params.id}, replacing with 10 default questions`);
      }
      questions = getDefaultQuestions(application.jobId.title);
    }
    
    // FINAL SAFETY CHECK: Ensure exactly 10 questions
    if (questions.length !== 10) {
      console.error(`❌ Question count mismatch: ${questions.length} questions. Forcing 10 default questions.`);
      questions = getDefaultQuestions(application.jobId.title);
    }
    
    console.log(`✅ Returning ${questions.length} questions for ${application.jobId.title} interview`);

    return NextResponse.json({
      success: true,
      data: {
        applicationId: application._id,
        candidateName: application.userId.name,
        candidateEmail: application.userId.email,
        jobTitle: application.jobId.title,
        department: application.jobId.department,
        questions: questions,
        count: questions.length,
        resumeData: {
          name: application.parsedResume?.personalInfo?.name,
          skills: application.parsedResume?.skills,
          experience: application.parsedResume?.experience
        }
      }
    });
  } catch (error: any) {
    console.error('Error fetching questions:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch questions' },
      { status: 500 }
    );
  }
}
