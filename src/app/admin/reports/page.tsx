"use client"

import { useState } from 'react';
import Link from 'next/link';

interface Report {
  id: string;
  title: string;
  generatedDate: string;
  description: string;
}

interface Metric {
  label: string;
  value: string | number;
  color?: string;
}

export default function Reports() {
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Mock data for metrics
  const hiringMetrics: Metric[] = [
    { label: 'New hires this month', value: 24 },
    { label: 'Positions filled', value: 17 },
    { label: 'Open positions', value: 8 }
  ];
  
  const recruitmentMetrics: Metric[] = [
    { label: 'Applications', value: 186 },
    { label: 'Interviews conducted', value: 42 },
    { label: 'Avg. time to hire', value: '18 days' }
  ];
  
  const employeeMetrics: Metric[] = [
    { label: 'Total employees', value: 248 },
    { label: 'Turnover rate', value: '3.2%' },
    { label: 'Avg. tenure', value: '3.7 years' }
  ];
  
  // Mock data for reports
  const reports: Report[] = [
    {
      id: 'monthly-hiring-report',
      title: 'Monthly Hiring Report',
      generatedDate: 'May 15, 2025',
      description: 'Summary of all hiring activities for the current month including new hires, interviews conducted, and positions filled.'
    },
    {
      id: 'recruitment-performance-q2',
      title: 'Recruitment Performance Q2',
      generatedDate: 'May 10, 2025',
      description: 'Quarterly analysis of recruitment performance metrics including time-to-hire, cost-per-hire, and source effectiveness.'
    },
    {
      id: 'department-growth-analysis',
      title: 'Department Growth Analysis',
      generatedDate: 'May 8, 2025',
      description: 'Analysis of headcount growth by department over the last quarter with forecasts for the next 6 months.'
    },
    {
      id: 'employee-satisfaction-survey',
      title: 'Employee Satisfaction Survey',
      generatedDate: 'April 30, 2025',
      description: 'Results from the quarterly employee satisfaction survey with trend analysis and key areas for improvement.'
    },
    {
      id: 'candidate-source-analytics',
      title: 'Candidate Source Analytics',
      generatedDate: 'April 22, 2025',
      description: 'Analysis of recruitment channels and their effectiveness in providing quality candidates.'
    }
  ];

  // Handle view report
  const handleViewReport = (report: Report) => {
    setSelectedReport(report);
    setShowReportModal(true);
    setIsLoading(true);
    
    // Simulate loading the report data
    setTimeout(() => {
      setIsLoading(false);
    }, 1500);
  };

  // Get the color for each metric category
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'hiring':
        return 'bg-blue-500';
      case 'recruitment':
        return 'bg-green-500';
      case 'employee':
        return 'bg-orange-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Reports Dashboard</h1>
        
        {/* Metrics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Hiring Overview */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 bg-blue-500 text-white">
              <h2 className="text-lg font-semibold">Hiring Overview</h2>
            </div>
            <div className="p-6">
              {hiringMetrics.map((metric, index) => (
                <div key={index} className={`${index !== 0 ? 'mt-4' : ''}`}>
                  <div className="text-sm text-gray-600">{metric.label}</div>
                  <div className="font-semibold text-gray-800">{metric.value}</div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Recruitment Metrics */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 bg-green-500 text-white">
              <h2 className="text-lg font-semibold">Recruitment Metrics</h2>
            </div>
            <div className="p-6">
              {recruitmentMetrics.map((metric, index) => (
                <div key={index} className={`${index !== 0 ? 'mt-4' : ''}`}>
                  <div className="text-sm text-gray-600">{metric.label}</div>
                  <div className="font-semibold text-gray-800">{metric.value}</div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Employee Analytics */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 bg-orange-500 text-white">
              <h2 className="text-lg font-semibold">Employee Analytics</h2>
            </div>
            <div className="p-6">
              {employeeMetrics.map((metric, index) => (
                <div key={index} className={`${index !== 0 ? 'mt-4' : ''}`}>
                  <div className="text-sm text-gray-600">{metric.label}</div>
                  <div className="font-semibold text-gray-800">{metric.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      {/* Available Reports */}
      <div>
        <h2 className="text-xl font-semibold text-gray-800 mb-6">Available Reports</h2>
        
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {reports.map((report, index) => (
            <div 
              key={report.id} 
              className={`p-6 flex flex-col md:flex-row justify-between items-start md:items-center ${
                index !== reports.length - 1 ? 'border-b border-gray-200' : ''
              }`}
            >
              <div className="mb-4 md:mb-0">
                <h3 className="text-lg font-medium text-gray-800">{report.title}</h3>
                <p className="text-sm text-gray-600 mt-1">Generated: {report.generatedDate}</p>
              </div>
              <button
                onClick={() => handleViewReport(report)}
                className="px-4 py-2 bg-[#4285F4] text-white rounded-md hover:bg-blue-600 transition"
              >
                View Report
              </button>
            </div>
          ))}
        </div>
      </div>
      
      {/* Report View Modal */}
      {showReportModal && selectedReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-4xl max-h-[80vh] overflow-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold text-gray-800">{selectedReport.title}</h2>
              <button
                onClick={() => setShowReportModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-gray-600">Loading report data...</p>
              </div>
            ) : (
              <div>
                <div className="bg-gray-100 p-4 rounded-md mb-6">
                  <div className="text-sm text-gray-600 mb-1">Generated: {selectedReport.generatedDate}</div>
                  <p className="text-gray-700">{selectedReport.description}</p>
                </div>
                
                {/* Example report content - would be dynamic based on report type */}
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-medium text-gray-800 mb-4">Report Summary</h3>
                    <p className="text-gray-700">
                      This report provides detailed insights into {selectedReport.title.toLowerCase()}.
                      The data covers the period ending on {selectedReport.generatedDate}.
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="text-xl font-medium text-gray-800 mb-4">Key Metrics</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-blue-50 p-4 rounded-md">
                        <div className="text-sm text-gray-600">Total Applications</div>
                        <div className="text-2xl font-bold text-blue-600">186</div>
                      </div>
                      <div className="bg-green-50 p-4 rounded-md">
                        <div className="text-sm text-gray-600">Positions Filled</div>
                        <div className="text-2xl font-bold text-green-600">17</div>
                      </div>
                      <div className="bg-orange-50 p-4 rounded-md">
                        <div className="text-sm text-gray-600">Avg. Time to Hire</div>
                        <div className="text-2xl font-bold text-orange-600">18 days</div>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-xl font-medium text-gray-800 mb-4">Breakdown by Department</h3>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Applications</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Interviews</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hires</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          <tr>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Engineering</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">78</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">18</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">9</td>
                          </tr>
                          <tr>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Marketing</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">42</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">12</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">4</td>
                          </tr>
                          <tr>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Sales</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">38</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">8</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">3</td>
                          </tr>
                          <tr>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Design</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">28</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">4</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">1</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
                
                <div className="mt-8 flex justify-end">
                  <button
                    onClick={() => window.print()}
                    className="mr-4 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 text-gray-700"
                  >
                    Print Report
                  </button>
                  <button
                    onClick={() => {
                      alert(`Downloading ${selectedReport.title} as PDF...`);
                    }}
                    className="px-4 py-2 bg-[#4285F4] text-white rounded-md hover:bg-blue-600"
                  >
                    Download PDF
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 