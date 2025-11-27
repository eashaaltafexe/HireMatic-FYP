"use client"

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Job {
  _id: string;
  title: string;
  department: string;
  location: string;
  employmentType: string;
  experienceLevel: string;
  status: string;
  description: string;
  createdAt: string;
  skills: string[];
}

export default function HRDashboard() {
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
      try {
      const response = await fetch('/api/jobs');
      if (!response.ok) {
        throw new Error('Failed to fetch jobs');
      }
      const data = await response.json();
  
      // Log the fetched jobs data
      console.log('Fetched jobs from API:', data.jobs?.length || 0);
      if (data.jobs) {
        data.jobs.forEach((job: Job, index: number) => {
          console.log(`Job ${index + 1} - Title: ${job.title}`);
          console.log('Has description:', !!job.description);
          console.log('Description length:', job.description?.length || 0);
        });
      }
      
      setJobs(data.jobs || []);
    } catch (error) {
      console.error('Error fetching jobs:', error);
      setError('Failed to load job listings');
    } finally {
      setLoading(false);
  }
  };
  
  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-semibold text-gray-900">HR Dashboard</h1>
            <Link
              href="/hr/jobs/create"
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            >
              Create New Job
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading job listings...</p>
          </div>
        ) : error ? (
          <div className="text-center text-red-600">{error}</div>
        ) : jobs.length === 0 ? (
          <div className="text-center text-gray-600">
            <p>No job listings found.</p>
            <p className="mt-2">
              Click "Create New Job" to post your first job listing.
            </p>
              </div>
        ) : (
          <div className="grid gap-6">
            {jobs.map((job) => (
              <div
                key={job._id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">
                      {job.title}
                    </h2>
                    <p className="text-gray-600 mt-1">{job.department}</p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      job.status === 'published'
                        ? 'bg-green-100 text-green-800'
                        : job.status === 'draft'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Location</p>
                    <p className="font-medium">{job.location}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Employment Type</p>
                    <p className="font-medium">{job.employmentType}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Experience Level</p>
                    <p className="font-medium">{job.experienceLevel}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Posted</p>
                    <p className="font-medium">
                      {new Date(job.createdAt).toLocaleDateString()}
                    </p>
              </div>
              </div>

                <div className="mt-4">
                  <p className="text-sm text-gray-500">Description</p>
                  <p className="mt-1 text-gray-700">{job.description}</p>
                </div>

                {job.skills.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm text-gray-500 mb-2">Required Skills</p>
                    <div className="flex flex-wrap gap-2">
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

                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    onClick={() => router.push(`/hr/jobs/${job._id}/edit`)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Edit
                  </button>
                  {job.status === 'draft' && (
                <button 
                      onClick={() => router.push(`/hr/jobs/${job._id}/preview`)}
                      className="px-4 py-2 border border-blue-500 rounded-md text-blue-600 hover:bg-blue-50"
                >
                      Preview
                </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        </div>
    </div>
  );
} 