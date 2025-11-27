import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = 'AIzaSyAYxpI1GVrFd9PSopLel3DkPyn5p3ukglQ';
const genAI = new GoogleGenerativeAI(API_KEY);

/**
 * Gemini AI Virtual Interviewer Service
 * Acts as a real interviewer conducting a natural conversation
 */
class GeminiInterviewerService {
  private model;
  private chat: any;
  private conversationHistory: Array<{ role: string; text: string }> = [];
  private questions: any[] = [];
  private currentQuestionIndex: number = 0;
  private interviewStartTime: number = 0;
  private readonly INTERVIEW_DURATION_MS = 15 * 60 * 1000; // 15 minutes

  constructor() {
    // Try gemini-1.5-pro-latest for v1beta compatibility
    this.model = genAI.getGenerativeModel({ 
      model: 'gemini-1.5-pro-latest',
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 500,
      }
    });
  }

  /**
   * Initialize the interviewer with context
   */
  async initializeInterview(jobTitle: string, candidateName: string, questions: any[]) {
    this.questions = questions;
    this.currentQuestionIndex = 0;
    this.interviewStartTime = Date.now();

    const systemPrompt = `You are a professional interviewer conducting a 15-minute job interview for the position of ${jobTitle}.
Candidate Name: ${candidateName}

IMPORTANT INSTRUCTIONS:
1. You will conduct a natural, conversational interview
2. You have the following questions to cover during the interview:
${questions.map((q, i) => `   ${i + 1}. ${q.text}`).join('\n')}

3. Interview Flow:
   - Start by introducing yourself and the interview process
   - Ask questions one at a time in a natural, conversational manner
   - Listen to the candidate's answers WITHOUT evaluating or providing feedback
   - You may ask contextual follow-up questions based on their responses
   - Move naturally to the next question when appropriate
   - Keep track of time (15 minutes total)
   - Thank the candidate at the end

4. Your Response Style:
   - Be professional but warm and encouraging
   - Use natural transitions between questions
   - Acknowledge answers with simple phrases like "I see", "Thank you", "Interesting"
   - DO NOT evaluate, score, or provide feedback on answers
   - DO NOT say things like "good answer" or "excellent point"
   - Just acknowledge and move forward naturally

5. Response Format:
   - Keep your responses concise (2-3 sentences max)
   - Ask ONE question at a time
   - Wait for the candidate to respond before asking the next question

Begin by introducing yourself and asking the first question.`;

    this.chat = this.model.startChat({
      history: [
        {
          role: 'user',
          parts: [{ text: systemPrompt }],
        },
        {
          role: 'model',
          parts: [{ text: 'I understand. I will conduct this interview professionally and naturally, asking questions one at a time and acknowledging responses without evaluation. I will keep the interview flowing smoothly within the 15-minute timeframe.' }],
        },
      ],
      generationConfig: {
        maxOutputTokens: 150,
        temperature: 0.8,
      },
    });

    this.conversationHistory.push(
      { role: 'system', text: systemPrompt },
      { role: 'assistant', text: 'Ready to begin interview' }
    );

    // Create greeting with first question
    const firstQuestion = questions[0]?.text || 'Tell me about yourself';
    const greeting = `Hello ${candidateName}! Welcome to your interview for the ${jobTitle} position. I'm your AI interviewer today. I'll be asking you a few questions about your experience and skills. Let's begin with the first question: ${firstQuestion}`;
    
    this.conversationHistory.push(
      { role: 'assistant', text: greeting }
    );
    
    return {
      message: 'Interview initialized successfully',
      ready: true,
      greeting: greeting,
      timeRemaining: this.INTERVIEW_DURATION_MS,
    };
  }

  /**
   * Get next response from interviewer based on candidate's answer
   */
  async getNextResponse(candidateAnswer: string): Promise<{
    response: string;
    shouldContinue: boolean;
    timeRemaining: number;
    questionIndex: number;
  }> {
    try {
      const timeElapsed = Date.now() - this.interviewStartTime;
      const timeRemaining = this.INTERVIEW_DURATION_MS - timeElapsed;

      // Check if time is up
      if (timeRemaining <= 0) {
        return {
          response: 'Thank you for your time today. That concludes our interview. We appreciate you sharing your experiences with us.',
          shouldContinue: false,
          timeRemaining: 0,
          questionIndex: this.currentQuestionIndex,
        };
      }

      // Save candidate's answer to history
      this.conversationHistory.push({ role: 'candidate', text: candidateAnswer });
      
      console.log(`[Gemini] Sending candidate answer via HTTP API: "${candidateAnswer.substring(0, 50)}..."`);
      console.log(`[Gemini] Current question index: ${this.currentQuestionIndex}/${this.questions.length}`);
      
      // Check if candidate is asking a question (ends with ? or contains question words)
      const candidateIsAskingQuestion = candidateAnswer.includes('?') || 
        /\b(what|how|why|when|where|which|who|can you|could you|should i|do you|does)\b/i.test(candidateAnswer);
      
      // Only move to next question if candidate is actually answering (not asking a clarifying question)
      if (!candidateIsAskingQuestion) {
        this.currentQuestionIndex++;
      }

      // Use direct HTTP API instead of SDK - using gemini-2.5-flash
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`;
      
      // Build conversation context
      const conversationContext = this.conversationHistory
        .filter(h => h.role !== 'system')
        .map(h => `${h.role === 'candidate' ? 'Candidate' : 'Interviewer'}: ${h.text}`)
        .join('\n');
      
      // Determine if we should ask next question or just acknowledge
      const shouldAskNextQuestion = this.currentQuestionIndex < this.questions.length;
      
      let promptText;
      if (candidateIsAskingQuestion) {
        // Candidate is asking a clarifying question - just answer it, don't ask next question yet
        promptText = `You are conducting a professional job interview. Here's the conversation so far:

${conversationContext}

The candidate is asking you a clarifying question. Answer their question helpfully and professionally in 1-2 sentences. DO NOT ask the next interview question yet - wait for them to actually answer the current question.`;
      } else if (shouldAskNextQuestion) {
        const nextQuestion = this.questions[this.currentQuestionIndex];
        promptText = `You are conducting a professional job interview. Here's the conversation so far:

${conversationContext}

The candidate just answered. Respond naturally and conversationally by:
1. Briefly acknowledging their answer (1 sentence like "Thank you for sharing that" or "I appreciate that insight")
2. Then smoothly transition to the next question: "${nextQuestion.text}"

Keep your total response to 2-3 sentences maximum. Be warm but professional.`;
      } else {
        promptText = `You are conducting a professional job interview. Here's the conversation so far:

${conversationContext}

The candidate just answered the final question. Thank them warmly for their time and let them know the interview is complete. Keep it brief (1-2 sentences).`;
      }

      console.log('[Gemini] Calling Gemini HTTP API...');
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: promptText
            }]
          }]
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('[Gemini] API Error:', errorData);
        throw new Error(`Gemini API error: ${response.status}`);
      }

      const data: any = await response.json();
      const interviewerResponse = data.candidates[0].content.parts[0].text;
      
      console.log(`[Gemini] Received response: "${interviewerResponse.substring(0, 100)}..."`);

      this.conversationHistory.push({ role: 'interviewer', text: interviewerResponse });

      // Check if we've covered all questions or time is running low
      const shouldContinue = this.currentQuestionIndex < this.questions.length && timeRemaining > 60000;

      return {
        response: interviewerResponse,
        shouldContinue,
        timeRemaining,
        questionIndex: this.currentQuestionIndex,
      };
    } catch (error) {
      console.error('[Gemini] Error getting next response:', error);
      
      // Fallback: try to continue with next question
      this.currentQuestionIndex++;
      if (this.currentQuestionIndex < this.questions.length) {
        const nextQuestion = this.questions[this.currentQuestionIndex];
        return {
          response: `Let me ask you the next question: ${nextQuestion.text}`,
          shouldContinue: true,
          timeRemaining: this.INTERVIEW_DURATION_MS - (Date.now() - this.interviewStartTime),
          questionIndex: this.currentQuestionIndex,
        };
      } else {
        return {
          response: 'Thank you for your answers. That concludes our interview.',
          shouldContinue: false,
          timeRemaining: this.INTERVIEW_DURATION_MS - (Date.now() - this.interviewStartTime),
          questionIndex: this.currentQuestionIndex,
        };
      }
    }
  }

  /**
   * Process candidate's answer (legacy method for compatibility)
   */
  async processAnswer(questionText: string, answer: string, questionNumber: number): Promise<string> {
    const result = await this.getNextResponse(answer);
    return result.response;
  }

  /**
   * Get time remaining in interview
   */
  getTimeRemaining(): number {
    return this.INTERVIEW_DURATION_MS - (Date.now() - this.interviewStartTime);
  }

  /**
   * Check if interview time is up
   */
  isTimeUp(): boolean {
    return this.getTimeRemaining() <= 0;
  }

  /**
   * Generate final interview summary
   */
  async generateInterviewSummary(transcript: any[]): Promise<string> {
    try {
      const transcriptText = transcript
        .map((t, i) => `Q${i + 1}: ${t.questionText}\nA${i + 1}: ${t.answer}`)
        .join('\n\n');

      const prompt = `Interview Complete. Here is the full transcript:

${transcriptText}

Provide a brief professional summary of the candidate's performance (3-4 sentences):
- Overall impression
- Key strengths demonstrated
- Areas for improvement
- Final recommendation`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('[Gemini] Error generating summary:', error);
      return 'Interview completed successfully. Thank you for your participation.';
    }
  }

  /**
   * Analyze answer quality and provide scoring
   */
  async analyzeAnswer(questionText: string, answer: string): Promise<{
    score: number;
    feedback: string;
    strengths: string[];
    improvements: string[];
  }> {
    try {
      const prompt = `Analyze this interview answer:
Question: "${questionText}"
Answer: "${answer}"

Provide analysis in JSON format:
{
  "score": <0-100>,
  "feedback": "<brief feedback>",
  "strengths": ["<strength1>", "<strength2>"],
  "improvements": ["<improvement1>", "<improvement2>"]
}`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Extract JSON from response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      // Fallback
      return {
        score: 70,
        feedback: 'Thank you for your response.',
        strengths: ['Clear communication'],
        improvements: ['Could provide more specific examples'],
      };
    } catch (error) {
      console.error('[Gemini] Error analyzing answer:', error);
      return {
        score: 70,
        feedback: 'Response recorded.',
        strengths: [],
        improvements: [],
      };
    }
  }

  /**
   * Get conversation history
   */
  getConversationHistory() {
    return this.conversationHistory;
  }

  /**
   * Reset the interview session
   */
  reset() {
    this.conversationHistory = [];
    this.chat = null;
  }
}

export default GeminiInterviewerService;
