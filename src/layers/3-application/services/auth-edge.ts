import { jwtVerify, SignJWT } from 'jose';
import { IUser } from '@/data-access';

const JWT_SECRET = process.env.JWT_SECRET || 'your_default_secret_change_this';

export interface UserPayload {
  userId: string;
  email: string;
  role: string;
}

export async function verifyTokenEdge(token: string): Promise<UserPayload | null> {
  try {
    const encoder = new TextEncoder();
    const { payload } = await jwtVerify(token, encoder.encode(JWT_SECRET));
    
    return payload as unknown as UserPayload;
  } catch (error: unknown) {
    console.error('Token verification error:', (error as Error).message);
    return null;
  }
}

export async function isAuthenticatedEdge(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  
  const payload = await verifyTokenEdge(token);
  return !!payload;
}

export async function isAuthorizedEdge(token: string | undefined, roles: string[]): Promise<boolean> {
  if (!token) return false;
  
  const payload = await verifyTokenEdge(token);
  if (!payload) return false;
  
  return roles.includes(payload.role as string);
} 