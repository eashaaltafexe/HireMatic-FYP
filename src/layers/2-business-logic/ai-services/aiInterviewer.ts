import { GoogleGenerativeAI } from '@google/generative-ai';

interface Question {
  id: number;
  text: string;
  type: string;
  difficulty: string;
  jobField: string;
}

interface InterviewResponse {
  message: string;
  action: 'ask_question' | 'clarify' | 'move_next' | 'repeat' | 'evaluate' | 'complete';
  currentQuestionIndex: number;
  evaluation?: {
    score: number;
    feedback: string;
  };
}

interface CandidateAnswer {
  questionId: number;
  questionText: string;
  answer: string;
  timestamp: Date;
  evaluation?: {
    score: number;
    feedback: string;
    keyPoints: string[];
  };
}

class AIInterviewer {
  private genAI: GoogleGenerativeAI;
  private model: any;
  private questions: Question[] = [];
  private currentQuestionIndex: number = 0;
  private conversationHistory: string[] = [];
  private answers: CandidateAnswer[] = [];
  private jobTitle: string = '';
  private candidateName: string = '';

  constructor() {
    const apiKey = process.env.GEMINI_INTERVIEWER_API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('Gemini API key not found');
    }
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });
  }

  /**
   * Initialize the interview with questions and candidate info
   */
  initializeInterview(questions: Question[], jobTitle: string, candidateName: string) {
    this.questions = questions;
    this.jobTitle = jobTitle;
    this.candidateName = candidateName;
    this.currentQuestionIndex = 0;
    this.conversationHistory = [];
    this.answers = [];
    
    console.log(`[AI Interviewer] Initialized with ${questions.length} questions for ${candidateName} - ${jobTitle}`);
  }

  /**
   * Get the welcome message to start the interview
   */
  getWelcomeMessage(): string {
    return `Hello ${this.candidateName}! Welcome to your interview for the ${this.jobTitle} position. I'm your AI interviewer today. I'll be asking you ${this.questions.length} questions. Please answer each question thoughtfully, and feel free to ask me to repeat any question if needed. Let's begin!`;
  }

  /**
   * Get the current question
   */
  getCurrentQuestion(): Question | null {
    if (this.currentQuestionIndex >= this.questions.length) {
      return null;
    }
    return this.questions[this.currentQuestionIndex];
  }

  /**
   * Process candidate's input and determine next action
   */
  async processResponse(candidateInput: string): Promise<InterviewResponse> {
    try {
      const currentQuestion = this.getCurrentQuestion();

      // Check if interview is complete
      if (!currentQuestion) {
        const finalEvaluation = await this.getFinalEvaluation();
        return {
          message: `Thank you for completing the interview! ${finalEvaluation.message}`,
          action: 'complete',
          currentQuestionIndex: this.currentQuestionIndex,
          evaluation: finalEvaluation.evaluation
        };
      }

      // Add to conversation history
      this.conversationHistory.push(`Candidate: ${candidateInput}`);

      // Detect candidate's intent using AI
      const intent = await this.detectIntent(candidateInput, currentQuestion);

      if (intent === 'repeat') {
        return {
          message: `Of course! Let me repeat the question: "${currentQuestion.text}"`,
          action: 'repeat',
          currentQuestionIndex: this.currentQuestionIndex
        };
      }

      if (intent === 'clarify') {
        const clarification = await this.provideClarification(candidateInput, currentQuestion);
        return {
          message: clarification,
          action: 'clarify',
          currentQuestionIndex: this.currentQuestionIndex
        };
      }

      // It's an answer - evaluate it
      const evaluation = await this.evaluateAnswer(candidateInput, currentQuestion);
      
      // Store the answer
      this.answers.push({
        questionId: currentQuestion.id,
        questionText: currentQuestion.text,
        answer: candidateInput,
        timestamp: new Date(),
        evaluation
      });

      // Move to next question
      this.currentQuestionIndex++;
      const nextQuestion = this.getCurrentQuestion();

      if (nextQuestion) {
        const transitionMessage = this.getTransitionMessage(evaluation.score);
        return {
          message: `${transitionMessage} Next question: "${nextQuestion.text}"`,
          action: 'move_next',
          currentQuestionIndex: this.currentQuestionIndex
        };
      } else {
        const finalEvaluation = await this.getFinalEvaluation();
        return {
          message: `Thank you for your answer! ${finalEvaluation.message}`,
          action: 'complete',
          currentQuestionIndex: this.currentQuestionIndex,
          evaluation: finalEvaluation.evaluation
        };
      }

    } catch (error) {
      console.error('[AI Interviewer] Error processing response:', error);
      return {
        message: "I apologize, I didn't quite catch that. Could you please repeat your response?",
        action: 'clarify',
        currentQuestionIndex: this.currentQuestionIndex
      };
    }
  }

  /**
   * Detect the intent of candidate's input
   */
  private async detectIntent(input: string, question: Question): Promise<'answer' | 'repeat' | 'clarify'> {
    const lowerInput = input.toLowerCase().trim();

    // Check for repeat keywords
    const repeatKeywords = ['repeat', 'again', 'say that again', 'come again', 'pardon', 'what was that'];
    if (repeatKeywords.some(keyword => lowerInput.includes(keyword)) && lowerInput.split(' ').length < 10) {
      return 'repeat';
    }

    // Check for clarification requests
    const clarifyKeywords = ['what do you mean', 'can you explain', 'clarify', 'i don\'t understand', 'what does that mean'];
    if (clarifyKeywords.some(keyword => lowerInput.includes(keyword))) {
      return 'clarify';
    }

    // Default to answer
    return 'answer';
  }

  /**
   * Provide clarification for a question
   */
  private async provideClarification(candidateInput: string, question: Question): Promise<string> {
    try {
      const prompt = `You are an interviewer. The candidate asked for clarification about this question:
Question: "${question.text}"
Candidate's clarification request: "${candidateInput}"

Provide a brief, helpful clarification without giving away the answer. Keep it under 50 words.`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('[AI Interviewer] Clarification error:', error);
      return `The question is asking: "${question.text}". Please share your thoughts on this topic.`;
    }
  }

  /**
   * Evaluate candidate's answer
   */
  private async evaluateAnswer(answer: string, question: Question): Promise<{
    score: number;
    feedback: string;
    keyPoints: string[];
  }> {
    try {
      const prompt = `You are an expert interviewer evaluating a candidate's answer for a ${this.jobTitle} position.

Question (${question.type} - ${question.difficulty}): "${question.text}"
Candidate's Answer: "${answer}"

Evaluate the answer and provide:
1. A score from 0-100
2. Brief feedback (2-3 sentences)
3. Key points mentioned (list 2-3 main points)

Format your response as JSON:
{
  "score": <number>,
  "feedback": "<feedback>",
  "keyPoints": ["<point1>", "<point2>", "<point3>"]
}`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Extract JSON from response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const evaluation = JSON.parse(jsonMatch[0]);
        return {
          score: Math.max(0, Math.min(100, evaluation.score || 50)),
          feedback: evaluation.feedback || 'Answer received.',
          keyPoints: evaluation.keyPoints || []
        };
      }
      
      return {
        score: 50,
        feedback: 'Thank you for your answer.',
        keyPoints: []
      };
    } catch (error) {
      console.error('[AI Interviewer] Evaluation error:', error);
      return {
        score: 50,
        feedback: 'Thank you for your response.',
        keyPoints: []
      };
    }
  }

  /**
   * Get transition message based on performance
   */
  private getTransitionMessage(score: number): string {
    if (score >= 80) {
      return 'Excellent answer!';
    } else if (score >= 60) {
      return 'Good response.';
    } else if (score >= 40) {
      return 'Thank you for your answer.';
    } else {
      return 'I appreciate your response.';
    }
  }

  /**
   * Get final evaluation of the interview
   */
  private async getFinalEvaluation(): Promise<{
    message: string;
    evaluation: { score: number; feedback: string };
  }> {
    if (this.answers.length === 0) {
      return {
        message: 'The interview has been completed.',
        evaluation: { score: 0, feedback: 'No answers provided.' }
      };
    }

    try {
      // Calculate average score
      const totalScore = this.answers.reduce((sum, ans) => sum + (ans.evaluation?.score || 0), 0);
      const averageScore = Math.round(totalScore / this.answers.length);

      // Generate overall feedback
      const prompt = `You are an expert interviewer providing final feedback for a ${this.jobTitle} position.

The candidate answered ${this.answers.length} questions with an average score of ${averageScore}/100.

Questions and Answers:
${this.answers.map((ans, i) => `
Q${i + 1}: ${ans.questionText}
A${i + 1}: ${ans.answer}
Score: ${ans.evaluation?.score || 0}/100
`).join('\n')}

Provide encouraging final feedback in 2-3 sentences. Be professional and constructive.`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const feedback = response.text();

      return {
        message: 'That concludes our interview. Here is your overall performance summary.',
        evaluation: {
          score: averageScore,
          feedback: feedback
        }
      };
    } catch (error) {
      console.error('[AI Interviewer] Final evaluation error:', error);
      const avgScore = Math.round(
        this.answers.reduce((sum, ans) => sum + (ans.evaluation?.score || 0), 0) / this.answers.length
      );
      return {
        message: 'That concludes our interview.',
        evaluation: {
          score: avgScore,
          feedback: 'Thank you for participating in this interview. Your responses have been recorded.'
        }
      };
    }
  }

  /**
   * Get all answers
   */
  getAnswers(): CandidateAnswer[] {
    return this.answers;
  }

  /**
   * Get interview progress
   */
  getProgress(): {
    current: number;
    total: number;
    percentage: number;
  } {
    return {
      current: this.currentQuestionIndex,
      total: this.questions.length,
      percentage: Math.round((this.currentQuestionIndex / this.questions.length) * 100)
    };
  }
}

export default AIInterviewer;
export type { Question, InterviewResponse, CandidateAnswer };
