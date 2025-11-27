"use client"

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Job {
  _id: string;
  title: string;
  department: string;
  location: string;
  employmentType: string;
  description: string;
  salaryRange: string;
  skills: string[];
  createdAt: string;
  status: string;
  experienceLevel?: string; // Optional since it might not exist in all job records
}

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('All Departments');
  const [typeFilter, setTypeFilter] = useState('All Types');
  const [locationFilter, setLocationFilter] = useState('All Locations');
  const [experienceFilter, setExperienceFilter] = useState('All Experience');
  const [datePostedFilter, setDatePostedFilter] = useState('All Time');
  const [remoteFilter, setRemoteFilter] = useState('All');
  const [easyApplyFilter, setEasyApplyFilter] = useState(false);
  const [showAllFilters, setShowAllFilters] = useState(false);
  const router = useRouter();

  // Fetch jobs on component mount and when filters change
  useEffect(() => {
    fetchJobs();
  }, [searchTerm, departmentFilter, typeFilter, locationFilter, experienceFilter, datePostedFilter, remoteFilter, easyApplyFilter]);

  const fetchJobs = async () => {
    try {
      // Build query parameters
      const params = new URLSearchParams();
      params.append('status', 'published');
      if (searchTerm) params.append('search', searchTerm);
      if (departmentFilter !== 'All Departments') params.append('department', departmentFilter);
      if (typeFilter !== 'All Types') params.append('employmentType', typeFilter);
      if (locationFilter !== 'All Locations') params.append('location', locationFilter);
      if (experienceFilter !== 'All Experience') params.append('experienceLevel', experienceFilter);
      if (remoteFilter !== 'All') params.append('remote', remoteFilter);
      if (easyApplyFilter) params.append('easyApply', 'true');

      const response = await fetch(`/api/jobs?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch jobs');
      }
      const data = await response.json();
      setJobs(data.jobs || []);
    } catch (error) {
      console.error('Error fetching jobs:', error);
      setError('Failed to load job listings');
    } finally {
      setLoading(false);
    }
  };

  // Get unique filter options from jobs
  const departments = ['All Departments', ...new Set(['CS', 'Engineering', 'Marketing', 'Sales', 'HR', 'Finance', 'Operations', 'IT', 'Design', ...jobs.map(job => job.department)])];
  const employmentTypes = ['All Types', 'Full-time', 'Part-time', 'Contract', 'Internship', 'Temporary'];
  const locations = ['All Locations', ...new Set(['Karachi', 'Lahore', 'Islamabad', 'Rawalpindi', 'Faisalabad', 'Multan', 'Peshawar', 'Quetta', 'Remote', 'Hybrid', ...jobs.map(job => job.location)])];
  const experienceLevels = ['All Experience', 'Entry Level', 'Mid Level', 'Senior Level', 'Executive'];
  const datePostedOptions = ['All Time', 'Last 24 hours', 'Last 3 days', 'Last week', 'Last month'];
  const remoteOptions = ['All', 'Remote', 'Hybrid', 'On-site'];
  
  // Filter jobs based on search and filters
  const filteredJobs = jobs.filter(job => {
    const matchesSearch = 
      job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.department.toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesDepartment = departmentFilter === 'All Departments' || job.department === departmentFilter;
    const matchesType = typeFilter === 'All Types' || job.employmentType === typeFilter;
    const matchesLocation = locationFilter === 'All Locations' || job.location === locationFilter;
    const matchesExperience = experienceFilter === 'All Experience' || job.experienceLevel === experienceFilter;
    const matchesRemote = remoteFilter === 'All' || 
      (remoteFilter === 'Remote' && job.location.toLowerCase().includes('remote')) ||
      (remoteFilter === 'Hybrid' && job.location.toLowerCase().includes('hybrid')) ||
      (remoteFilter === 'On-site' && !job.location.toLowerCase().includes('remote') && !job.location.toLowerCase().includes('hybrid'));
    
    return matchesSearch && matchesDepartment && matchesType && matchesLocation && matchesExperience && matchesRemote;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Career Opportunities</h1>
        <p className="mt-2 text-lg text-gray-600">
          Find your next role and join our team
        </p>
      </div>

      {/* Enhanced Search and Filters */}
      <div className="mb-8 space-y-6">
        {/* Main Search Bar */}
          <div className="relative">
            <input
              type="text"
            placeholder="Search jobs, companies, or keywords..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-6 py-4 text-lg border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm"
            style={{ color: '#1f2937' }}
            />
          <span className="absolute right-4 top-4 text-gray-400">
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            </span>
          </div>
          
        {/* Filter Buttons Row */}
        <div className="flex flex-wrap gap-3">
          {/* Department Filter */}
          <div className="relative">
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
              className="px-4 py-2 bg-white border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm min-w-[140px] text-gray-900 font-medium"
              style={{ color: '#1f2937' }}
          >
            {departments.map(dept => (
                <option key={dept} value={dept} style={{ color: '#1f2937', backgroundColor: 'white' }}>{dept}</option>
            ))}
          </select>
            <span className="absolute right-2 top-2 text-gray-400 pointer-events-none">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </span>
          </div>

          {/* Employment Type Filter */}
          <div className="relative">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
              className="px-4 py-2 bg-white border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm min-w-[140px] text-gray-900 font-medium"
              style={{ color: '#1f2937' }}
          >
            {employmentTypes.map(type => (
                <option key={type} value={type} style={{ color: '#1f2937', backgroundColor: 'white' }}>{type}</option>
              ))}
            </select>
            <span className="absolute right-2 top-2 text-gray-400 pointer-events-none">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </span>
          </div>

          {/* Location Filter */}
          <div className="relative">
            <select
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="px-4 py-2 bg-white border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm min-w-[140px] text-gray-900 font-medium"
              style={{ color: '#1f2937' }}
            >
              {locations.map(location => (
                <option key={location} value={location} style={{ color: '#1f2937', backgroundColor: 'white' }}>{location}</option>
              ))}
            </select>
            <span className="absolute right-2 top-2 text-gray-400 pointer-events-none">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </span>
          </div>

          {/* Experience Level Filter */}
          <div className="relative">
            <select
              value={experienceFilter}
              onChange={(e) => setExperienceFilter(e.target.value)}
              className="px-4 py-2 bg-white border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm min-w-[140px] text-gray-900 font-medium"
              style={{ color: '#1f2937' }}
            >
              {experienceLevels.map(level => (
                <option key={level} value={level} style={{ color: '#1f2937', backgroundColor: 'white' }}>{level}</option>
              ))}
            </select>
            <span className="absolute right-2 top-2 text-gray-400 pointer-events-none">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </span>
          </div>

          {/* Remote Filter */}
          <div className="relative">
            <select
              value={remoteFilter}
              onChange={(e) => setRemoteFilter(e.target.value)}
              className="px-4 py-2 bg-white border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm min-w-[120px] text-gray-900 font-medium"
              style={{ color: '#1f2937' }}
            >
              {remoteOptions.map(option => (
                <option key={option} value={option} style={{ color: '#1f2937', backgroundColor: 'white' }}>{option}</option>
            ))}
          </select>
            <span className="absolute right-2 top-2 text-gray-400 pointer-events-none">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </span>
          </div>

          {/* Easy Apply Toggle */}
          <button
            onClick={() => setEasyApplyFilter(!easyApplyFilter)}
            className={`px-4 py-2 rounded-lg border transition-colors ${
              easyApplyFilter 
                ? 'bg-blue-500 text-white border-blue-500' 
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            Easy Apply
          </button>

          {/* All Filters Button */}
          <button
            onClick={() => setShowAllFilters(!showAllFilters)}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            All Filters
            <svg className="inline-block ml-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>

        {/* Additional Filters (when "All Filters" is clicked) */}
        {showAllFilters && (
          <div className="bg-gray-50 p-4 rounded-lg space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Additional Filters</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Date Posted Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date Posted</label>
                <select
                  value={datePostedFilter}
                  onChange={(e) => setDatePostedFilter(e.target.value)}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 font-medium"
                  style={{ color: '#1f2937' }}
                >
                  {datePostedOptions.map(option => (
                    <option key={option} value={option} style={{ color: '#1f2937', backgroundColor: 'white' }}>{option}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Active Filters Display */}
        {(departmentFilter !== 'All Departments' || typeFilter !== 'All Types' || locationFilter !== 'All Locations' || experienceFilter !== 'All Experience' || remoteFilter !== 'All' || easyApplyFilter) && (
          <div className="flex flex-wrap gap-2">
            <span className="text-sm text-gray-600">Active filters:</span>
            {departmentFilter !== 'All Departments' && (
              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                {departmentFilter} ×
              </span>
            )}
            {typeFilter !== 'All Types' && (
              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                {typeFilter} ×
              </span>
            )}
            {locationFilter !== 'All Locations' && (
              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                {locationFilter} ×
              </span>
            )}
            {experienceFilter !== 'All Experience' && (
              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                {experienceFilter} ×
              </span>
            )}
            {remoteFilter !== 'All' && (
              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                {remoteFilter} ×
              </span>
            )}
            {easyApplyFilter && (
              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                Easy Apply ×
              </span>
            )}
          </div>
        )}
      </div>

      {/* Results Counter */}
      {!loading && !error && (
        <div className="mb-6">
          <p className="text-gray-600">
            Showing <span className="font-semibold text-gray-900">{filteredJobs.length}</span> of <span className="font-semibold text-gray-900">{jobs.length}</span> jobs
          </p>
        </div>
      )}

      {/* Job Listings */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading job opportunities...</p>
        </div>
      ) : error ? (
        <div className="text-center py-12 text-red-600">{error}</div>
      ) : filteredJobs.length === 0 ? (
        <div className="text-center py-12">
          <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No jobs found</h3>
          <p className="text-gray-600 mb-4">Try adjusting your search criteria or filters.</p>
          <button
            onClick={() => {
              setSearchTerm('');
              setDepartmentFilter('All Departments');
              setTypeFilter('All Types');
              setLocationFilter('All Locations');
              setExperienceFilter('All Experience');
              setRemoteFilter('All');
              setEasyApplyFilter(false);
            }}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
          >
            Clear all filters
          </button>
        </div>
      ) : (
      <div className="space-y-6">
        {filteredJobs.map((job) => (
            <div
              key={job._id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
            <div className="flex justify-between items-start">
              <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    {job.title}
                  </h2>
                  <p className="text-gray-600 mt-1">{job.department}</p>
              </div>
              <Link
                  href={`/candidate/jobs/${job._id}/apply`}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
              >
                Apply Now
              </Link>
            </div>
            
              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center text-gray-600">
                  <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {job.location}
              </div>
                <div className="flex items-center text-gray-600">
                  <svg className="h-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                  {job.employmentType}
              </div>
                {job.salaryRange && (
                  <div className="flex items-center text-gray-600">
                    <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                    {job.salaryRange}
              </div>
                )}
            </div>
            
            <div className="mt-4">
                <h3 className="text-lg font-medium text-gray-900">Description</h3>
              <p className="mt-2 text-gray-600">{job.description}</p>
            </div>
            
              {job.skills.length > 0 && (
            <div className="mt-4">
                  <h3 className="text-lg font-medium text-gray-900">Required Skills</h3>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {job.skills.map((skill, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                      >
                        {skill}
                      </span>
                ))}
                  </div>
                </div>
              )}

              <div className="mt-4 text-sm text-gray-500">
                Posted {new Date(job.createdAt).toLocaleDateString()}
            </div>
          </div>
        ))}
      </div>
      )}
    </div>
  );
} 