"use client"

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';

interface DashboardData {
  user: {
    name: string;
    email: string;
  };
  stats: {
    totalApplications: number;
    interviewScheduled: number;
    underReview: number;
    accepted: number;
  };
  upcomingInterviews: Array<{
    _id: string;
    jobId: {
      title: string;
    };
    interview: {
      date: string;
      link?: string;
    };
  }>;
  recentTimeline: Array<{
    status: string;
    description: string;
    date: string;
    jobTitle: string;
  }>;
}

export default function CandidateDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await fetch('/api/candidate/dashboard', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data');
      }

      const result = await response.json();
      
      if (result.success && result.data) {
        setData(result.data);
      } else {
        throw new Error(result.error || 'Failed to fetch dashboard data');
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const getTimeAgo = (date: string) => {
    const now = new Date();
    const eventDate = new Date(date);
    const diffInHours = Math.floor((now.getTime() - eventDate.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    if (diffInHours < 48) return 'Yesterday';
    return `${Math.floor(diffInHours / 24)} days ago`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-8">
        <div className="text-center">
          <p className="text-gray-600">No dashboard data available</p>
        </div>
      </div>
    );
  }

  const nextInterview = data.upcomingInterviews?.[0];
  const recentActivities = data.recentTimeline?.slice(0, 3) || [];

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Welcome Message */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {data.user?.name || 'User'}!
        </h1>
      </div>

      {/* Quick Stats - 4 boxes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
          <div className="text-3xl font-bold text-blue-600 mb-2">
            {data.stats.totalApplications}
          </div>
          <div className="text-gray-600 font-medium">Applications</div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
          <div className="text-3xl font-bold text-green-600 mb-2">
            {data.stats.interviewScheduled}
          </div>
          <div className="text-gray-600 font-medium">Interviews</div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
          <div className="text-3xl font-bold text-orange-600 mb-2">
            {data.stats.underReview}
          </div>
          <div className="text-gray-600 font-medium">In Review</div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
          <div className="text-3xl font-bold text-purple-600 mb-2">
            {data.stats.accepted}
          </div>
          <div className="text-gray-600 font-medium">Evaluations</div>
        </div>
      </div>

      {/* Next Interview Alert */}
      {nextInterview && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-8">
          <div className="flex items-start justify-between">
            <div className="flex items-start">
              <div className="text-yellow-600 mr-3 mt-1">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-yellow-800 mb-1">⚠️ Upcoming Interview</h3>
                <p className="text-yellow-700">
                  {nextInterview.jobId.title} - {format(new Date(nextInterview.interview.date), 'MMM d, yyyy \'at\' h:mm a')}
                </p>
              </div>
            </div>
            {nextInterview.interview.link && (
              <a
                href={nextInterview.interview.link}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-yellow-600 text-white px-4 py-2 rounded-md hover:bg-yellow-700 transition-colors"
              >
                Join Interview
              </a>
            )}
          </div>
        </div>
      )}

      {/* Recent Activity */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">📋 Recent Updates</h3>
          <Link 
            href="/candidate/applications"
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            View All
          </Link>
        </div>
        
        {recentActivities.length > 0 ? (
          <div className="space-y-3">
            {recentActivities.map((activity, index) => (
              <div key={index} className="flex justify-between items-center py-2">
                <div>
                  <span className="font-medium text-gray-900">{activity.status}</span>
                  {activity.jobTitle && (
                    <span className="text-gray-600"> - {activity.jobTitle}</span>
                  )}
                </div>
                <span className="text-sm text-gray-500">
                  {getTimeAgo(activity.date)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-4">No recent activity</p>
        )}
      </div>
    </div>
  );
}
