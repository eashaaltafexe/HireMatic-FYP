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
  };
  slot: {
    date: string;
    duration: number;
    type: 'AI' | 'Human' | 'Panel';
    aiInterviewerStatus?: string;
  };
  status: string;
  confirmationStatus: string;
  link: string;
  createdAt: string;
}

interface DaySchedule {
  date: string;
  interviews: Interview[];
  aiInterviewerBusySlots: number;
  totalSlots: number;
}

export default function ScheduledInterviewsPage() {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState('');
  const [filter, setFilter] = useState<'all' | 'today' | 'upcoming' | 'past'>('upcoming');
  const [scheduleView, setScheduleView] = useState<DaySchedule[]>([]);

  useEffect(() => {
    fetchInterviews();
  }, [filter]);

  const fetchInterviews = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        toast.error('Please login to view interviews');
        return;
      }

      const response = await fetch(`/api/admin/interviews?filter=${filter}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setInterviews(data.interviews || []);
        processScheduleView(data.interviews || []);
      } else {
        toast.error('Failed to fetch interviews');
      }
    } catch (error) {
      console.error('Error fetching interviews:', error);
      toast.error('Error loading interviews');
    } finally {
      setLoading(false);
    }
  };

  const processScheduleView = (interviewsList: Interview[]) => {
    // Group interviews by date
    const groupedByDate: Record<string, Interview[]> = {};
    
    interviewsList.forEach(interview => {
      const date = new Date(interview.slot.date).toISOString().split('T')[0];
      if (!groupedByDate[date]) {
        groupedByDate[date] = [];
      }
      groupedByDate[date].push(interview);
    });

    // Create schedule view
    const schedule: DaySchedule[] = Object.keys(groupedByDate)
      .sort()
      .map(date => {
        const dayInterviews = groupedByDate[date];
        const aiInterviews = dayInterviews.filter(i => i.slot.type === 'AI');
        
        return {
          date,
          interviews: dayInterviews.sort((a, b) => 
            new Date(a.slot.date).getTime() - new Date(b.slot.date).getTime()
          ),
          aiInterviewerBusySlots: aiInterviews.filter(i => 
            i.status === 'scheduled' || i.status === 'confirmed'
          ).length,
          totalSlots: 6 // Total time slots per day
        };
      });

    setScheduleView(schedule);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getAvailabilityColor = (busySlots: number, totalSlots: number) => {
    const percentage = (busySlots / totalSlots) * 100;
    if (percentage < 50) return 'text-green-600';
    if (percentage < 80) return 'text-yellow-600';
    return 'text-red-600';
  };

  const cancelInterview = async (interviewId: string) => {
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
        toast.success('Interview cancelled');
        fetchInterviews();
      } else {
        toast.error('Failed to cancel interview');
      }
    } catch (error) {
      console.error('Error cancelling interview:', error);
      toast.error('Error cancelling interview');
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Scheduled Interviews</h1>
        <p className="text-gray-600 mt-1">Manage scheduled interviews and AI interviewer availability</p>
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
        <div className="flex items-center space-x-4">
          <span className="text-sm font-medium text-gray-700">Filter:</span>
          <div className="flex space-x-2">
            {(['all', 'today', 'upcoming', 'past'] as const).map((filterOption) => (
              <button
                key={filterOption}
                onClick={() => setFilter(filterOption)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === filterOption
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {filterOption.charAt(0).toUpperCase() + filterOption.slice(1)}
              </button>
            ))}
          </div>
          <div className="ml-auto text-sm text-gray-600">
            Total: <strong>{interviews.length}</strong> interviews
          </div>
        </div>
      </div>

      {/* AI Interviewer Availability Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">AI Interviews Today</p>
              <p className="text-2xl font-bold text-gray-900">
                {interviews.filter(i => {
                  const today = new Date().toISOString().split('T')[0];
                  const interviewDate = new Date(i.slot.date).toISOString().split('T')[0];
                  return i.slot.type === 'AI' && interviewDate === today;
                }).length}
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Upcoming AI Interviews</p>
              <p className="text-2xl font-bold text-gray-900">
                {interviews.filter(i => 
                  i.slot.type === 'AI' && 
                  new Date(i.slot.date) > new Date() &&
                  (i.status === 'scheduled' || i.status === 'confirmed')
                ).length}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Completed This Week</p>
              <p className="text-2xl font-bold text-gray-900">
                {interviews.filter(i => {
                  const weekAgo = new Date();
                  weekAgo.setDate(weekAgo.getDate() - 7);
                  return i.status === 'completed' && new Date(i.slot.date) > weekAgo;
                }).length}
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <svg className="h-6 w-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Schedule View */}
      {scheduleView.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
          <div className="text-gray-400 mb-4">
            <svg className="h-16 w-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Interviews Found</h3>
          <p className="text-gray-500">There are no interviews matching the selected filter.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {scheduleView.map((day) => (
            <div key={day.date} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              {/* Day Header */}
              <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{formatDate(day.date)}</h3>
                    <p className="text-sm text-gray-600">{day.interviews.length} interview(s) scheduled</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">AI Interviewer Load</p>
                    <p className={`text-lg font-semibold ${getAvailabilityColor(day.aiInterviewerBusySlots, day.totalSlots)}`}>
                      {day.aiInterviewerBusySlots} / {day.totalSlots} slots
                    </p>
                  </div>
                </div>
              </div>

              {/* Interviews List */}
              <div className="divide-y divide-gray-200">
                {day.interviews.map((interview) => (
                  <div key={interview._id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h4 className="text-lg font-medium text-gray-900">
                            {interview.candidateMetadata?.fullName || 'N/A'}
                          </h4>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(interview.status)}`}>
                            {interview.status}
                          </span>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                            {interview.slot.type}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                          <div>
                            <span className="font-medium">Position:</span>{' '}
                            {interview.jobId?.title || 'N/A'}
                          </div>
                          <div>
                            <span className="font-medium">Time:</span>{' '}
                            {formatTime(interview.slot.date)}
                          </div>
                          <div>
                            <span className="font-medium">Email:</span>{' '}
                            {interview.candidateMetadata?.email || 'N/A'}
                          </div>
                          <div>
                            <span className="font-medium">Duration:</span>{' '}
                            {interview.slot.duration} minutes
                          </div>
                          <div>
                            <span className="font-medium">Interview ID:</span>{' '}
                            <span className="font-mono text-xs">{interview.interviewId}</span>
                          </div>
                          <div>
                            <span className="font-medium">Phone:</span>{' '}
                            {interview.candidateMetadata?.phone || 'N/A'}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col space-y-2 ml-4">
                        <a
                          href={interview.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm text-center"
                        >
                          Join Interview
                        </a>
                        {interview.status !== 'completed' && interview.status !== 'cancelled' && (
                          <button
                            onClick={() => cancelInterview(interview._id)}
                            className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors text-sm"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <ToastContainer />
    </div>
  );
}




