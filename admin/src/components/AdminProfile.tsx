import React, { useState } from 'react';

interface AdminProfileProps {
  onClose: () => void;
}

const AdminProfile = ({ onClose }: AdminProfileProps) => {
  const [activeTab, setActiveTab] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);

  const profileData = {
    name: 'Admin User',
    email: 'admin@trees.com',
    role: 'Super Administrator',
    avatar: '/api/placeholder/150/150',
    lastLogin: '2025-08-15 22:30:00',
    permissions: ['User Management', 'Content Moderation', 'Analytics', 'System Settings'],
    roleLevel: 5,
    accessGroups: ['Core Admin', 'System Admin', 'Content Moderator'],
    securityLevel: 'Maximum',
    lastPasswordChange: '2025-07-15 10:30:00',
    twoFactorEnabled: true,
    ipWhitelist: ['192.168.1.100', '10.0.0.50'],
    sessionTimeout: '8 hours',
    loginAttempts: 0,
    maxLoginAttempts: 5
  };

  const [formData, setFormData] = useState({
    name: profileData.name,
    email: profileData.email,
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSave = () => {
    // Here you would typically save to backend
    console.log('Saving profile:', formData);
    setIsEditing(false);
  };

  const handlePasswordChange = () => {
    if (formData.newPassword !== formData.confirmPassword) {
      alert('New passwords do not match!');
      return;
    }
    // Here you would typically update password
    console.log('Updating password');
    setFormData({
      ...formData,
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 font-treesh text-treesh-primary">Treesh Admin Profile</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 overflow-x-auto">
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-6 py-3 font-medium text-sm whitespace-nowrap ${
              activeTab === 'profile'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Profile Info
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`px-6 py-3 font-medium text-sm whitespace-nowrap ${
              activeTab === 'security'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Access Control
          </button>
          <button
            onClick={() => setActiveTab('activity')}
            className={`px-6 py-3 font-medium text-sm whitespace-nowrap ${
              activeTab === 'activity'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Activity Log
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {activeTab === 'profile' && (
            <div className="space-y-6">
              {/* Avatar Section */}
              <div className="flex items-center space-x-4">
                <div className="w-20 h-20 bg-gradient-to-r from-treesh-primary to-treesh-secondary rounded-full flex items-center justify-center text-white text-2xl font-bold font-treesh">
                  {profileData.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">{profileData.name}</h3>
                  <p className="text-gray-600">{profileData.role}</p>
                  <p className="text-sm text-gray-500">Last login: {profileData.lastLogin}</p>
                </div>
              </div>

              {/* Profile Form */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                  <input
                    type="text"
                    value={profileData.role}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Permissions</label>
                  <div className="flex flex-wrap gap-2">
                    {profileData.permissions.map((permission, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-treesh-light text-treesh-primary text-sm rounded-full font-inter"
                      >
                        {permission}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3">
                {!isEditing ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                  >
                    Edit Profile
                  </button>
                ) : (
                  <>
                    <button
                      onClick={handleSave}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                    >
                      Save Changes
                    </button>
                    <button
                      onClick={() => setIsEditing(false)}
                      className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
                    >
                      Cancel
                    </button>
                  </>
                )}
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Access Control & Permissions</h3>
              
              {/* Role Information */}
                              <div className="bg-treesh-light border border-treesh-primary rounded-lg p-4">
                  <h4 className="font-semibold text-treesh-primary mb-3">Current Role: {profileData.role}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-treesh-primary">Role Level: <span className="font-medium">{profileData.roleLevel}/5</span></p>
                      <p className="text-sm text-treesh-primary">Security Level: <span className="font-medium">{profileData.securityLevel}</span></p>
                      <p className="text-sm text-treesh-primary">Session Timeout: <span className="font-medium">{profileData.sessionTimeout}</span></p>
                    </div>
                    <div>
                      <p className="text-sm text-treesh-primary">2FA Enabled: <span className="font-medium">{profileData.twoFactorEnabled ? 'Yes' : 'No'}</span></p>
                      <p className="text-sm text-treesh-primary">Last Password Change: <span className="font-medium">{profileData.lastPasswordChange}</span></p>
                      <p className="text-sm text-treesh-primary">Login Attempts: <span className="font-medium">{profileData.loginAttempts}/{profileData.maxLoginAttempts}</span></p>
                    </div>
                  </div>
                </div>

              {/* Access Groups */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Access Groups</h4>
                <div className="flex flex-wrap gap-2">
                  {profileData.accessGroups.map((group, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full border border-green-200"
                    >
                      {group}
                    </span>
                  ))}
                </div>
              </div>

              {/* Permissions Matrix */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Permission Matrix</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {profileData.permissions.map((permission, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm font-medium text-gray-700">{permission}</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-green-600 text-sm">✓ Full Access</span>
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* IP Whitelist */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">IP Address Whitelist</h4>
                <div className="space-y-2">
                  {profileData.ipWhitelist.map((ip, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="text-sm text-gray-700 font-mono">{ip}</span>
                      <button className="text-red-600 hover:text-red-800 text-sm">Remove</button>
                    </div>
                  ))}
                  <button className="bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700">
                    Add IP Address
                  </button>
                </div>
              </div>

              {/* Password Change Section */}
              <div className="border-t pt-6">
                <h4 className="font-semibold text-gray-900 mb-3">Change Password</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
                    <input
                      type="password"
                      name="currentPassword"
                      value={formData.currentPassword}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                    <input
                      type="password"
                      name="newPassword"
                      value={formData.newPassword}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
                    <input
                      type="password"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <button
                    onClick={handlePasswordChange}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                  >
                    Update Password
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'activity' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">Logged in from 192.168.1.100</span>
                  <span className="text-xs text-gray-400 ml-auto">2 min ago</span>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">Updated user permissions</span>
                  <span className="text-xs text-gray-400 ml-auto">1 hour ago</span>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">Reviewed 5 reported posts</span>
                  <span className="text-xs text-gray-400 ml-auto">3 hours ago</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminProfile;
