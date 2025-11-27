'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { toast } from '@/utils/toast';
import { Loader2, AlertCircle } from 'lucide-react';

// Dynamically import VirtualInterviewer to prevent SSR issues
const VirtualInterviewer = dynamic(() => import('@/components/VirtualInterviewer'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-screen bg-gray-900">
      <Loader2 className="w-16 h-16 animate-spin text-blue-500" />
    </div>
  )
});

interface AgoraCredentials {
  appId: string;
  channel: string;
  token: string;
  uid: number;
}

interface InterviewData {
  id: string;
  interviewId: string;
  jobTitle: string;
  date: string;
  duration: number;
  applicationId?: string;
}

interface Question {
  id: number;
  text: string;
  type: string;
  difficulty: string;
  jobField: string;
}

export default function InterviewRoomPage() {
  const params = useParams();
  const router = useRouter();
  const interviewId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [agoraCredentials, setAgoraCredentials] = useState<AgoraCredentials | null>(null);
  const [interview, setInterview] = useState<InterviewData | null>(null);
  const [userName, setUserName] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);

  useEffect(() => {
    joinInterview();
  }, [interviewId]);

  useEffect(() => {
    if (interview?.applicationId) {
      fetchQuestions();
    }
  }, [interview]);

  const fetchQuestions = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/applications/${interview?.applicationId}/questions`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await response.json();
      if (result.success && result.data.questions) {
        setQuestions(result.data.questions);
      }
    } catch (error) {
      console.error('Error fetching questions:', error);
    }
  };

  const joinInterview = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('token');
      console.log('🔑 Token:', token ? 'Found' : 'Not found');
      
      if (!token) {
        toast.error('Please login to join the interview');
        router.push('/login');
        return;
      }

      console.log('📞 Calling /api/interviews/join with interviewId:', interviewId);

      const response = await fetch('/api/interviews/join', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ interviewId })
      });

      console.log('📡 Response status:', response.status);
      const data = await response.json();
      console.log('📦 Response data:', data);

      if (response.ok) {
        setAgoraCredentials(data.agora);
        setInterview(data.interview);
        setUserName(data.userName || 'Candidate');
        console.log('✅ Successfully joined interview');
        setLoading(false);
      } else {
        throw new Error(data.error || 'Failed to join interview');
      }
    } catch (error: any) {
      console.error('❌ Error joining interview:', error);
      setError(error.message || 'Failed to join interview');
      setLoading(false);
      toast.error(error.message || 'Failed to join interview');
    }
  };

  const handleInterviewComplete = async (answers: any[]) => {
    try {
      const token = localStorage.getItem('token');
      const overallScore = answers.length > 0
        ? Math.round(answers.reduce((sum, ans) => sum + (ans.evaluation?.score || 0), 0) / answers.length)
        : 0;

      if (!interview?.applicationId) {
        toast.error('Application ID missing. Cannot save answers.');
        return;
      }
      if (!answers || answers.length === 0) {
        toast.error('No answers to save.');
        return;
      }

      const response = await fetch('/api/interviews/answers', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          applicationId: interview.applicationId,
          answers,
          overallScore,
          overallFeedback: `Interview completed with ${answers.length} questions answered.`
        })
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        console.error('Failed to save interview answers:', result.error || result);
        toast.error(`Failed to save interview answers: ${result.error || 'Unknown error'}`);
        return;
      }

      toast.success('Interview completed and answers saved!');
      router.push('/candidate/applications');
    } catch (error) {
      console.error('Error saving answers:', error);
      toast.error('Failed to save interview answers (exception)');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-center">
          <Loader2 className="w-16 h-16 animate-spin text-blue-500 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-white mb-2">Preparing Interview...</h2>
          <p className="text-gray-400">Setting up your connection</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="bg-red-500/10 border border-red-500 rounded-lg p-8 max-w-md text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-white mb-2">Unable to Join Interview</h2>
          <p className="text-red-300 mb-6">{error}</p>
          <button
            onClick={() => router.push('/candidate/applications')}
            className="px-6 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // Null checks for interview and agoraCredentials
  if (!interview || !agoraCredentials) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-center">
          <Loader2 className="w-16 h-16 animate-spin text-blue-500 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-white mb-2">Preparing Interview...</h2>
          <p className="text-gray-400">Setting up your connection</p>
        </div>
      </div>
    );
  }

  return (
    <VirtualInterviewer
      interviewId={interview.interviewId}
      applicationId={interview.applicationId || ''}
      questions={questions}
      jobTitle={interview.jobTitle}
      candidateName={userName}
      agoraAppId={agoraCredentials.appId}
      agoraChannel={agoraCredentials.channel}
      agoraToken={agoraCredentials.token}
      agoraUid={agoraCredentials.uid}
      onComplete={handleInterviewComplete}
    />
  );
}
