"use client"

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type Interview = {
  interviewer: string;
  duration: string;
  date: string;
  feedback: string;
  score: string;
};

type InterviewData = {
  technical: Interview;
  behavioral: Interview;
  final: Interview;
};

type BaseCandidate = {
  id: number;
  name: string;
  avatar: string;
  score: number;
  strengths: string[];
  technicalScore: number;
  experienceMatch: number;
  communication: number;
  culturalFit: number;
};

type DetailedCandidate = BaseCandidate & {
  matchScore: string;
  keyPoints: string[];
  interviews: InterviewData;
};

// Mock data for candidates
const mockCandidates = [
  {
    id: 1,
    name: 'Sarah Mitchell',
    avatar: 'SM',
    score: 92,
    matchScore: '92% • Top Recommendation',
    strengths: ['React Expert', 'Problem Solving', 'Leadership'],
    technicalScore: 95,
    experienceMatch: 90,
    communication: 92,
    culturalFit: 88,
    keyPoints: [
      'Exceptional React & TypeScript expertise',
      'Strong problem-solving in technical interviews',
      'Excellent team collaboration skills',
      '6+ years relevant experience'
    ],
    interviews: {
      technical: {
        interviewer: 'John Smith',
        duration: '45 minutes',
        date: '2 days ago',
        feedback: 'Excellent problem-solving approach. Implemented a clean solution to the algorithm challenge and explained the time complexity clearly. Strong understanding of React patterns and state management.',
        score: '9/10'
      },
      behavioral: {
        interviewer: 'Emily Johnson',
        duration: '30 minutes',
        date: '1 day ago',
        feedback: 'Demonstrated strong leadership qualities and excellent communication skills. Provided concrete examples of past project successes.',
        score: '8/10'
      },
      final: {
        interviewer: 'Mark Thompson',
        duration: '60 minutes',
        date: 'Today',
        feedback: 'Outstanding candidate with deep technical knowledge and excellent cultural fit. Shows great potential for growth and leadership.',
        score: '9.5/10'
      }
    }
  },
  {
    id: 2,
    name: 'Michael Roberts',
    avatar: 'MR',
    score: 89,
    matchScore: '89% • Strong Alternative',
    strengths: ['Full Stack', 'Team Player', 'Adaptable', 'Frontend'],
    technicalScore: 88,
    experienceMatch: 85,
    communication: 94,
    culturalFit: 92,
    keyPoints: [
      'Full-stack capabilities with modern frameworks',
      'Great cultural fit and communication',
      'Proven track record in agile environments',
      'Strong leadership potential'
    ],
    interviews: {
      technical: {
        interviewer: 'Jane Doe',
        duration: '50 minutes',
        date: '3 days ago',
        feedback: 'Solid full-stack knowledge with good understanding of both frontend and backend concepts. Took a systematic approach to debugging the provided code sample.',
        score: '8/10'
      },
      behavioral: {
        interviewer: 'David Wilson',
        duration: '35 minutes',
        date: '2 days ago',
        feedback: 'Shows great adaptability and team-first mindset. Excellent communication skills and problem-solving approach.',
        score: '9/10'
      },
      final: {
        interviewer: 'Sarah Anderson',
        duration: '45 minutes',
        date: 'Yesterday',
        feedback: 'Strong technical foundation combined with excellent soft skills. Would be a valuable addition to the team.',
        score: '8.5/10'
      }
    }
  },
  {
    id: 3,
    name: 'James Davis',
    avatar: 'JD',
    score: 85,
    strengths: ['Backend', 'Database'],
    technicalScore: 82,
    experienceMatch: 80,
    communication: 78,
    culturalFit: 85
  },
  {
    id: 4,
    name: 'Anna Lopez',
    avatar: 'AL',
    score: 78,
    strengths: ['Marketing', 'Creative', 'Technical'],
    technicalScore: 65,
    experienceMatch: 70,
    communication: 88,
    culturalFit: 82
  }
] as DetailedCandidate[];

