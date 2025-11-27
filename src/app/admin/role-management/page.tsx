"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Define permission structure
interface Permission {
  module: string;
  action: string;
  resource: string;
  description: string;
  enabled: boolean;
}

interface Role {
  _id: string;
  name: string;
  description: string;
  permissions: Permission[];
  isSystemRole: boolean;
  createdAt: string;
  userCount: number;
  permissionCount: number;
}

export default function RoleManagement() {
  const router = useRouter();
  
  // State management
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch roles from mock data
  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      setLoading(true);
      
      // Mock data for roles with detailed permissions
      const mockRoles: Role[] = [
        {
          _id: '1',
          name: 'Administrator',
          description: 'Full system access with all permissions',
          permissions: [
            // User Management
            { module: 'User Management', action: 'create', resource: 'user', description: 'Create User Accounts', enabled: true },
            { module: 'User Management', action: 'read', resource: 'user', description: 'View User Details', enabled: true },
            { module: 'User Management', action: 'update', resource: 'user', description: 'Edit User Profiles', enabled: true },
            { module: 'User Management', action: 'delete', resource: 'user', description: 'Delete Users', enabled: true },
            { module: 'User Management', action: 'manage', resource: 'roles', description: 'Manage Roles', enabled: true },
            
            // HR Management
            { module: 'HR Management', action: 'create', resource: 'job', description: 'Create Job Postings', enabled: true },
            { module: 'HR Management', action: 'read', resource: 'applications', description: 'View Applications', enabled: true },
            { module: 'HR Management', action: 'update', resource: 'job', description: 'Edit Job Details', enabled: true },
            { module: 'HR Management', action: 'delete', resource: 'job', description: 'Remove Job Postings', enabled: true },
            { module: 'HR Management', action: 'manage', resource: 'interviews', description: 'Manage Interview Process', enabled: true },
            
            // System Settings
            { module: 'System Settings', action: 'configure', resource: 'system', description: 'Configure System', enabled: true },
            { module: 'System Settings', action: 'backup', resource: 'data', description: 'Backup/Restore', enabled: true },
            { module: 'System Settings', action: 'manage', resource: 'integrations', description: 'Manage Integrations', enabled: true },
            { module: 'System Settings', action: 'view', resource: 'logs', description: 'Access Logs', enabled: true },
            
            // Reports
            { module: 'Reports', action: 'view', resource: 'reports', description: 'View All Reports', enabled: true },
            { module: 'Reports', action: 'create', resource: 'reports', description: 'Create Custom Reports', enabled: true }
          ],
          isSystemRole: true,
          createdAt: '2024-01-01',
          userCount: 2,
          permissionCount: 16
        },
        {
          _id: '2',
          name: 'HR Manager',
          description: 'Human Resources management with limited system access',
          permissions: [
            // User Management (Limited)
            { module: 'User Management', action: 'create', resource: 'user', description: 'Create User Accounts', enabled: false },
            { module: 'User Management', action: 'read', resource: 'user', description: 'View User Details', enabled: true },
            { module: 'User Management', action: 'update', resource: 'user', description: 'Edit User Profiles', enabled: true },
            { module: 'User Management', action: 'delete', resource: 'user', description: 'Delete Users', enabled: false },
            { module: 'User Management', action: 'manage', resource: 'roles', description: 'Manage Roles', enabled: false },
            
            // HR Management (Full Access)
            { module: 'HR Management', action: 'create', resource: 'job', description: 'Create Job Postings', enabled: true },
            { module: 'HR Management', action: 'read', resource: 'applications', description: 'View Applications', enabled: true },
            { module: 'HR Management', action: 'update', resource: 'job', description: 'Edit Job Details', enabled: true },
            { module: 'HR Management', action: 'delete', resource: 'job', description: 'Remove Job Postings', enabled: true },
            { module: 'HR Management', action: 'manage', resource: 'interviews', description: 'Manage Interview Process', enabled: true },
            
            // System Settings (Limited)
            { module: 'System Settings', action: 'configure', resource: 'system', description: 'Configure System', enabled: false },
            { module: 'System Settings', action: 'backup', resource: 'data', description: 'Backup/Restore', enabled: false },
            { module: 'System Settings', action: 'manage', resource: 'integrations', description: 'Manage Integrations', enabled: true },
            { module: 'System Settings', action: 'view', resource: 'logs', description: 'Access Logs', enabled: true },
            
            // Reports (Limited)
            { module: 'Reports', action: 'view', resource: 'reports', description: 'View All Reports', enabled: true },
            { module: 'Reports', action: 'create', resource: 'reports', description: 'Create Custom Reports', enabled: false }
          ],
          isSystemRole: false,
          createdAt: '2024-01-15',
          userCount: 5,
          permissionCount: 10
        },
        {
          _id: '3',
          name: 'User',
          description: 'Basic user access for job seekers and candidates',
          permissions: [
            // User Management (Very Limited)
            { module: 'User Management', action: 'create', resource: 'user', description: 'Create User Accounts', enabled: false },
            { module: 'User Management', action: 'read', resource: 'user', description: 'View User Details', enabled: false },
            { module: 'User Management', action: 'update', resource: 'user', description: 'Edit User Profiles', enabled: false },
            { module: 'User Management', action: 'delete', resource: 'user', description: 'Delete Users', enabled: false },
            { module: 'User Management', action: 'manage', resource: 'roles', description: 'Manage Roles', enabled: false },
            
            // HR Management (Read Only)
            { module: 'HR Management', action: 'create', resource: 'job', description: 'Create Job Postings', enabled: false },
            { module: 'HR Management', action: 'read', resource: 'applications', description: 'View Applications', enabled: true },
            { module: 'HR Management', action: 'update', resource: 'job', description: 'Edit Job Details', enabled: false },
            { module: 'HR Management', action: 'delete', resource: 'job', description: 'Remove Job Postings', enabled: false },
            { module: 'HR Management', action: 'manage', resource: 'interviews', description: 'Manage Interview Process', enabled: false },
            
            // System Settings (No Access)
            { module: 'System Settings', action: 'configure', resource: 'system', description: 'Configure System', enabled: false },
            { module: 'System Settings', action: 'backup', resource: 'data', description: 'Backup/Restore', enabled: false },
            { module: 'System Settings', action: 'manage', resource: 'integrations', description: 'Manage Integrations', enabled: false },
            { module: 'System Settings', action: 'view', resource: 'logs', description: 'Access Logs', enabled: false },
            
            // Reports (No Access)
            { module: 'Reports', action: 'view', resource: 'reports', description: 'View All Reports', enabled: false },
            { module: 'Reports', action: 'create', resource: 'reports', description: 'Create Custom Reports', enabled: false }
          ],
          isSystemRole: true,
          createdAt: '2024-01-01',
          userCount: 150,
          permissionCount: 1
        }
      ];

      setRoles(mockRoles);
      setSelectedRole(mockRoles[0]); // Default to Administrator
      setError('');
    } catch (err: any) {
      console.error('Error fetching roles:', err);
      setError('Failed to load roles');
    } finally {
      setLoading(false);
    }
  };

  const handlePermissionToggle = (permissionIndex: number) => {
    if (!selectedRole) return;
    
    const updatedRole = { ...selectedRole };
    updatedRole.permissions[permissionIndex].enabled = !updatedRole.permissions[permissionIndex].enabled;
    
    setSelectedRole(updatedRole);
    
    // Update the role in the roles array
    const updatedRoles = roles.map(role => 
      role._id === selectedRole._id ? updatedRole : role
    );
    setRoles(updatedRoles);
  };

  const handleSaveChanges = () => {
    alert('Changes saved successfully! (Demo mode)');
  };

  // Group permissions by module
  const groupedPermissions = selectedRole?.permissions.reduce((acc, permission) => {
    if (!acc[permission.module]) {
      acc[permission.module] = [];
    }
    acc[permission.module].push(permission);
    return acc;
  }, {} as { [key: string]: Permission[] }) || {};

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
            onClick={fetchRoles}
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
        <h1 className="text-2xl font-bold text-gray-800">Role Management</h1>
        <button 
          onClick={() => alert('Add Role functionality (Demo mode)')}
          className="px-4 py-2 bg-[#4285F4] text-white rounded-md hover:bg-blue-600"
        >
          Add Role
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm">
        {/* Role Selection */}
        <div className="p-6 border-b border-gray-200">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Role
            </label>
            <div className="flex gap-2">
              {roles.map((role) => (
                <button
                  key={role._id}
                  onClick={() => setSelectedRole(role)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    selectedRole?._id === role._id
                      ? 'bg-[#4285F4] text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {role.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Permissions Section */}
        {selectedRole && (
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-6">
              Permissions for: {selectedRole.name}
            </h2>

            <div className="space-y-8">
              {Object.entries(groupedPermissions).map(([module, permissions]) => (
                <div key={module}>
                  <h3 className="text-md font-medium text-gray-700 mb-4">{module}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {permissions.map((permission, index) => {
                      const globalIndex = selectedRole.permissions.findIndex(p => 
                        p.module === permission.module && 
                        p.action === permission.action && 
                        p.resource === permission.resource
                      );
                      
                      return (
                        <div key={`${permission.module}-${permission.action}-${permission.resource}`} className="flex items-center">
                          <input
                            type="checkbox"
                            id={`permission-${globalIndex}`}
                            checked={permission.enabled}
                            onChange={() => handlePermissionToggle(globalIndex)}
                            className="h-4 w-4 text-[#4285F4] focus:ring-[#4285F4] border-gray-300 rounded"
                          />
                          <label 
                            htmlFor={`permission-${globalIndex}`}
                            className="ml-3 text-sm text-gray-700 cursor-pointer"
                          >
                            {permission.description}
                          </label>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Save Button */}
            <div className="mt-8 flex justify-end">
              <button
                onClick={handleSaveChanges}
                className="px-6 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
              >
                Save Changes
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
