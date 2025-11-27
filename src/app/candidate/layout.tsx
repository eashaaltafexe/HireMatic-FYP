"use client"

import { ReactNode } from 'react';
import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';

const ChatbotWidget = dynamic(() => import('@/components/ChatbotWidget'), { ssr: false });

interface CandidateLayoutProps {
  children: ReactNode;
}

interface User {
  name: string;
  email: string;
  role: string;
  title?: string;
}

export default function CandidateLayout({ children }: CandidateLayoutProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Check if user is authenticated and is a candidate
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    try {
      // Decode token to get user info
      const base64Url = token.split('.')[1];
      if (base64Url) {
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        
        const payload = JSON.parse(jsonPayload);
        
        // Check if token is expired
        const currentTime = Date.now() / 1000;
        if (payload.exp && payload.exp < currentTime) {
          console.log('Token expired');
          localStorage.removeItem('token');
          router.push('/login');
          return;
        }

        // Verify role is candidate
        if (payload.role !== 'candidate') {
          router.push('/login');
          return;
        }

        // Set user data from token
        setUser({
          name: payload.name || payload.email.split('@')[0],
          email: payload.email,
          role: payload.role,
          title: 'Job Seeker'
        });
        setLoading(false);
      }
    } catch (error) {
      console.error('Error parsing token:', error);
      router.push('/login');
    }
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-[#1e2535] text-white">
        <div className="p-6 flex items-center space-x-3">
          <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
            {user?.name?.charAt(0) || ''}
          </div>
          <div>
            <div className="font-semibold">{user?.name || 'Loading...'}</div>
            <div className="text-sm text-gray-400">{user?.title || 'Candidate'}</div>
          </div>
        </div>
        
        <nav className="mt-6">
          <Link 
            href="/candidate/dashboard" 
            className={`block px-6 py-3 ${
              pathname === '/candidate/dashboard' 
                ? 'text-white bg-[#2d3648] font-medium' 
                : 'text-gray-300 hover:bg-[#2d3648]'
            } transition-colors`}
          >
            <span className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
              </svg>
              Dashboard
            </span>
          </Link>
          
          <Link 
            href="/candidate/jobs" 
            className={`block px-6 py-3 ${
              pathname === '/candidate/jobs' 
                ? 'text-white bg-[#2d3648] font-medium' 
                : 'text-gray-300 hover:bg-[#2d3648]'
            } transition-colors`}
          >
            <span className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
              </svg>
              Career Page
            </span>
          </Link>

          <Link 
            href="/candidate/applications" 
            className={`block px-6 py-3 ${
              pathname === '/candidate/applications' 
                ? 'text-white bg-[#2d3648] font-medium' 
                : 'text-gray-300 hover:bg-[#2d3648]'
            } transition-colors`}
          >
            <span className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
              </svg>
              My Applications
            </span>
          </Link>

          <Link 
            href="/candidate/interviews" 
            className={`block px-6 py-3 ${
              pathname === '/candidate/interviews' 
                ? 'text-white bg-[#2d3648] font-medium' 
                : 'text-gray-300 hover:bg-[#2d3648]'
            } transition-colors`}
          >
            <span className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
              </svg>
              Interviews
            </span>
          </Link>

          <Link 
            href="/candidate/evaluations" 
            className={`block px-6 py-3 ${
              pathname === '/candidate/evaluations' 
                ? 'text-white bg-[#2d3648] font-medium' 
                : 'text-gray-300 hover:bg-[#2d3648]'
            } transition-colors`}
          >
            <span className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
              </svg>
              Evaluations
            </span>
          </Link>

          <Link 
            href="/candidate/notifications" 
            className={`block px-6 py-3 ${
              pathname === '/candidate/notifications' 
                ? 'text-white bg-[#2d3648] font-medium' 
                : 'text-gray-300 hover:bg-[#2d3648]'
            } transition-colors`}
          >
            <span className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path>
              </svg>
              Notifications
            </span>
          </Link>
        </nav>
        
        <div className="absolute bottom-0 w-64 p-6">
          <button 
            onClick={() => {
              localStorage.removeItem('token');
              localStorage.removeItem('userName');
              localStorage.removeItem('userEmail');
              router.push('/');
            }}
            className="w-full px-4 py-2 text-sm text-white bg-[#2d3648] hover:bg-[#1e2535] rounded-md transition-colors flex items-center justify-center space-x-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
            </svg>
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
      {children}
      </div>
      
      {/* Chatbot Widget */}
      <ChatbotWidget userRole="candidate" />
    </div>
  );
} 