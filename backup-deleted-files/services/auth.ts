import { SignJWT } from 'jose';
import { IUser } from '../models/User';

const JWT_SECRET = process.env.JWT_SECRET || 'your_default_secret_change_this';

export interface UserPayload {
  userId: string;
  email: string;
  role: string;
  [key: string]: string | number | boolean; // Add index signature for JWTPayload compatibility
}

export const createToken = async (user: IUser): Promise<string> => {
  console.log('Creating token with secret:', JWT_SECRET.substring(0, 3) + '...');
  const payload: UserPayload = {
    userId: user._id.toString(),
    email: user.email,
    role: user.role,
  };
  
  const encoder = new TextEncoder();
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d') // Token expires in 7 days
    .sign(encoder.encode(JWT_SECRET));
  
  return token;
};

// Use the verifyToken from auth-edge.ts
// This function will be deprecated in favor of the Edge-compatible version
export const verifyToken = async (token: string): Promise<UserPayload | null> => {
  try {
    const encoder = new TextEncoder();
    const { jwtVerify } = await import('jose');
    const { payload } = await jwtVerify(token, encoder.encode(JWT_SECRET));
    
    return payload as unknown as UserPayload;
  } catch (error: unknown) {
    console.error('Token verification error:', (error as Error).message);
    return null;
  }
};

export const isAuthenticated = async (token: string | undefined): Promise<boolean> => {
  if (!token) return false;
  
  const payload = await verifyToken(token);
  return !!payload;
};

export const isAuthorized = async (token: string | undefined, roles: string[]): Promise<boolean> => {
  if (!token) return false;
  
  const payload = await verifyToken(token);
  if (!payload) return false;
  
  return roles.includes(payload.role);
}; 