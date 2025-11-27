"use client"

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Candidate {
  id: number;
  name: string;
  position: string;
  appliedDate: string;
  matchScore: number;
  status: string;
  department: string;
  email?: string;
  phone?: string;
  experience?: string;
  education?: string;
  skills?: string[];
  resume?: string;
}

// Mock database of candidates
const candidatesData: Candidate[] = [
  {
    id: 1,
    name: "Emily Johnson",
    position: "Senior UX Designer",
    appliedDate: "May 15, 2025",
    matchScore: 92,
    status: "Shortlisted",
    department: "Design",
    email: "emily.johnson@example.com",
    phone: "+1 (555) 123-4567",
    experience: "7 years",
    education: "Master in Design, University of California",
    skills: ["UI/UX Design", "Figma", "Adobe XD", "User Research", "Prototyping"],
    resume: "/resumes/emily-johnson.pdf"
  },
  {
    id: 2,
    name: "Michael Chen",
    position: "Full Stack Developer",
    appliedDate: "May 12, 2025",
    matchScore: 88,
    status: "In Interview",
    department: "Engineering",
    email: "michael.chen@example.com",
    phone: "+1 (555) 234-5678",
    experience: "5 years",
    education: "BS in Computer Science, MIT",
    skills: ["JavaScript", "React", "Node.js", "MongoDB", "AWS"],
    resume: "/resumes/michael-chen.pdf"
  },
  {
    id: 3,
    name: "Sarah Williams",
    position: "Marketing Manager",
    appliedDate: "May 19, 2025",
    matchScore: 85,
    status: "New",
    department: "Marketing",
    email: "sarah.williams@example.com",
    phone: "+1 (555) 345-6789",
    experience: "6 years",
    education: "MBA, Stanford University",
    skills: ["Digital Marketing", "Campaign Management", "SEO/SEM", "Content Strategy", "Analytics"],
    resume: "/resumes/sarah-williams.pdf"
  },
  {
    id: 4,
    name: "David Rodriguez",
    position: "Sales Executive",
    appliedDate: "May 8, 2025",
    matchScore: 62,
    status: "Rejected",
    department: "Sales",
    email: "david.rodriguez@example.com",
    phone: "+1 (555) 456-7890",
    experience: "3 years",
    education: "BS in Business Administration, NYU",
    skills: ["B2B Sales", "Account Management", "CRM", "Negotiation", "Presentations"],
    resume: "/resumes/david-rodriguez.pdf"
  }
];

