"use client"

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Candidate {
  _id: string;
  name: string;
  email: string;
  department: string;
  phone: string;
  createdAt: string;
  lastLogin?: string;
  stats: {
    totalApplications: number;
    pending: number;
    underReview: number;
    interviewScheduled: number;
    accepted: number;
    rejected: number;
  };
  latestApplication?: {
    _id: string;
    jobTitle: string;
    company: string;
    status: string;
    appliedDate: string;
  };
  resumeData?: {
    summary: string;
    experience: number;
    education: number;
    skills: {
      technical: number;
      soft: number;
      languages: number;
    };
  };
}

interface CandidatesResponse {
  success: boolean;
  data: {
    candidates: Candidate[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalCandidates: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
    };
    filters: {
      departments: string[];
      statuses: string[];
    };
    summary: {
      totalCandidates: number;
      activeApplicants: number;
      hired: number;
      averageApplications: number;
    };
  };
  error?: string;
}

export default function CandidateProfiles() {
  const router = useRouter();
  const [selectedStatus, setSelectedStatus] = useState<string>('All Status');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('All Departments');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [departmentDropdownOpen, setDepartmentDropdownOpen] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [candidatesData, setCandidatesData] = useState<CandidatesResponse['data'] | null>(null);

  // Real data from API
  const candidates = candidatesData?.candidates || [];
  const departments = candidatesData?.filters.departments || ['All Departments'];
  const statuses = candidatesData?.filters.statuses || ['All Status'];

  // Fetch candidates from API
  useEffect(() => {
    fetchCandidates();
  }, [currentPage, searchTerm, selectedDepartment, selectedStatus]);

  const fetchCandidates = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10'
      });
      
      if (searchTerm) params.append('search', searchTerm);
      if (selectedDepartment && selectedDepartment !== 'All Departments') {
        params.append('department', selectedDepartment);
      }
      if (selectedStatus && selectedStatus !== 'All Status') {
        params.append('status', selectedStatus);
      }

      const response = await fetch(`/api/admin/candidates?${params}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch candidates');
      }

      const result: CandidatesResponse = await response.json();
      
      if (result.success && result.data) {
        setCandidatesData(result.data);
        setError('');
      } else {
        throw new Error(result.error || 'Failed to fetch candidates');
      }
    } catch (err: any) {
      console.error('Error fetching candidates:', err);
      setError('Failed to load candidates');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (candidate: Candidate) => {
    if (candidate.stats.accepted > 0) return 'bg-green-100 text-green-800';
    if (candidate.stats.interviewScheduled > 0) return 'bg-blue-100 text-blue-800';
    if (candidate.stats.underReview > 0) return 'bg-yellow-100 text-yellow-800';
    if (candidate.stats.pending > 0) return 'bg-gray-100 text-gray-800';
    if (candidate.stats.rejected > 0) return 'bg-red-100 text-red-800';
    return 'bg-gray-100 text-gray-800';
  };

  const getStatusText = (candidate: Candidate) => {
    if (candidate.stats.accepted > 0) return 'Hired';
    if (candidate.stats.interviewScheduled > 0) return 'Interview Scheduled';
    if (candidate.stats.underReview > 0) return 'Under Review';
    if (candidate.stats.pending > 0) return 'Applied';
    if (candidate.stats.rejected > 0) return 'Rejected';
    return 'No Applications';
  };

  // View profile handler
  const handleViewProfile = (candidateId: string) => {
    router.push(`/admin/candidate-profiles/${candidateId}`);
  };

  // Schedule interview handler
  const handleSchedule = (candidate: Candidate) => {
    setSelectedCandidate(candidate);
    setShowScheduleModal(true);
  };

  // Page navigation
  const handlePageChange = (page: number) => {
    if (page > 0 && page <= (candidatesData?.pagination.totalPages || 1)) {
      setCurrentPage(page);
    }
  };

  if (loading) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
          <button 
            onClick={fetchCandidates}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Candidate Profiles</h1>
          {candidatesData?.summary && (
            <p className="text-gray-600 mt-1">
              {candidatesData.summary.totalCandidates} total candidates • {candidatesData.summary.activeApplicants} active applicants • {candidatesData.summary.hired} hired
            </p>
          )}
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        {/* Search */}
        <div className="flex-1 min-w-[300px]">
          <input
            type="text"
            placeholder="Search candidates by name or email..."
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Status Filter */}
        <div className="relative w-[200px]">
          <button
            className="px-4 py-2 bg-white border border-gray-300 rounded-md flex items-center justify-between w-full"
            onClick={() => setStatusDropdownOpen(!statusDropdownOpen)}
          >
            <span className="text-gray-700">{selectedStatus}</span>
            <span>▼</span>
          </button>
          {statusDropdownOpen && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
              {statuses.map((status) => (
                <div
                  key={status}
                  className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                  onClick={() => {
                    setSelectedStatus(status);
                    setStatusDropdownOpen(false);
                  }}
                >
                  {status}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Department Filter */}
        <div className="relative w-[200px]">
          <button
            className="px-4 py-2 bg-white border border-gray-300 rounded-md flex items-center justify-between w-full"
            onClick={() => setDepartmentDropdownOpen(!departmentDropdownOpen)}
          >
            <span className="text-gray-700">{selectedDepartment}</span>
            <span>▼</span>
          </button>
          {departmentDropdownOpen && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
              {departments.map((dept) => (
                <div
                  key={dept}
                  className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                  onClick={() => {
                    setSelectedDepartment(dept);
                    setDepartmentDropdownOpen(false);
                  }}
                >
                  {dept}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Candidates List */}
      <div className="bg-white rounded-lg shadow">
        {candidates.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No candidates found matching your criteria.
          </div>
        ) : (
          candidates.map((candidate) => (
            <div
              key={candidate._id}
              className="p-6 border-b border-gray-200 hover:bg-gray-50"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-800">
                      {candidate.name}
                    </h3>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(candidate)}`}
                    >
                      {getStatusText(candidate)}
                    </span>
                  </div>
                  <div className="text-gray-600 space-y-1">
                    <p>{candidate.email} • {candidate.phone || 'No phone'}</p>
                    {candidate.latestApplication ? (
                      <p>
                        Latest: {candidate.latestApplication.jobTitle} at {candidate.latestApplication.company} • 
                        Applied {new Date(candidate.latestApplication.appliedDate).toLocaleDateString()}
                      </p>
                    ) : (
                      <p>No applications yet</p>
                    )}
                    <div className="flex gap-4 text-sm">
                      <span>Applications: {candidate.stats.totalApplications}</span>
                      {candidate.resumeData && (
                        <>
                          <span>Experience: {candidate.resumeData.experience} roles</span>
                          <span>Skills: {candidate.resumeData.skills.technical + candidate.resumeData.skills.soft}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 ml-4">
                  <button 
                    className="px-4 py-2 bg-[#4285F4] text-white rounded-md hover:bg-blue-600"
                    onClick={() => handleViewProfile(candidate._id)}
                  >
                    View Profile
                  </button>
                  {candidate.stats.totalApplications > 0 && (
                    <button 
                      className="px-4 py-2 border border-[#4285F4] text-[#4285F4] rounded-md hover:bg-blue-50"
                      onClick={() => handleSchedule(candidate)}
                    >
                      Schedule
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {candidatesData?.pagination && candidatesData.pagination.totalPages > 1 && (
        <div className="mt-6 flex justify-between items-center">
          <div className="text-sm text-gray-600">
            Showing {((candidatesData.pagination.currentPage - 1) * 10) + 1}-{Math.min(candidatesData.pagination.currentPage * 10, candidatesData.pagination.totalCandidates)} of {candidatesData.pagination.totalCandidates} candidates
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              className="w-8 h-8 flex items-center justify-center bg-white text-gray-700 rounded hover:bg-gray-100 border border-gray-300"
              disabled={!candidatesData.pagination.hasPrevPage}
            >
              ←
            </button>
            {Array.from({ length: Math.min(candidatesData.pagination.totalPages, 5) }, (_, i) => (
              <button
                key={i + 1}
                onClick={() => handlePageChange(i + 1)}
                className={`w-8 h-8 flex items-center justify-center rounded ${
                  currentPage === i + 1
                    ? 'bg-[#4285F4] text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                }`}
              >
                {i + 1}
              </button>
            ))}
            <button 
              onClick={() => handlePageChange(currentPage + 1)}
              className="w-8 h-8 flex items-center justify-center bg-white text-gray-700 rounded hover:bg-gray-100 border border-gray-300"
              disabled={!candidatesData.pagination.hasNextPage}
            >
              →
            </button>
          </div>
        </div>
      )}

      {/* Schedule Interview Modal */}
      {showScheduleModal && selectedCandidate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Schedule Interview</h2>
            <p className="mb-4">
              Schedule an interview with <strong>{selectedCandidate.name}</strong>
              {selectedCandidate.latestApplication && (
                <> for the <strong>{selectedCandidate.latestApplication.jobTitle}</strong> position</>
              )}.
            </p>
            
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
                <option>AI Interview</option>
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
                  setShowScheduleModal(false);
                  alert(`Interview scheduled with ${selectedCandidate.name}`);
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
