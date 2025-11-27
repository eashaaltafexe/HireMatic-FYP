"use client"

import Link from 'next/link';
import { useState, FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function SignupPage() {
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [isConfirmPasswordFocused, setIsConfirmPasswordFocused] = useState(false);
  const [selectedRole, setSelectedRole] = useState('candidate');
  const [currentStep, setCurrentStep] = useState<'form' | 'otp'>('form');
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    email: '',
    password: '',
    confirmPassword: '',
    termsAccepted: false,
  });
  const [otpData, setOtpData] = useState({
    otp: '',
    resendTimer: 0,
  });
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleOtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    // Only allow 6 digits
    if (value.length <= 6 && /^\d*$/.test(value)) {
      setOtpData(prev => ({ ...prev, otp: value }));
    }
  };

  const startResendTimer = () => {
    setOtpData(prev => ({ ...prev, resendTimer: 60 }));
    const timer = setInterval(() => {
      setOtpData(prev => {
        if (prev.resendTimer <= 1) {
          clearInterval(timer);
          return { ...prev, resendTimer: 0 };
        }
        return { ...prev, resendTimer: prev.resendTimer - 1 };
      });
    }, 1000);
  };

  const resendOTP = async () => {
    if (otpData.resendTimer > 0) return;
    
    setIsLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: formData.email }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to resend OTP');
      }
      
      startResendTimer();
    } catch (err: any) {
      setError(err.message || 'Failed to resend OTP');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    
    if (currentStep === 'form') {
      // Basic validation
      if (formData.password !== formData.confirmPassword) {
        setError("Passwords don't match");
        return;
      }

      if (!formData.termsAccepted) {
        setError('You must accept the terms and conditions');
        return;
      }

      setIsLoading(true);

      try {
        // First, register the user (unverified)
        const registerResponse = await fetch('/api/auth/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: formData.name,
            email: formData.email,
            password: formData.password,
            role: selectedRole,
            company: formData.company || undefined,
          }),
        });

        let registerData;
        try {
          registerData = await registerResponse.json();
        } catch (parseError) {
          const text = await registerResponse.text();
          throw new Error(`Server returned invalid JSON. Status: ${registerResponse.status}. Response: ${text.substring(0, 200)}...`);
        }
        
        if (!registerResponse.ok) {
          // Check if it's an "email already in use" error for verified users
          if (registerData.message === 'Email already in use') {
            setError('This email is already registered and verified. Please use a different email or try logging in.');
            setIsLoading(false);
            return;
          }
          throw new Error(registerData.message || `Registration failed with status ${registerResponse.status}`);
        }

        // Send OTP
        const otpResponse = await fetch('/api/auth/send-otp', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email: formData.email }),
        });

        let otpData;
        try {
          otpData = await otpResponse.json();
        } catch (parseError) {
          const text = await otpResponse.text();
          throw new Error(`OTP API returned invalid JSON. Status: ${otpResponse.status}. Response: ${text.substring(0, 200)}...`);
        }
        
        if (!otpResponse.ok) {
          throw new Error(otpData.message || `Failed to send OTP with status ${otpResponse.status}`);
        }

        // Check if this is an existing unverified user
        if (registerData.userExists && registerData.emailNotVerified) {
          setError(''); // Clear any previous errors
          setSuccessMessage('Account found but email not verified. Sending new verification code...');
        } else {
          setSuccessMessage('Account created successfully! Please check your email for the verification code.');
        }

        // Move to OTP verification step
        setCurrentStep('otp');
        startResendTimer();
        
      } catch (err: any) {
        setError(err.message || 'An error occurred during registration. Please try again.');
        console.error('Registration error:', err);
      } finally {
        setIsLoading(false);
      }
    } else if (currentStep === 'otp') {
      // Verify OTP
      if (otpData.otp.length !== 6) {
        setError('Please enter a valid 6-digit OTP');
        return;
      }

      setIsLoading(true);

      try {
        // Complete registration with OTP verification
        const response = await fetch('/api/auth/complete-registration', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: formData.email,
            otp: otpData.otp,
          }),
        });

        let data;
        try {
          data = await response.json();
        } catch (parseError) {
          const text = await response.text();
          throw new Error(`Server returned invalid JSON. Status: ${response.status}. Response: ${text.substring(0, 200)}...`);
        }
        
        if (!response.ok) {
          throw new Error(data.message || `OTP verification failed with status ${response.status}`);
        }

        // Store the token and redirect based on user role
        localStorage.setItem('token', data.token);
        document.cookie = `token=${data.token}; path=/; max-age=604800`; // 7 days
        
        const role = data.user.role;
        if (role === 'admin') {
          router.push('/admin/dashboard');
        } else if (role === 'hr') {
          router.push('/hr/dashboard');
        } else {
          router.push('/candidate/dashboard');
        }
        
      } catch (err: any) {
        setError(err.message || 'OTP verification failed. Please try again.');
        console.error('OTP verification error:', err);
      } finally {
        setIsLoading(false);
      }
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
              <Link href="/login" className="bg-[#3B82F6] text-white px-4 py-2 rounded-md hover:bg-opacity-90 transition">Login</Link>
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

        {currentStep === 'form' ? (
          <>
            <h1 className="text-2xl font-bold mb-2 text-center">Create your account</h1>
            <p className="text-gray-600 mb-10 text-center">Join HireMatic to streamline your hiring process</p>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-bold mb-2 text-center">Verify your email</h1>
            <p className="text-gray-600 mb-10 text-center">
              We've sent a 6-digit code to <strong>{formData.email}</strong>
            </p>
          </>
        )}

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-md mb-6">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="bg-green-50 text-green-600 p-3 rounded-md mb-6">
            {successMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {currentStep === 'form' ? (
            <>
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-md py-3 px-4 focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent transition-all"
                    placeholder="Enter your full name"
                    required
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-2">
                  Company (Optional)
                </label>
                <input
                  type="text"
                  id="company"
                  name="company"
                  value={formData.company}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-md py-3 px-4 focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent transition-all"
                  placeholder="Enter your company name"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <div className="relative">
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
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
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className={`w-full border rounded-md py-3 px-4 transition-all focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent ${isPasswordFocused ? 'border-l-4 border-l-[#3B82F6] border-t-gray-300 border-r-gray-300 border-b-gray-300' : 'border-gray-300'}`}
                    placeholder="Create a password"
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

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className={`w-full border rounded-md py-3 px-4 transition-all focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent ${isConfirmPasswordFocused ? 'border-l-4 border-l-[#3B82F6] border-t-gray-300 border-r-gray-300 border-b-gray-300' : 'border-gray-300'}`}
                    placeholder="Confirm your password"
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

              <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
                  I am a
                </label>
                <div className="flex space-x-4">
                  {['candidate', 'hr', 'admin'].map(role => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => setSelectedRole(role)}
                      className={`flex-1 py-2 px-3 rounded-md transition-all text-sm focus:outline-none ${
                        selectedRole === role
                            ? 'bg-[#EBF5FF] text-[#3B82F6] border border-[#3B82F6]'
                          : 'bg-white border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {role === 'candidate' ? 'Job Seeker' : role === 'hr' ? 'HR Professional' : 'Company Admin'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center">
                <input
                  id="terms"
                  name="termsAccepted"
                  type="checkbox"
                  checked={formData.termsAccepted}
                  onChange={handleChange}
                  className="h-4 w-4 text-[#3B82F6] focus:ring-[#3B82F6] border-gray-300 rounded"
                />
                <label htmlFor="terms" className="ml-2 block text-sm text-gray-700">
                    I accept the <Link href="/terms" className="text-[#3B82F6] hover:text-blue-800">Terms of Service</Link> and <Link href="/privacy" className="text-[#3B82F6] hover:text-blue-800">Privacy Policy</Link>
                </label>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#2A3647] text-white rounded-md py-3.5 font-medium hover:bg-opacity-90 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2A3647] disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Creating account...' : 'Sign up'}
              </button>

              <div className="text-center mt-6">
                <p className="text-sm text-gray-700">
                    Already have an account? <Link href="/login?fresh=true" className="text-[#2A3647] font-medium hover:text-[#3B82F6] transition-colors">Log in</Link>
                </p>
              </div>
            </>
          ) : (
            <>
              <div>
                <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-2">
                  Enter verification code
                </label>
                <div className="relative">
                  <input
                    type="text"
                    id="otp"
                    name="otp"
                    value={otpData.otp}
                    onChange={handleOtpChange}
                    className="w-full border border-gray-300 rounded-md py-3 px-4 text-center text-2xl font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent transition-all"
                    placeholder="000000"
                    maxLength={6}
                    required
                  />
                </div>
              </div>

              <div className="text-center">
                <p className="text-sm text-gray-600 mb-4">
                  Didn't receive the code?{' '}
                  {otpData.resendTimer > 0 ? (
                    <span className="text-gray-400">
                      Resend in {otpData.resendTimer}s
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={resendOTP}
                      disabled={isLoading}
                      className="text-[#3B82F6] hover:text-blue-800 font-medium"
                    >
                      Resend code
                    </button>
                  )}
                </p>
              </div>

              <button
                type="submit"
                disabled={isLoading || otpData.otp.length !== 6}
                className="w-full bg-[#2A3647] text-white rounded-md py-3.5 font-medium hover:bg-opacity-90 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2A3647] disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Verifying...' : 'Verify & Complete Registration'}
              </button>

              <div className="text-center mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setCurrentStep('form');
                    setSuccessMessage('');
                  }}
                  className="text-sm text-gray-600 hover:text-[#3B82F6] transition-colors"
                >
                  ← Back to registration
                </button>
              </div>
            </>
          )}
        </form>
      </div>

        <div className="hidden lg:block lg:w-1/3 bg-[#3B82F6] min-h-screen ml-8 rounded-lg p-10">
        <h2 className="text-4xl font-bold mt-12">Start your hiring journey</h2>
        <p className="mt-6 text-xl">Create an account to access our AI-powered recruitment tools.</p>
        <div className="mt-10">
          <div className="flex items-center mb-6">
            <div className="bg-black bg-opacity-10 rounded-full p-2 mr-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
              <span className="text-lg">Free 30-day trial</span>
          </div>
          <div className="flex items-center mb-6">
            <div className="bg-black bg-opacity-10 rounded-full p-2 mr-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
              <span className="text-lg">No credit card required</span>
          </div>
          <div className="flex items-center">
            <div className="bg-black bg-opacity-10 rounded-full p-2 mr-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
              <span className="text-lg">Cancel anytime</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 