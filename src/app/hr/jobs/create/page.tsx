"use client"

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function CreateJobListing() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [skills, setSkills] = useState<string[]>([]);
  const skillInputRef = useRef<HTMLInputElement>(null);
  const [generatedDescription, setGeneratedDescription] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Form state
  const [jobData, setJobData] = useState({
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
    description: ''
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

  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setJobData(prev => ({ ...prev, [name]: value }));
  };

  // Handle skill addition
  const handleAddSkill = () => {
    if (skillInputRef.current && skillInputRef.current.value) {
      const newSkill = skillInputRef.current.value.trim();
      if (newSkill && !skills.includes(newSkill)) {
        setSkills([...skills, newSkill]);
        skillInputRef.current.value = '';
      }
    }
  };

  // Handle skill input keypress
  const handleSkillKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddSkill();
    }
  };

  // Handle slider change for evaluation criteria
  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEvaluationCriteria(prev => ({ ...prev, [name]: parseInt(value) }));
  };

  // Handle skill removal
  const removeSkill = (skillToRemove: string) => {
    setSkills(skills.filter(skill => skill !== skillToRemove));
  };

  // Save job listing
  const saveJobListing = async (status: 'draft' | 'published') => {
    setLoading(true);
    
    try {
    // Prepare data for submission
    const jobListing = {
      ...jobData,
      status,
      skills,
      evaluationCriteria,
      createdAt: new Date().toISOString()
    };
    
      // Submit to the API
      const response = await fetch('/api/jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(jobListing),
      });

      if (!response.ok) {
        throw new Error('Failed to save job listing');
      }

      // Show success message
      alert(status === 'published' ? 'Job listing published successfully!' : 'Job listing saved as draft!');
      
      // Redirect back to jobs dashboard
      router.push('/hr/dashboard');
    } catch (error) {
      console.error('Error saving job:', error);
      alert('Failed to save job listing. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Generate Preview
  const handlePreview = () => {
    // In a real application, you might save the draft and redirect to a preview page
    console.log('Generating preview for:', jobData);
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

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-xl font-semibold text-gray-800">Create Job Listing</h1>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="bg-white rounded-lg shadow overflow-hidden mb-8">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-700">Job Details</h2>
          </div>

          {/* Basic Information */}
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-md font-medium text-blue-600 pb-2 mb-4 border-b">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Job Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  value={jobData.title}
                  onChange={handleChange}
                  placeholder="e.g. Senior Software Engineer"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Department <span className="text-red-500">*</span>
                </label>
                <select
                  name="department"
                  value={jobData.department}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select Department</option>
                  {departmentOptions.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Employment Type <span className="text-red-500">*</span>
                </label>
                <select
                  name="employmentType"
                  value={jobData.employmentType}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select Type</option>
                  {employmentTypeOptions.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Experience Level <span className="text-red-500">*</span>
                </label>
                <select
                  name="experienceLevel"
                  value={jobData.experienceLevel}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select Level</option>
                  {experienceLevelOptions.map(level => (
                    <option key={level} value={level}>{level}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="location"
                  value={jobData.location}
                  onChange={handleChange}
                  placeholder="e.g. New York, NY or Remote"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Salary Range
                </label>
                <input
                  type="text"
                  name="salaryRange"
                  value={jobData.salaryRange}
                  onChange={handleChange}
                  placeholder="e.g. $80,000 - $120,000"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Technical Skills */}
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-md font-medium text-blue-600 pb-2 mb-4 border-b">Technical Skills</h3>
            <div className="flex space-x-2 mb-4">
              <input
                ref={skillInputRef}
                type="text"
                placeholder="Add a skill and press Enter"
                onKeyPress={handleSkillKeyPress}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleAddSkill}
                className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {skills.map((skill, index) => (
                <div key={index} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full flex items-center">
                  {skill}
                  <button
                    onClick={() => removeSkill(skill)}
                    className="ml-2 text-blue-800 hover:text-blue-900"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Evaluation Criteria */}
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-md font-medium text-blue-600 pb-2 mb-4 border-b">Evaluation Criteria</h3>
            <p className="text-sm text-gray-600 mb-4">
              Set the importance weightings for different evaluation criteria. These will be used by our AI model to rank and score candidates.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
              <div>
                <div className="flex justify-between mb-1">
                  <label className="text-sm font-medium text-gray-700">Technical Skills</label>
                  <span className="text-blue-600 font-semibold">{evaluationCriteria.technicalSkills}%</span>
                </div>
                <input
                  type="range"
                  name="technicalSkills"
                  min="0"
                  max="100"
                  value={evaluationCriteria.technicalSkills}
                  onChange={handleSliderChange}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <label className="text-sm font-medium text-gray-700">Experience</label>
                  <span className="text-blue-600 font-semibold">{evaluationCriteria.experience}%</span>
                </div>
                <input
                  type="range"
                  name="experience"
                  min="0"
                  max="100"
                  value={evaluationCriteria.experience}
                  onChange={handleSliderChange}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <label className="text-sm font-medium text-gray-700">Education</label>
                  <span className="text-blue-600 font-semibold">{evaluationCriteria.education}%</span>
                </div>
                <input
                  type="range"
                  name="education"
                  min="0"
                  max="100"
                  value={evaluationCriteria.education}
                  onChange={handleSliderChange}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <label className="text-sm font-medium text-gray-700">Communication Skills</label>
                  <span className="text-blue-600 font-semibold">{evaluationCriteria.communicationSkills}%</span>
                </div>
                <input
                  type="range"
                  name="communicationSkills"
                  min="0"
                  max="100"
                  value={evaluationCriteria.communicationSkills}
                  onChange={handleSliderChange}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <label className="text-sm font-medium text-gray-700">Cultural Fit</label>
                  <span className="text-blue-600 font-semibold">{evaluationCriteria.culturalFit}%</span>
                </div>
                <input
                  type="range"
                  name="culturalFit"
                  min="0"
                  max="100"
                  value={evaluationCriteria.culturalFit}
                  onChange={handleSliderChange}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Custom Evaluation Criteria
              </label>
              <textarea
                name="custom"
                value={evaluationCriteria.custom}
                onChange={(e) => setEvaluationCriteria(prev => ({ ...prev, custom: e.target.value }))}
                rows={3}
                placeholder="Define any additional criteria specific to this role that should be considered during evaluation..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              ></textarea>
            </div>
          </div>

          {/* Screening Settings */}
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-md font-medium text-blue-600 pb-2 mb-4 border-b">Screening Settings</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Minimum Score Threshold
                </label>
                <select
                  name="minimumScore"
                  value={jobData.minimumScore}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {minimumScoreOptions.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Auto-Screening
                </label>
                <select
                  name="autoScreening"
                  value={jobData.autoScreening}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {autoScreeningOptions.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Application Settings */}
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-md font-medium text-blue-600 pb-2 mb-4 border-b">Application Settings</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Application Deadline
                </label>
                <input
                  type="date"
                  name="applicationDeadline"
                  value={jobData.applicationDeadline}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Number of Positions
                </label>
                <input
                  type="number"
                  name="numberOfPositions"
                  value={jobData.numberOfPositions}
                  onChange={handleChange}
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hiring Manager
                </label>
                <input
                  type="text"
                  name="hiringManager"
                  value={jobData.hiringManager}
                  onChange={handleChange}
                  placeholder="Name of hiring manager"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contact Email
                </label>
                <input
                  type="email"
                  name="contactEmail"
                  value={jobData.contactEmail}
                  onChange={handleChange}
                  placeholder="hr@company.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Job Description Section */}
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-md font-medium text-blue-600 pb-2 mb-4 border-b">Job Description</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <button
                  onClick={generateJobDescription}
                  disabled={isGenerating || !jobData.title || !jobData.department || !jobData.experienceLevel}
                  className={`px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 flex items-center ${
                    (isGenerating || !jobData.title || !jobData.department || !jobData.experienceLevel) ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {isGenerating ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Generating...
                    </>
                  ) : (
                    'Generate Description'
                  )}
                </button>
                <button
                  onClick={() => {
                    const textarea = document.querySelector('textarea[name="description"]') as HTMLTextAreaElement;
                    if (textarea) {
                      textarea.focus();
                    }
                  }}
                  className="px-4 py-2 text-blue-600 hover:text-blue-800 flex items-center"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                  Edit Description
                </button>
              </div>
              <div>
                <textarea
                  name="description"
                  value={jobData.description}
                  onChange={handleChange}
                  rows={8}
                  placeholder="Job description will be generated here. You can also edit it manually."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Action buttons (bottom) */}
        <div className="flex justify-end space-x-3">
          <button
            onClick={() => router.push('/hr/dashboard')}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            onClick={() => saveJobListing('draft')}
            className="px-4 py-2 border border-blue-300 rounded-md text-blue-600 bg-blue-50 hover:bg-blue-100"
            disabled={loading}
          >
            {loading ? 'Saving...' : 'Save as Draft'}
          </button>
          <button
            onClick={() => saveJobListing('published')}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            disabled={loading || !jobData.title || !jobData.department}
          >
            {loading ? 'Publishing...' : 'Publish Job'}
          </button>
        </div>
      </div>
    </div>
  );
} 