/**
 * Question Generator Service
 * Prepares dynamic and adaptive interview questions based on job and resume data
 */

export interface Question {
  id: string;
  text: string;
  type: 'technical' | 'behavioral' | 'situational' | 'coding' | 'system-design';
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
  skills: string[];
  followUpQuestions?: string[];
  evaluationCriteria?: string[];
}

export interface QuestionGenerationParams {
  jobId: string;
  candidateProfile?: any;
  focusAreas?: string[];
  difficulty?: 'easy' | 'medium' | 'hard';
  numberOfQuestions?: number;
}

class QuestionGenerator {
  /**
   * Generate interview questions using GPT-2 model via Python service
   */
  async generateQuestions(
    params: QuestionGenerationParams
  ): Promise<Question[]> {
    const {
      numberOfQuestions = 10,
      difficulty = 'medium',
      focusAreas = [],
    } = params;

    try {
      // Get job details to extract role
      const role = focusAreas[0] || 'software engineer'; // Default role
      
      // Call the Next.js API route which connects to Python service
      const response = await fetch('/api/questions/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          role,
          num_questions: numberOfQuestions,
        }),
      });

      if (!response.ok) {
        console.error('Failed to generate questions from GPT-2 model, using fallback');
        return this.generateFallbackQuestions(numberOfQuestions, difficulty, focusAreas);
      }

      const result = await response.json();
      
      if (result.success && result.data.questions) {
        // Map the generated questions to our Question interface
        return result.data.questions.map((q: any, index: number) => ({
          id: q.id || `q_${Date.now()}_${index}`,
          text: q.text,
          type: (q.type as Question['type']) || 'technical',
          difficulty: (q.difficulty as Question['difficulty']) || difficulty,
          category: focusAreas[index % focusAreas.length] || role,
          skills: this.getRelevantSkills('technical'),
          followUpQuestions: this.generateFollowUps('technical'),
          evaluationCriteria: this.getEvaluationCriteria('technical'),
        }));
      }
      
      // Fallback if API call fails
      return this.generateFallbackQuestions(numberOfQuestions, difficulty, focusAreas);
    } catch (error) {
      console.error('Error generating questions with GPT-2:', error);
      return this.generateFallbackQuestions(numberOfQuestions, difficulty, focusAreas);
    }
  }

  /**
   * Fallback method to generate questions when GPT-2 service is unavailable
   */
  private generateFallbackQuestions(
    numberOfQuestions: number,
    difficulty: Question['difficulty'],
    focusAreas: string[]
  ): Question[] {
    const questions: Question[] = [];
    const types: Question['type'][] = ['technical', 'behavioral', 'situational', 'coding'];
    
    for (let i = 0; i < numberOfQuestions; i++) {
      const type = types[i % types.length];
      questions.push({
        id: `q_${Date.now()}_${i}`,
        text: this.getQuestionByType(type, difficulty),
        type,
        difficulty,
        category: focusAreas[i % focusAreas.length] || 'general',
        skills: this.getRelevantSkills(type),
        followUpQuestions: this.generateFollowUps(type),
        evaluationCriteria: this.getEvaluationCriteria(type),
      });
    }
    
    return questions;
  }

  /**
   * Generate adaptive questions based on previous answers
   */
  async generateAdaptiveQuestion(
    previousAnswers: any[],
    performanceLevel: number
  ): Promise<Question> {
    // TODO: Implement adaptive question generation
    // This would adjust difficulty based on candidate's performance
    
    const difficulty: Question['difficulty'] = 
      performanceLevel > 80 ? 'hard' : 
      performanceLevel > 60 ? 'medium' : 'easy';
    
    return {
      id: `adaptive_${Date.now()}`,
      text: 'What is your approach to solving complex technical problems?',
      type: 'technical',
      difficulty,
      category: 'problem-solving',
      skills: ['critical-thinking', 'analysis'],
    };
  }

  /**
   * Generate follow-up questions based on answer
   */
  async generateFollowUp(
    question: Question,
    answer: string
  ): Promise<Question[]> {
    // TODO: Implement AI-based follow-up generation
    // This would analyze the answer and create relevant follow-ups
    
    return [
      {
        id: `followup_${question.id}`,
        text: 'Can you elaborate more on that approach?',
        type: question.type,
        difficulty: question.difficulty,
        category: question.category,
        skills: question.skills,
      },
    ];
  }

  private getQuestionByType(type: Question['type'], difficulty: string): string {
    const questions: Record<string, Record<string, string>> = {
      technical: {
        easy: 'What is your experience with version control systems?',
        medium: 'Explain the concept of polymorphism in object-oriented programming.',
        hard: 'How would you design a distributed caching system?',
      },
      behavioral: {
        easy: 'Tell me about yourself and your career goals.',
        medium: 'Describe a time when you had to work with a difficult team member.',
        hard: 'Tell me about a project that failed and what you learned from it.',
      },
      situational: {
        easy: 'How would you handle a tight deadline?',
        medium: 'What would you do if you disagreed with your manager\'s decision?',
        hard: 'How would you handle a situation where you discovered a critical bug in production?',
      },
      coding: {
        easy: 'Write a function to reverse a string.',
        medium: 'Implement a function to find the longest palindrome in a string.',
        hard: 'Design and implement an LRU cache.',
      },
      'system-design': {
        easy: 'What is the difference between SQL and NoSQL databases?',
        medium: 'How would you design a URL shortening service?',
        hard: 'Design a distributed messaging system like WhatsApp.',
      },
    };
    
    return questions[type]?.[difficulty] || 'General interview question';
  }

  private getRelevantSkills(type: Question['type']): string[] {
    const skillMap = {
      technical: ['programming', 'problem-solving', 'algorithms'],
      behavioral: ['communication', 'teamwork', 'leadership'],
      situational: ['decision-making', 'adaptability', 'conflict-resolution'],
      coding: ['programming', 'data-structures', 'algorithms'],
      'system-design': ['architecture', 'scalability', 'system-thinking'],
    };
    
    return skillMap[type] || ['general'];
  }

  private generateFollowUps(type: Question['type']): string[] {
    return [
      'Can you provide a specific example?',
      'What was the outcome?',
      'What would you do differently?',
    ];
  }

  private getEvaluationCriteria(type: Question['type']): string[] {
    const criteriaMap = {
      technical: ['technical accuracy', 'depth of knowledge', 'clarity of explanation'],
      behavioral: ['specific examples', 'self-awareness', 'learning mindset'],
      situational: ['logical reasoning', 'ethical considerations', 'practical approach'],
      coding: ['correctness', 'efficiency', 'code quality'],
      'system-design': ['scalability', 'reliability', 'trade-off analysis'],
    };
    
    return criteriaMap[type] || ['overall quality'];
  }
}

export default new QuestionGenerator();
