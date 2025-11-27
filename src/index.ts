/**
 * HireMatic - Central Export Point for All Layers
 * 
 * This file provides a single import point for accessing all layers of the application.
 * 
 * ⚠️ RECOMMENDED USAGE:
 * Import directly from the specific layer/service for better TypeScript support:
 * 
 * // Layer 1 - Database
 * import dbConnect from '@/layers/1-data-access/database/connection';
 * import { User, Job } from '@/layers/1-data-access';
 * 
 * // Layer 2 - AI Services
 * import InterviewerBot from '@/layers/2-business-logic/ai-services/interviewerBot';
 * import { screenResumeWithAI } from '@/layers/2-business-logic/ai-services/aiScreening';
 * 
 * // Layer 3 - Application Services
 * import UserManagementService from '@/layers/3-application/services/userManagement';
 * import { authMiddleware } from '@/layers/3-application/middleware/auth';
 */

// ========================================
// Layer 1: Data Access Layer
// ========================================
export * as DataLayer from './layers/1-data-access';

// ========================================
// Layer 2: Business Logic Layer (AI)
// ========================================
export * as BusinessLayer from './layers/2-business-logic';

// ========================================
// Layer 3: Application Layer
// ========================================
export * as ApplicationLayer from './layers/3-application';

// ========================================
// Direct Exports (for convenience)
// ========================================

// Database
export { dbConnect } from './layers/1-data-access';

// Models
export { User, Job, Application, Interview } from './layers/1-data-access';
