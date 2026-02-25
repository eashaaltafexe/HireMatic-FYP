import { NextRequest, NextResponse } from 'next/server';

const GEMINI_API_KEY = process.env.GEMINI_INTERVIEWER_API_KEY || 'AIzaSyBYnNfKbJS43Wdgiy68Mr8fSF9ICgbciFs';

// Store interview sessions in memory (in production, use Redis or DB)
const interviewSessions = new Map<string, {
  conversationHistory: Array<{ role: string; text: string }>;
  questions: any[];
  currentQuestionIndex: number;
  startTime: number;
}>();

export async function GET(request: NextRequest) {
  return NextResponse.json({
    success: true,
    message: 'Gemini Interview API is running',
    activeSessions: interviewSessions.size
  });
}

export async function POST(request: NextRequest) {
  try {
    const { action, sessionId, candidateName, jobTitle, questions, candidateAnswer } = await request.json();

    console.log(`[Gemini API] Action: ${action}, SessionID: ${sessionId}`);

    if (action === 'initialize') {
      // Initialize new interview session
      console.log(`[Gemini API] 🔍 Initializing session for ${jobTitle} with ${questions.length} questions`);
      console.log(`[Gemini API] 📋 First question: ${questions[0]?.text}`);
      
      const greeting = `Hello ${candidateName}! Welcome to your interview for the ${jobTitle} position. I'm your AI interviewer today. I'll be asking you ${questions.length} questions about your experience and skills. Let's begin with the first question: ${questions[0]?.text}`;
      
      interviewSessions.set(sessionId, {
        conversationHistory: [
          { role: 'assistant', text: greeting }
        ],
        questions: questions,
        currentQuestionIndex: 0,
        startTime: Date.now()
      });

      console.log(`[Gemini API] ✅ Session initialized with ${questions.length} questions for ${jobTitle}`);
      console.log(`[Gemini API] 📊 Question categories: ${questions.map((q: any) => q.jobField).join(', ')}`);

      return NextResponse.json({
        success: true,
        greeting: greeting,
        questionIndex: 0
      });
    }

    if (action === 'next-response') {
      // Get next response from Gemini
      const session = interviewSessions.get(sessionId);
      
      if (!session) {
        console.error(`[Gemini API] ❌ Session not found for ID: ${sessionId}`);
        console.log(`[Gemini API] Available sessions: ${Array.from(interviewSessions.keys()).join(', ')}`);
        return NextResponse.json({
          success: false,
          error: 'Session not found - please reinitialize the interview',
          details: `Session ID not found: ${sessionId}`
        }, { status: 404 });
      }

      // Add candidate answer to history
      session.conversationHistory.push({ role: 'candidate', text: candidateAnswer });

      // ALWAYS move to next question after answer is received
      session.currentQuestionIndex++;

      const shouldAskNextQuestion = session.currentQuestionIndex < session.questions.length;
      
      let promptText;
      let responseText;
      
      if (shouldAskNextQuestion) {
        // Ask the next technical question
        const nextQuestion = session.questions[session.currentQuestionIndex];
        responseText = `Thank you for your answer. Now, the next question: ${nextQuestion.text}`;
        
        console.log(`[Gemini API] ✅ Moving to question ${session.currentQuestionIndex + 1} of ${session.questions.length}`);
        console.log(`[Gemini API] 📋 Question ${session.currentQuestionIndex + 1}: ${nextQuestion.text}`);
        console.log(`[Gemini API] 🏷️ Category: ${nextQuestion.jobField}`);
      } else {
        // Interview is complete
        responseText = `Thank you for your thoughtful answers throughout this interview. We appreciate your time and effort. We will review your responses and get back to you soon.`;
        
        console.log(`[Gemini API] Interview complete. All ${session.questions.length} questions answered.`);
      }

      // Add to history
      session.conversationHistory.push({ role: 'interviewer', text: responseText });

      const shouldContinue = session.currentQuestionIndex < session.questions.length;

      return NextResponse.json({
        success: true,
        response: responseText,
        shouldContinue: shouldContinue,
        questionIndex: session.currentQuestionIndex
      });
    }

    return NextResponse.json({
      success: false,
      error: 'Invalid action'
    }, { status: 400 });

  } catch (error: any) {
    console.error('[Gemini API] ❌ Error:', error);
    console.error('[Gemini API] Error stack:', error.stack);
    return NextResponse.json({
      success: false,
      error: error.message,
      details: error.stack
    }, { status: 500 });
  }
}
