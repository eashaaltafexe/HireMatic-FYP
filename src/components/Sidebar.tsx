"use client"

import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState } from 'react';

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const navItems = [
    { name: 'Dashboard', path: '/admin/dashboard' },
    { name: 'User Management', path: '/admin/users' },
    { name: 'HR Profiles', path: '/admin/hr-profiles' },
    { name: 'Candidate Profiles', path: '/admin/candidate-profiles' },
    { name: 'Scheduled Interviews', path: '/admin/scheduled-interviews' },
    { name: 'Generated Questions', path: '/admin/generated-questions' },
    { name: 'Role Management', path: '/admin/role-management' },
    { name: 'Reports', path: '/admin/reports' },
    { name: 'System Settings', path: '/admin/settings' },
    { name: 'Chat Support', path: '/admin/support' },
  ];

  const handleLogout = () => {
    // Clear any auth tokens from storage
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      sessionStorage.removeItem('token');
      
      // Remove any auth cookies
      document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      
      // Redirect to landing page
      router.push('/');
    }
  };

  return (
    <div className="w-64 h-screen bg-[#2C3E50] text-white flex flex-col">
      {/* User Profile */}
      <div className="p-6 flex items-center space-x-3 border-b border-gray-700">
        <div className="w-12 h-12 rounded-full bg-[#4285F4] flex items-center justify-center text-white font-bold">
          A
        </div>
        <div>
          <div className="font-semibold">Admin User</div>
          <div className="text-sm text-gray-400">Administrator</div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="mt-6 flex-1">
        {navItems.map((item) => (
          <Link
            key={item.name}
            href={item.path}
            className={`block px-6 py-3 font-medium transition-colors ${
              pathname === item.path
                ? 'bg-[#1e2a38] border-l-4 border-[#4285F4]'
                : 'text-gray-300 hover:bg-[#1e2a38]'
            }`}
          >
            {item.name}
          </Link>
        ))}
      </nav>

      {/* Logout */}
      <div className="p-6 border-t border-gray-700">
        <button 
          onClick={() => setShowLogoutConfirm(true)}
          className="w-full text-left py-2 text-gray-300 hover:text-white transition-colors"
        >
          Logout
        </button>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md text-gray-800">
            <h2 className="text-xl font-semibold mb-4">Confirm Logout</h2>
            <p className="mb-6">Are you sure you want to logout from the admin dashboard?</p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-[#4285F4] text-white rounded-md hover:bg-blue-600"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 