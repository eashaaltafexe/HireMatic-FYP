"use client"

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface User {
  _id: string;
  name: string;
  email: string;
  department: string;
  role: string;
  status: 'Active' | 'Inactive';
  createdAt?: string;
  lastLogin?: string;
}

interface UsersResponse {
  success: boolean;
  data: {
    users: User[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalUsers: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
    };
    filters: {
      departments: string[];
      roles: string[];
    };
  };
  error?: string;
}

export default function UserManagement() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [departmentDropdownOpen, setDepartmentDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // User modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  
  // Form state for add/edit
  const [userForm, setUserForm] = useState<Partial<User>>({
    name: '',
    email: '',
    department: '',
    role: '',
    status: 'Active'
  });

  // Real data from API
  const [usersData, setUsersData] = useState<UsersResponse['data'] | null>(null);
  const [users, setUsers] = useState<User[]>([]);

  // Dynamic filter options from API
  const departments = usersData?.filters.departments || ['All Departments'];
  const roles = usersData?.filters.roles || ['All Roles'];

  // Fetch users from API
  useEffect(() => {
    fetchUsers();
  }, [currentPage, searchTerm, selectedDepartment, selectedRole]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10'
      });
      
      if (searchTerm) params.append('search', searchTerm);
      if (selectedDepartment && selectedDepartment !== 'All Departments') {
        params.append('department', selectedDepartment);
      }
      if (selectedRole && selectedRole !== 'All Roles') {
        params.append('role', selectedRole);
      }

      const response = await fetch(`/api/admin/users?${params}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }

      const result: UsersResponse = await response.json();
      
      if (result.success && result.data) {
        setUsersData(result.data);
        setUsers(result.data.users);
        setError('');
      } else {
        throw new Error(result.error || 'Failed to fetch users');
      }
    } catch (err: any) {
      console.error('Error fetching users:', err);
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  // Users are already filtered by API, so we use them directly
  const filteredUsers = users;
  const totalPages = usersData?.pagination.totalPages || 1;
  
  // Add user handler
  const handleAddUser = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...userForm,
          password: 'defaultPassword123' // In production, generate or ask for password
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create user');
      }

      const result = await response.json();
      
      if (result.success) {
        setShowAddModal(false);
        resetForm();
        fetchUsers(); // Refresh the list
      } else {
        throw new Error(result.error || 'Failed to create user');
      }
    } catch (err: any) {
      console.error('Error creating user:', err);
      setError('Failed to create user');
    }
  };
  
  // Edit user handler
  const handleEditUser = async () => {
    if (!selectedUser) return;
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: selectedUser._id,
          ...userForm
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update user');
      }

      const result = await response.json();
      
      if (result.success) {
        setShowEditModal(false);
        resetForm();
        fetchUsers(); // Refresh the list
      } else {
        throw new Error(result.error || 'Failed to update user');
      }
    } catch (err: any) {
      console.error('Error updating user:', err);
      setError('Failed to update user');
    }
  };
  
  // Delete user handler
  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await fetch(`/api/admin/users?userId=${selectedUser._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete user');
      }

      const result = await response.json();
      
      if (result.success) {
        setShowDeleteModal(false);
        setSelectedUser(null);
        fetchUsers(); // Refresh the list
      } else {
        throw new Error(result.error || 'Failed to delete user');
      }
    } catch (err: any) {
      console.error('Error deleting user:', err);
      setError('Failed to delete user');
    }
  };
  
  // Reset form
  const resetForm = () => {
    setUserForm({
      name: '',
      email: '',
      department: '',
      role: '',
      status: 'Active'
    });
    setSelectedUser(null);
  };
  
  // Open edit modal with user data
  const openEditModal = (user: User) => {
    setSelectedUser(user);
    setUserForm({
      name: user.name,
      email: user.email,
      department: user.department,
      role: user.role,
      status: user.status
    });
    setShowEditModal(true);
  };
  
  // Open delete modal
  const openDeleteModal = (user: User) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">User Management</h1>
      
      {/* Search and filters */}
      <div className="flex flex-col md:flex-row items-start md:items-center gap-4 mb-6">
        <div className="w-full md:w-auto flex-grow">
          <input
            type="text"
            placeholder="Search users..."
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="relative">
          <button 
            className="px-4 py-2 border border-gray-300 rounded-md flex items-center justify-between min-w-[180px] bg-white"
            onClick={() => setDepartmentDropdownOpen(!departmentDropdownOpen)}
          >
            <span>{selectedDepartment || 'Department'}</span>
            <span className="ml-2">▼</span>
          </button>
          {departmentDropdownOpen && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
              {departments.map((dept) => (
                <div 
                  key={dept} 
                  className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                  onClick={() => {
                    setSelectedDepartment(dept === "All Departments" ? null : dept);
                    setDepartmentDropdownOpen(false);
                  }}
                >
                  {dept}
                </div>
              ))}
            </div>
          )}
        </div>
        
        <button 
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 font-medium"
          onClick={() => setShowAddModal(true)}
        >
          Add User
        </button>
      </div>
      
      {/* Table */}
      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="min-w-full">
          <thead>
            <tr className="border-b">
              <th className="px-6 py-3 text-left font-medium text-gray-700">Name</th>
              <th className="px-6 py-3 text-left font-medium text-gray-700">Email</th>
              <th className="px-6 py-3 text-left font-medium text-gray-700">Department</th>
              <th className="px-6 py-3 text-left font-medium text-gray-700">Role</th>
              <th className="px-6 py-3 text-left font-medium text-gray-700">Status</th>
              <th className="px-6 py-3 text-left font-medium text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredUsers.map((user) => (
              <tr key={user._id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-800">{user.name}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-700">{user.email}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-700">{user.department}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-700">{user.role}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span 
                    className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      user.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {user.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => openEditModal(user)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => openDeleteModal(user)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Pagination */}
      <div className="flex justify-between items-center mt-6">
        <div className="text-sm text-gray-700">
          Showing 1-{filteredUsers.length} of 124 users
        </div>
        <div className="flex space-x-1">
          <button className="w-8 h-8 flex items-center justify-center bg-white border border-gray-300 rounded text-gray-700 hover:bg-gray-100">
            1
          </button>
          <button className="w-8 h-8 flex items-center justify-center bg-white border border-gray-300 rounded text-gray-700 hover:bg-gray-100">
            2
          </button>
          <button className="w-8 h-8 flex items-center justify-center bg-white border border-gray-300 rounded text-gray-700 hover:bg-gray-100">
            3
          </button>
          <button className="w-8 h-8 flex items-center justify-center bg-white border border-gray-300 rounded text-gray-700 hover:bg-gray-100">
            →
          </button>
        </div>
      </div>
      
      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Add New User</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={userForm.name}
                  onChange={(e) => setUserForm({...userForm, name: e.target.value})}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={userForm.email}
                  onChange={(e) => setUserForm({...userForm, email: e.target.value})}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={userForm.department}
                  onChange={(e) => setUserForm({...userForm, department: e.target.value})}
                >
                  <option value="">Select Department</option>
                  {departments.filter(d => d !== "All Departments").map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={userForm.role}
                  onChange={(e) => setUserForm({...userForm, role: e.target.value})}
                >
                  <option value="">Select Role</option>
                  {roles.map(role => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={userForm.status}
                  onChange={(e) => setUserForm({...userForm, status: e.target.value as 'Active' | 'Inactive'})}
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  resetForm();
                }}
                className="px-4 py-2 border border-gray-300 rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={handleAddUser}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
              >
                Add User
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Edit User Modal */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Edit User</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={userForm.name}
                  onChange={(e) => setUserForm({...userForm, name: e.target.value})}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={userForm.email}
                  onChange={(e) => setUserForm({...userForm, email: e.target.value})}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={userForm.department}
                  onChange={(e) => setUserForm({...userForm, department: e.target.value})}
                >
                  <option value="">Select Department</option>
                  {departments.filter(d => d !== "All Departments").map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={userForm.role}
                  onChange={(e) => setUserForm({...userForm, role: e.target.value})}
                >
                  <option value="">Select Role</option>
                  {roles.map(role => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={userForm.status}
                  onChange={(e) => setUserForm({...userForm, status: e.target.value as 'Active' | 'Inactive'})}
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  resetForm();
                }}
                className="px-4 py-2 border border-gray-300 rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={handleEditUser}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Delete User Modal */}
      {showDeleteModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Delete User</h2>
            
            <p className="mb-6">
              Are you sure you want to delete the user <span className="font-semibold">{selectedUser.name}</span>? This action cannot be undone.
            </p>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteUser}
                className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 