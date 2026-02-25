'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Loader2, Video as VideoIcon } from 'lucide-react';

// Dynamically import to prevent SSR issues
const AgoraVideoCall = dynamic(() => import('@/components/AgoraVideoCall'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full bg-gray-900">
      <Loader2 className="w-12 h-12 animate-spin text-blue-500" />
    </div>
  )
});

const AIInterviewerPanel = dynamic(() => import('@/components/AIInterviewerPanel'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-screen">
      <Loader2 className="w-12 h-12 animate-spin text-blue-500" />
    </div>
  )
});

interface AgoraCredentials {
  appId: string;
  channel: string;
  token: string;
  uid: number;
}

// Sample test questions
const sampleQuestions = [
  {
    id: 1,
    text: "What is your experience with JavaScript and its modern frameworks?",
    type: "technical",
    difficulty: "medium",
    jobField: "software engineer",
    generatedAt: new Date().toISOString()
  },
  {
    id: 2,
    text: "Can you explain the concept of RESTful APIs and how you've used them?",
    type: "technical",
    difficulty: "medium",
    jobField: "software engineer",
    generatedAt: new Date().toISOString()
  },
  {
    id: 3,
    text: "Describe a challenging project you worked on and how you overcame obstacles.",
    type: "behavioral",
    difficulty: "medium",
    jobField: "software engineer",
    generatedAt: new Date().toISOString()
  },
  {
    id: 4,
    text: "What are the differences between SQL and NoSQL databases?",
    type: "technical",
    difficulty: "medium",
    jobField: "software engineer",
    generatedAt: new Date().toISOString()
  },
  {
    id: 5,
    text: "How do you handle version control and collaboration in a team?",
    type: "behavioral",
    difficulty: "easy",
    jobField: "software engineer",
    generatedAt: new Date().toISOString()
  },
  {
    id: 6,
    text: "Explain the concept of asynchronous programming in JavaScript.",
    type: "technical",
    difficulty: "hard",
    jobField: "software engineer",
    generatedAt: new Date().toISOString()
  },
  {
    id: 7,
    text: "What testing frameworks have you used and why?",
    type: "technical",
    difficulty: "medium",
    jobField: "software engineer",
    generatedAt: new Date().toISOString()
  },
  {
    id: 8,
    text: "How do you prioritize tasks when working on multiple projects?",
    type: "behavioral",
    difficulty: "easy",
    jobField: "software engineer",
    generatedAt: new Date().toISOString()
  },
  {
    id: 9,
    text: "What is your approach to code review and ensuring code quality?",
    type: "technical",
    difficulty: "medium",
    jobField: "software engineer",
    generatedAt: new Date().toISOString()
  },
  {
    id: 10,
    text: "Where do you see yourself in your software development career in 3 years?",
    type: "behavioral",
    difficulty: "easy",
    jobField: "software engineer",
    generatedAt: new Date().toISOString()
  }
];