type Candidate = typeof mockCandidates[number];
type MetricType = 'technicalScore' | 'experienceMatch' | 'communication' | 'culturalFit';
type InterviewType = 'technical' | 'behavioral' | 'final';

export default function DecisionSupport() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  const [selectedPosition, setSelectedPosition] = useState('Senior Software Engineer');
  const [activeTab, setActiveTab] = useState<'All Metrics' | 'Technical' | 'Soft Skills' | 'Experience'>('All Metrics');
  const [activeInterviewTab, setActiveInterviewTab] = useState<InterviewType>('technical');

  const getVisibleMetrics = (tab: typeof activeTab): MetricType[] => {
    switch (tab) {
      case 'Technical':
        return ['technicalScore'];
      case 'Soft Skills':
        return ['communication', 'culturalFit'];
      case 'Experience':
        return ['experienceMatch'];
      default:
        return ['technicalScore', 'experienceMatch', 'communication', 'culturalFit'];
    }
  };

  const getMetricLabel = (metric: MetricType): string => {
    switch (metric) {
      case 'technicalScore':
        return 'Technical Skills';
      case 'experienceMatch':
        return 'Experience Match';
      case 'communication':
        return 'Communication';
      case 'culturalFit':
        return 'Cultural Fit';
    }
  };

  const getInterviewTabLabel = (tab: InterviewType): string => {
    switch (tab) {
      case 'technical':
        return 'Technical Interviews';
      case 'behavioral':
        return 'Behavioral Interviews';
      case 'final':
        return 'Final Round';
    }
  };

  const handleRefreshAnalysis = async () => {
    setRefreshing(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      setLastRefreshed(new Date());
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-black">Decision Support</h1>
          <p className="text-gray-600 mt-1">AI-powered candidate evaluation and recommendations</p>
        </div>
        <button
          onClick={handleRefreshAnalysis}
          className="px-4 py-2 bg-[#3B82F6] text-white rounded-md hover:bg-opacity-90 transition-colors flex items-center"
          disabled={refreshing}
        >
          {refreshing ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Refreshing...
            </>
          ) : (
            'Refresh Analysis'
          )}
        </button>
      </div>

      {/* AI Recommendations */}
      <div className="mt-8 bg-gradient-to-br from-indigo-500 via-purple-500 to-purple-600 rounded-lg p-8">
        <div className="flex items-center mb-6">
          <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
            </svg>
          </div>
          <div className="ml-4">
            <h2 className="text-xl font-bold text-white">AI Hiring Recommendations</h2>
            <p className="text-white/80 text-sm">Based on comprehensive analysis of 156 candidates for Senior Software Engineer</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {(mockCandidates.slice(0, 2) as DetailedCandidate[]).map((candidate) => (
            <div key={candidate.id} className="bg-white/10 rounded-lg p-6">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                  {candidate.avatar}
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-white">{candidate.name}</h3>
                  <p className="text-white/80 text-sm">{candidate.matchScore}</p>
                </div>
              </div>
              <div className="space-y-2">
                {candidate.keyPoints.map((point, index) => (
                  <div key={index} className="flex items-start">
                    <svg className="w-5 h-5 text-white mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    <span className="text-white/90 text-sm">{point}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 text-center text-white/80 text-sm">
          AI Confidence Level: 85% • Based on technical assessments, interview performance, and cultural fit analysis
        </div>
      </div>

      {/* Detailed Candidate Comparison */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-bold mb-6">Detailed Candidate Comparison</h2>
        
        {/* Filter Tabs */}
        <div className="flex space-x-2 mb-6">
          {['All Metrics', 'Technical', 'Soft Skills', 'Experience'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as typeof activeTab)}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-colors ${
                activeTab === tab
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Comparison Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr>
                <th className="text-left py-4 px-6 text-gray-500 font-medium text-sm">Criteria</th>
                {mockCandidates.map((candidate) => (
                  <th key={candidate.id} className="text-center py-4 px-6">
                    <div className="flex flex-col items-center">
                      <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-medium mb-2">
                        {candidate.avatar}
                      </div>
                      <div className="text-gray-900 font-medium">{candidate.name}</div>
                      <div className="text-sm text-gray-500">Score: {candidate.score}%</div>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {getVisibleMetrics(activeTab).map((metric) => (
                <tr key={metric} className="border-t">
                  <td className="py-4 px-6 font-medium text-gray-900">{getMetricLabel(metric)}</td>
                  {mockCandidates.map((candidate) => (
                    <td key={candidate.id} className="py-4 px-6">
                      <div className="flex flex-col items-center">
                        <div className="w-full max-w-[200px] h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-orange-500 via-green-500 to-green-500"
                            style={{ width: `${candidate[metric]}%` }}
                          ></div>
                        </div>
                        <span className="mt-1 text-sm text-gray-600">{candidate[metric]}%</span>
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
              {activeTab === 'All Metrics' && (
                <tr className="border-t">
                  <td className="py-4 px-6 font-medium text-gray-900">Key Strengths</td>
                  {mockCandidates.map((candidate) => (
                    <td key={candidate.id} className="py-4 px-6">
                      <div className="flex flex-wrap justify-center gap-2">
                        {candidate.strengths.map((strength, index) => (
                          <span
                            key={index}
                            className={`px-3 py-1 text-xs font-medium rounded-full ${
                              strength === 'React Expert' || strength === 'Problem Solving'
                                ? 'bg-green-100 text-green-800'
                                : strength === 'Full Stack' || strength === 'Team Player'
                                ? 'bg-blue-100 text-blue-800'
                                : strength === 'Backend' || strength === 'Database'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {strength}
                          </span>
                        ))}
                      </div>
                    </td>
                  ))}
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Interview Rounds section */}
      <div className="mt-8">
        <h2 className="text-xl font-bold mb-6">Interview Rounds</h2>
        
        {/* Interview Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {(['technical', 'behavioral', 'final'] as InterviewType[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveInterviewTab(tab)}
                className={`border-b-2 py-4 px-1 text-sm font-medium transition-colors ${
                  activeInterviewTab === tab
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {getInterviewTabLabel(tab)}
              </button>
            ))}
          </nav>
        </div>

        {/* Interview Cards */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          {(mockCandidates.slice(0, 2) as DetailedCandidate[]).map((candidate) => (
            <div
              key={`${candidate.id}-${activeInterviewTab}`}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 relative overflow-hidden"
            >
              <div className={`absolute left-0 top-0 bottom-0 w-1 ${
                activeInterviewTab === 'technical' ? 'bg-blue-500' :
                activeInterviewTab === 'behavioral' ? 'bg-green-500' :
                'bg-purple-500'
              }`}></div>
              <div className="ml-2">
                <h3 className="text-lg font-semibold text-gray-900">
                  {candidate.name} - {getInterviewTabLabel(activeInterviewTab)}
                </h3>
                <div className="mt-1 text-sm text-gray-500">
                  Interviewer: {candidate.interviews[activeInterviewTab].interviewer} • {candidate.interviews[activeInterviewTab].duration} • {candidate.interviews[activeInterviewTab].date}
                </div>
                <p className="mt-4 text-gray-600">
                  {candidate.interviews[activeInterviewTab].feedback}
                </p>
                <div className="mt-4 flex items-center justify-between">
                  <div className="text-sm font-medium text-gray-900">
                    {activeInterviewTab === 'technical' ? 'Technical' :
                     activeInterviewTab === 'behavioral' ? 'Behavioral' :
                     'Final'} Score:
                  </div>
                  <div className={`font-semibold ${
                    activeInterviewTab === 'technical' ? 'text-blue-600' :
                    activeInterviewTab === 'behavioral' ? 'text-green-600' :
                    'text-purple-600'
                  }`}>
                    {candidate.interviews[activeInterviewTab].score}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 