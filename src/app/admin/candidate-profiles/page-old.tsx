"use client"

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Candidate {
  id: number;
  name: string;
  position: string;
  appliedDate: string;
  matchScore: number;
  status: string;
  department: string;
}

export default function CandidateProfiles() {
  const router = useRouter();
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('All');
  const [sortBy, setSortBy] = useState<string>('Newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [departmentDropdownOpen, setDepartmentDropdownOpen] = useState(false);
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);

  // Mock data
  const [candidates] = useState<Candidate[]>([
    {
      id: 1,
      name: "Emily Johnson",
      position: "Senior UX Designer",
      appliedDate: "May 15, 2025",
      matchScore: 92,
      status: "Shortlisted",
      department: "Design"
    },
    {
      id: 2,
      name: "Michael Chen",
      position: "Full Stack Developer",
      appliedDate: "May 12, 2025",
      matchScore: 88,
      status: "In Interview",
      department: "Engineering"
    },
    {
      id: 3,
      name: "Sarah Williams",
      position: "Marketing Manager",
      appliedDate: "May 19, 2025",
      matchScore: 85,
      status: "New",
      department: "Marketing"
    },
    {
      id: 4,
      name: "David Rodriguez",
      position: "Sales Executive",
      appliedDate: "May 8, 2025",
      matchScore: 62,
      status: "Rejected",
      department: "Sales"
    }
  ]);

  const departments = ["All", "Engineering", "Design", "Marketing", "Sales", "Product"];
  const statuses = ["All", "New", "Shortlisted", "In Interview", "Rejected"];
  const sortOptions = ["Newest", "Oldest", "Highest Match", "Lowest Match"];

  // Filter and sort candidates
  const filteredCandidates = candidates.filter(candidate => {
    const matchesStatus = selectedStatus === 'All' || candidate.status === selectedStatus;
    const matchesDepartment = selectedDepartment === 'All' || candidate.department === selectedDepartment;
    return matchesStatus && matchesDepartment;
  }).sort((a, b) => {
    switch (sortBy) {
      case 'Oldest':
        return new Date(a.appliedDate).getTime() - new Date(b.appliedDate).getTime();
      case 'Highest Match':
        return b.matchScore - a.matchScore;
      case 'Lowest Match':
        return a.matchScore - b.matchScore;
      default: // Newest
        return new Date(b.appliedDate).getTime() - new Date(a.appliedDate).getTime();
    }
  });

  // Pagination logic
  const candidatesPerPage = 10;
  const indexOfLastCandidate = currentPage * candidatesPerPage;
  const indexOfFirstCandidate = indexOfLastCandidate - candidatesPerPage;
  const currentCandidates = filteredCandidates.slice(indexOfFirstCandidate, indexOfLastCandidate);
  const totalPages = Math.ceil(filteredCandidates.length / candidatesPerPage);

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

  // View profile handler
  const handleViewProfile = (candidateId: number) => {
    // Navigate to candidate profile page
    router.push(`/admin/candidate-profiles/${candidateId}`);
  };

  // Schedule interview handler
  const handleSchedule = (candidate: Candidate) => {
    setSelectedCandidate(candidate);
    setShowScheduleModal(true);
  };

  // Page navigation
  const handlePageChange = (page: number) => {
    if (page > 0 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Candidate Profiles</h1>
        <button className="px-4 py-2 bg-[#4285F4] text-white rounded-md hover:bg-blue-600">
          + Add
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        {/* Status Filter */}
        <div className="relative w-[200px]">
          <button
            className="px-4 py-2 bg-white border border-gray-300 rounded-md flex items-center justify-between w-full"
            onClick={() => setStatusDropdownOpen(!statusDropdownOpen)}
          >
            <span className="text-gray-700">Status: {selectedStatus}</span>
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
            <span className="text-gray-700">Department: {selectedDepartment}</span>
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

        {/* Sort By */}
        <div className="relative w-[200px]">
          <button
            className="px-4 py-2 bg-white border border-gray-300 rounded-md flex items-center justify-between w-full"
            onClick={() => setSortDropdownOpen(!sortDropdownOpen)}
          >
            <span className="text-gray-700">Sort by: {sortBy}</span>
            <span>▼</span>
          </button>
          {sortDropdownOpen && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
              {sortOptions.map((option) => (
                <div
                  key={option}
                  className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                  onClick={() => {
                    setSortBy(option);
                    setSortDropdownOpen(false);
                  }}
                >
                  {option}
                </div>
              ))}
            </div>
          )}
        </div>

        <button className="px-4 py-2 bg-[#4285F4] text-white rounded-md hover:bg-blue-600">
          Filter
        </button>
      </div>

      {/* Candidates List */}
      <div className="bg-white rounded-lg shadow">
        {filteredCandidates.map((candidate) => (
          <div
            key={candidate.id}
            className="p-6 border-b border-gray-200 hover:bg-gray-50"
          >
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-semibold text-gray-800">
                    {candidate.name}
                  </h3>
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
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-sm text-gray-600">Match Score</div>
                  <div className="font-semibold text-gray-800">{candidate.matchScore}%</div>
                </div>
                <div className="flex gap-2">
                  <button 
                    className="px-4 py-2 bg-[#4285F4] text-white rounded-md hover:bg-blue-600"
                    onClick={() => handleViewProfile(candidate.id)}
                  >
                    View Profile
                  </button>
                  <button 
                    className="px-4 py-2 border border-[#4285F4] text-[#4285F4] rounded-md hover:bg-blue-50"
                    onClick={() => handleSchedule(candidate)}
                  >
                    Schedule
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      <div className="mt-6 flex justify-between items-center">
        <div className="text-sm text-gray-600">
          Showing {indexOfFirstCandidate + 1}-{Math.min(indexOfLastCandidate, filteredCandidates.length)} of {filteredCandidates.length} candidates
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            className="w-8 h-8 flex items-center justify-center bg-white text-gray-700 rounded hover:bg-gray-100 border border-gray-300"
            disabled={currentPage === 1}
          >
            ←
          </button>
          {Array.from({ length: Math.min(totalPages, 3) }, (_, i) => (
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
          {totalPages > 3 && (
            <span className="flex items-center justify-center px-2">...</span>
          )}
          {totalPages > 3 && (
            <button
              onClick={() => handlePageChange(totalPages)}
              className={`w-8 h-8 flex items-center justify-center rounded bg-white text-gray-700 hover:bg-gray-100 border border-gray-300`}
            >
              {totalPages}
            </button>
          )}
          <button 
            onClick={() => handlePageChange(currentPage + 1)}
            className="w-8 h-8 flex items-center justify-center bg-white text-gray-700 rounded hover:bg-gray-100 border border-gray-300"
            disabled={currentPage === totalPages}
          >
            →
          </button>
        </div>
      </div>

      {/* Schedule Interview Modal */}
      {showScheduleModal && selectedCandidate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Schedule Interview</h2>
            <p className="mb-4">Schedule an interview with <strong>{selectedCandidate.name}</strong> for the <strong>{selectedCandidate.position}</strong> position.</p>
            
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