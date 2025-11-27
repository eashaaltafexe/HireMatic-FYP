"use client"

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface GeneratedQuestion {
  id: number;
  text: string;
  type: string;
  difficulty: string;
  jobField: string;
  generatedAt: string;
}

interface Application {
  _id: string;
  userId: {
    _id: string;
    name: string;
    email: string;
  };
  jobId: {
    _id: string;
    title: string;
    department: string;
  };
  status: string;
  appliedDate: string;
  generatedQuestions: GeneratedQuestion[];
  evaluation: {
    score: number;
    feedback: string;
  };
  parsedResume: {
    personalInfo: {
      name: string;
      email: string;
      phone: string;
    };
    skills: {
      technical: string[];
      soft: string[];
    };
    experience: any[];
  };
}

export default function ApplicationQuestionsPage() {
  const router = useRouter();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [filter, setFilter] = useState<'all' | 'shortlisted'>('shortlisted');

  useEffect(() => {
    fetchApplications();
  }, [filter]);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      console.log('Fetching applications with questions...');
      
      const response = await fetch('/api/admin/applications', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const result = await response.json();
      console.log('API Response:', result);
      
      if (result.success) {
        console.log('Total applications:', result.data.length);
        
        // Filter to show only applications with generated questions
        const appsWithQuestions = result.data.filter((app: Application) => {
          const hasQuestions = app.generatedQuestions && app.generatedQuestions.length > 0;
          if (hasQuestions) {
            console.log(`App ${app._id} has ${app.generatedQuestions.length} questions`);
          }
          return hasQuestions;
        });
        
        console.log('Apps with questions:', appsWithQuestions.length);
        
        if (filter === 'shortlisted') {
          const filtered = appsWithQuestions.filter((app: Application) => 
            app.status === 'Under Review' || app.status === 'Interview Scheduled'
          );
          console.log('Filtered shortlisted apps:', filtered.length);
          setApplications(filtered);
        } else {
          setApplications(appsWithQuestions);
        }
      }
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const viewQuestions = async (applicationId: string) => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`/api/applications/${applicationId}/questions`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const result = await response.json();
      
      if (result.success) {
        // Find the application
        const app = applications.find(a => a._id === applicationId);
        if (app) {
          setSelectedApp({
            ...app,
            generatedQuestions: result.data.questions
          });
        }
      }
    } catch (error) {
      console.error('Error fetching questions:', error);
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          Generated Interview Questions
        </h1>
        <div className="flex gap-3">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as 'all' | 'shortlisted')}
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="shortlisted">Shortlisted Only</option>
            <option value="all">All Applications</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Applications List */}
        <div className="lg:col-span-1 bg-white rounded-lg shadow-sm p-4">
          <h2 className="text-lg font-semibold mb-4 text-gray-700">
            Applications ({applications.length})
          </h2>
          
          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading...</div>
          ) : applications.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No applications with generated questions
            </div>
          ) : (
            <div className="space-y-3 max-h-[calc(100vh-250px)] overflow-y-auto">
              {applications.map((app) => (
                <div
                  key={app._id}
                  onClick={() => viewQuestions(app._id)}
                  className={`p-4 border rounded-lg cursor-pointer transition ${
                    selectedApp?._id === app._id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="font-semibold text-gray-800">{app.userId.name}</div>
                  <div className="text-sm text-gray-600">{app.jobId.title}</div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">
                      {app.generatedQuestions?.length || 0} Questions
                    </span>
                    <span className="text-xs text-gray-500">
                      Score: {app.evaluation?.score || 0}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Questions Display */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-sm p-6">
          {!selectedApp ? (
            <div className="flex flex-col items-center justify-center h-96 text-gray-500">
              <svg className="w-16 h-16 mb-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-lg font-medium">No application selected</p>
              <p className="text-sm mt-1">Select an application to view generated questions</p>
            </div>
          ) : (
            <div>
              {/* Header */}
              <div className="mb-6 pb-4 border-b">
                <h2 className="text-xl font-bold text-gray-800">{selectedApp.userId.name}</h2>
                <div className="mt-2 space-y-1">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="font-medium">Position:</span>
                    <span>{selectedApp.jobId.title}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="font-medium">Department:</span>
                    <span>{selectedApp.jobId.department}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="font-medium">Email:</span>
                    <span>{selectedApp.userId.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="font-medium">AI Score:</span>
                    <span className="font-semibold text-blue-600">
                      {selectedApp.evaluation?.score || 0}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Questions */}
              <h3 className="text-lg font-semibold mb-4 text-gray-700">
                Interview Questions ({selectedApp.generatedQuestions?.length || 0})
              </h3>
              
              <div className="space-y-4 max-h-[calc(100vh-400px)] overflow-y-auto pr-2">
                {selectedApp.generatedQuestions && selectedApp.generatedQuestions.length > 0 ? (
                  selectedApp.generatedQuestions.map((question, index) => (
                    <div
                      key={question.id || index}
                      className="p-4 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      <div className="flex items-start gap-3">
                        <span className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-semibold text-sm">
                          {index + 1}
                        </span>
                        <div className="flex-1">
                          <p className="text-gray-800 font-medium mb-2">{question.text}</p>
                          <div className="flex gap-2 flex-wrap">
                            <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                              {question.type}
                            </span>
                            <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">
                              {question.difficulty}
                            </span>
                            {question.jobField && (
                              <span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded-full">
                                {question.jobField}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No questions generated for this application
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="mt-6 pt-4 border-t flex gap-3">
                <button
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition"
                  onClick={() => {
                    // Copy questions to clipboard
                    const questionsText = selectedApp.generatedQuestions
                      ?.map((q, i) => `${i + 1}. ${q.text}`)
                      .join('\n\n');
                    navigator.clipboard.writeText(questionsText || '');
                    alert('Questions copied to clipboard!');
                  }}
                >
                  Copy Questions
                </button>
                <button
                  className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition"
                  onClick={() => window.print()}
                >
                  Print Questions
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
