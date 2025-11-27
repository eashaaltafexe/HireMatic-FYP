"use client"

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Home from './(site)/page';
import SiteLayout from './(site)/layout';

export default function RootPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Add a parameter to always show landing page
  const alwaysShowLanding = true; // This will force the landing page to be shown
  
  useEffect(() => {
    // If we want to always show landing page, don't redirect
    if (alwaysShowLanding) {
      return;
    }
    
    // The code below will not run when alwaysShowLanding is true
    // Try to get token from both localStorage and cookies
    const localToken = localStorage.getItem('token');
    const cookieToken = document.cookie.split('; ').find(row => row.startsWith('token='))?.split('=')[1];
    
    const token = localToken || cookieToken;
    
    if (token) {
      try {
        // Simple decode to check the role (not secure, just for demo)
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const payload = JSON.parse(window.atob(base64));
        
        // Check if token is expired
        const currentTime = Date.now() / 1000;
        if (payload.exp && payload.exp < currentTime) {
          // Token is expired, don't redirect
          return;
        }
        
        // Redirect based on role
        const role = payload.role;
        if (role === 'admin') {
          router.push('/admin/dashboard');
        } else if (role === 'hr') {
          router.push('/hr/dashboard');
        } else if (role === 'candidate') {
          router.push('/candidate/dashboard');
        }
      } catch (e) {
        // Error decoding token, don't redirect
        console.error('Token error:', e);
      }
    }
  }, [router]);

  // Wrap the home page with SiteLayout to include the chatbot
  return (
    <SiteLayout>
      <Home />
    </SiteLayout>
  );
}
