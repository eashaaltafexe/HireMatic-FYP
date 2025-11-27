"use client"

import { useState } from 'react';

interface ParsedResume {
  personalInfo: {
    name: string;
    email: string;
    phone: string;
    location: string;
    linkedin?: string;
    github?: string;
    website?: string;
  };
  summary: string;
  experience: Array<{
    company: string;
    position: string;
    duration: string;
    description: string;
    location?: string;
  }>;
  education: Array<{
    institution: string;
    degree: string;
    field: string;
    graduationYear: string;
    gpa?: string;
  }>;
  skills: {
    technical: string[];
    soft: string[];
    languages: string[];
  };
  certifications: Array<{
    name: string;
    issuer: string;
    date: string;
  }>;
  projects: Array<{
    name: string;
    description: string;
    technologies: string[];
    url?: string;
  }>;
  rawText: string;
  parsingStatus: string;
  parsingError?: string;
  confidence?: number;
}

interface ResumeViewerProps {
  parsedResume: ParsedResume;
}

export default function ResumeViewer({ parsedResume }: ResumeViewerProps) {
  const [activeTab, setActiveTab] = useState<'parsed' | 'raw'>('parsed');

  if (!parsedResume || parsedResume.parsingStatus !== 'success') {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-center">
          <svg className="w-5 h-5 text-yellow-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
          </svg>
          <span className="text-yellow-800 font-medium">Resume Processing Status</span>
        </div>
        <p className="text-yellow-700 mt-2">
          {parsedResume?.parsingStatus === 'failed' 
            ? `Failed to parse resume: ${parsedResume.parsingError || 'Unknown error'}`
            : 'Resume is being processed...'
          }
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg">
      {/* Header */}
      <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Parsed Resume Data</h3>
          <div className="flex items-center space-x-2">
            {parsedResume.confidence && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                {Math.round(parsedResume.confidence * 100)}% Confidence
              </span>
            )}
            <div className="flex rounded-md shadow-sm">
              <button
                onClick={() => setActiveTab('parsed')}
                className={`px-3 py-1 text-sm font-medium rounded-l-md ${
                  activeTab === 'parsed'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-300'
                }`}
              >
                Structured Data
              </button>
              <button
                onClick={() => setActiveTab('raw')}
                className={`px-3 py-1 text-sm font-medium rounded-r-md ${
                  activeTab === 'raw'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-300'
                }`}
              >
                Raw Text
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {activeTab === 'parsed' ? (
          <div className="space-y-6">
            {/* Personal Information */}
            <div>
              <h4 className="text-md font-semibold text-gray-900 mb-3 flex items-center">
                <svg className="w-4 h-4 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                </svg>
                Personal Information
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {parsedResume.personalInfo.name && (
                  <div>
                    <span className="text-sm font-medium text-gray-500">Name:</span>
                    <p className="text-gray-900">{parsedResume.personalInfo.name}</p>
                  </div>
                )}
                {parsedResume.personalInfo.email && (
                  <div>
                    <span className="text-sm font-medium text-gray-500">Email:</span>
                    <p className="text-gray-900">{parsedResume.personalInfo.email}</p>
                  </div>
                )}
                {parsedResume.personalInfo.phone && (
                  <div>
                    <span className="text-sm font-medium text-gray-500">Phone:</span>
                    <p className="text-gray-900">{parsedResume.personalInfo.phone}</p>
                  </div>
                )}
                {parsedResume.personalInfo.location && (
                  <div>
                    <span className="text-sm font-medium text-gray-500">Location:</span>
                    <p className="text-gray-900">{parsedResume.personalInfo.location}</p>
                  </div>
                )}
                {parsedResume.personalInfo.linkedin && (
                  <div>
                    <span className="text-sm font-medium text-gray-500">LinkedIn:</span>
                    <a href={parsedResume.personalInfo.linkedin} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      {parsedResume.personalInfo.linkedin}
                    </a>
                  </div>
                )}
                {parsedResume.personalInfo.github && (
                  <div>
                    <span className="text-sm font-medium text-gray-500">GitHub:</span>
                    <a href={parsedResume.personalInfo.github} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      {parsedResume.personalInfo.github}
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Summary */}
            {parsedResume.summary && (
              <div>
                <h4 className="text-md font-semibold text-gray-900 mb-3 flex items-center">
                  <svg className="w-4 h-4 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                  </svg>
                  Summary
                </h4>
                <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">{parsedResume.summary}</p>
              </div>
            )}

            {/* Skills */}
            {(parsedResume.skills.technical.length > 0 || parsedResume.skills.soft.length > 0) && (
              <div>
                <h4 className="text-md font-semibold text-gray-900 mb-3 flex items-center">
                  <svg className="w-4 h-4 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
                  </svg>
                  Skills
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {parsedResume.skills.technical.length > 0 && (
                    <div>
                      <h5 className="text-sm font-medium text-gray-700 mb-2">Technical Skills</h5>
                      <div className="flex flex-wrap gap-2">
                        {parsedResume.skills.technical.map((skill, index) => (
                          <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {parsedResume.skills.soft.length > 0 && (
                    <div>
                      <h5 className="text-sm font-medium text-gray-700 mb-2">Soft Skills</h5>
                      <div className="flex flex-wrap gap-2">
                        {parsedResume.skills.soft.map((skill, index) => (
                          <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Experience */}
            {parsedResume.experience.length > 0 && (
              <div>
                <h4 className="text-md font-semibold text-gray-900 mb-3 flex items-center">
                  <svg className="w-4 h-4 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                  </svg>
                  Experience
                </h4>
                <div className="space-y-4">
                  {parsedResume.experience.map((exp, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h5 className="font-medium text-gray-900">{exp.position}</h5>
                        <span className="text-sm text-gray-500">{exp.duration}</span>
                      </div>
                      <p className="text-gray-600 mb-2">{exp.company}</p>
                      {exp.description && <p className="text-gray-700 text-sm">{exp.description}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Education */}
            {parsedResume.education.length > 0 && (
              <div>
                <h4 className="text-md font-semibold text-gray-900 mb-3 flex items-center">
                  <svg className="w-4 h-4 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l9-5-9-5-9 5 9 5z"></path>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"></path>
                  </svg>
                  Education
                </h4>
                <div className="space-y-4">
                  {parsedResume.education.map((edu, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <h5 className="font-medium text-gray-900">{edu.institution}</h5>
                      {edu.degree && <p className="text-gray-600">{edu.degree}</p>}
                      {edu.graduationYear && <p className="text-sm text-gray-500">Graduated: {edu.graduationYear}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Projects */}
            {parsedResume.projects.length > 0 && (
              <div>
                <h4 className="text-md font-semibold text-gray-900 mb-3 flex items-center">
                  <svg className="w-4 h-4 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
                  </svg>
                  Projects
                </h4>
                <div className="space-y-4">
                  {parsedResume.projects.map((project, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <h5 className="font-medium text-gray-900">{project.name}</h5>
                      {project.description && <p className="text-gray-700 text-sm mt-2">{project.description}</p>}
                      {project.technologies.length > 0 && (
                        <div className="mt-2">
                          <div className="flex flex-wrap gap-1">
                            {project.technologies.map((tech, techIndex) => (
                              <span key={techIndex} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                {tech}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Raw Text Tab */
          <div>
            <h4 className="text-md font-semibold text-gray-900 mb-3">Raw Resume Text</h4>
            <div className="bg-gray-50 p-4 rounded-lg">
              <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono">
                {parsedResume.rawText}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
