/**
 * Auto Question Generator Service
 * Automatically generates interview questions when candidates are shortlisted
 */

interface GeneratedQuestion {
  id: number;
  text: string;
  type: 'technical' | 'behavioral' | 'situational' | 'coding' | 'system-design';
  difficulty: 'easy' | 'medium' | 'hard';
  jobField?: string;
  generatedAt?: Date;
}

interface QuestionGenerationResult {
  success: boolean;
  questions: GeneratedQuestion[];
  count: number;
  error?: string;
}

/**
 * Generate questions automatically when a candidate is shortlisted
 */
export async function generateQuestionsForShortlistedCandidate(
  jobTitle: string,
  candidateName: string,
  applicationId: string
): Promise<QuestionGenerationResult> {
  try {
    console.log(`🤖 Generating questions for ${candidateName} - ${jobTitle}`);
    
    // Extract job field/role from job title (e.g., "Senior Software Engineer" -> "software engineer")
    const jobField = extractJobField(jobTitle);
    
    // Call the Python service to generate questions
    const pythonServiceUrl = process.env.PYTHON_SERVICE_URL || 'http://localhost:8000';
    const response = await fetch(`${pythonServiceUrl}/generate-multiple`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        role: jobField,
        num_questions: 10, // Generate 10 questions by default
      }),
    });

    if (!response.ok) {
      throw new Error(`Python service error: ${response.statusText}`);
    }

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error);
    }

    // Map questions and add jobField
    const questions: GeneratedQuestion[] = data.questions.map((q: any) => ({
      ...q,
      jobField,
      generatedAt: new Date(),
    }));

    console.log(`✅ Generated ${questions.length} questions for ${jobField}`);
    
    return {
      success: true,
      questions,
      count: questions.length,
    };
  } catch (error: any) {
    console.error('❌ Error generating questions:', error);
    
    // Return fallback questions if service is down
    return {
      success: false,
      questions: getFallbackQuestions(jobTitle),
      count: 0,
      error: error.message,
    };
  }
}

/**
 * Extract job field from job title
 */
function extractJobField(jobTitle: string): string {
  const title = jobTitle.toLowerCase();
  
  // Map common job titles to fields
  if (title.includes('software') || title.includes('developer') || title.includes('programmer')) {
    return 'software engineer';
  } else if (title.includes('data scientist') || title.includes('ml engineer')) {
    return 'data scientist';
  } else if (title.includes('frontend') || title.includes('front-end')) {
    return 'frontend developer';
  } else if (title.includes('backend') || title.includes('back-end')) {
    return 'backend developer';
  } else if (title.includes('devops') || title.includes('sre')) {
    return 'devops engineer';
  } else if (title.includes('machine learning') || title.includes('ai engineer')) {
    return 'machine learning engineer';
  } else if (title.includes('full stack') || title.includes('fullstack')) {
    return 'full stack developer';
  } else if (title.includes('product manager') || title.includes('pm')) {
    return 'product manager';
  }
  
  // Default fallback
  return 'software engineer';
}

/**
 * Fallback questions if Python service is unavailable
 */
function getFallbackQuestions(jobTitle: string): GeneratedQuestion[] {
  const jobField = extractJobField(jobTitle);
  
  const fallbackQuestions = [
    { id: 1, text: "Tell me about your experience in this field.", type: "behavioral" as const, difficulty: "medium" as const },
    { id: 2, text: "What technical skills do you bring to this role?", type: "technical" as const, difficulty: "medium" as const },
    { id: 3, text: "Describe a challenging project you've worked on.", type: "behavioral" as const, difficulty: "medium" as const },
    { id: 4, text: "How do you stay updated with industry trends?", type: "behavioral" as const, difficulty: "easy" as const },
    { id: 5, text: "What is your approach to problem-solving?", type: "situational" as const, difficulty: "medium" as const },
    { id: 6, text: "Describe your experience with team collaboration.", type: "behavioral" as const, difficulty: "easy" as const },
    { id: 7, text: "How do you handle tight deadlines?", type: "situational" as const, difficulty: "medium" as const },
    { id: 8, text: "What are your strengths and weaknesses?", type: "behavioral" as const, difficulty: "easy" as const },
    { id: 9, text: "Why are you interested in this position?", type: "behavioral" as const, difficulty: "easy" as const },
    { id: 10, text: "Where do you see yourself in 5 years?", type: "behavioral" as const, difficulty: "easy" as const },
  ];
  
  return fallbackQuestions.map(q => ({
    ...q,
    jobField,
    generatedAt: new Date(),
  }));
}

/**
 * Store generated questions in database
 */
export async function storeGeneratedQuestions(
  applicationId: string,
  questions: GeneratedQuestion[]
): Promise<boolean> {
  try {
    const Application = (await import('@/data-access')).Application;
    
    // Update application with generated questions
    const application = await Application.findById(applicationId);
    
    if (!application) {
      console.error('❌ Application not found:', applicationId);
      return false;
    }
    
    // Add questions to application
    application.generatedQuestions = questions;
    
    // Add timeline entry
    application.timeline.push({
      date: new Date(),
      status: 'Questions Generated',
      description: `${questions.length} AI-generated interview questions created for ${questions[0]?.jobField || 'this role'}`,
    });
    
    await application.save();
    
    console.log(`✅ Stored ${questions.length} questions for application ${applicationId}`);
    return true;
  } catch (error) {
    console.error('❌ Error storing questions:', error);
    return false;
  }
}

export default {
  generateQuestionsForShortlistedCandidate,
  storeGeneratedQuestions,
};
