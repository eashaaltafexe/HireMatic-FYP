/**
 * Layer 1: Data Access Layer
 * 
 * This layer is responsible for:
 * - Database connections
 * - Data models and schemas
 * - CRUD operations
 * - Data validation
 */

// Database connections
export { default as dbConnect } from './database/connection';
export { connectDB } from './database/mongodb';

// Export all models
export { default as User } from './models/User';
export type { IUser } from './models/User';
export { default as Job } from './models/Job';
export { default as Application } from './models/Application';
export { default as Interview } from './models/Interview';
export { default as ChatMessage } from './models/ChatMessage';
export type { IChatMessage } from './models/ChatMessage';
