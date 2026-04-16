import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  Video, 
  MessageSquare, 
  Bell, 
  BarChart3, 
  Settings, 
  Target,
  Zap,
  Globe
} from 'lucide-react';
import logo from './logo.svg';

interface AdminSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  isMobile: boolean;
  onClose: () => void;
}

const AdminSidebar = ({ activeTab, onTabChange, isMobile, onClose }: AdminSidebarProps) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const menuItems = [
    { id: 'overview', name: 'Dashboard', icon: '📊', color: 'text-blue-600' },
    { id: 'users', name: 'User Management', icon: '👥', color: 'text-green-600' },
    { id: 'content', name: 'Content Moderation', icon: '🛡️', color: 'text-red-600' },
    { id: 'livestream', name: 'Livestream Controls', icon: '📺', color: 'text-purple-600' },
    { id: 'psa', name: 'PSA', icon: '📢', color: 'text-orange-600' },
    { id: 'notifications', name: 'Notifications', icon: '🔔', color: 'text-indigo-600' },
    { id: 'analytics', name: 'Analytics & Reports', icon: '📈', color: 'text-teal-600' },
    { id: 'matchmaking', name: 'Matchmaking Oversight', icon: '💬', color: 'text-pink-600' },
    { id: 'subscriptions', name: 'Subscriptions', icon: '💎', color: 'text-yellow-600' },
    { id: 'website', name: 'Website Management', icon: '🌐', color: 'text-gray-600' },
  // { id: 'settings', name: 'Admin Settings', icon: '⚙️', color: 'text-slate-600' },
  ];

  const handleTabClick = (tabId: string) => {
    onTabChange(tabId);
    if (isMobile) {
      onClose();
    }
  };

  return (
    <div className={`
      ${isMobile ? 'fixed inset-y-0 left-0 z-50 w-64 sm:w-72' : 'relative'}
      ${isMobile ? '' : 'hidden lg:block'}
      bg-white border-r border-gray-200 shadow-lg
    `} style={{ backgroundColor: 'white', borderRight: '1px solid #e5e7eb', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}>
      {/* Sidebar Header */}
      <div className="flex items-center justify-between px-4 py-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <img src={logo} alt="Admin Logo" className="h-8 w-8" />
          <div>
            <h2 className="text-lg font-bold text-gray-900">Admin Panel</h2>
            <p className="text-sm text-gray-500">Administrator</p>
          </div>
        </div>
        {isMobile && (
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors duration-200"
            aria-label="Close sidebar"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 overflow-y-auto py-3 sm:py-4">
        <div className="px-2 sm:px-3 space-y-1 sm:space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleTabClick(item.id)}
              className={`
                w-full flex items-center space-x-2 sm:space-x-3 px-2 sm:px-3 py-2 sm:py-3 rounded-lg text-left transition-all duration-200
                ${activeTab === item.id
                  ? 'bg-treesh-light border-l-4 border-treesh-primary text-treesh-primary'
                  : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                }
              `}
            >
              <span className="text-lg sm:text-xl">{item.icon}</span>
              {!isCollapsed && (
                <span className="font-medium text-sm sm:text-base">{item.name}</span>
              )}
            </button>
          ))}
        </div>
      </nav>

      {/* Footer */}
      {!isCollapsed && (
        <div className="p-3 sm:p-4 border-t border-gray-200">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gray-300 rounded-full"></div>
            <div>
              <p className="text-xs sm:text-sm font-medium text-gray-900">Admin User</p>
              <p className="text-xs text-gray-500">Super Admin</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSidebar;