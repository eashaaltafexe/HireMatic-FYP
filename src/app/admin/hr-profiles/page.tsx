"use client"

import { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';

ChartJS.register(
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface Department {
  name: string;
  employees: number;
  openPositions: number;
  growthRate: string;
}

interface JobTitle {
  title: string;
  department: string;
  level: string;
  positions: number;
}

interface SalaryBand {
  level: string;
  minSalary: number;
  maxSalary: number;
  currency: string;
}

interface Benefit {
  name: string;
  description: string;
  eligibility: string;
  status: 'Active' | 'Under Review' | 'Inactive';
}

export default function HRProfiles() {
  const [activeTab, setActiveTab] = useState('departments');
  const [showAddDepartment, setShowAddDepartment] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  
  // Add global styles to ensure everything is properly scrollable
  useEffect(() => {
    // Force the body to be scrollable
    document.body.style.overflow = 'auto';
    document.body.style.display = 'block';
    
    return () => {
      document.body.style.overflow = '';
      document.body.style.display = '';
    };
  }, []);
  
  // Department Data
  const [departments, setDepartments] = useState<Department[]>([
    { name: "Engineering", employees: 68, openPositions: 4, growthRate: "+12% YoY" },
    { name: "Marketing", employees: 43, openPositions: 2, growthRate: "+8% YoY" },
    { name: "Sales", employees: 51, openPositions: 3, growthRate: "+15% YoY" },
    { name: "Computer Science", employees: 45, openPositions: 5, growthRate: "+20% YoY" },
    { name: "Artificial Intelligence", employees: 32, openPositions: 6, growthRate: "+25% YoY" }
  ]);

  // Job Titles Data
  const [jobTitles, setJobTitles] = useState<JobTitle[]>([
    { title: "Software Engineer", department: "Engineering", level: "L3", positions: 15 },
    { title: "Marketing Manager", department: "Marketing", level: "L4", positions: 8 },
    { title: "AI Research Scientist", department: "Artificial Intelligence", level: "L4", positions: 6 },
    { title: "Data Scientist", department: "Computer Science", level: "L3", positions: 10 }
  ]);

  // Salary Bands Data
  const [salaryBands, setSalaryBands] = useState<SalaryBand[]>([
    { level: "L1", minSalary: 45000, maxSalary: 65000, currency: "USD" },
    { level: "L2", minSalary: 65000, maxSalary: 85000, currency: "USD" },
    { level: "L3", minSalary: 85000, maxSalary: 120000, currency: "USD" },
    { level: "L4", minSalary: 120000, maxSalary: 180000, currency: "USD" },
    { level: "L5", minSalary: 180000, maxSalary: 250000, currency: "USD" }
  ]);

  // Benefits Data
  const [benefits, setBenefits] = useState<Benefit[]>([
    {
      name: "Health Insurance",
      description: "Comprehensive medical, dental, and vision coverage",
      eligibility: "All full-time employees",
      status: "Active"
    },
    {
      name: "401(k) Plan",
      description: "Retirement savings with company matching",
      eligibility: "After 3 months of employment",
      status: "Active"
    },
    {
      name: "Remote Work",
      description: "Flexible work-from-home options",
      eligibility: "Based on department policy",
      status: "Active"
    }
  ]);

  // Chart Data
  const pieChartData = {
    labels: ['Engineering', 'Marketing', 'Sales'],
    datasets: [
      {
        data: [38, 36, 26],
        backgroundColor: ['#4285F4', '#34A853', '#FBBC05'],
        borderWidth: 0,
      },
    ],
  };

  const barChartData = {
    labels: ['Q1', 'Q2', 'Q3', 'Q4', 'Q1'],
    datasets: [
      {
        label: '2024-2025 Quarterly Growth',
        data: [20, 25, 30, 35, 45],
        backgroundColor: '#4285F4',
        borderRadius: 4,
      },
    ],
  };

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          display: false,
        },
      },
      x: {
        grid: {
          display: false,
        },
      },
    },
    plugins: {
      legend: {
        display: false,
      },
    },
  };

  const pieChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          usePointStyle: true,
          padding: 20,
        },
      },
    },
  };

  return (
    <div style={{ padding: '24px', backgroundColor: '#f9fafb' }}>
      {/* Header Section */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937' }}>HR Profiles</h1>
          <div style={{ display: 'flex', gap: '16px' }}>
            <button style={{ 
              padding: '8px 16px', 
              color: '#4b5563', 
              border: '1px solid #d1d5db', 
              borderRadius: '6px', 
              backgroundColor: 'white' 
            }}>
              Export
            </button>
            <button 
              style={{ 
                padding: '8px 16px', 
                backgroundColor: '#4285F4', 
                color: 'white', 
                borderRadius: '6px',
                border: 'none'
              }}
              onClick={() => setShowAddDepartment(true)}
            >
              Add Department
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div style={{ 
        backgroundColor: 'white', 
        borderTopLeftRadius: '8px', 
        borderTopRightRadius: '8px', 
        borderBottom: '1px solid #e5e7eb' 
      }}>
        <nav style={{ display: 'flex' }}>
          {['Departments', 'Job Titles', 'Salary Bands', 'Benefits'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab.toLowerCase().replace(' ', '-'))}
              style={{ 
                padding: '16px 32px', 
                fontWeight: '500', 
                fontSize: '14px',
                color: activeTab === tab.toLowerCase().replace(' ', '-') ? '#4285F4' : '#6b7280',
                borderBottom: activeTab === tab.toLowerCase().replace(' ', '-') ? '2px solid #4285F4' : 'none',
                backgroundColor: activeTab === tab.toLowerCase().replace(' ', '-') ? 'white' : 'transparent',
              }}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {/* Content Area - with padding to ensure spacing */}
      <div style={{ marginTop: '24px' }}>
        {/* Departments View */}
        {activeTab === 'departments' && (
          <div>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
              gap: '24px', 
              marginBottom: '32px' 
            }}>
              {departments.map((dept) => (
                <div 
                  key={dept.name}
                  style={{ 
                    backgroundColor: 'white', 
                    padding: '24px', 
                    borderRadius: '8px', 
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)', 
                    cursor: 'pointer' 
                  }}
                  onClick={() => setSelectedDepartment(dept)}
                >
                  <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937', marginBottom: '16px' }}>{dept.name}</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: '#4b5563' }}>Employees:</span>
                      <span style={{ fontWeight: '500' }}>{dept.employees}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: '#4b5563' }}>Open positions:</span>
                      <span style={{ fontWeight: '500' }}>{dept.openPositions}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: '#4b5563' }}>Growth rate:</span>
                      <span style={{ fontWeight: '500', color: '#059669' }}>{dept.growthRate}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Department Details Section */}
            {selectedDepartment && (
              <div style={{ 
                backgroundColor: 'white', 
                borderRadius: '8px', 
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)', 
                padding: '24px' 
              }}>
                <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#1f2937', marginBottom: '24px' }}>Department Details</h2>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
                  gap: '24px' 
                }}>
                  <div style={{ backgroundColor: '#f9fafb', padding: '24px', borderRadius: '8px' }}>
                    <h3 style={{ fontWeight: '500', color: '#374151', marginBottom: '16px' }}>Department Composition</h3>
                    <div style={{ height: '256px' }}>
                      <Pie data={pieChartData} options={pieChartOptions} />
                    </div>
                  </div>
                  <div style={{ backgroundColor: '#f9fafb', padding: '24px', borderRadius: '8px' }}>
                    <h3 style={{ fontWeight: '500', color: '#374151', marginBottom: '16px' }}>Department Growth</h3>
                    <div style={{ height: '256px' }}>
                      <Bar data={barChartData} options={barChartOptions} />
                    </div>
                  </div>
                </div>
                <div style={{ marginTop: '16px', fontSize: '14px', color: '#6b7280' }}>
                  Last updated: May 18, 2025
                </div>
              </div>
            )}
          </div>
        )}

        {/* Job Titles View */}
        {activeTab === 'job-titles' && (
          <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f9fafb' }}>
                  <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '12px', fontWeight: '500', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Title</th>
                  <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '12px', fontWeight: '500', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Department</th>
                  <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '12px', fontWeight: '500', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Level</th>
                  <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '12px', fontWeight: '500', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Positions</th>
                </tr>
              </thead>
              <tbody>
                {jobTitles.map((job, index) => (
                  <tr key={job.title} style={{ backgroundColor: index % 2 === 0 ? 'white' : '#f9fafb' }}>
                    <td style={{ padding: '16px 24px', fontSize: '14px', fontWeight: '500', color: '#1f2937' }}>{job.title}</td>
                    <td style={{ padding: '16px 24px', fontSize: '14px', color: '#6b7280' }}>{job.department}</td>
                    <td style={{ padding: '16px 24px', fontSize: '14px', color: '#6b7280' }}>{job.level}</td>
                    <td style={{ padding: '16px 24px', fontSize: '14px', color: '#6b7280' }}>{job.positions}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Salary Bands View */}
        {activeTab === 'salary-bands' && (
          <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f9fafb' }}>
                  <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '12px', fontWeight: '500', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Level</th>
                  <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '12px', fontWeight: '500', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Min Salary</th>
                  <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '12px', fontWeight: '500', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Max Salary</th>
                  <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '12px', fontWeight: '500', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Currency</th>
                </tr>
              </thead>
              <tbody>
                {salaryBands.map((band, index) => (
                  <tr key={band.level} style={{ backgroundColor: index % 2 === 0 ? 'white' : '#f9fafb' }}>
                    <td style={{ padding: '16px 24px', fontSize: '14px', fontWeight: '500', color: '#1f2937' }}>{band.level}</td>
                    <td style={{ padding: '16px 24px', fontSize: '14px', color: '#6b7280' }}>{band.minSalary.toLocaleString()}</td>
                    <td style={{ padding: '16px 24px', fontSize: '14px', color: '#6b7280' }}>{band.maxSalary.toLocaleString()}</td>
                    <td style={{ padding: '16px 24px', fontSize: '14px', color: '#6b7280' }}>{band.currency}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Benefits View */}
        {activeTab === 'benefits' && (
          <div style={{ display: 'grid', gap: '24px' }}>
            {benefits.map((benefit) => (
              <div key={benefit.name} style={{ 
                backgroundColor: 'white', 
                padding: '24px', 
                borderRadius: '8px', 
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)' 
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937' }}>{benefit.name}</h3>
                  <span style={{ 
                    padding: '4px 12px', 
                    borderRadius: '9999px', 
                    fontSize: '12px', 
                    fontWeight: '600',
                    backgroundColor: benefit.status === 'Active' ? '#d1fae5' : benefit.status === 'Under Review' ? '#fef3c7' : '#fee2e2',
                    color: benefit.status === 'Active' ? '#065f46' : benefit.status === 'Under Review' ? '#92400e' : '#b91c1c'
                  }}>
                    {benefit.status}
                  </span>
                </div>
                <p style={{ color: '#4b5563', marginBottom: '16px' }}>{benefit.description}</p>
                <div style={{ fontSize: '14px', color: '#6b7280' }}>
                  <span style={{ fontWeight: '500' }}>Eligibility:</span> {benefit.eligibility}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Department Modal */}
      {showAddDepartment && (
        <div style={{ 
          position: 'fixed', 
          inset: 0, 
          backgroundColor: 'rgba(0, 0, 0, 0.5)', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          zIndex: 50,
          overflow: 'auto'
        }}>
          <div style={{ 
            backgroundColor: 'white', 
            padding: '24px', 
            borderRadius: '8px', 
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            width: '100%',
            maxWidth: '448px',
            margin: '32px auto' 
          }}>
            <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '16px' }}>Add New Department</h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>
                  Department Name
                </label>
                <input
                  type="text"
                  style={{ 
                    width: '100%', 
                    padding: '8px 12px', 
                    border: '1px solid #d1d5db', 
                    borderRadius: '6px' 
                  }}
                  placeholder="Enter department name"
                />
              </div>
              
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>
                  Initial Employees
                </label>
                <input
                  type="number"
                  style={{ 
                    width: '100%', 
                    padding: '8px 12px', 
                    border: '1px solid #d1d5db', 
                    borderRadius: '6px' 
                  }}
                  placeholder="Enter number of employees"
                />
              </div>
              
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>
                  Open Positions
                </label>
                <input
                  type="number"
                  style={{ 
                    width: '100%', 
                    padding: '8px 12px', 
                    border: '1px solid #d1d5db', 
                    borderRadius: '6px' 
                  }}
                  placeholder="Enter number of open positions"
                />
              </div>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
              <button
                onClick={() => setShowAddDepartment(false)}
                style={{ 
                  padding: '8px 16px', 
                  border: '1px solid #d1d5db', 
                  borderRadius: '6px', 
                  backgroundColor: 'white' 
                }}
              >
                Cancel
              </button>
              <button style={{ 
                padding: '8px 16px', 
                backgroundColor: '#4285F4', 
                color: 'white', 
                borderRadius: '6px',
                border: 'none'
              }}>
                Add Department
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 