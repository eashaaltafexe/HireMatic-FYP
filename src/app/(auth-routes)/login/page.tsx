"use client"

import Link from 'next/link';
import { useState, FormEvent, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function LoginPage() {
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Check URL parameters
  useEffect(() => {
    // If "logout=true" is in the URL, clear auth state
    if (searchParams?.get('logout') === 'true') {
      // Clear any stored authentication
      localStorage.removeItem('token');
      document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
      return;
    }
    
    // If "fresh=true" or "registered=true" is in the URL, don't auto-redirect
    if (searchParams?.get('fresh') === 'true' || searchParams?.get('registered') === 'true') {
      return;
    }

    // If we're coming from a manual navigation to /login, don't auto-redirect
    if (window.location.pathname === '/login') {
      return;
    }
    
    // Check if token exists
    const token = localStorage.getItem('token') || 
      document.cookie.split('; ').find(row => row.startsWith('token='))?.split('=')[1];
    
    if (token) {
      try {
        // Verify token (in a real app, you'd validate with your backend)
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const payload = JSON.parse(window.atob(base64));
        
        // Check if token is expired
        const currentTime = Date.now() / 1000;
        if (payload.exp && payload.exp < currentTime) {
          console.log('Token expired');
          localStorage.removeItem('token');
          document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
          return;
        }
        
        // Only redirect if we're not explicitly trying to view the login page
        if (!window.location.pathname.includes('/login')) {
          // Redirect based on role
          const role = payload.role;
          if (role === 'admin') {
            router.push('/admin/dashboard');
          } else if (role === 'hr') {
            router.push('/hr/dashboard');
          } else if (role === 'candidate') {
            router.push('/candidate/dashboard');
          }
        }
      } catch (e) {
        console.error('Error validating token:', e);
        // If token is invalid, remove it
        localStorage.removeItem('token');
        document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
      }
    }
  }, [router, searchParams]);
  
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      // Make API call to login endpoint
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        setError(data.message || 'Invalid credentials');
        setIsLoading(false);
        return;
      }
      
      // Store the token from your API
      localStorage.setItem('token', data.token);
      document.cookie = `token=${data.token}; path=/; max-age=604800`; // 7 days
      
      // Redirect based on user role
      const role = data.user.role;
      if (role === 'admin') {
        router.push('/admin/dashboard');
      } else if (role === 'hr') {
        router.push('/hr/dashboard');
      } else {
        router.push('/candidate/dashboard');
      }
    } catch (err) {
      setError('An error occurred during login. Please try again.');
      console.error('Login error:', err);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="flex flex-col min-h-screen bg-[#F9FAFB]">
      {/* Navigation Bar */}
      <nav className="bg-[#2A3647] shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <Link href="/" className="flex items-center">
                <span className="text-2xl mr-2 text-white">⎈</span>
                <span className="text-xl font-bold text-white">HireMatic</span>
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/about" className="text-gray-300 hover:text-[#3B82F6]">About</Link>
              <Link href="/services" className="text-gray-300 hover:text-[#3B82F6]">Services</Link>
              <Link href="/contact" className="text-gray-300 hover:text-[#3B82F6]">Contact</Link>
              <Link href="/signup" className="bg-[#3B82F6] text-white px-4 py-2 rounded-md hover:bg-opacity-90 transition">Sign Up</Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex justify-center items-center flex-grow py-12">
        <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-10">
          <div className="flex justify-center mb-8">
            <Link href="/" className="text-3xl font-bold flex items-center text-black">
              <span className="mr-2 text-4xl text-black">⎈</span> HireMatic<span className="text-[#3B82F6]">.</span>
            </Link>
          </div>

          <h1 className="text-2xl font-bold mb-2 text-center text-black">Log in to your account</h1>
          <p className="text-gray-600 mb-10 text-center">Welcome back to HireMatic</p>

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-md mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-7">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-black mb-2">
                Email
              </label>
              <div className="relative">
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-gray-300 rounded-md py-3 px-4 focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent transition-all"
                  placeholder="Enter your email"
                  required
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                  </svg>
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-black mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full border rounded-md py-3 px-4 transition-all focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent ${isPasswordFocused ? 'border-l-4 border-l-[#3B82F6] border-t-gray-300 border-r-gray-300 border-b-gray-300' : 'border-gray-300'}`}
                  placeholder="Enter your password"
                  onFocus={() => setIsPasswordFocused(true)}
                  onBlur={() => setIsPasswordFocused(false)}
                  required
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <Link href="/forgot-password" className="text-sm text-[#3B82F6] hover:text-blue-800 font-medium transition-colors">
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#2A3647] text-white rounded-md py-3.5 font-medium hover:bg-opacity-90 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2A3647] disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Logging in...' : 'Log in'}
            </button>

            <div className="text-center mt-6">
              <p className="text-sm text-black">
                Don&apos;t have an account? <Link href="/signup?fresh=true" className="text-[#2A3647] font-medium hover:text-[#3B82F6] transition-colors">Sign up</Link>
              </p>
            </div>
          </form>
        </div>

        <div className="hidden lg:block lg:w-1/3 bg-[#3B82F6] min-h-screen ml-8 rounded-lg p-10">
          <h2 className="text-4xl font-bold mt-12">Join the best in the industry</h2>
          <p className="mt-6 text-xl">Access top recruitment tools powered by AI.</p>
          <div className="mt-10">
            <div className="flex items-center mb-6">
              <div className="bg-black bg-opacity-10 rounded-full p-2 mr-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className="text-lg">Smart Resume Parsing</span>
            </div>
            <div className="flex items-center mb-6">
              <div className="bg-black bg-opacity-10 rounded-full p-2 mr-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className="text-lg">Virtual Interviewing</span>
            </div>
            <div className="flex items-center">
              <div className="bg-black bg-opacity-10 rounded-full p-2 mr-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className="text-lg">Advanced Analytics</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 