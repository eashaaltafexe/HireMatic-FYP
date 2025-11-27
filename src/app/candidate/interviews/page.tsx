"use client"

import { useState, useEffect } from 'react';
import { toast } from '@/utils/toast';
import ToastContainer from '@/components/Toast';

interface AvailableSlot {
  time: string;
  displayTime: string;
  available: boolean;
  bookedBy?: string;
}

interface JobPosition {
  _id: string;
  title: string;
  department: string;
  company?: string;
}

type Step = 'personal-info' | 'select-time' | 'confirmation';

export default function CandidateScheduleInterviewPage() {
  const [currentStep, setCurrentStep] = useState<Step>('personal-info');
  const [loading, setLoading] = useState(false);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [positions, setPositions] = useState<JobPosition[]>([]);
  
  // Form data
  const [personalInfo, setPersonalInfo] = useState({
    fullName: '',
    email: '',
    positionId: '',
    phone: ''
  });
  
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('');
  const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([]);
  
  // Confirmation data
  const [scheduledInterview, setScheduledInterview] = useState<any>(null);

  // Predefined time slots
  const timeSlots = [
    { value: '09:00', display: '09:00 AM' },
    { value: '10:00', display: '10:00 AM' },
    { value: '11:00', display: '11:00 AM' },
    { value: '14:00', display: '02:00 PM' },
    { value: '15:00', display: '03:00 PM' },
    { value: '16:00', display: '04:00 PM' }
  ];

  // Fetch available positions on mount
  useEffect(() => {
    fetchPositions();
    loadUserInfo();
  }, []);

  const loadUserInfo = () => {
    // Try to load user info from localStorage
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setPersonalInfo(prev => ({
          ...prev,
          fullName: user.name || '',
          email: user.email || ''
        }));
      } catch (error) {
        console.error('Error loading user info:', error);
      }
    }
  };

  const fetchPositions = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // If logged in, fetch only jobs the candidate applied to and is shortlisted for
      if (token) {
        const response = await fetch('/api/applications', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const applications = await response.json();
          
          // Filter for "Interview Scheduled" status only (not "Under Review")
          const readyForInterview = applications.filter((app: any) => 
            app.status === 'Interview Scheduled'
          );
          
          // Map to job positions
          const jobPositions = readyForInterview.map((app: any) => ({
            _id: app.jobId._id,
            title: app.jobId.title,
            department: app.jobId.department,
            company: app.jobId.company || 'Company',
            applicationId: app._id,
            applicationStatus: app.status
          }));
          
          setPositions(jobPositions);
          
          if (jobPositions.length === 0) {
            toast.info('No applications ready for interview scheduling. Please wait for HR to schedule your interview.');
          }
          return;
        }
      }
      
      // Fallback: fetch all public jobs (for non-logged users)
      const response = await fetch('/api/jobs/public');
      if (response.ok) {
        const data = await response.json();
        setPositions(data.jobs || []);
      }
    } catch (error) {
      console.error('Error fetching positions:', error);
      toast.error('Failed to load available positions');
      setPositions([]);
    }
  };

  const handlePersonalInfoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!personalInfo.fullName || !personalInfo.email || !personalInfo.positionId) {
      toast.error('Please fill in all required fields');
        return;
      }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(personalInfo.email)) {
      toast.error('Please enter a valid email address');
      return;
    }
    
    setCurrentStep('select-time');
  };

  const handleCheckAvailability = async () => {
    if (!selectedDate) {
      toast.error('Please select a date');
      return;
    }

    setCheckingAvailability(true);
    
    try {
      const response = await fetch('/api/schedule-interview/check-availability', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          date: selectedDate,
          positionId: personalInfo.positionId
        })
      });

      if (response.ok) {
        const data = await response.json();
        setAvailableSlots(data.slots || []);
        
        const availableCount = data.slots?.filter((s: AvailableSlot) => s.available).length || 0;
        if (availableCount === 0) {
          toast.error('No slots available for this date. Please select another date.');
        } else {
          toast.success(`Found ${availableCount} available slot(s)`);
        }
      } else {
        toast.error('Failed to check availability');
      }
    } catch (error) {
      console.error('Error checking availability:', error);
      toast.error('Error checking availability');
    } finally {
      setCheckingAvailability(false);
    }
  };

  const handleScheduleInterview = async () => {
    if (!selectedTimeSlot) {
      toast.error('Please select a time slot');
        return;
      }

    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const headers: HeadersInit = {
        'Content-Type': 'application/json'
      };
      
      // Add auth token if available
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch('/api/schedule-interview/book', {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
          fullName: personalInfo.fullName,
          email: personalInfo.email,
          phone: personalInfo.phone,
          positionId: personalInfo.positionId,
          date: selectedDate,
          timeSlot: selectedTimeSlot
        })
      });

      const data = await response.json();

      if (response.ok) {
        setScheduledInterview(data.interview);
        setCurrentStep('confirmation');
        toast.success('Interview scheduled successfully!');
      } else {
        toast.error(data.error || 'Failed to schedule interview');
      }
    } catch (error) {
      console.error('Error scheduling interview:', error);
      toast.error('Error scheduling interview');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setCurrentStep('personal-info');
    setPersonalInfo(prev => ({ ...prev, positionId: '', phone: '' }));
    setSelectedDate('');
    setSelectedTimeSlot('');
    setAvailableSlots([]);
    setScheduledInterview(null);
  };

  const selectedPosition = positions.find(p => p._id === personalInfo.positionId);

  const formatDisplayDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getMinDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  const getMaxDate = () => {
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 30); // 30 days from now
    return maxDate.toISOString().split('T')[0];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Step 1: Personal Information */}
        {currentStep === 'personal-info' && (
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Schedule Your Interview</h1>
            <p className="text-gray-600 mb-4">Fill in your details to book an interview with our AI interviewer</p>
            
            {/* Info banner */}
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-2">
                <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <div className="flex-1">
                  <p className="text-sm font-medium text-blue-900">Interview Scheduling</p>
                  <p className="text-sm text-blue-700 mt-1">You can only schedule interviews for applications with status "Interview Scheduled". HR will update your application status when you're ready for an interview.</p>
                </div>
              </div>
            </div>
            
            <form onSubmit={handlePersonalInfoSubmit} className="space-y-6">
              {/* Full Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={personalInfo.fullName}
                  onChange={(e) => setPersonalInfo({ ...personalInfo, fullName: e.target.value })}
                  placeholder="Enter your full name"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-400"
                  required
                />
      </div>

              {/* Email Address */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={personalInfo.email}
                  onChange={(e) => setPersonalInfo({ ...personalInfo, email: e.target.value })}
                  placeholder="your.email@example.com"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-400"
                  required
                />
      </div>

              {/* Phone Number (Optional) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={personalInfo.phone}
                  onChange={(e) => setPersonalInfo({ ...personalInfo, phone: e.target.value })}
                  placeholder="+1 (555) 000-0000"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-400"
                />
              </div>

              {/* Position Applying For */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Position Applying For <span className="text-red-500">*</span>
                </label>
                {positions.length === 0 ? (
                  <div className="w-full px-4 py-3 border border-yellow-300 bg-yellow-50 rounded-lg text-gray-700">
                    <p className="font-medium">No applications ready for interview scheduling.</p>
                    <p className="text-sm mt-1">HR will schedule interviews for shortlisted candidates. You'll receive a notification when your interview is scheduled.</p>
                  </div>
                ) : (
                  <select
                    value={personalInfo.positionId}
                    onChange={(e) => setPersonalInfo({ ...personalInfo, positionId: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 appearance-none cursor-pointer"
                    required
                  >
                    <option value="">Select a position</option>
                    {positions.map((position: any) => (
                      <option key={position._id} value={position._id}>
                        {position.title} - {position.department} ({position.applicationStatus || 'Shortlisted'})
                      </option>
                    ))}
                  </select>
                )}
            </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={positions.length === 0}
                className="w-full bg-indigo-600 text-white py-3 px-6 rounded-lg font-medium text-lg hover:bg-indigo-700 transition-colors shadow-md disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Next: Select Time Slot
              </button>
            </form>
                  </div>
        )}

        {/* Step 2: Select Interview Time */}
        {currentStep === 'select-time' && (
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="flex justify-between items-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900">Select Interview Time</h1>
              <button
                onClick={() => setCurrentStep('personal-info')}
                className="text-indigo-600 hover:text-indigo-800 font-medium flex items-center"
              >
                ← Back
              </button>
                  </div>

            {/* Candidate Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="font-semibold text-blue-900">Candidate:</span>
                  <span className="ml-2 text-blue-800">{personalInfo.fullName}</span>
                </div>
                <div>
                  <span className="font-semibold text-blue-900">Position:</span>
                  <span className="ml-2 text-blue-800">{selectedPosition?.title}</span>
                </div>
              </div>
        </div>

            {/* Date Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Select Date <span className="text-red-500 ml-1">*</span>
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  setSelectedTimeSlot('');
                  setAvailableSlots([]);
                }}
                min={getMinDate()}
                max={getMaxDate()}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
              />
              </div>

            {/* Check Availability Button */}
            <button
              onClick={handleCheckAvailability}
              disabled={!selectedDate || checkingAvailability}
              className="w-full bg-indigo-600 text-white py-3 px-6 rounded-lg font-medium text-lg hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors shadow-md mb-6"
            >
              {checkingAvailability ? 'Checking Availability...' : 'Check Availability'}
            </button>

            {/* Time Slots */}
            {availableSlots.length > 0 && (
              <>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                      <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    Select Time Slot <span className="text-red-500 ml-1">*</span>
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  {availableSlots.map((slot) => (
                    <button
                      key={slot.time}
                      onClick={() => slot.available && setSelectedTimeSlot(slot.time)}
                      disabled={!slot.available}
                      className={`py-4 px-6 border-2 rounded-lg font-medium text-lg transition-all ${
                        selectedTimeSlot === slot.time
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                          : slot.available
                          ? 'border-gray-300 hover:border-indigo-400 text-gray-900'
                          : 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      {slot.displayTime}
                      {!slot.available && (
                        <div className="text-xs text-red-500 mt-1">Booked</div>
                      )}
                    </button>
                  ))}
                </div>

                {/* Schedule Button */}
                <button
                  onClick={handleScheduleInterview}
                  disabled={!selectedTimeSlot || loading}
                  className="w-full bg-green-600 text-white py-3 px-6 rounded-lg font-medium text-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors shadow-md"
                >
                  {loading ? 'Scheduling...' : 'Schedule Interview'}
                </button>
              </>
            )}
                </div>
              )}

        {/* Step 3: Confirmation */}
        {currentStep === 'confirmation' && scheduledInterview && (
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Interview Scheduled Successfully!</h1>
            </div>

            {/* Interview Details */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
              <div className="space-y-3">
                <div className="flex">
                  <span className="font-semibold text-green-900 w-32">Candidate:</span>
                  <span className="text-green-800">{scheduledInterview.candidateName}</span>
                </div>
                <div className="flex">
                  <span className="font-semibold text-green-900 w-32">Email:</span>
                  <span className="text-green-800">{scheduledInterview.candidateEmail}</span>
                    </div>
                <div className="flex">
                  <span className="font-semibold text-green-900 w-32">Position:</span>
                  <span className="text-green-800">{scheduledInterview.positionTitle}</span>
                        </div>
                <div className="flex">
                  <span className="font-semibold text-green-900 w-32">Date:</span>
                  <span className="text-green-800">{formatDisplayDate(scheduledInterview.date)}</span>
                        </div>
                <div className="flex">
                  <span className="font-semibold text-green-900 w-32">Time:</span>
                  <span className="text-green-800">{scheduledInterview.time}</span>
                      </div>
                <div className="flex">
                  <span className="font-semibold text-green-900 w-32">Interview ID:</span>
                  <span className="text-green-800 font-mono text-sm">{scheduledInterview.interviewId}</span>
                </div>
                </div>
              </div>

            {/* Confirmation Message */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-blue-900 text-center">
                A confirmation email has been sent to <strong>{scheduledInterview.candidateEmail}</strong>. 
                The AI interviewer will be ready at your scheduled time.
              </p>
              </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
                <button
                onClick={resetForm}
                className="flex-1 bg-indigo-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-indigo-700 transition-colors shadow-md"
                >
                Schedule Another Interview
                </button>
                <button
                onClick={() => window.print()}
                className="flex-1 border-2 border-indigo-600 text-indigo-600 py-3 px-6 rounded-lg font-medium hover:bg-indigo-50 transition-colors"
                >
                Print Confirmation
                </button>
            </div>
          </div>
        )}
        </div>
      
      <ToastContainer />
    </div>
  );
}
