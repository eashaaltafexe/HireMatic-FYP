"use client"

import Link from 'next/link';
import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';

export default function ForgotPasswordPage() {
  const [step, setStep] = useState(1); // Step 1: Email verification, Step 2: New password
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [isConfirmPasswordFocused, setIsConfirmPasswordFocused] = useState(false);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const router = useRouter();
  
  const verifyEmail = async (e: FormEvent) => {
    e.preventDefault();
    setMessage('');
    setIsLoading(true);
    
    try {
      // Verify if email exists
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        setMessage(data.message || 'Email not found. Please check your email address.');
        setIsSuccess(false);
      } else {
        // Move to password reset step
        setStep(2);
        setIsSuccess(true);
        setMessage('Email verified. Please enter your new password.');
      }
    } catch (err) {
      setMessage('An error occurred. Please try again.');
      setIsSuccess(false);
      console.error('Email verification error:', err);
    } finally {
      setIsLoading(false);
    }
  };
  
  const resetPassword = async (e: FormEvent) => {
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
      // Update password directly
      const response = await fetch('/api/auth/direct-reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        setMessage(data.message || 'An error occurred. Please try again.');
        setIsSuccess(false);
      } else {
        setMessage('Your password has been reset successfully. Redirecting to login...');
        setIsSuccess(true);
        
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
          {step === 1 ? (
            <p className="text-gray-600 mb-6 text-center">Enter your email address to reset your password</p>
          ) : (
            <p className="text-gray-600 mb-6 text-center">Create a new password for your account</p>
          )}

          {message && (
            <div className={`${isSuccess ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'} p-3 rounded-md mb-6`}>
              {message}
            </div>
          )}

          {step === 1 ? (
            <form onSubmit={verifyEmail} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
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

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#2A3647] text-white rounded-md py-3.5 font-medium hover:bg-opacity-90 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2A3647] disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Verifying...' : 'Continue'}
              </button>
            </form>
          ) : (
            <form onSubmit={resetPassword} className="space-y-6">
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
                {isLoading ? 'Resetting Password...' : 'Reset Password'}
              </button>
            </form>
          )}

          <div className="text-center mt-6">
            <p className="text-sm text-gray-700">
              Remember your password? <Link href="/login" className="text-[#2A3647] font-medium hover:text-[#3B82F6] transition-colors">Log in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 