/**
 * Role-Based Access Control Middleware
 * Checks if user has required role(s)
 */

import { NextRequest, NextResponse } from 'next/server';

export interface RoleConfig {
  allowedRoles: string[];
  requireAll?: boolean; // If true, user must have ALL roles
}

/**
 * Role middleware factory
 * Returns a middleware function that checks for specific roles
 */
export function roleMiddleware(allowedRoles: string | string[]) {
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  return async (request: NextRequest) => {
    const user = (request as any).user;

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userRole = user.role;

    if (!roles.includes(userRole)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    return null; // Continue to next middleware/handler
  };
}

/**
 * Check if user has admin role
 */
export function adminOnly() {
  return roleMiddleware('admin');
}

/**
 * Check if user has HR or admin role
 */
export function hrOrAdmin() {
  return roleMiddleware(['hr', 'admin']);
}

/**
 * Check if user is a candidate
 */
export function candidateOnly() {
  return roleMiddleware('candidate');
}

/**
 * Utility to check role without middleware
 */
export function hasRole(user: any, role: string | string[]): boolean {
  if (!user) return false;
  
  const roles = Array.isArray(role) ? role : [role];
  return roles.includes(user.role);
}

/**
 * Utility to check if user is admin
 */
export function isAdmin(user: any): boolean {
  return hasRole(user, 'admin');
}

/**
 * Utility to check if user is HR
 */
export function isHR(user: any): boolean {
  return hasRole(user, 'hr');
}

/**
 * Utility to check if user is candidate
 */
export function isCandidate(user: any): boolean {
  return hasRole(user, 'candidate');
}
