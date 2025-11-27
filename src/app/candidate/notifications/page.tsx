"use client"

import { useState, useEffect } from 'react';
import { toast } from '@/utils/toast';
import ToastContainer from '@/components/Toast';

interface Interview {
  _id: string;
  interviewId: string;
  candidateMetadata?: {
    fullName: string;
    email: string;
    phone?: string;
  };
  jobId: {
    _id: string;
    title: string;
    department: string;
    company?: string;
  };
  slot: {
    date: string;
    duration: number;
    type: 'AI' | 'Human' | 'Panel';
  };
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no-show' | 'rescheduled' | 'pending_schedule';
  confirmationStatus: 'pending' | 'confirmed' | 'declined' | 'rescheduled';
  link: string;
  rescheduleRequests?: Array<{
    requestedDate: string;
    reason: string;
    status: 'pending' | 'approved' | 'declined';
    requestedAt: string;
  }>;
  createdAt: string;
}

interface AvailableSlot {
  time: string;
  displayTime: string;
  available: boolean;
}

export default function ManageInterviewsPage() {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInterview, setSelectedInterview] = useState<Interview | null>(null);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([]);
  const [rescheduleReason, setRescheduleReason] = useState('');
  const [selectedNewSlot, setSelectedNewSlot] = useState('');
  const [additionalComments, setAdditionalComments] = useState('');
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [joiningInterview, setJoiningInterview] = useState(false);

  useEffect(() => {
    fetchInterviews();
  }, []);

  const fetchInterviews = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        toast.error('Please login to view interviews');
        return;
      }

      const response = await fetch('/api/interviews?upcoming=true', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Fetched interviews:', data.interviews); // Debug log
        setInterviews(data.interviews || []);
        
        // Auto-select first interview if available
        if (data.interviews && data.interviews.length > 0) {
          setSelectedInterview(data.interviews[0]);
        }
      } else {
        console.error('Failed to fetch interviews:', await response.text());
        toast.error('Failed to fetch interviews');
      }
    } catch (error) {
      console.error('Error fetching interviews:', error);
      toast.error('Error loading interviews');
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableSlotsForReschedule = async (interviewDate: string) => {
    setCheckingAvailability(true);
    
    try {
      // Get dates around the original interview date
      const originalDate = new Date(interviewDate);
      const dates = [];
      
      // Get 3 days before and 3 days after
      for (let i = -3; i <= 3; i++) {
        const date = new Date(originalDate);
        date.setDate(date.getDate() + i);
        if (date > new Date()) { // Only future dates
          dates.push(date.toISOString().split('T')[0]);
        }
      }

      // Fetch availability for these dates
      const allSlots: AvailableSlot[] = [];
      
      for (const date of dates) {
        const response = await fetch('/api/schedule-interview/check-availability', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            date: date,
            positionId: selectedInterview?.jobId._id
          })
        });

        if (response.ok) {
          const data = await response.json();
          const availableSlotsForDate = data.slots.filter((s: AvailableSlot) => s.available);
          
          availableSlotsForDate.forEach((slot: any) => {
            allSlots.push({
              time: `${date}T${slot.time}:00`,
              displayTime: `${formatDate(date)} - ${slot.displayTime}`,
              available: true
            });
          });
        }
      }

      setAvailableSlots(allSlots);
    } catch (error) {
      console.error('Error fetching available slots:', error);
      toast.error('Failed to fetch available slots');
    } finally {
      setCheckingAvailability(false);
    }
  };

  const handleRescheduleClick = (interview: Interview) => {
    setSelectedInterview(interview);
    setShowRescheduleModal(true);
    setRescheduleReason('');
    setSelectedNewSlot('');
    setAdditionalComments('');
    fetchAvailableSlotsForReschedule(interview.slot.date);
  };

  const handleCancelInterview = async (interviewId: string) => {
    if (!confirm('Are you sure you want to cancel this interview?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/interviews/${interviewId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action: 'cancel' })
      });

      if (response.ok) {
        toast.success('Interview cancelled successfully');
        fetchInterviews();
      } else {
        toast.error('Failed to cancel interview');
      }
    } catch (error) {
      console.error('Error cancelling interview:', error);
      toast.error('Error cancelling interview');
    }
  };

  const handleSubmitReschedule = async () => {
    if (!selectedNewSlot || !rescheduleReason) {
      toast.error('Please select a new time slot and provide a reason');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/interviews/${selectedInterview?._id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'reschedule',
          newDate: selectedNewSlot,
          reason: rescheduleReason,
          comments: additionalComments
        })
      });

      if (response.ok) {
        toast.success('Reschedule request submitted successfully');
        setShowRescheduleModal(false);
        fetchInterviews();
      } else {
        toast.error('Failed to submit reschedule request');
      }
    } catch (error) {
      console.error('Error submitting reschedule request:', error);
      toast.error('Error submitting reschedule request');
    }
  };

  const handleProvideAvailability = (interview: Interview) => {
    // Navigate to scheduling page
    window.location.href = '/candidate/interviews';
  };

  const handleJoinInterview = async (interview: Interview) => {
    setJoiningInterview(true);
    
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        toast.error('Please login to join interview');
        return;
      }

      // Navigate to interview room page
      window.location.href = `/interview/${interview._id}`;
      toast.success('Joining interview room...');
      
    } catch (error) {
      console.error('Error joining interview:', error);
      toast.error('Error joining interview');
      setJoiningInterview(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatTimeRange = (dateString: string, duration: number) => {
    const startDate = new Date(dateString);
    const endDate = new Date(startDate.getTime() + duration * 60000);
    
    return `${formatTime(dateString)} - ${formatTime(endDate.toISOString())}`;
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'scheduled':
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'pending_schedule':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-purple-100 text-purple-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status.toLowerCase()) {
      case 'scheduled':
      case 'confirmed':
        return 'SCHEDULED';
      case 'pending_schedule':
        return 'PENDING SCHEDULE';
      case 'completed':
        return 'COMPLETED';
      case 'cancelled':
        return 'CANCELLED';
      default:
        return status.toUpperCase();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
      <div className="mb-8">
          <h1 className="text-3xl font-bold text-indigo-900">2. Manage Interviews</h1>
      </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - My Interviews Dashboard */}
          <div className="bg-white/80 backdrop-blur rounded-2xl shadow-lg p-6 border border-purple-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-indigo-900 flex items-center">
                📅 My Interviews Dashboard
              </h2>
              <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                Active
              </span>
        </div>

            {/* Interviews List */}
        <div className="space-y-4">
              {interviews.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No interviews scheduled yet</p>
                </div>
              ) : (
                interviews.map((interview, index) => (
                  <div
                    key={interview._id}
                    className="border-l-4 border-purple-500 bg-white rounded-lg p-4 shadow-sm"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="font-semibold text-gray-900">
                        Round {index + 1}: {interview.jobId.title}
                      </h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(interview.status)}`}>
                        {getStatusLabel(interview.status)}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                      <div className="flex items-center text-gray-600">
                        <span className="w-5 h-5 bg-purple-100 rounded-full flex items-center justify-center mr-2 text-purple-600">
                          📅
                        </span>
                        {formatDate(interview.slot.date)}
                      </div>
                      <div className="flex items-center text-gray-600">
                        <span className="w-5 h-5 bg-purple-100 rounded-full flex items-center justify-center mr-2 text-purple-600">
                          🕐
                        </span>
                        {formatTime(interview.slot.date)}
                      </div>
                      <div className="flex items-center text-gray-600">
                        <span className="w-5 h-5 bg-purple-100 rounded-full flex items-center justify-center mr-2 text-purple-600">
                          ⏱️
                        </span>
                        {interview.slot.duration} minutes
                </div>
                      <div className="flex items-center text-gray-600">
                        <span className="w-5 h-5 bg-purple-100 rounded-full flex items-center justify-center mr-2 text-purple-600">
                          📹
                        </span>
                        Virtual ({interview.slot.type})
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {interview.status === 'scheduled' || interview.status === 'confirmed' ? (
                        <>
                          <button
                            onClick={() => handleJoinInterview(interview)}
                            disabled={joiningInterview}
                            className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors text-center text-sm font-medium disabled:bg-indigo-400 disabled:cursor-not-allowed"
                          >
                            {joiningInterview ? 'JOINING...' : 'JOIN INTERVIEW'}
                          </button>
                          <button
                            onClick={() => handleRescheduleClick(interview)}
                            className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                          >
                            RESCHEDULE
                          </button>
                        </>
                      ) : interview.status === 'pending_schedule' ? (
                        <button
                          onClick={() => handleProvideAvailability(interview)}
                          className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
                        >
                          PROVIDE AVAILABILITY
                        </button>
                      ) : null}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right Column - Reschedule/Cancel Interview */}
          <div className="bg-white/80 backdrop-blur rounded-2xl shadow-lg p-6 border border-purple-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-indigo-900 flex items-center">
                🔄 Reschedule/Cancel Interview
              </h2>
              <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-medium">
                          Action Required
                        </span>
            </div>

            {selectedInterview ? (
              <div className="space-y-4">
                {/* Current Interview Info */}
                <div className="border-l-4 border-purple-500 bg-white rounded-lg p-4 shadow-sm">
                  <h3 className="font-semibold text-gray-900 mb-3">Current Interview</h3>
                  
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center text-gray-600">
                      <span className="w-5 h-5 bg-purple-100 rounded-full flex items-center justify-center mr-2 text-purple-600">
                        📅
                      </span>
                      {formatDate(selectedInterview.slot.date)}
                    </div>
                    <div className="flex items-center text-gray-600">
                      <span className="w-5 h-5 bg-purple-100 rounded-full flex items-center justify-center mr-2 text-purple-600">
                        🕐
                      </span>
                      {formatTimeRange(selectedInterview.slot.date, selectedInterview.slot.duration)}
                    </div>
                  </div>

                  <span className={`inline-block mt-3 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedInterview.status)}`}>
                    {getStatusLabel(selectedInterview.status)}
                  </span>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                  <button
                    onClick={() => handleRescheduleClick(selectedInterview)}
                    className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                  >
                    Request Reschedule
                  </button>
                  <button
                    onClick={() => handleCancelInterview(selectedInterview._id)}
                    className="w-full bg-white border-2 border-red-300 text-red-600 py-3 px-4 rounded-lg hover:bg-red-50 transition-colors font-medium"
                  >
                    Cancel Interview
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <p className="mb-2">Select an interview to reschedule or cancel</p>
                <p className="text-sm">Click on an interview from the left panel</p>
              </div>
                      )}
                    </div>
                  </div>

        {/* Reschedule Modal */}
        {showRescheduleModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-2xl">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-bold text-gray-900">Reschedule Interview</h3>
                  <button
                    onClick={() => setShowRescheduleModal(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Current Interview */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="font-semibold text-green-900 mb-2">Current Interview</h4>
                  <div className="text-sm text-green-800">
                    <p>{formatDate(selectedInterview?.slot.date || '')} at {formatTime(selectedInterview?.slot.date || '')}</p>
                  </div>
                </div>

                {/* Action Dropdown */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Action
                  </label>
                  <select className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                    <option>Reschedule Interview</option>
                  </select>
                </div>

                {/* Reason */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reason
                  </label>
                  <select
                    value={rescheduleReason}
                    onChange={(e) => setRescheduleReason(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">Schedule Conflict</option>
                    <option value="schedule_conflict">Schedule Conflict</option>
                    <option value="personal_emergency">Personal Emergency</option>
                    <option value="technical_issues">Technical Issues</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                {/* Additional Comments */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Additional Comments
                  </label>
                  <textarea
                    value={additionalComments}
                    onChange={(e) => setAdditionalComments(e.target.value)}
                    placeholder="Please provide additional details..."
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                  />
                </div>

                {/* Preferred New Time Slots */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Preferred New Time Slots (if rescheduling)
                  </label>
                  
                  {checkingAvailability ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                      <p className="text-gray-500 mt-2">Loading available slots...</p>
                    </div>
                  ) : availableSlots.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <p>No alternative slots available</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-3">
                      {availableSlots.slice(0, 6).map((slot, index) => (
                        <button
                          key={index}
                          onClick={() => setSelectedNewSlot(slot.time)}
                          className={`py-3 px-3 rounded-lg text-sm font-medium transition-all ${
                            selectedNewSlot === slot.time
                              ? 'bg-indigo-600 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {slot.displayTime.split(' - ')[0]}<br/>
                          <span className="text-xs">{slot.displayTime.split(' - ')[1]}</span>
                        </button>
                      ))}
                    </div>
                      )}
                    </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={handleSubmitReschedule}
                    disabled={!selectedNewSlot || !rescheduleReason}
                    className="flex-1 bg-indigo-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                  >
                    SUBMIT REQUEST
                  </button>
                  <button
                    onClick={() => setShowRescheduleModal(false)}
                    className="flex-1 bg-gray-100 text-gray-700 py-3 px-6 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                  >
                    CANCEL
                  </button>
                  </div>
                </div>
              </div>
            </div>
        )}
        </div>

      <ToastContainer />
    </div>
  );
} 
