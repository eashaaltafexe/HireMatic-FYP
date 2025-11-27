"use client"

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, PointElement, LineElement } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { jwtDecode } from 'jwt-decode';

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, PointElement, LineElement);

// Define the token structure based on your application
interface DecodedToken {
  userId: string;
  email: string;
  role: string;
  exp: number;
  name?: string; // Name might be included
}

// Real dashboard data interface
interface DashboardData {
  stats: {
    totalUsers: number;
    userGrowth: string;
    activeJobs: number;
    jobGrowth: string;
    applications: number;
    applicationGrowth: string;
  };
  chartData: {
    labels: string[];
    applications: number[];
    interviews: number[];
  };
  recentActivities: Array<{
    user: string;
    action: string;
    time: string;
    type: string;
  }>;
  usersByRole: Array<{ _id: string; count: number }>;
  applicationsByStatus: Array<{ _id: string; count: number }>;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [userData, setUserData] = useState({ name: "Admin User", email: "", role: "" });
  const [isLoading, setIsLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [applicationStats, setApplicationStats] = useState({
    labels: [] as string[],
    datasets: [] as {
      label: string;
      data: number[];
      backgroundColor: string;
      borderColor: string;
      borderWidth: number;
    }[]
  });
  const [generatedQuestions, setGeneratedQuestions] = useState<any[]>([]);
  const [questionsLoading, setQuestionsLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState('software engineer');
  
  // Fetch user data on component mount
  useEffect(() => {
    const getUserData = async () => {
      try {
        // Get token from localStorage
        let token = localStorage.getItem('token');
        console.log('Token found in localStorage:', token ? 'Yes' : 'No');
        
        // If not in localStorage, try cookies
        if (!token) {
          const cookies = document.cookie.split(';');
          const tokenCookie = cookies.find(cookie => cookie.trim().startsWith('token='));
          if (tokenCookie) {
            token = tokenCookie.split('=')[1];
            console.log('Token found in cookies');
          }
        }
        
        if (!token) {
          console.log('No token found, redirecting to login');
          router.push('/login');
          return;
        }
        
        // Decode the token to get user info without making an API call
        try {
          const decodedToken = jwtDecode<DecodedToken>(token);
          console.log('Decoded JWT payload:', decodedToken);
          
          // Extract user information from token
          const user = {
            name: 'Admin User', // Default fallback
            email: '',
            role: 'admin'
          };
          
          // Get the best available user name
          if (decodedToken) {
            // First check if there's user.name in the token (less likely)
            if (decodedToken.name) {
              user.name = decodedToken.name;
            } 
            // Check payload for email and extract name from it if needed
            else if (decodedToken.email) {
              // If we have an email but no name, use the part before @ as name
              const emailName = decodedToken.email.split('@')[0];
              // Capitalize first letter and format name (convert dots to spaces)
              user.name = emailName
                .split('.')
                .map(part => part.charAt(0).toUpperCase() + part.slice(1))
                .join(' ');
          }
          
            // Set email and role from token
            user.email = decodedToken.email || '';
            user.role = decodedToken.role || 'admin';
          }
          
          console.log('User data set:', user);
          setUserData(user);
          
        } catch (tokenError) {
          console.error('Error decoding token:', tokenError);
          // Continue with default name if token parsing fails
        }
        
        // Fetch real dashboard data
        await fetchDashboardData();
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching user data:', error);
        setIsLoading(false);
      }
    };
    
    getUserData();
  }, [router]);
  
  // Fetch dashboard data from API
  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await fetch('/api/admin/dashboard', {
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
        setDashboardData(result.data);
        
        // Update chart data
        setApplicationStats({
          labels: result.data.chartData.labels,
          datasets: [
            {
              label: 'Applications',
              data: result.data.chartData.applications,
              backgroundColor: 'rgba(66, 133, 244, 0.5)',
              borderColor: 'rgb(66, 133, 244)',
              borderWidth: 2,
            },
            {
              label: 'Interviews',
              data: result.data.chartData.interviews,
              backgroundColor: 'rgba(52, 168, 83, 0.5)',
              borderColor: 'rgb(52, 168, 83)',
              borderWidth: 2,
            }
          ]
        });
      } else {
        throw new Error(result.error || 'Failed to fetch dashboard data');
      }
    } catch (err: any) {
      console.error('Error fetching dashboard data:', err);
      // Keep loading state or show error
    }
  };
  
  // Chart options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Monthly Application Statistics',
      },
    },
  };
  
  // Generate questions for shortlisted candidates
  const handleGenerateQuestions = async () => {
    setQuestionsLoading(true);
    try {
      const response = await fetch('/api/questions/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          role: selectedRole,
          num_questions: 10,
        }),
      });

      const result = await response.json();
      
      if (result.success && result.data.questions) {
        setGeneratedQuestions(result.data.questions);
      } else {
        console.error('Failed to generate questions:', result.error);
        alert('Failed to generate questions. Make sure Python service is running.');
      }
    } catch (error) {
      console.error('Error generating questions:', error);
      alert('Error generating questions. Make sure Python service is running on port 8000.');
    } finally {
      setQuestionsLoading(false);
    }
  };

  // Quick actions handler
  const handleQuickAction = (action: string) => {
    switch(action) {
      case 'newUser':
        router.push('/admin/users?add=true');
        break;
      case 'newJob':
        router.push('/admin/hr-profiles?add=true');
        break;
      case 'reports':
        router.push('/admin/reports');
        break;
      case 'settings':
        router.push('/admin/settings');
        break;
    }
  };
  
  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard Overview</h1>
        <div className="flex items-center gap-4">
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="Search..." 
              className="w-64 px-4 py-2 pl-10 border border-gray-300 rounded-full bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
            <svg 
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" 
              width="20" 
              height="20" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" 
              />
            </svg>
          </div>
          
          <div className="relative">
            <button className="w-10 h-10 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-100">
              <span className="absolute top-1 right-1 w-5 h-5 flex items-center justify-center bg-yellow-400 rounded-full text-xs text-white font-bold">
                3
              </span>
              <svg 
                width="20" 
                height="20" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" 
                />
                </svg>
            </button>
              </div>
          
          <button className="w-10 h-10 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-100">
            <svg 
              width="20" 
              height="20" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" 
              />
                </svg>
              </button>
          
          <div className="flex items-center cursor-pointer group relative">
            <div className="w-10 h-10 bg-[#4285F4] rounded-full flex items-center justify-center text-white font-bold">
              {userData.name ? userData.name.charAt(0).toUpperCase() : 'A'}
            </div>
            <div className="ml-2">
              <div className="text-sm font-medium text-gray-800">{userData.name}</div>
              <div className="text-xs text-gray-500">{userData.role === 'admin' ? 'Administrator' : userData.role}</div>
              {userData.email && <div className="text-xs text-gray-400">{userData.email}</div>}
            </div>
            
            {/* User dropdown menu - appears on hover */}
            <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg py-2 z-10 hidden group-hover:block">
              <a href="/admin/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Your Profile</a>
              <a href="/admin/settings" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Settings</a>
              <div className="border-t border-gray-100 my-1"></div>
              <button 
                onClick={() => {
                  localStorage.removeItem('token');
                  router.push('/login');
                }}
                className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
              >
                Sign out
              </button>
            </div>
          </div>
            </div>
          </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-gray-500 text-sm font-medium mb-2">Total Users</h3>
          <p className="text-3xl font-bold text-blue-600">{dashboardData?.stats.totalUsers || 0}</p>
          <span className="text-green-500">{dashboardData?.stats.userGrowth || '+0%'}</span>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-gray-500 text-sm font-medium mb-2">Active Jobs</h3>
          <p className="text-3xl font-bold text-blue-600">{dashboardData?.stats.activeJobs || 0}</p>
          <span className="text-green-500">{dashboardData?.stats.jobGrowth || '+0%'}</span>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-gray-500 text-sm font-medium mb-2">Applications</h3>
          <p className="text-3xl font-bold text-blue-600">{dashboardData?.stats.applications || 0}</p>
          <span className="text-green-500">{dashboardData?.stats.applicationGrowth || '+0%'}</span>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h3 className="text-gray-700 font-medium mb-4">Quick Actions</h3>
        <div className="space-y-3">
          <button 
            onClick={() => handleQuickAction('newUser')}
            className="w-full py-2 px-4 bg-[#4285F4] text-white rounded-md hover:bg-blue-600 transition"
          >
            New User
          </button>
          <button 
            onClick={() => handleQuickAction('newJob')}
            className="w-full py-2 px-4 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition"
          >
            New Job
          </button>
          <button 
            onClick={() => handleQuickAction('reports')}
            className="w-full py-2 px-4 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition"
          >
            Run Reports
          </button>
          <button 
            onClick={() => handleQuickAction('settings')}
            className="w-full py-2 px-4 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition"
          >
            Settings
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Application Statistics */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-gray-700 font-medium mb-4">Application Statistics</h3>
          <div className="h-64">
            {isLoading ? (
              <div className="h-full flex items-center justify-center text-gray-400">
                Loading chart data...
              </div>
            ) : (
              <Bar options={chartOptions} data={applicationStats} />
            )}
          </div>
        </div>
        
        {/* Recent Activities */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-xl font-semibold mb-4 text-blue-600">Recent Activities</h3>
          <div className="space-y-4">
            {dashboardData?.recentActivities && dashboardData.recentActivities.length > 0 ? (
              dashboardData.recentActivities.map((activity: any, index: number) => (
                <div key={index} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div>
                    <span className="text-lg font-semibold text-blue-600">{activity.user}</span>
                    <p className="text-gray-600">{activity.action}</p>
                  </div>
                  <span className="text-sm text-gray-500">{activity.time}</span>
                </div>
              ))
            ) : (
              <div className="text-center text-gray-500 py-8">
                {isLoading ? 'Loading activities...' : 'No recent activities'}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* AI-Generated Interview Questions Section */}
      <div className="mt-6 bg-white p-6 rounded-lg shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-blue-600">AI-Generated Interview Questions</h3>
          <div className="flex gap-3 items-center">
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="software engineer">Software Engineer</option>
              <option value="data scientist">Data Scientist</option>
              <option value="frontend developer">Frontend Developer</option>
              <option value="backend developer">Backend Developer</option>
              <option value="devops engineer">DevOps Engineer</option>
              <option value="machine learning engineer">ML Engineer</option>
              <option value="full stack developer">Full Stack Developer</option>
              <option value="product manager">Product Manager</option>
            </select>
            <button
              onClick={handleGenerateQuestions}
              disabled={questionsLoading}
              className="px-6 py-2 bg-[#4285F4] text-white rounded-md hover:bg-blue-600 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {questionsLoading ? 'Generating...' : 'Generate Questions'}
            </button>
          </div>
        </div>
        
        {generatedQuestions.length > 0 ? (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {generatedQuestions.map((question, index) => (
              <div key={question.id || index} className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-blue-300 transition">
                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-semibold">
                    {index + 1}
                  </span>
                  <div className="flex-1">
                    <p className="text-gray-800 font-medium">{question.text}</p>
                    <div className="mt-2 flex gap-2">
                      <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                        {question.type || 'Technical'}
                      </span>
                      <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">
                        {question.difficulty || 'Medium'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <svg className="mx-auto h-12 w-12 text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-lg font-medium">No questions generated yet</p>
            <p className="text-sm mt-1">Select a role and click "Generate Questions" to create AI-powered interview questions for shortlisted candidates</p>
          </div>
        )}
      </div>
    </div>
  );
} 