export default function CandidateProfile({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [loading, setLoading] = useState(true);
  const [showScheduleModal, setShowScheduleModal] = useState(false);

  useEffect(() => {
    // Simulate loading data from an API
    const candidateId = parseInt(params.id);
    const foundCandidate = candidatesData.find(c => c.id === candidateId);
    
    // Simulate network delay
    setTimeout(() => {
      setCandidate(foundCandidate || null);
      setLoading(false);
    }, 500);
  }, [params.id]);

  const handleSchedule = () => {
    setShowScheduleModal(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'New':
        return 'bg-blue-100 text-blue-800';
      case 'Shortlisted':
        return 'bg-green-100 text-green-800';
      case 'In Interview':
        return 'bg-yellow-100 text-yellow-800';
      case 'Rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleBack = () => {
    router.back();
  };

  if (loading) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="mt-4 text-gray-700">Loading candidate profile...</p>
        </div>
      </div>
    );
  }

  if (!candidate) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Candidate Not Found</h2>
          <p className="text-gray-600 mb-8">The candidate you're looking for doesn't exist or has been removed.</p>
          <button 
            onClick={handleBack}
            className="px-6 py-2 bg-[#4285F4] text-white rounded-md hover:bg-blue-600"
          >
            Back to Candidates
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header with back button */}
      <div className="mb-6">
        <button 
          onClick={handleBack}
          className="flex items-center text-gray-600 hover:text-gray-800"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Candidates
        </button>
      </div>

      {/* Candidate Header */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-gray-800">
                {candidate.name}
              </h1>
              <span
                className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                  candidate.status
                )}`}
              >
                {candidate.status}
              </span>
            </div>
            <p className="text-gray-600">
              {candidate.position} • Applied on {candidate.appliedDate}
            </p>
          </div>
          <div className="mt-4 md:mt-0 flex gap-4 items-center">
            <div className="text-center">
              <div className="text-sm text-gray-600">Match Score</div>
              <div className="font-semibold text-2xl text-gray-800">{candidate.matchScore}%</div>
            </div>
            <button 
              onClick={handleSchedule}
              className="px-4 py-2 bg-[#4285F4] text-white rounded-md hover:bg-blue-600"
            >
              Schedule Interview
            </button>
          </div>
        </div>
      </div>

      {/* Candidate Details */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Contact Information */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Contact Information</h2>
          <div className="space-y-3">
            <div>
              <div className="text-sm text-gray-600">Email</div>
              <div className="font-medium">{candidate.email}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Phone</div>
              <div className="font-medium">{candidate.phone}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Department</div>
              <div className="font-medium">{candidate.department}</div>
            </div>
          </div>
        </div>

        {/* Professional Information */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Professional Summary</h2>
          <div className="space-y-3">
            <div>
              <div className="text-sm text-gray-600">Experience</div>
              <div className="font-medium">{candidate.experience}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Education</div>
              <div className="font-medium">{candidate.education}</div>
            </div>
          </div>
        </div>

        {/* Skills */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Skills</h2>
          <div className="flex flex-wrap gap-2">
            {candidate.skills?.map((skill, index) => (
              <span key={index} className="px-3 py-1 bg-gray-100 rounded-full text-gray-700 text-sm">
                {skill}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Application Details */}
      <div className="bg-white rounded-lg shadow p-6 mt-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Application Timeline</h2>
        <div className="space-y-6">
          <div className="flex">
            <div className="flex flex-col items-center mr-4">
              <div className="w-4 h-4 bg-blue-600 rounded-full"></div>
              <div className="h-full w-0.5 bg-gray-200"></div>
            </div>
            <div>
              <div className="font-medium">Application Received</div>
              <div className="text-sm text-gray-600">{candidate.appliedDate}</div>
              <div className="mt-1 text-gray-600">
                {candidate.name} applied for the {candidate.position} position.
              </div>
            </div>
          </div>
          
          <div className="flex">
            <div className="flex flex-col items-center mr-4">
              <div className="w-4 h-4 bg-blue-600 rounded-full"></div>
              <div className="h-full w-0.5 bg-gray-200"></div>
            </div>
            <div>
              <div className="font-medium">Resume Screened</div>
              <div className="text-sm text-gray-600">
                {new Date(new Date(candidate.appliedDate).getTime() + 2 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </div>
              <div className="mt-1 text-gray-600">
                Resume evaluated by hiring team. Match score: {candidate.matchScore}%.
              </div>
            </div>
          </div>
          
          {candidate.status !== 'New' && (
            <div className="flex">
              <div className="flex flex-col items-center mr-4">
                <div className={`w-4 h-4 ${candidate.status === 'Rejected' ? 'bg-red-600' : 'bg-green-600'} rounded-full`}></div>
                {candidate.status !== 'Rejected' && <div className="h-full w-0.5 bg-gray-200"></div>}
              </div>
              <div>
                <div className="font-medium">
                  {candidate.status === 'Shortlisted' ? 'Shortlisted for Interview' : 
                    candidate.status === 'In Interview' ? 'Interview Scheduled' : 
                    'Application Rejected'}
                </div>
                <div className="text-sm text-gray-600">
                  {new Date(new Date(candidate.appliedDate).getTime() + 5 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </div>
                <div className="mt-1 text-gray-600">
                  {candidate.status === 'Rejected' ? 
                    'Application was rejected due to insufficient qualifications match.' : 
                    candidate.status === 'Shortlisted' ? 
                    'Candidate shortlisted for interview based on resume evaluation.' :
                    'First interview scheduled with the hiring manager.'}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Schedule Interview Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Schedule Interview</h2>
            <p className="mb-4">Schedule an interview with <strong>{candidate.name}</strong> for the <strong>{candidate.position}</strong> position.</p>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Interview Date
              </label>
              <input 
                type="date" 
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Interview Time
              </label>
              <input 
                type="time" 
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Interview Type
              </label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option>Video Call</option>
                <option>In-person</option>
                <option>Phone Call</option>
              </select>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowScheduleModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  // Handle scheduling logic here
                  setShowScheduleModal(false);
                  alert(`Interview scheduled with ${candidate.name}`);
                }}
                className="px-4 py-2 bg-[#4285F4] text-white rounded-md hover:bg-blue-600 transition"
              >
                Schedule Interview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 