"use client"

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

interface Job {
  _id: string;
  title: string;
  department: string;
  employmentType: string;
  experienceLevel: string;
  location: string;
  salaryRange: string;
  applicationDeadline: string;
  numberOfPositions: number;
  hiringManager: string;
  contactEmail: string;
  minimumScore: string;
  autoScreening: string;
  description: string;
  skills: string[];
  status: string;
}

export default function EditJobListing() {
  const router = useRouter();
  const params = useParams();
  const jobId = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [skills, setSkills] = useState<string[]>([]);
  const skillInputRef = useRef<HTMLInputElement>(null);
  const [generatedDescription, setGeneratedDescription] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Form state
  const [jobData, setJobData] = useState<Job>({
    _id: '',
    title: '',
    department: '',
    employmentType: '',
    experienceLevel: '',
    location: '',
    salaryRange: '',
    applicationDeadline: '',
    numberOfPositions: 1,
    hiringManager: '',
    contactEmail: '',
    minimumScore: '70% - Good Match',
    autoScreening: 'Auto-screen based on criteria',
    description: '',
    skills: [],
    status: 'draft'
  });

  // Evaluation criteria weights
  const [evaluationCriteria, setEvaluationCriteria] = useState({
    technicalSkills: 30,
    experience: 25,
    education: 15,
    communicationSkills: 20,
    culturalFit: 10,
    custom: ''
  });
  
  // Dropdown options
  const departmentOptions = ['Engineering', 'Marketing', 'Sales', 'Design', 'Computer Science', 'Finance', 'HR', 'Operations'];
  const employmentTypeOptions = ['Full-time', 'Part-time', 'Contract', 'Internship', 'Temporary'];
  const experienceLevelOptions = ['Entry Level', 'Junior', 'Mid-Level', 'Senior', 'Lead', 'Executive'];
  const minimumScoreOptions = ['50% - Basic Match', '60% - Fair Match', '70% - Good Match', '80% - Strong Match', '90% - Excellent Match'];
  const autoScreeningOptions = ['Manual screening only', 'Auto-screen based on criteria', 'Auto-screen with manual review'];

  // Load job data
  useEffect(() => {
    if (jobId) {
      fetchJobData();
    }
  }, [jobId]);

  const fetchJobData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/jobs/${jobId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch job data');
      }
      const job = await response.json();
      
      setJobData(job);
      setSkills(job.skills || []);
      setGeneratedDescription(job.description || '');
    } catch (error) {
      console.error('Error fetching job data:', error);
      alert('Failed to load job data');
    } finally {
      setLoading(false);
    }
  };

  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setJobData(prev => ({ ...prev, [name]: value }));
  };

  // Handle skill addition
  const handleAddSkill = () => {
    const skill = skillInputRef.current?.value.trim();
    if (skill && !skills.includes(skill)) {
      const newSkills = [...skills, skill];
      setSkills(newSkills);
      setJobData(prev => ({ ...prev, skills: newSkills }));
      if (skillInputRef.current) {
        skillInputRef.current.value = '';
      }
    }
  };

  // Handle skill removal
  const handleRemoveSkill = (skillToRemove: string) => {
    const newSkills = skills.filter(skill => skill !== skillToRemove);
    setSkills(newSkills);
    setJobData(prev => ({ ...prev, skills: newSkills }));
  };

  // Handle skill input key press
  const handleSkillKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddSkill();
    }
  };

  // Update job listing
  const updateJobListing = async () => {
    try {
      setSaving(true);
      
      const response = await fetch(`/api/jobs/${jobId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(jobData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update job listing');
      }

      alert('Job listing updated successfully!');
      router.push('/hr/dashboard');
    } catch (error: any) {
      console.error('Error updating job:', error);
      alert(error.message || 'Failed to update job listing');
    } finally {
      setSaving(false);
    }
  };

  // Generate job description
  const generateJobDescription = async () => {
    if (!jobData.title || !jobData.department || !jobData.experienceLevel) {
      alert('Please fill in the job title, department, and experience level first.');
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch('/api/generate-job-description', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: jobData.title,
          department: jobData.department,
          experienceLevel: jobData.experienceLevel,
          skills: skills
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate job description');
      }

      const data = await response.json();
      setGeneratedDescription(data.jobDescription);
      
      // Update the form data with the generated description
      setJobData(prev => ({
        ...prev,
        description: data.jobDescription
      }));
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to generate job description. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading job data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Edit Job Listing</h1>
              <p className="mt-1 text-sm text-gray-600">Update job details and requirements</p>
            </div>
            <Link
              href="/hr/dashboard"
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <form onSubmit={(e) => { e.preventDefault(); updateJobListing(); }} className="space-y-8">
            
            {/* Basic Information */}
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-6">Basic Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Job Title *</label>
                  <input
                    type="text"
                    name="title"
                    value={jobData.title}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Department *</label>
                  <select
                    name="department"
                    value={jobData.department}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select Department</option>
                    {departmentOptions.map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Employment Type *</label>
                  <select
                    name="employmentType"
                    value={jobData.employmentType}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select Type</option>
                    {employmentTypeOptions.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Experience Level *</label>
                  <select
                    name="experienceLevel"
                    value={jobData.experienceLevel}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select Level</option>
                    {experienceLevelOptions.map(level => (
                      <option key={level} value={level}>{level}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Location *</label>
                  <input
                    type="text"
                    name="location"
                    value={jobData.location}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Salary Range</label>
                  <input
                    type="text"
                    name="salaryRange"
                    value={jobData.salaryRange}
                    onChange={handleChange}
                    placeholder="e.g., $50,000 - $70,000"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Job Description */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-medium text-gray-900">Job Description</h2>
                <button
                  type="button"
                  onClick={generateJobDescription}
                  disabled={isGenerating}
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isGenerating ? 'Generating...' : 'Generate with AI'}
                </button>
              </div>
              <textarea
                name="description"
                value={jobData.description}
                onChange={handleChange}
                rows={8}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Describe the role, responsibilities, and requirements..."
              />
            </div>

            {/* Required Skills */}
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">Required Skills</h2>
              <div className="flex gap-2 mb-4">
                <input
                  ref={skillInputRef}
                  type="text"
                  placeholder="Add a skill"
                  onKeyPress={handleSkillKeyPress}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={handleAddSkill}
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {skills.map((skill, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                  >
                    {skill}
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(skill)}
                      className="ml-2 text-blue-600 hover:text-blue-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Additional Details */}
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-6">Additional Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Application Deadline</label>
                  <input
                    type="date"
                    name="applicationDeadline"
                    value={jobData.applicationDeadline}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Number of Positions</label>
                  <input
                    type="number"
                    name="numberOfPositions"
                    value={jobData.numberOfPositions}
                    onChange={handleChange}
                    min="1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Hiring Manager</label>
                  <input
                    type="text"
                    name="hiringManager"
                    value={jobData.hiringManager}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Contact Email</label>
                  <input
                    type="email"
                    name="contactEmail"
                    value={jobData.contactEmail}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Status */}
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">Job Status</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select
                    name="status"
                    value={jobData.status}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
              <Link
                href="/hr/dashboard"
                className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Updating...' : 'Update Job Listing'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
