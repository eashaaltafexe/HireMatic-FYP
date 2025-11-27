"use client"

import Link from 'next/link';
import { useState, FormEvent, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function ResetPasswordPage() {
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [isConfirmPasswordFocused, setIsConfirmPasswordFocused] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [tokenValid, setTokenValid] = useState(false);
  const [validating, setValidating] = useState(true);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams?.get('token');
  
  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setTokenValid(false);
        setMessage('Invalid or missing reset token.');
        setValidating(false);
        return;
      }
      
      try {
        const response = await fetch(`/api/auth/verify-reset-token?token=${token}`);
        const data = await response.json();
        
        if (!response.ok) {
          setTokenValid(false);
          setMessage(data.message || 'Invalid or expired reset token.');
        } else {
          setTokenValid(true);
        }
      } catch (err) {
        console.error('Token validation error:', err);
        setTokenValid(false);
        setMessage('An error occurred while validating your reset token.');
      } finally {
        setValidating(false);
      }
    };
    
    validateToken();
  }, [token]);
  
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setMessage('');
    
    if (password !== confirmPassword) {
      setMessage("Passwords don't match");
      setIsSuccess(false);
      return;
    }
    
    if (password.length < 6) {
      setMessage("Password must be at least 6 characters");
      setIsSuccess(false);
      return;
    }
    
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, password }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        setMessage(data.message || 'An error occurred. Please try again.');
        setIsSuccess(false);
      } else {
        setMessage('Your password has been reset successfully.');
        setIsSuccess(true);
        setPassword('');
        setConfirmPassword('');
        
        // Redirect to login page after 3 seconds
        setTimeout(() => {
          router.push('/login');
        }, 3000);
      }
    } catch (err) {
      setMessage('An error occurred. Please try again.');
      setIsSuccess(false);
      console.error('Password reset error:', err);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Show loading state while validating token
  if (validating) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-[#F9FAFB]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3B82F6] mx-auto"></div>
          <p className="mt-4 text-lg text-gray-600">Validating your reset token...</p>
        </div>
      </div>
    );
  }
  
  // Show error message if token is invalid
  if (!tokenValid) {
    return (
      <div className="flex flex-col min-h-screen bg-[#F9FAFB]">
        <nav className="bg-[#2A3647] shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex">
                <Link href="/" className="flex items-center">
                  <span className="text-2xl mr-2 text-white">⎈</span>
                  <span className="text-xl font-bold text-white">HireMatic</span>
                </Link>
              </div>
            </div>
          </div>
        </nav>
        
        <div className="flex justify-center items-center flex-grow">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
            <div className="text-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-red-500 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <h2 className="text-xl font-semibold mt-4">Invalid Reset Link</h2>
              <p className="mt-2 text-gray-600">{message}</p>
              <div className="mt-6">
                <Link 
                  href="/forgot-password" 
                  className="inline-block bg-[#2A3647] text-white px-4 py-2 rounded-md hover:bg-opacity-90 transition"
                >
                  Request New Reset Link
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col min-h-screen bg-[#F9FAFB]">
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
              <Link href="/login" className="text-gray-300 hover:text-[#3B82F6]">Login</Link>
              <Link href="/signup" className="bg-[#3B82F6] text-white px-4 py-2 rounded-md hover:bg-opacity-90 transition">Sign Up</Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex justify-center items-center flex-grow py-12">
        <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-10">
          <div className="flex justify-center mb-8">
            <Link href="/" className="text-3xl font-bold flex items-center">
              <span className="mr-2 text-4xl">⎈</span> HireMatic<span className="text-[#3B82F6]">.</span>
            </Link>
          </div>

          <h1 className="text-2xl font-bold mb-2 text-center">Reset Your Password</h1>
          <p className="text-gray-600 mb-10 text-center">Create a new password for your account</p>

          {message && (
            <div className={`${isSuccess ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'} p-3 rounded-md mb-6`}>
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                New Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full border rounded-md py-3 px-4 transition-all focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent ${isPasswordFocused ? 'border-l-4 border-l-[#3B82F6] border-t-gray-300 border-r-gray-300 border-b-gray-300' : 'border-gray-300'}`}
                  placeholder="Enter new password"
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
              <p className="text-xs text-gray-500 mt-1">Password must be at least 6 characters.</p>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`w-full border rounded-md py-3 px-4 transition-all focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent ${isConfirmPasswordFocused ? 'border-l-4 border-l-[#3B82F6] border-t-gray-300 border-r-gray-300 border-b-gray-300' : 'border-gray-300'}`}
                  placeholder="Confirm new password"
                  onFocus={() => setIsConfirmPasswordFocused(true)}
                  onBlur={() => setIsConfirmPasswordFocused(false)}
                  required
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#2A3647] text-white rounded-md py-3.5 font-medium hover:bg-opacity-90 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2A3647] disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
} 