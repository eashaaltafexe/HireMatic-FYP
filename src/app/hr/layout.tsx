"use client"

import { ReactNode, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';

const ChatbotWidget = dynamic(() => import('@/components/ChatbotWidget'), { ssr: false });

interface HRLayoutProps {
  children: ReactNode;
}

interface User {
  name: string;
  email: string;
  role: string;
}

export default function HRLayout({ children }: HRLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    console.log('Current pathname in HR Layout:', pathname);
    const checkAuth = () => {
      const token = localStorage.getItem('token');
      console.log('Layout - Token present:', !!token);

      if (!token) {
        console.log('No token found in layout, redirecting to login...');
        router.push('/login');
        return;
      }

      try {
        // Verify token and role
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        
        const payload = JSON.parse(jsonPayload);
        console.log('Token payload in layout:', payload);
        
        if (payload.role !== 'hr') {
          console.log('Invalid role in layout, redirecting to login...');
          router.push('/login');
          return;
        }

        setUser({
          name: payload.name || payload.email.split('@')[0],
          email: payload.email,
          role: payload.role
        });
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Error verifying token in layout:', error);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router, pathname]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
    router.push('/login?logout=true');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  console.log('HR Layout rendering children');

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <div className="w-64 bg-[#2A3647] text-white flex flex-col h-full">
        <div className="p-6">
          <Link href="/hr/dashboard" className="flex items-center space-x-2">
            <span className="text-2xl">⎈</span>
            <span className="text-xl font-bold">HireMatic</span>
          </Link>
        </div>

        {/* User Info */}
        <div className="p-6 border-t border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
              {user?.name?.charAt(0) || ''}
            </div>
            <div>
              <div className="font-semibold">{user?.name || 'Loading...'}</div>
              <div className="text-sm text-gray-300">HR Manager</div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto">
          <div className="px-4 space-y-1">
            <Link 
              href="/hr/dashboard" 
              className={`flex items-center px-4 py-2.5 text-sm font-medium rounded-lg ${
                pathname === '/hr/dashboard' ? 'bg-[#3B82F6] text-white' : 'text-gray-300 hover:bg-gray-700'
              }`}
            >
              <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Dashboard
            </Link>

            <Link 
              href="/hr/jobs" 
              className={`flex items-center px-4 py-2.5 text-sm font-medium rounded-lg ${
                pathname.startsWith('/hr/jobs') ? 'bg-[#3B82F6] text-white' : 'text-gray-300 hover:bg-gray-700'
              }`}
            >
              <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Job Listings
            </Link>

            <Link 
              href="/hr/decision-support" 
              className={`flex items-center px-4 py-2.5 text-sm font-medium rounded-lg ${
                pathname === '/hr/decision-support' ? 'bg-[#3B82F6] text-white' : 'text-gray-300 hover:bg-gray-700'
              }`}
            >
              <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Decision Support
            </Link>

            <Link 
              href="/admin/generated-questions" 
              className={`flex items-center px-4 py-2.5 text-sm font-medium rounded-lg ${
                pathname === '/admin/generated-questions' ? 'bg-[#3B82F6] text-white' : 'text-gray-300 hover:bg-gray-700'
              }`}
            >
              <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Generated Questions
            </Link>
          </div>
        </nav>

        {/* Logout Button at Bottom */}
        <div className="p-6 border-t border-gray-700">
          <button 
            onClick={handleLogout}
            className="w-full px-4 py-2 text-sm text-white bg-[#2d3648] hover:bg-[#1e2535] rounded-md transition-colors flex items-center justify-center space-x-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
      {children}
      </div>
      
      {/* Chatbot Widget */}
      <ChatbotWidget userRole="hr" />
    </div>
  );
} 