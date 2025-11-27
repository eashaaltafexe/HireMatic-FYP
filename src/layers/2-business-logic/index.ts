/**
 * Layer 2: Business Logic Layer (AI Services)
 * 
 * This layer contains the core AI/ML intelligence:
 * - Resume Parsing (Gemini AI)
 * - AI Screening (Gemini AI)
 * - Interviewer Bot
 * - Job Description Generator
 * - Report Generation
 * - Question/Answer Generation
 */

// Export Gemini AI services (primary)
export * from './ai-services/geminiResumeParser';
export * from './ai-services/geminiAIScreening';

// Export other AI services
export * from './ai-services/questionGenerator';
export * from './ai-services/autoQuestionGenerator';
export * from './ai-services/jobDescriptionGenerator';
export * from './ai-services/reportGenerator';
export * from './ai-services/hirematicChatbot';
export * from './ai-services/interviewerBot';
