/**
 * Layer 3: Application Layer
 * 
 * This layer serves as the backend service layer:
 * - API Routing
 * - User Management
 * - User Authentication
 * - Progress Tracking
 * - Interview Scheduling
 */

// Export application services (server-side only)
export * from './services/auth';
export * from './services/interviewScheduler';
export * from './services/notificationService';
export * from './services/otpService';
export * from './services/agoraService';
export * from './services/recordingProcessor';
// Note: agoraClient is client-side only, import directly when needed
