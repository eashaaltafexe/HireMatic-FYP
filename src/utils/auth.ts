import { jwtDecode } from 'jwt-decode';
import cookies from 'js-cookie';

interface DecodedToken {
  userId: string;
  email: string;
  role: string;
  exp: number;
}

// Set token to both localStorage and cookies
export const setToken = (token: string): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('token', token);
    cookies.set('token', token, { expires: 7 }); // Expire in 7 days
  }
};

// Get token from localStorage or cookies
export const getToken = (): string | null => {
  if (typeof window !== 'undefined') {
    // First try localStorage 
    const localToken = localStorage.getItem('token');
    if (localToken) {
      console.log('Token found in localStorage');
      return localToken;
    }
    
    // Then try cookies
    const cookieToken = cookies.get('token');
    if (cookieToken) {
      console.log('Token found in cookies');
      return cookieToken;
    }
    
    console.log('No token found in either localStorage or cookies');
    return null;
  }
  return null;
};

// Remove token from both localStorage and cookies
export const removeToken = (): void => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('token');
    cookies.remove('token');
  }
};

// Clear all authentication state
export const clearAuthState = (): void => {
  removeToken();
  // Clear any other auth-related state here if needed
  console.log('Auth state cleared');
};

// Check if token is valid and not expired
export const isTokenValid = (): boolean => {
  const token = getToken();
  
  if (!token) return false;
  
  try {
    const decodedToken = jwtDecode<DecodedToken>(token);
    const currentTime = Date.now() / 1000;
    
    // Check if token is expired
    if (decodedToken.exp < currentTime) {
      removeToken();
      return false;
    }
    
    return true;
  } catch (error) {
    removeToken();
    return false;
  }
};

// Get user role from token
export const getUserRole = (): string | null => {
  const token = getToken();
  
  if (!token) {
    console.log('No token found in getUserRole');
    return null;
  }
  
  try {
    const decodedToken = jwtDecode<DecodedToken>(token);
    console.log('Decoded token in getUserRole:', { role: decodedToken.role });
    return decodedToken.role;
  } catch (error) {
    console.error('Error decoding token in getUserRole:', error);
    return null;
  }
};

// Get user ID from token
export const getUserId = (): string | null => {
  const token = getToken();
  
  if (!token) return null;
  
  try {
    const decodedToken = jwtDecode<DecodedToken>(token);
    return decodedToken.userId;
  } catch (error) {
    return null;
  }
};

// Redirects user to appropriate dashboard based on role
export const redirectToDashboard = (router: any): void => {
  const role = getUserRole();
  console.log('In redirectToDashboard, role:', role);
  
  if (!role) {
    console.log('No role found, redirecting to login');
    router.push('/login');
    return;
  }
  
  switch (role) {
    case 'admin':
      console.log('Redirecting admin to dashboard');
      router.push('/admin/dashboard');
      break;
    case 'hr':
      console.log('Redirecting HR to dashboard');
      router.push('/hr/dashboard');
      break;
    default:
      console.log('Redirecting candidate to dashboard');
      router.push('/candidate/dashboard');
  }
}; 