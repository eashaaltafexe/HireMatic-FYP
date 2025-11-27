"use client"

import { useState } from 'react';

export default function SystemSettings() {
  const [activeTab, setActiveTab] = useState('general');
  const [companyInfo, setCompanyInfo] = useState({
    name: 'Acme Corporation',
    website: 'www.acmecorp.com',
    address: '123 Business Avenue\nSan Francisco, CA 94103'
  });
  
  const [regionalSettings, setRegionalSettings] = useState({
    timeZone: 'Pacific Time (GMT-7)',
    dateFormat: 'MM/DD/YYYY'
  });
  
  const [branding, setBranding] = useState({
    themeColor: 'Default Blue'
  });
  
  const [securitySettings, setSecuritySettings] = useState({
    twoFactorAuth: true,
    passwordExpiry: 90,
    minPasswordLength: 8,
    sessionTimeout: 30,
    loginAttempts: 5
  });
  
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    appNotifications: true,
    dailyDigest: false,
    newCandidates: true,
    interviewReminders: true,
    systemUpdates: true
  });
  
  const [integrationSettings, setIntegrationSettings] = useState({
    googleCalendar: true,
    microsoftTeams: false,
    slack: true,
    zoom: true,
    ats: {
      connected: true,
      provider: 'Workday',
      lastSync: '2023-05-15T10:30:00Z'
    }
  });
  
  const [backupSettings, setBackupSettings] = useState({
    autoBackup: true,
    backupFrequency: 'daily',
    lastBackup: '2023-05-18T05:00:00Z',
    storageLocation: 'cloud',
    retentionPeriod: 30
  });
  
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Handle input change for company info
  const handleCompanyInfoChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCompanyInfo(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle dropdown change
  const handleDropdownChange = (setting: string, value: string) => {
    if (setting === 'timeZone' || setting === 'dateFormat') {
      setRegionalSettings(prev => ({
        ...prev,
        [setting]: value
      }));
    } else if (setting === 'themeColor') {
      setBranding(prev => ({
        ...prev,
        [setting]: value
      }));
    } else if (setting === 'backupFrequency') {
      setBackupSettings(prev => ({
        ...prev,
        [setting]: value
      }));
    }
  };
  
  // Handle security settings change
  const handleSecurityChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const newValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : 
                    type === 'number' ? parseInt(value) : value;
    
    setSecuritySettings(prev => ({
      ...prev,
      [name]: newValue
    }));
  };
  
  // Handle notification settings change
  const handleNotificationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setNotificationSettings(prev => ({
      ...prev,
      [name]: checked
    }));
  };
  
  // Handle integration settings change
  const handleIntegrationChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, type } = e.target;
    const value = type === 'checkbox' ? (e.target as HTMLInputElement).checked : 
                 (e.target as HTMLSelectElement).value;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setIntegrationSettings(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent as keyof typeof prev] as object,
          [child]: value
        }
      }));
    } else {
      setIntegrationSettings(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };
  
  // Handle backup settings change
  const handleBackupChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, type } = e.target;
    const value = type === 'checkbox' ? (e.target as HTMLInputElement).checked : 
                 type === 'number' ? parseInt((e.target as HTMLInputElement).value) :
                 (e.target as HTMLSelectElement).value;
    
    setBackupSettings(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle logo upload
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setLogoFile(e.target.files[0]);
    }
  };

  // Save changes
  const saveChanges = async () => {
    setIsSaving(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Show success message
    setShowSuccessMessage(true);
    
    // Hide success message after 3 seconds
    setTimeout(() => {
      setShowSuccessMessage(false);
    }, 3000);
    
    setIsSaving(false);
  };

  // Format date from ISO string
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">System Settings</h1>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg mb-6">
        <nav className="flex border-b border-gray-200">
          {['General', 'Security', 'Notifications'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab.toLowerCase())}
              className={`py-4 px-8 font-medium ${
                activeTab === tab.toLowerCase()
                  ? 'text-[#4285F4] border-b-2 border-[#4285F4] bg-white'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {/* Settings Content */}
      <div className="bg-white rounded-lg shadow p-6">
        {activeTab === 'general' && (
          <div className="space-y-8">
            {/* Company Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Company Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Company Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={companyInfo.name}
                    onChange={handleCompanyInfoChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Website
                  </label>
                  <input
                    type="text"
                    name="website"
                    value={companyInfo.website}
                    onChange={handleCompanyInfoChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Company Address
                </label>
                <textarea
                  name="address"
                  value={companyInfo.address}
                  onChange={handleCompanyInfoChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Regional Settings */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Regional Settings</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Time Zone
                  </label>
                  <div className="relative">
                    <select
                      value={regionalSettings.timeZone}
                      onChange={(e) => handleDropdownChange('timeZone', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Pacific Time (GMT-7)">Pacific Time (GMT-7)</option>
                      <option value="Mountain Time (GMT-6)">Mountain Time (GMT-6)</option>
                      <option value="Central Time (GMT-5)">Central Time (GMT-5)</option>
                      <option value="Eastern Time (GMT-4)">Eastern Time (GMT-4)</option>
                      <option value="UTC">UTC</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date Format
                  </label>
                  <div className="relative">
                    <select
                      value={regionalSettings.dateFormat}
                      onChange={(e) => handleDropdownChange('dateFormat', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                      <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                      <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Branding */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Branding</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Theme Color
                  </label>
                  <div className="relative">
                    <div className="flex items-center px-3 py-2 border border-gray-300 rounded-md">
                      <div className="w-6 h-6 bg-[#4285F4] rounded-full mr-2"></div>
                      <span>{branding.themeColor}</span>
                      <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Logo
                  </label>
                  <button
                    onClick={() => document.getElementById('logo-upload')?.click()}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-center hover:bg-gray-50"
                  >
                    {logoFile ? logoFile.name : 'Upload Logo'}
                  </button>
                  <input
                    id="logo-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end mt-8">
              <button
                onClick={saveChanges}
                disabled={isSaving}
                className="px-6 py-2 bg-[#4285F4] text-white rounded-md hover:bg-blue-600 transition"
              >
                {isSaving ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </span>
                ) : 'Save Changes'}
              </button>
            </div>

            {/* Success Message */}
            {showSuccessMessage && (
              <div className="mt-4 p-3 bg-green-100 text-green-800 rounded-md">
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  Settings saved successfully!
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'security' && (
          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Authentication Settings</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="font-medium text-gray-700">Two-Factor Authentication</label>
                    <p className="text-sm text-gray-500">Require two-factor authentication for all users</p>
                  </div>
                  <div className="flex items-center">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        name="twoFactorAuth"
                        checked={securitySettings.twoFactorAuth}
                        onChange={handleSecurityChange}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-blue-300 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Password Expiry (days)
                    </label>
                    <input
                      type="number"
                      name="passwordExpiry"
                      value={securitySettings.passwordExpiry}
                      onChange={handleSecurityChange}
                      min="0"
                      max="365"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="mt-1 text-xs text-gray-500">Set to 0 for never expire</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Minimum Password Length
                    </label>
                    <input
                      type="number"
                      name="minPasswordLength"
                      value={securitySettings.minPasswordLength}
                      onChange={handleSecurityChange}
                      min="6"
                      max="20"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Session Timeout (minutes)
                    </label>
                    <input
                      type="number"
                      name="sessionTimeout"
                      value={securitySettings.sessionTimeout}
                      onChange={handleSecurityChange}
                      min="5"
                      max="240"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Max Failed Login Attempts
                    </label>
                    <input
                      type="number"
                      name="loginAttempts"
                      value={securitySettings.loginAttempts}
                      onChange={handleSecurityChange}
                      min="3"
                      max="10"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Security Logs</h3>
              <div className="bg-gray-50 p-4 rounded-md">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-sm font-medium text-gray-600">Recent Activity</span>
                  <button className="text-blue-600 text-sm hover:text-blue-800">
                    View All Logs
                  </button>
                </div>
                <div className="space-y-3">
                  <div className="text-sm">
                    <div className="flex justify-between">
                      <span className="font-medium">Admin login</span>
                      <span className="text-gray-500">2 hours ago</span>
                    </div>
                    <p className="text-gray-600">Admin user logged in from 192.168.1.1</p>
                  </div>
                  <div className="text-sm">
                    <div className="flex justify-between">
                      <span className="font-medium">Password change</span>
                      <span className="text-gray-500">Yesterday</span>
                    </div>
                    <p className="text-gray-600">User "hr_manager" changed their password</p>
                  </div>
                  <div className="text-sm">
                    <div className="flex justify-between">
                      <span className="font-medium">Permission update</span>
                      <span className="text-gray-500">3 days ago</span>
                    </div>
                    <p className="text-gray-600">Role "Recruiter" permissions were updated</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Email Notifications</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="font-medium text-gray-700">Email Notifications</label>
                    <p className="text-sm text-gray-500">Receive notifications via email</p>
                  </div>
                  <div className="flex items-center">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        name="emailNotifications"
                        checked={notificationSettings.emailNotifications}
                        onChange={handleNotificationChange}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-blue-300 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <label className="font-medium text-gray-700">Daily Digest</label>
                    <p className="text-sm text-gray-500">Receive a daily summary of activities</p>
                  </div>
                  <div className="flex items-center">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        name="dailyDigest"
                        checked={notificationSettings.dailyDigest}
                        onChange={handleNotificationChange}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-blue-300 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Application Notifications</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="font-medium text-gray-700">In-App Notifications</label>
                    <p className="text-sm text-gray-500">Receive notifications within the application</p>
                  </div>
                  <div className="flex items-center">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        name="appNotifications"
                        checked={notificationSettings.appNotifications}
                        onChange={handleNotificationChange}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-blue-300 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Event Notifications</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="font-medium text-gray-700">New Candidates</label>
                    <p className="text-sm text-gray-500">Get notified when new candidates are added</p>
                  </div>
                  <div className="flex items-center">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        name="newCandidates"
                        checked={notificationSettings.newCandidates}
                        onChange={handleNotificationChange}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-blue-300 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <label className="font-medium text-gray-700">Interview Reminders</label>
                    <p className="text-sm text-gray-500">Get reminders for upcoming interviews</p>
                  </div>
                  <div className="flex items-center">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        name="interviewReminders"
                        checked={notificationSettings.interviewReminders}
                        onChange={handleNotificationChange}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-blue-300 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <label className="font-medium text-gray-700">System Updates</label>
                    <p className="text-sm text-gray-500">Get notified about system updates and maintenance</p>
                  </div>
                  <div className="flex items-center">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        name="systemUpdates"
                        checked={notificationSettings.systemUpdates}
                        onChange={handleNotificationChange}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-blue-300 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end mt-8">
              <button
                onClick={saveChanges}
                disabled={isSaving}
                className="px-6 py-2 bg-[#4285F4] text-white rounded-md hover:bg-blue-600 transition"
              >
                {isSaving ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </span>
                ) : 'Save Changes'}
              </button>
            </div>

            {/* Success Message */}
            {showSuccessMessage && (
              <div className="mt-4 p-3 bg-green-100 text-green-800 rounded-md">
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  Settings saved successfully!
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab !== 'general' && activeTab !== 'security' && activeTab !== 'notifications' && (
          <div className="flex flex-col items-center justify-center h-64">
            <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
            <p className="text-gray-500 text-lg">This section is under development.</p>
            <p className="text-gray-400">Please check back later.</p>
          </div>
        )}
      </div>
    </div>
  );
} 