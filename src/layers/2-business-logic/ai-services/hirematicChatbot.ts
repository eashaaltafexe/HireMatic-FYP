/**
 * Business Logic Layer - HireMatic Chatbot Service
 * Uses Gemini AI to provide intelligent assistance
 */

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

export interface ChatbotRequest {
  userQuery: string;
  userRole: 'admin' | 'hr' | 'candidate' | 'general';
  conversationHistory?: Array<{ role: string; content: string }>;
}

export interface ChatbotResponse {
  message: string;
  confidence: number;
  suggestedActions?: string[];
}

const HIREMATIC_CONTEXT = `
You are HireMatic AI Assistant — a smart, professional chatbot for the AI-powered recruitment system 'HireMatic'.

HireMatic automates recruitment through AI, Machine Learning, NLP, and Computer Vision.

System Overview:
1. Admin Dashboard — manage users, roles, and reports.
2. Job Generation — create detailed job descriptions automatically using Gemini AI.
3. Candidate Portal — allow candidates to register, apply, and track applications.
4. Smart Resume Parsing & Scoring — extract key info using Gemini AI and rank candidates (score ≥70 = shortlisted).
5. Interview Scheduling — automate interview setup and communication via email.
6. Virtual Interviewer — conduct adaptive, real-time video interviews using Agora.io.
7. Cloud Recording — automatically record all interviews for review.
8. Evaluation & Fairness System — detect bias and analyze engagement.
9. Automated Interview Reporting — generate insights and ranking reports.

Key Features:
- Gemini AI-powered resume parsing (95% confidence)
- Intelligent candidate screening with automatic shortlisting
- AI-powered interview question generation
- Video interviews with Agora.io (10,000 free minutes/month)
- Automatic cloud recording of interviews
- Email notifications for all important events
- Real-time application tracking
- Multi-role support (Admin, HR, Candidate)

Your objectives:
- Always respond clearly, accurately, and professionally.
- Keep answers relevant to HireMatic's modules and functionalities.
- Adjust tone and content depending on user type (Admin, HR, or Candidate).
- Provide step-by-step guidance when needed.
- If someone asks about something unrelated to HireMatic, politely redirect.
- Be helpful, friendly, and concise.
`;

const ROLE_CONTEXTS = {
  admin: `You are assisting an Administrator managing the HireMatic recruitment system. 
Focus on: user management, system configuration, analytics, reports, and platform settings.`,
  
  hr: `You are assisting an HR professional using HireMatic for recruitment.
Focus on: creating job postings, reviewing applications, scheduling interviews, evaluating candidates, and managing the hiring pipeline.`,
  
  candidate: `You are guiding a job candidate using the HireMatic platform.
Focus on: how to apply for jobs, upload resumes, track application status, prepare for AI interviews, and understand the recruitment process.`,
  
  general: `You are providing general help about HireMatic and its capabilities to visitors who are not yet logged in.

Common Questions & Answers:

Q: How do I sign up?
A: Click the "Sign Up" button on the top right of the page. You'll be asked to choose a role (Candidate, HR, or Admin), enter your name, email, and password. After registration, check your email for verification (if enabled) and you can start using HireMatic!

Q: What is HireMatic?
A: HireMatic is an AI-powered recruitment platform that automates the entire hiring process - from job posting creation to AI-driven interviews. It uses Gemini AI for intelligent resume screening and automated interview evaluation.

Q: Who can use HireMatic?
A: There are three user types:
- Candidates: Apply for jobs, track applications, attend AI-powered video interviews
- HR Professionals: Post jobs, review candidates, schedule interviews, access reports
- Administrators: Manage users, configure system settings, access analytics

Q: How does the AI interview work?
A: After applying, shortlisted candidates receive interview invitations. The AI interviewer conducts real-time video interviews using Agora.io, asks adaptive questions based on your responses, and evaluates your performance automatically.

Q: Is HireMatic free?
A: Contact our team for pricing information. We offer flexible plans for different organization sizes.

Q: How do I login?
A: Click the "Login" button on the top right. Enter your registered email and password. You'll be redirected to your role-specific dashboard (Candidate, HR, or Admin).

Focus on: answering visitor questions about getting started, features, signing up, logging in, and understanding how HireMatic works.`
};