export default function TestInterviewerPage() {
  const [started, setStarted] = useState(false);
  const [interviewComplete, setInterviewComplete] = useState(false);
  const [answers, setAnswers] = useState<any[]>([]);
  const [agoraCredentials, setAgoraCredentials] = useState<AgoraCredentials | null>(null);
  const [loadingCredentials, setLoadingCredentials] = useState(false);

  // Fetch Agora credentials when starting
  useEffect(() => {
    if (started && !agoraCredentials) {
      fetchAgoraCredentials();
    }
  }, [started]);

  const fetchAgoraCredentials = async () => {
    try {
      setLoadingCredentials(true);
      const channel = `test-interview-${Date.now()}`;
      const response = await fetch(`/api/interviews/test-credentials?channel=${channel}`);
      const result = await response.json();

      if (result.success && result.data) {
        setAgoraCredentials(result.data);
      } else {
        console.error('Failed to get Agora credentials:', result.error);
      }
    } catch (error) {
      console.error('Error fetching Agora credentials:', error);
    } finally {
      setLoadingCredentials(false);
    }
  };

  const handleComplete = (completedAnswers: any[]) => {
    console.log('Interview completed with answers:', completedAnswers);
    setAnswers(completedAnswers);
    setInterviewComplete(true);
  };

  const handleRestart = () => {
    setStarted(false);
    setInterviewComplete(false);
    setAnswers([]);
  };

  if (!started) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center p-6">
        <div className="max-w-2xl w-full bg-white rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h1 className="text-4xl font-bold text-gray-800 mb-3">
              TalkHire Interviewer Test
            </h1>
            <p className="text-lg text-gray-600">
              Test the TalkHire voice interviewer
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
            <h2 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              How it works:
            </h2>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-1">•</span>
                <span><strong>Voice Interaction:</strong> TalkHire will speak questions, you answer via voice</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-1">•</span>
                <span><strong>10 Questions:</strong> Sample software engineering interview questions</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-1">•</span>
                <span><strong>Intelligent Evaluation:</strong> Powered by TalkHire - evaluates your answers</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-1">•</span>
                <span><strong>Features:</strong> Ask to repeat questions, request clarification</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-1">•</span>
                <span><strong>Complete Transcript:</strong> All Q&A saved with scores</span>
              </li>
            </ul>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-yellow-900 mb-2 flex items-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              Browser Requirements:
            </h3>
            <p className="text-sm text-yellow-800">
              Use <strong>Chrome or Edge</strong> for best voice recognition support. 
              Make sure to allow microphone access when prompted.
            </p>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => setStarted(true)}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 px-6 rounded-lg font-semibold text-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              Start Interview Test
            </button>
            
            <button
              onClick={() => window.history.back()}
              className="w-full bg-gray-200 text-gray-700 py-3 px-6 rounded-lg font-medium hover:bg-gray-300 transition-colors"
            >
              Go Back
            </button>
          </div>

          <p className="text-xs text-gray-500 text-center mt-6">
            This is a test environment. No data will be saved to the production database.
          </p>
        </div>
      </div>
    );
  }

  if (interviewComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-900 via-blue-900 to-purple-900 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-2xl p-8">
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h1 className="text-4xl font-bold text-gray-800 mb-2">
                Interview Complete!
              </h1>
              <p className="text-lg text-gray-600">
                Total Questions: <span className="text-2xl font-bold text-blue-600">{answers.length}</span>
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Interview Transcript
              </h2>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {answers.map((item, index) => (
                  <div key={index} className="bg-white rounded-lg p-4 border border-gray-200">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-gray-800">
                        Question {index + 1}
                      </h3>
                      <span className="text-xs text-gray-500">
                        {new Date(item.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      <strong>Q:</strong> {item.questionText}
                    </p>
                    <p className="text-sm text-gray-700">
                      <strong>A:</strong> {item.answer}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleRestart}
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all"
              >
                Test Again
              </button>
              <button
                onClick={() => {
                  const data = JSON.stringify(answers, null, 2);
                  const blob = new Blob([data], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `interview-transcript-${Date.now()}.json`;
                  a.click();
                }}
                className="flex-1 bg-gray-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-gray-700 transition-colors"
              >
                Download Transcript
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show loading while credentials are being fetched
  if (started && loadingCredentials) {
    return (
      <div className="h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-16 h-16 animate-spin text-blue-500 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-white mb-2">
            Setting up video call...
          </h2>
          <p className="text-gray-300">Connecting to Agora servers</p>
        </div>
      </div>
    );
  }

  // Main interview UI with video
  if (started && agoraCredentials) {
    return (
      <div className="relative h-screen flex bg-gray-900">
        {/* Left Side - Video Call (2/3 width) */}
        <div className="w-2/3 relative">
          {/* Test Interview Info Header */}
          <div className="absolute top-4 left-4 z-50 bg-black bg-opacity-70 px-4 py-2 rounded-lg shadow-lg">
            <div className="flex items-center gap-2 text-white">
              <VideoIcon size={20} className="text-blue-500" />
              <div>
                <p className="font-semibold">Test Interview - Software Engineer</p>
                <p className="text-xs text-gray-300">
                  Test Mode • Channel: {agoraCredentials.channel}
                </p>
              </div>
            </div>
          </div>

          {/* Agora Video Call Component */}
          <AgoraVideoCall
            appId={agoraCredentials.appId}
            channel={agoraCredentials.channel}
            token={agoraCredentials.token}
            uid={agoraCredentials.uid}
            userName="Test Candidate"
            interviewId="TEST-INTERVIEW"
            onLeave={() => {
              setStarted(false);
              setAgoraCredentials(null);
              window.location.reload();
            }}
          />
        </div>

        {/* Right Side - AI Interviewer Panel (1/3 width) */}
        <div className="w-1/3 bg-gray-100 overflow-y-auto p-4">
          <AIInterviewerPanel
            interviewId="TEST-INTERVIEW"
            applicationId="TEST-APP"
            questions={sampleQuestions}
            jobTitle="Software Engineer"
            candidateName="Test Candidate"
            onComplete={handleComplete}
          />
        </div>
      </div>
    );
  }

  // Fallback (should not reach here)
  return (
    <div className="h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center">
      <div className="text-center">
        <p className="text-white text-xl">Loading...</p>
      </div>
    </div>
  );
}
