"use client"

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { dummyApplications } from '@/data/dummyApplications';
import ResumeViewer from '@/components/ResumeViewer';

interface Application {
  _id: string;
  jobId: {
    _id: string;
    title: string;
    company: string;
  };
  status: string;
  appliedDate: string;
  lastUpdate: string;
  interview?: {
    date: string;
    link: string;
    type: string;
    notes: string;
  };
  documents: Array<{
    name: string;
    url: string;
    type: string;
  }>;
  timeline: Array<{
    date: string;
    status: string;
    description: string;
  }>;
  evaluation?: {
    score: number;
    feedback: string;
    evaluationDate: string;
  };
  notifications: Array<{
    message: string;
    date: string;
    read: boolean;
  }>;
  parsedResume?: {
    personalInfo: {
      name: string;
      email: string;
      phone: string;
      location: string;
      linkedin?: string;
      github?: string;
      website?: string;
    };
    summary: string;
    experience: Array<{
      company: string;
      position: string;
      duration: string;
      description: string;
      location?: string;
    }>;
    education: Array<{
      institution: string;
      degree: string;
      field: string;
      graduationYear: string;
      gpa?: string;
    }>;
    skills: {
      technical: string[];
      soft: string[];
      languages: string[];
    };
    certifications: Array<{
      name: string;
      issuer: string;
      date: string;
    }>;
    projects: Array<{
      name: string;
      description: string;
      technologies: string[];
      url?: string;
    }>;
    rawText: string;
    parsingStatus: string;
    parsingError?: string;
    confidence?: number;
  };
}

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [filterStatus, setFilterStatus] = useState('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [startingInterview, setStartingInterview] = useState<string | null>(null);

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        // Check for token in both localStorage and sessionStorage
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        
        if (!token) {
          console.log('No token found, using dummy data');
          setApplications(dummyApplications);
          if (dummyApplications.length > 0) {
            setSelectedApplication(dummyApplications[0]);
          }
          setLoading(false);
          return;
        }

        const response = await fetch('/api/applications', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          credentials: 'include' // Include credentials in the request
        });

        if (response.status === 401) {
          console.log('Token expired or invalid, using dummy data');
          setApplications(dummyApplications);
          if (dummyApplications.length > 0) {
            setSelectedApplication(dummyApplications[0]);
          }
          localStorage.removeItem('token');
          sessionStorage.removeItem('token');
          setLoading(false);
          return;
        }

        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch applications');
        }

        console.log('Applications fetched successfully:', data);
        console.log('Applications with evaluation:', data.filter((app: Application) => app.evaluation).length);
        console.log('Sample application data:', data[0]);
        setApplications(data);
        if (data.length > 0) {
          setSelectedApplication(data[0]);
        }
      } catch (err) {
        console.error('Error fetching applications:', err);
        setError('Failed to load applications');
      } finally {
        setLoading(false);
      }
    };

    fetchApplications();
  }, []);

  const filteredApplications = filterStatus === 'All'
    ? applications
    : applications.filter(app => app.status === filterStatus);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Interview Scheduled':
        return 'bg-green-100 text-green-800';
      case 'Under Review':
        return 'bg-blue-100 text-blue-800';
      case 'Rejected':
        return 'bg-red-100 text-red-800';
      case 'Accepted':
        return 'bg-emerald-100 text-emerald-800';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleStartInterviewNow = async (applicationId: string) => {
    try {
      setStartingInterview(applicationId);
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      
      if (!token) {
        alert('Please login to start interview');
        return;
      }

      const response = await fetch('/api/interviews/start-now', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ applicationId })
      });

      const data = await response.json();

      if (data.success) {
        // Redirect to interview page
        window.location.href = data.data.interviewLink;
      } else {
        alert(data.error || 'Failed to start interview');
      }
    } catch (error) {
      console.error('Error starting interview:', error);
      alert('Failed to start interview. Please try again.');
    } finally {
      setStartingInterview(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error && error !== 'Failed to fetch applications') {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">My Applications</h1>
        <p className="text-gray-600 mt-1">Track your job applications and their status</p>
      </div>

      {/* Info Banner for Immediate Interviews */}
      {applications.some(app => app.evaluation && app.evaluation.score >= 70) && (
        <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-3">
            <svg className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h3 className="font-semibold text-blue-900">Ready for Interview?</h3>
              <p className="text-sm text-blue-800 mt-1">
                Congratulations! You've been shortlisted. You can start your AI-powered interview immediately! 
                Click "Start Interview Now" on any shortlisted application. The system will generate 
                job-specific questions and guide you through a voice-based interview.
              </p>
              <p className="text-sm text-blue-700 mt-2 font-medium">
                💡 Make sure you have a working microphone and are in a quiet environment.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Filter - Only show if there are applications */}
      {applications.length > 0 && (
        <div className="mb-6">
          <select
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option>All</option>
            <option>Pending</option>
            <option>Under Review</option>
            <option>Interview Scheduled</option>
            <option>Accepted</option>
            <option>Rejected</option>
          </select>
        </div>
      )}

      {/* Applications List - Full Width */}
      {applications.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-gray-900">No Applications Yet</h3>
          <p className="mt-2 text-gray-600">
            You haven't submitted any job applications yet. Start exploring available positions and apply today!
          </p>
          <a
            href="/candidate/jobs"
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Browse Jobs
          </a>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredApplications.map((application) => (
            <div
              key={application._id}
              className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{application.jobId.title}</h3>
                      <p className="text-md text-gray-600 mt-1">{application.jobId.company}</p>
                    </div>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(application.status)}`}>
                      {application.status}
                    </span>
                  </div>
                  
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                    <div>
                      <span className="font-medium">Applied Date:</span>
                      <span className="ml-2">{format(new Date(application.appliedDate), 'MMM dd, yyyy')}</span>
                    </div>
                    <div>
                      <span className="font-medium">Last Updated:</span>
                      <span className="ml-2">{format(new Date(application.lastUpdate), 'MMM dd, yyyy')}</span>
                    </div>
                  </div>
                  
                  {/* Evaluation Status Indicator */}
                  {application.evaluation && (
                    <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-medium text-blue-900">AI Screening Result:</span>
                          <span className={`ml-2 px-2 py-1 rounded text-sm font-medium ${
                            application.evaluation.score >= 70 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {application.evaluation.score >= 70 ? '✅ Shortlisted' : '❌ Not Shortlisted'}
                          </span>
                        </div>
                        <span className="text-blue-700 font-semibold">
                          {application.evaluation.score}/100
                        </span>
                      </div>
                      {application.evaluation.feedback && (
                        <p className="mt-2 text-sm text-blue-800">
                          {application.evaluation.feedback.length > 100 
                            ? application.evaluation.feedback.substring(0, 100) + '...'
                            : application.evaluation.feedback
                          }
                        </p>
                      )}
                    </div>
                  )}

                  <div className="mt-4 flex justify-end gap-3">
                    {/* Start Interview Now Button - Show only for shortlisted applications */}
                    {application.evaluation && application.evaluation.score >= 70 && (
                      <button
                        onClick={() => handleStartInterviewNow(application._id)}
                        disabled={startingInterview === application._id}
                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {startingInterview === application._id ? (
                          <>
                            <svg className="animate-spin h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Starting...
                          </>
                        ) : (
                          <>
                            <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                            Start Interview Now
                          </>
                        )}
                      </button>
                    )}
                    
                    <button
                      onClick={() => setSelectedApplication(selectedApplication?._id === application._id ? null : application)}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {selectedApplication?._id === application._id ? 'Hide Timeline' : 'View Timeline'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Expandable Timeline Section */}
              {selectedApplication?._id === application._id && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Application Timeline</h4>
                  <div className="space-y-4">
                    {application.timeline.map((event, index) => (
                      <div key={index} className="flex">
                        <div className="flex-shrink-0">
                          <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full">
                            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                        </div>
                        <div className="ml-4 flex-1">
                          <div className="flex items-center justify-between">
                            <h5 className="text-sm font-medium text-gray-900">{event.status}</h5>
                            <p className="text-sm text-gray-500">{format(new Date(event.date), 'MMM dd, yyyy')}</p>
                          </div>
                          <p className="mt-1 text-sm text-gray-600">{event.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Resume Data Display */}
                  {application.parsedResume && (
                    <div className="mt-6">
                      <ResumeViewer parsedResume={application.parsedResume} />
                    </div>
                  )}

                  {/* Interview Details in Timeline */}
                  {application.interview && (
                    <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <h5 className="text-sm font-medium text-blue-900 mb-2">Interview Scheduled</h5>
                      <div className="text-sm text-blue-800">
                        <p><span className="font-medium">Date:</span> {format(new Date(application.interview.date), 'MMM dd, yyyy hh:mm a')}</p>
                        <p><span className="font-medium">Type:</span> {application.interview.type}</p>
                        {application.interview.notes && (
                          <p><span className="font-medium">Notes:</span> {application.interview.notes}</p>
                        )}
                        {application.interview.link && (
                          <a
                            href={application.interview.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-2 inline-flex items-center text-blue-600 hover:text-blue-800"
                          >
                            <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                            Join Interview
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8" style={{display: 'none'}}>
        {/* Hidden - keeping original detailed view code for reference */}
        <div className="lg:col-span-1 space-y-4"></div>

        {/* Application Details */}
        {selectedApplication && (
          <div className="lg:col-span-2">
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <div className="border-b border-gray-200 pb-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-xl font-semibold">{selectedApplication.jobId.title}</h2>
                    <p className="text-gray-600">{selectedApplication.jobId.company}</p>
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedApplication.status)}`}>
                    {selectedApplication.status}
                  </span>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Applied Date:</span>
                    <span className="ml-2">{format(new Date(selectedApplication.appliedDate), 'MMM dd, yyyy')}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Last Updated:</span>
                    <span className="ml-2">{format(new Date(selectedApplication.lastUpdate), 'MMM dd, yyyy')}</span>
                  </div>
                </div>
              </div>

              {/* Interview Details */}
              {selectedApplication.interview && (
                <div className="py-6 border-b border-gray-200">
                  <h3 className="text-lg font-medium mb-4">Interview Details</h3>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center text-blue-800">
                      <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="font-medium">
                        {format(new Date(selectedApplication.interview.date), 'MMM dd, yyyy hh:mm a')}
                      </span>
                    </div>
                    <div className="mt-2 text-blue-700">
                      <p>Type: {selectedApplication.interview.type}</p>
                      {selectedApplication.interview.notes && (
                        <p className="mt-1">Notes: {selectedApplication.interview.notes}</p>
                      )}
                    </div>
                    {selectedApplication.interview.link && (
                      <a
                        href={selectedApplication.interview.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 inline-flex items-center text-blue-600 hover:text-blue-800"
                      >
                        <svg className="h-5 w-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        Join Interview
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* Evaluation Details */}
              {selectedApplication.evaluation && (
                <div className="py-6 border-b border-gray-200">
                  <h3 className="text-lg font-medium mb-4">Evaluation Results</h3>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-700">Score:</span>
                      <span className="font-medium">{selectedApplication.evaluation.score}/100</span>
                    </div>
                    {selectedApplication.evaluation.feedback && (
                      <div className="mt-3">
                        <span className="text-gray-700">Feedback:</span>
                        <p className="mt-1 text-gray-600">{selectedApplication.evaluation.feedback}</p>
                      </div>
                    )}
                    <div className="mt-2 text-sm text-gray-500">
                      Evaluated on {format(new Date(selectedApplication.evaluation.evaluationDate), 'MMM dd, yyyy')}
                    </div>
                    {/* PDF Report Download Link */}
                    {selectedApplication.interviewSession && selectedApplication.interviewSession.pdfPath && (
                      <div className="mt-4">
                        <a
                          href={`/${selectedApplication.interviewSession.pdfPath}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                          Download Interview Report (PDF)
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Submitted Documents */}
              <div className="py-6 border-b border-gray-200">
                <h3 className="text-lg font-medium mb-4">Submitted Documents</h3>
                <div className="space-y-2">
                  {selectedApplication.documents.map((doc, index) => (
                    <div key={index} className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded-lg">
                      <div className="flex items-center">
                        <svg className="h-5 w-5 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                        <span>{doc.name}</span>
                      </div>
                      {doc.url && (
                        <a
                          href={doc.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800"
                        >
                          View
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Application Timeline */}
              <div className="pt-6">
                <h3 className="text-lg font-medium mb-4">Application Timeline</h3>
                <div className="space-y-6">
                  {selectedApplication.timeline.map((event, index) => (
                    <div key={index} className="flex">
                      <div className="flex-shrink-0">
                        <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full">
                          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                      </div>
                      <div className="ml-4 flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-medium text-gray-900">{event.status}</h4>
                          <p className="text-sm text-gray-500">{format(new Date(event.date), 'MMM dd, yyyy')}</p>
                        </div>
                        <p className="mt-1 text-sm text-gray-600">{event.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Notifications */}
              {selectedApplication.notifications && selectedApplication.notifications.length > 0 && (
                <div className="pt-6 border-t border-gray-200 mt-6">
                  <h3 className="text-lg font-medium mb-4">Notifications</h3>
                  <div className="space-y-4">
                    {selectedApplication.notifications.map((notification, index) => (
                      <div
                        key={index}
                        className={`p-3 rounded-lg ${notification.read ? 'bg-gray-50' : 'bg-blue-50 border-blue-100'}`}
                      >
                        <div className="flex justify-between items-start">
                          <p className="text-sm">{notification.message}</p>
                          <span className="text-xs text-gray-500">
                            {format(new Date(notification.date), 'MMM dd, yyyy')}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 