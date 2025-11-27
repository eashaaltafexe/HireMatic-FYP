/**
 * Database connection module
 * Re-exports from Layer 1: Data Access Layer
 * 
 * This file maintains backward compatibility with existing code
 * while the project is being restructured.
 */

export { dbConnect as default } from '../layers/1-data-access';
 