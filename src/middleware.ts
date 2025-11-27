import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyTokenEdge } from './layers/3-application/services/auth-edge';

// Define the paths that should be accessible without authentication
const publicPaths = ['/', '/login', '/signup', '/about', '/services', '/contact'];

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value || '';
  const { pathname } = request.nextUrl;
  
  console.log('Middleware processing path:', pathname);
  console.log('Token present:', !!token);
  
  // Log partial token for debugging
  if (token) {
    const tokenPreview = token.substring(0, 10) + '...' + token.substring(token.length - 5);
    console.log('Token preview:', tokenPreview);
  }
  
  // Allow public paths without authentication
  if (publicPaths.some(path => pathname === path || pathname.startsWith(`${path}/`))) {
    console.log('Public path, allowing access');
    return NextResponse.next();
  }
  
  // Check if route needs to be authenticated
  if (pathname.includes('/admin') || pathname.includes('/hr') || pathname.includes('/candidate')) {
    if (!token) {
      console.log('Protected route with no token, redirecting to login');
      return NextResponse.redirect(new URL('/login', request.url));
    }
    
    // Verify token and role
    const payload = await verifyTokenEdge(token);
    console.log('Token verified, payload:', payload ? `role: ${payload.role}` : 'invalid token');
    
    if (!payload) {
      console.log('Invalid token, redirecting to login');
      const response = NextResponse.redirect(new URL('/login', request.url));
      response.cookies.delete('token');
      return response;
    }
    
    // Check if user is trying to access a route they don't have permission for
    if (pathname.includes('/admin') && payload.role !== 'admin') {
      console.log('Non-admin trying to access admin route, redirecting');
      return NextResponse.redirect(
        new URL(payload.role === 'hr' ? '/hr/dashboard' : '/candidate/dashboard', request.url)
      );
    }
    
    if (pathname.includes('/hr') && payload.role !== 'hr' && payload.role !== 'admin') {
      // Redirect HR routes if not HR or admin
      return NextResponse.redirect(
        new URL(payload.role === 'admin' ? '/admin/dashboard' : '/candidate/dashboard', request.url)
      );
    }
    
    if (pathname.includes('/candidate') && payload.role !== 'candidate' && payload.role !== 'admin') {
      // Redirect candidate routes if not candidate or admin
      return NextResponse.redirect(
        new URL(payload.role === 'admin' ? '/admin/dashboard' : '/hr/dashboard', request.url)
      );
    }
  }
  
  console.log('Access granted, proceeding to route');
  return NextResponse.next();
}

// Configure the middleware to run on specific paths
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
}; 