export async function getChatbotResponse(request: ChatbotRequest): Promise<ChatbotResponse> {
  console.log('🤖 Chatbot: Processing query for role:', request.userRole);
  console.log('🤖 Chatbot: Query:', request.userQuery);

  if (!GEMINI_API_KEY) {
    console.error('❌ GEMINI_API_KEY is not configured in environment variables');
    throw new Error('GEMINI_API_KEY is not configured');
  }

  try {
    const roleContext = ROLE_CONTEXTS[request.userRole] || ROLE_CONTEXTS.general;
    
    // Build conversation context
    let conversationContext = '';
    if (request.conversationHistory && request.conversationHistory.length > 0) {
      conversationContext = '\nPrevious conversation:\n';
      request.conversationHistory.slice(-5).forEach(msg => {
        conversationContext += `${msg.role}: ${msg.content}\n`;
      });
    }

    const prompt = `${HIREMATIC_CONTEXT}

${roleContext}

${conversationContext}

User Query: ${request.userQuery}

Instructions:
1. Respond in a friendly, professional tone
2. Keep answers concise but informative (2-4 sentences preferred)
3. If the query is about a specific feature, explain how it works
4. If the query is about how to do something, provide step-by-step instructions
5. If the query is off-topic, politely redirect to HireMatic-related topics
6. Use emojis sparingly to keep it professional but friendly

Respond naturally as if you're a helpful customer support agent.`;

    const payload = {
      contents: [
        {
          parts: [
            {
              text: prompt
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.7, // More conversational
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 800, // Concise responses
      }
    };

    console.log('📤 Sending chatbot request to Gemini AI...');
    
    // Retry logic for rate limits
    let retries = 3;
    let response: Response | undefined;
    
    while (retries > 0) {
      response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      // If rate limited (429), wait and retry
      if (response.status === 429 && retries > 1) {
        const waitTime = (4 - retries) * 2000; // 2s, 4s
        console.log(`⏳ Rate limited. Retrying in ${waitTime}ms... (${retries - 1} retries left)`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        retries--;
        continue;
      }

      // If successful or other error, break
      break;
    }

    if (!response) {
      throw new Error('Failed to get response from Gemini API');
    }

    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { error: { message: errorText } };
      }
      
      // Handle specific error types
      if (response.status === 429) {
        console.error('❌ Gemini API rate limit exceeded');
        throw new Error('⏳ Rate limit reached. Please wait 10-30 seconds and try again.');
      }
      
      console.error('❌ Gemini API error:', response.status, errorText);
      throw new Error(`Gemini API error: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    console.log('📥 Gemini response received:', JSON.stringify(data).substring(0, 200));
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!generatedText) {
      throw new Error('No response from Gemini AI');
    }

    console.log('✅ Chatbot response generated successfully');

    // Generate suggested actions based on role
    const suggestedActions = generateSuggestedActions(request.userRole, request.userQuery);

    return {
      message: generatedText.trim(),
      confidence: 0.95,
      suggestedActions
    };

  } catch (error) {
    console.error('❌ Chatbot error:', error);
    console.error('❌ Error details:', error instanceof Error ? error.message : 'Unknown error');
    
    // Check if it's a rate limit error
    const isRateLimited = error instanceof Error && error.message.includes('Rate limit');
    
    // Fallback response
    return {
      message: getFallbackResponse(request.userRole, isRateLimited),
      confidence: isRateLimited ? 0 : 0.5,
      suggestedActions: isRateLimited ? ['Wait 30 seconds', 'Try again later'] : []
    };
  }
}

function generateSuggestedActions(role: string, query: string): string[] {
  const queryLower = query.toLowerCase();
  
  if (role === 'candidate') {
    if (queryLower.includes('apply') || queryLower.includes('job')) {
      return ['Browse Jobs', 'View My Applications', 'Upload Resume'];
    }
    if (queryLower.includes('interview') || queryLower.includes('schedule')) {
      return ['View Scheduled Interviews', 'Check Interview Status'];
    }
    if (queryLower.includes('status') || queryLower.includes('track')) {
      return ['View Application Status', 'Check Notifications'];
    }
  }
  
  if (role === 'hr') {
    if (queryLower.includes('job') || queryLower.includes('post')) {
      return ['Create Job Posting', 'View Active Jobs', 'Manage Applications'];
    }
    if (queryLower.includes('candidate') || queryLower.includes('application')) {
      return ['Review Applications', 'Schedule Interviews', 'View Candidate Profiles'];
    }
    if (queryLower.includes('interview')) {
      return ['Schedule Interview', 'View Interview Reports', 'Manage Interviews'];
    }
  }
  
  if (role === 'admin') {
    if (queryLower.includes('user') || queryLower.includes('manage')) {
      return ['User Management', 'View System Reports', 'Configure Settings'];
    }
    if (queryLower.includes('report') || queryLower.includes('analytics')) {
      return ['View Dashboard', 'Generate Reports', 'System Analytics'];
    }
  }
  
  return [];
}

function getFallbackResponse(role: string, isRateLimited: boolean = false): string {
  if (isRateLimited) {
    return "⏳ I'm currently experiencing high traffic. Please wait 10-30 seconds and try again. In the meantime, feel free to explore the platform or check our documentation.";
  }
  
  const responses = {
    admin: "I'm here to help you manage the HireMatic platform. You can ask me about user management, system configuration, reports, or any administrative tasks.",
    hr: "I'm here to assist with your recruitment needs. Feel free to ask about creating job postings, reviewing candidates, scheduling interviews, or managing applications.",
    candidate: "I'm here to help you with your job search! Ask me about applying for jobs, tracking your applications, preparing for interviews, or navigating the platform.",
    general: "I'm the HireMatic AI Assistant. I can help you understand our AI-powered recruitment platform. What would you like to know?"
  };
  
  return responses[role as keyof typeof responses] || responses.general;
}
