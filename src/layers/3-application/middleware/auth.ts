/**
 * Authentication Middleware
 * Ensures secure login and access control
 */

import { NextRequest, NextResponse } from 'next/server';
import { verify } from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export interface AuthRequest extends NextRequest {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

/**
 * Verify JWT token
 */
export function verifyToken(token: string): any {
  try {
    return verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

/**
 * Auth middleware for API routes
 */
export async function authMiddleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value || 
                request.headers.get('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    );
  }

  const decoded = verifyToken(token);

  if (!decoded) {
    return NextResponse.json(
      { error: 'Invalid or expired token' },
      { status: 401 }
    );
  }

  // Attach user to request
  (request as any).user = decoded;

  return null; // Continue to next middleware/handler
}

/**
 * Optional auth middleware (doesn't fail if not authenticated)
 */
export async function optionalAuthMiddleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value || 
                request.headers.get('Authorization')?.replace('Bearer ', '');

  if (token) {
    const decoded = verifyToken(token);
    if (decoded) {
      (request as any).user = decoded;
    }
  }

  return null;
}
