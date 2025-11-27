"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Define permission structure
interface Permission {
  module: string;
  action: string;
  resource: string;
  description: string;
}

interface Role {
  _id: string;
  name: string;
  description: string;
  permissions: Permission[];
  isSystemRole: boolean;
  createdBy?: {
    name: string;
    email: string;
  };
  createdAt: string;
  userCount: number;
  permissionCount: number;
}

interface RolesResponse {
  success: boolean;
  data: {
    roles: Role[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalRoles: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
    };
    availablePermissions: Permission[];
  };
  error?: string;
}

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  roleId?: string;
  department?: string;
  status?: string;
  lastLogin?: string;
  roleName?: string;
  roleDescription?: string;
  permissionCount?: number;
}

export default function RoleManagement() {
  const router = useRouter();
  
  // State management
  const [activeTab, setActiveTab] = useState<'roles' | 'assignments'>('roles');
  const [roles, setRoles] = useState<Role[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [availablePermissions, setAvailablePermissions] = useState<Permission[]>([]);
  const [availableRoles, setAvailableRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Modal states
  const [showCreateRoleModal, setShowCreateRoleModal] = useState(false);
  const [showEditRoleModal, setShowEditRoleModal] = useState(false);
  const [showAssignRoleModal, setShowAssignRoleModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  
  // Form states
  const [roleForm, setRoleForm] = useState({
    name: '',
    description: '',
    permissions: [] as Permission[]
  });
  
  // Search and pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (activeTab === 'roles') {
      fetchRoles();
    } else {
      fetchUsersWithRoles();
    }
  }, [activeTab, currentPage, searchTerm]);

  const fetchRoles = async () => {
    try {
      setLoading(true);
      
      // Mock data for roles
      const mockRoles: Role[] = [
        {
          _id: '1',
          name: 'Admin',
          description: 'Full system access',
          permissions: [
            { module: 'users', action: 'create', resource: 'user', description: 'Create users' },
            { module: 'users', action: 'read', resource: 'user', description: 'View users' },
            { module: 'users', action: 'update', resource: 'user', description: 'Update users' },
            { module: 'users', action: 'delete', resource: 'user', description: 'Delete users' },
            { module: 'jobs', action: 'create', resource: 'job', description: 'Create jobs' },
            { module: 'jobs', action: 'read', resource: 'job', description: 'View jobs' },
            { module: 'jobs', action: 'update', resource: 'job', description: 'Update jobs' },
            { module: 'jobs', action: 'delete', resource: 'job', description: 'Delete jobs' }
          ],
          isSystemRole: true,
          createdAt: '2024-01-01',
          userCount: 2,
          permissionCount: 8
        },
        {
          _id: '2',
          name: 'HR Manager',
          description: 'Human Resources management',
          permissions: [
            { module: 'jobs', action: 'create', resource: 'job', description: 'Create jobs' },
            { module: 'jobs', action: 'read', resource: 'job', description: 'View jobs' },
            { module: 'jobs', action: 'update', resource: 'job', description: 'Update jobs' },
            { module: 'applications', action: 'read', resource: 'application', description: 'View applications' },
            { module: 'applications', action: 'update', resource: 'application', description: 'Update applications' }
          ],
          isSystemRole: false,
          createdAt: '2024-01-15',
          userCount: 5,
          permissionCount: 5
        },
        {
          _id: '3',
          name: 'Candidate',
          description: 'Job seeker access',
          permissions: [
            { module: 'jobs', action: 'read', resource: 'job', description: 'View jobs' },
            { module: 'applications', action: 'create', resource: 'application', description: 'Apply for jobs' },
            { module: 'applications', action: 'read', resource: 'application', description: 'View own applications' }
          ],
          isSystemRole: true,
          createdAt: '2024-01-01',
          userCount: 150,
          permissionCount: 3
        }
      ];

      const mockPermissions: Permission[] = [
        { module: 'users', action: 'create', resource: 'user', description: 'Create users' },
        { module: 'users', action: 'read', resource: 'user', description: 'View users' },
        { module: 'users', action: 'update', resource: 'user', description: 'Update users' },
        { module: 'users', action: 'delete', resource: 'user', description: 'Delete users' },
        { module: 'jobs', action: 'create', resource: 'job', description: 'Create jobs' },
        { module: 'jobs', action: 'read', resource: 'job', description: 'View jobs' },
        { module: 'jobs', action: 'update', resource: 'job', description: 'Update jobs' },
        { module: 'jobs', action: 'delete', resource: 'job', description: 'Delete jobs' },
        { module: 'applications', action: 'create', resource: 'application', description: 'Apply for jobs' },
        { module: 'applications', action: 'read', resource: 'application', description: 'View applications' },
        { module: 'applications', action: 'update', resource: 'application', description: 'Update applications' },
        { module: 'applications', action: 'delete', resource: 'application', description: 'Delete applications' }
      ];

      // Filter roles based on search term
      const filteredRoles = searchTerm 
        ? mockRoles.filter(role => 
            role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            role.description.toLowerCase().includes(searchTerm.toLowerCase())
          )
        : mockRoles;

      setRoles(filteredRoles);
      setAvailablePermissions(mockPermissions);
      setError('');
    } catch (err: any) {
      console.error('Error fetching roles:', err);
      setError('Failed to load roles');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsersWithRoles = async () => {
    try {
      setLoading(true);
      
      // Mock data for users
      const mockUsers: User[] = [
        {
          _id: '1',
          name: 'John Doe',
          email: 'john.doe@company.com',
          role: 'Admin',
          roleId: '1',
          department: 'IT',
          status: 'Active',
          lastLogin: '2024-01-15T10:30:00Z'
        },
        {
          _id: '2',
          name: 'Jane Smith',
          email: 'jane.smith@company.com',
          role: 'HR Manager',
          roleId: '2',
          department: 'Human Resources',
          status: 'Active',
          lastLogin: '2024-01-14T15:45:00Z'
        },
        {
          _id: '3',
          name: 'Bob Johnson',
          email: 'bob.johnson@company.com',
          role: 'Candidate',
          roleId: '3',
          department: 'Engineering',
          status: 'Active',
          lastLogin: '2024-01-13T09:20:00Z'
        },
        {
          _id: '4',
          name: 'Alice Brown',
          email: 'alice.brown@company.com',
          role: 'HR Manager',
          roleId: '2',
          department: 'Human Resources',
          status: 'Inactive',
          lastLogin: '2024-01-10T14:15:00Z'
        }
      ];

      const mockAvailableRoles: Role[] = [
        {
          _id: '1',
          name: 'Admin',
          description: 'Full system access',
          permissions: [],
          isSystemRole: true,
          createdAt: '2024-01-01',
          userCount: 2,
          permissionCount: 8
        },
        {
          _id: '2',
          name: 'HR Manager',
          description: 'Human Resources management',
          permissions: [],
          isSystemRole: false,
          createdAt: '2024-01-15',
          userCount: 5,
          permissionCount: 5
        },
        {
          _id: '3',
          name: 'Candidate',
          description: 'Job seeker access',
          permissions: [],
          isSystemRole: true,
          createdAt: '2024-01-01',
          userCount: 150,
          permissionCount: 3
        }
      ];

      // Filter users based on search term
      const filteredUsers = searchTerm 
        ? mockUsers.filter(user => 
            user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.role.toLowerCase().includes(searchTerm.toLowerCase())
          )
        : mockUsers;

      setUsers(filteredUsers);
      setAvailableRoles(mockAvailableRoles);
      setError('');
    } catch (err: any) {
      console.error('Error fetching users:', err);
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRole = async () => {
    try {
      // Mock role creation - just show success message
      setShowCreateRoleModal(false);
      resetRoleForm();
      fetchRoles();
      alert('Role created successfully! (Demo mode)');
    } catch (err: any) {
      console.error('Error creating role:', err);
      alert('Failed to create role');
    }
  };

  const handleEditRole = async () => {
    if (!selectedRole) return;
    
    try {
      // Mock role editing - just show success message
      setShowEditRoleModal(false);
      resetRoleForm();
      fetchRoles();
      alert('Role updated successfully! (Demo mode)');
    } catch (err: any) {
      console.error('Error updating role:', err);
      alert('Failed to update role');
    }
  };

  const handleDeleteRole = async (roleId: string, roleName: string) => {
    if (!confirm(`Are you sure you want to delete the role "${roleName}"?`)) {
      return;
    }

    try {
      // Mock role deletion - just show success message
      fetchRoles();
      alert('Role deleted successfully! (Demo mode)');
    } catch (err: any) {
      console.error('Error deleting role:', err);
      alert('Failed to delete role');
    }
  };

  const handleAssignRole = async (userId: string, roleId: string) => {
    try {
      // Mock role assignment - just show success message
      fetchUsersWithRoles();
      alert('Role assigned successfully! (Demo mode)');
    } catch (err: any) {
      console.error('Error assigning role:', err);
      alert('Failed to assign role');
    }
  };

  const resetRoleForm = () => {
    setRoleForm({
      name: '',
      description: '',
      permissions: []
    });
    setSelectedRole(null);
  };

  const openEditModal = (role: Role) => {
    setSelectedRole(role);
    setRoleForm({
      name: role.name,
      description: role.description,
      permissions: role.permissions
    });
    setShowEditRoleModal(true);
  };

  const togglePermission = (permission: Permission) => {
    const exists = roleForm.permissions.some(p => 
      p.module === permission.module && 
      p.action === permission.action && 
      p.resource === permission.resource
    );

    if (exists) {
      setRoleForm({
        ...roleForm,
        permissions: roleForm.permissions.filter(p => 
          !(p.module === permission.module && 
            p.action === permission.action && 
            p.resource === permission.resource)
        )
      });
    } else {
      setRoleForm({
        ...roleForm,
        permissions: [...roleForm.permissions, permission]
      });
    }
  };

  const getPermissionKey = (permission: Permission) => 
    `${permission.module}:${permission.action}:${permission.resource}`;

  const isPermissionSelected = (permission: Permission) =>
    roleForm.permissions.some(p => 
      p.module === permission.module && 
      p.action === permission.action && 
      p.resource === permission.resource
    );

  // Group permissions by module for better organization
  const groupedPermissions = availablePermissions.reduce((acc, permission) => {
    if (!acc[permission.module]) {
      acc[permission.module] = [];
    }
    acc[permission.module].push(permission);
    return acc;
  }, {} as { [key: string]: Permission[] });

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
            onClick={() => activeTab === 'roles' ? fetchRoles() : fetchUsersWithRoles()}
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
        {activeTab === 'roles' && (
          <button 
            onClick={() => setShowCreateRoleModal(true)}
            className="px-4 py-2 bg-[#4285F4] text-white rounded-md hover:bg-blue-600"
          >
            Create New Role
          </button>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('roles')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'roles'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Roles & Permissions
            </button>
            <button
              onClick={() => setActiveTab('assignments')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'assignments'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              User Role Assignments
            </button>
          </nav>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <input
          type="text"
          placeholder={activeTab === 'roles' ? "Search roles..." : "Search users..."}
          className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Roles Tab */}
      {activeTab === 'roles' && (
        <div className="bg-white rounded-lg shadow">
          {roles.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No roles found.
            </div>
          ) : (
            roles.map((role) => (
              <div key={role._id} className="p-6 border-b border-gray-200 hover:bg-gray-50">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-800">{role.name}</h3>
                      {role.isSystemRole && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                          System Role
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 mb-2">{role.description}</p>
                    <div className="flex gap-4 text-sm text-gray-500">
                      <span>{role.userCount} users assigned</span>
                      <span>{role.permissionCount} permissions</span>
                      {role.createdBy && (
                        <span>Created by {role.createdBy.name}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <button 
                      onClick={() => openEditModal(role)}
                      className="px-3 py-1 text-blue-600 hover:bg-blue-50 rounded"
                      disabled={role.isSystemRole}
                    >
                      {role.isSystemRole ? 'View' : 'Edit'}
                    </button>
                    {!role.isSystemRole && (
                      <button 
                        onClick={() => handleDeleteRole(role._id, role.name)}
                        className="px-3 py-1 text-red-600 hover:bg-red-50 rounded"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* User Assignments Tab */}
      {activeTab === 'assignments' && (
        <div className="bg-white rounded-lg shadow">
          {users.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No users found.
            </div>
          ) : (
            users.map((user) => (
              <div key={user._id} className="p-6 border-b border-gray-200 hover:bg-gray-50">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-800">{user.name}</h3>
                    <p className="text-gray-600">{user.email}</p>
                    <div className="flex gap-4 text-sm text-gray-500 mt-1">
                      <span>Current Role: <strong>{user.roleName}</strong></span>
                      {user.department && <span>Department: {user.department}</span>}
                      <span>{user.permissionCount} permissions</span>
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <select
                      onChange={(e) => {
                        if (e.target.value) {
                          handleAssignRole(user._id, e.target.value);
                        }
                      }}
                      className="px-3 py-1 border border-gray-300 rounded text-sm"
                      defaultValue=""
                    >
                      <option value="">Assign Role</option>
                      {availableRoles.map((role) => (
                        <option key={role._id} value={role._id}>
                          {role.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Create Role Modal */}
      {showCreateRoleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold">Create New Role</h2>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Role Details */}
                <div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Role Name</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      value={roleForm.name}
                      onChange={(e) => setRoleForm({...roleForm, name: e.target.value})}
                      placeholder="Enter role name"
                    />
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      rows={3}
                      value={roleForm.description}
                      onChange={(e) => setRoleForm({...roleForm, description: e.target.value})}
                      placeholder="Describe the role's purpose"
                    />
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Selected Permissions ({roleForm.permissions.length})
                    </label>
                    <div className="max-h-32 overflow-y-auto border border-gray-200 rounded p-2">
                      {roleForm.permissions.length === 0 ? (
                        <p className="text-gray-500 text-sm">No permissions selected</p>
                      ) : (
                        roleForm.permissions.map((perm, index) => (
                          <div key={index} className="text-sm text-gray-700 mb-1">
                            {perm.module}:{perm.action}:{perm.resource}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* Permissions */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Available Permissions</label>
                  <div className="max-h-96 overflow-y-auto border border-gray-200 rounded">
                    {Object.entries(groupedPermissions).map(([module, permissions]) => (
                      <div key={module} className="p-3 border-b border-gray-100">
                        <h4 className="font-medium text-gray-800 mb-2 capitalize">{module}</h4>
                        <div className="space-y-1">
                          {permissions.map((permission) => (
                            <label key={getPermissionKey(permission)} className="flex items-start gap-2 text-sm">
                              <input
                                type="checkbox"
                                checked={isPermissionSelected(permission)}
                                onChange={() => togglePermission(permission)}
                                className="mt-1"
                              />
                              <div>
                                <div className="font-medium">{permission.action} {permission.resource}</div>
                                <div className="text-gray-500 text-xs">{permission.description}</div>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowCreateRoleModal(false);
                  resetRoleForm();
                }}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateRole}
                className="px-4 py-2 bg-[#4285F4] text-white rounded-md hover:bg-blue-600"
                disabled={!roleForm.name || !roleForm.description || roleForm.permissions.length === 0}
              >
                Create Role
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Role Modal */}
      {showEditRoleModal && selectedRole && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold">
                {selectedRole.isSystemRole ? 'View Role' : 'Edit Role'}: {selectedRole.name}
              </h2>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Role Details */}
                <div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Role Name</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      value={roleForm.name}
                      onChange={(e) => setRoleForm({...roleForm, name: e.target.value})}
                      disabled={selectedRole.isSystemRole}
                    />
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      rows={3}
                      value={roleForm.description}
                      onChange={(e) => setRoleForm({...roleForm, description: e.target.value})}
                      disabled={selectedRole.isSystemRole}
                    />
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Selected Permissions ({roleForm.permissions.length})
                    </label>
                    <div className="max-h-32 overflow-y-auto border border-gray-200 rounded p-2">
                      {roleForm.permissions.map((perm, index) => (
                        <div key={index} className="text-sm text-gray-700 mb-1">
                          {perm.module}:{perm.action}:{perm.resource}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Permissions */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Available Permissions</label>
                  <div className="max-h-96 overflow-y-auto border border-gray-200 rounded">
                    {Object.entries(groupedPermissions).map(([module, permissions]) => (
                      <div key={module} className="p-3 border-b border-gray-100">
                        <h4 className="font-medium text-gray-800 mb-2 capitalize">{module}</h4>
                        <div className="space-y-1">
                          {permissions.map((permission) => (
                            <label key={getPermissionKey(permission)} className="flex items-start gap-2 text-sm">
                              <input
                                type="checkbox"
                                checked={isPermissionSelected(permission)}
                                onChange={() => !selectedRole.isSystemRole && togglePermission(permission)}
                                disabled={selectedRole.isSystemRole}
                                className="mt-1"
                              />
                              <div>
                                <div className="font-medium">{permission.action} {permission.resource}</div>
                                <div className="text-gray-500 text-xs">{permission.description}</div>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowEditRoleModal(false);
                  resetRoleForm();
                }}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                {selectedRole.isSystemRole ? 'Close' : 'Cancel'}
              </button>
              {!selectedRole.isSystemRole && (
                <button
                  onClick={handleEditRole}
                  className="px-4 py-2 bg-[#4285F4] text-white rounded-md hover:bg-blue-600"
                  disabled={!roleForm.name || !roleForm.description || roleForm.permissions.length === 0}
                >
                  Update Role
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
