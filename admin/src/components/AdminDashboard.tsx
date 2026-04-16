import React, { useState, useEffect } from 'react';
import AdminSidebar from './AdminSidebar';
import { AdminUserManagement } from './AdminUserManagement';
import AdminContentModeration from './AdminContentModeration';
import AdminAnalytics from './AdminAnalytics';
import { AdminSettings } from './AdminSettings';
import AdminPSAManagement from './AdminPSAManagement';
import { AdminNotifications } from './AdminNotifications';
import { toast } from 'sonner';
import { Toaster } from 'sonner';
import logo from './logo.svg';
import { Button } from './ui/button';
import { User, LogOut } from 'lucide-react';
import { dashboardService, DashboardStats, RecentActivity } from '../services/api/dashboard';
import { subscriptionPlanService, AdminSubscriptionPlan, AdminSubscriptionPurchase } from '../services/api/subscriptionPlans';

interface AdminDashboardProps {
  initialSection?: string;
  onLogout?: () => void;
  user?: any; 
}

const AdminDashboard = ({ initialSection = 'overview', onLogout, user }: AdminDashboardProps) => {
  const [activeTab, setActiveTab] = useState(initialSection);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showLogout, setShowLogout] = useState(false);
  
  // Dashboard Stats State
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    totalUsers: 0,
    activeUsers: 0,
    totalPosts: 0,
    liveStreams: 0
  });
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);
  
  // User Management States
  const [showAddUser, setShowAddUser] = useState(false);
  const [showEditUser, setShowEditUser] = useState(false);
  const [showDeleteUser, setShowDeleteUser] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  
  // Content Moderation States
  const [showContentReview, setShowContentReview] = useState(false);
  const [selectedContent, setSelectedContent] = useState(null);
  
  // Livestream States
  const [showStreamControl, setShowStreamControl] = useState(false);
  const [selectedStream, setSelectedStream] = useState(null);
  
  // PSA States
  const [showPSACreate, setShowPSACreate] = useState(false);
  const [showPSAEdit, setShowPSAEdit] = useState(false);
  const [selectedPSA, setSelectedPSA] = useState(null);
  
  // Notification States
  const [showNotificationCreate, setShowNotificationCreate] = useState(false);
  const [showNotificationAnalytics, setShowNotificationAnalytics] = useState(false);
  
  // Matchmaking States
  const [showMatchDetails, setShowMatchDetails] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState(null);
  
  // Website Management States
  const [showWebsiteEditor, setShowWebsiteEditor] = useState(false);
  const [showSEOSettings, setShowSEOSettings] = useState(false);
  
  // Subscription States
  const [showSubscriptionCreate, setShowSubscriptionCreate] = useState(false);
  const [showSubscriptionEdit, setShowSubscriptionEdit] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState(null);
  const [subscriptionPlans, setSubscriptionPlans] = useState<AdminSubscriptionPlan[]>([]);
  const [plansLoading, setPlansLoading] = useState(false);
  const [planName, setPlanName] = useState('');
  const [planCode, setPlanCode] = useState('');
  const [planPrice, setPlanPrice] = useState('');
  const [planDescription, setPlanDescription] = useState('');
  const [planFeaturesInput, setPlanFeaturesInput] = useState('');
  const [subscriptionPurchases, setSubscriptionPurchases] = useState<AdminSubscriptionPurchase[]>([]);
  const [purchasesLoading, setPurchasesLoading] = useState(false);
  
  // Settings States
  const [showSettings, setShowSettings] = useState(false);

  // Mock user data
  const [users, setUsers] = useState([
    {
      id: 1,
      name: 'John Doe',
      email: 'john@example.com',
      status: 'Active',
      role: 'User',
      avatar: '/api/placeholder/150/150',
      joinDate: '2025-01-15',
      lastLogin: '2025-08-15 22:30:00'
    },
    {
      id: 2,
      name: 'Jane Smith',
      email: 'jane@example.com',
      status: 'Active',
      role: 'Moderator',
      avatar: '/api/placeholder/150/150',
      joinDate: '2025-02-20',
      lastLogin: '2025-08-15 21:15:00'
    },
    {
      id: 3,
      name: 'Mike Johnson',
      email: 'mike@example.com',
      status: 'Suspended',
      role: 'User',
      avatar: '/api/placeholder/150/150',
      joinDate: '2025-03-10',
      lastLogin: '2025-08-10 15:45:00'
    }
  ]);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    // Close mobile sidebar when tab changes
    setMobileSidebarOpen(false);
  };

  const toggleMobileSidebar = () => {
    setMobileSidebarOpen(!mobileSidebarOpen);
  };

  // Close mobile sidebar when clicking outside
  const handleClickOutside = (e: React.MouseEvent) => {
    if (mobileSidebarOpen && e.target === e.currentTarget) {
      setMobileSidebarOpen(false);
    }
  };

  // Close mobile sidebar when pressing Escape key
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && mobileSidebarOpen) {
        setMobileSidebarOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [mobileSidebarOpen]);

  // Fetch dashboard data on component mount
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoadingStats(true);
        
        // Fetch all dashboard data in parallel
        const [stats, activities] = await Promise.all([
          dashboardService.getStats(),
          dashboardService.getRecentActivities(10)
        ]);
        
        setDashboardStats(stats);
        setRecentActivities(activities);
        
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
        toast.error('Failed to load dashboard data');
      } finally {
        setLoadingStats(false);
      }
    };

    fetchDashboardData();
    
    // Refresh data every 5 minutes
    const interval = setInterval(fetchDashboardData, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  const loadSubscriptionPlans = async () => {
    try {
      setPlansLoading(true);
      const plans = await subscriptionPlanService.getPlans();
      setSubscriptionPlans(plans);
    } catch (error) {
      console.error('Failed to load subscription plans:', error);
      toast.error('Failed to load subscription plans');
    } finally {
      setPlansLoading(false);
    }
  };

  const loadSubscriptionPurchases = async () => {
    try {
      setPurchasesLoading(true);
      const response = await subscriptionPlanService.getPurchases(1, 30);
      setSubscriptionPurchases(response.items || []);
    } catch (error) {
      console.error('Failed to load subscription purchases:', error);
      toast.error('Failed to load purchase history');
    } finally {
      setPurchasesLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'subscriptions') {
      loadSubscriptionPlans();
      loadSubscriptionPurchases();
    }
  }, [activeTab]);

  const handleCreateSubscriptionPlan = async () => {
    const trimmedName = planName.trim();
    const trimmedCode = planCode.trim().toLowerCase();
    const parsedPrice = Number(planPrice);

    if (!trimmedName || !trimmedCode || Number.isNaN(parsedPrice)) {
      toast.error('Plan name, code, and valid price are required');
      return;
    }

    const features = planFeaturesInput
      .split(',')
      .map((feature) => feature.trim())
      .filter(Boolean);

    try {
      await subscriptionPlanService.createPlan({
        name: trimmedName,
        code: trimmedCode,
        price: parsedPrice,
        description: planDescription.trim(),
        features,
        currency: 'USD',
        isActive: true,
      });

      toast.success('Subscription plan created successfully');
      setPlanName('');
      setPlanCode('');
      setPlanPrice('');
      setPlanDescription('');
      setPlanFeaturesInput('');
      await loadSubscriptionPlans();
    } catch (error: any) {
      const message = error?.response?.data?.error || 'Failed to create plan';
      toast.error(message);
    }
  };

  const handleLogout = () => {
    // Show success message
    toast.success('Logged out successfully');
    
    // Close any open modals
    setShowLogout(false);
    
    // Use the passed onLogout function if available, otherwise redirect
    if (onLogout) {
      onLogout();
    } else {
      // Fallback: clear token and redirect to root
      localStorage.removeItem('admin_token');
      window.location.href = '/';
    }
  };

  // User Management Functions
  const handleAddUser = (userData) => {
    const newUser = {
      id: users.length + 1,
      ...userData,
      joinDate: new Date().toISOString().split('T')[0],
      lastLogin: 'Never',
      status: 'Active'
    };
    setUsers([...users, newUser]);
    setShowAddUser(false);
    setMobileSidebarOpen(false); // Close mobile sidebar
    toast.success('User added successfully');
  };

  const handleEditUser = (userData) => {
    setUsers(users.map(user => 
      user.id === selectedUser.id ? { ...user, ...userData } : user
    ));
    setShowEditUser(false);
    setSelectedUser(null);
    setMobileSidebarOpen(false); // Close mobile sidebar
    toast.success('User updated successfully');
  };

  const handleDeleteUser = () => {
    setUsers(users.filter(user => user.id !== selectedUser.id));
    setShowDeleteUser(false);
    setSelectedUser(null);
    setMobileSidebarOpen(false); // Close mobile sidebar
    toast.success('User deleted successfully');
  };

  const openEditUser = (user) => {
    setSelectedUser(user);
    setShowEditUser(true);
    setMobileSidebarOpen(false); // Close mobile sidebar
  };

  const openDeleteUser = (user) => {
    setSelectedUser(user);
    setShowDeleteUser(true);
    setMobileSidebarOpen(false); // Close mobile sidebar
  };

  // Helper function to format numbers with commas
  const formatNumber = (num: number): string => {
    return num.toLocaleString();
  };

  const normalizeCurrency = (currency?: string): string => {
    const value = String(currency || 'USD').toUpperCase();
    return value === 'INR' ? 'USD' : value;
  };

  const formatCurrencyAmount = (amount: number, currency?: string): string => {
    const normalized = normalizeCurrency(currency);
    if (normalized === 'USD') {
      return `$${Number(amount || 0).toFixed(2)}`;
    }
    return `${normalized} ${Number(amount || 0).toFixed(2)}`;
  };

  const stats = [
    { 
      label: 'Total Users', 
      value: loadingStats ? '...' : formatNumber(dashboardStats.totalUsers), 
      change: '+20.1%', 
      color: 'text-green-600' 
    },
    { 
      label: 'Active Users', 
      value: loadingStats ? '...' : formatNumber(dashboardStats.activeUsers), 
      change: '+8.2%', 
      color: 'text-blue-600' 
    },
    { 
      label: 'Total Posts', 
      value: loadingStats ? '...' : formatNumber(dashboardStats.totalPosts), 
      change: '+12.5%', 
      color: 'text-purple-600' 
    },
    { 
      label: 'Live Streams', 
      value: loadingStats ? '...' : formatNumber(dashboardStats.liveStreams), 
      change: '+3.1%', 
      color: 'text-red-600' 
    },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-4 sm:space-y-6">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Dashboard Overview</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
              {stats.map((stat, index) => (
                <div key={index} className="bg-white p-3 sm:p-6 rounded-lg shadow border">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs sm:text-sm font-medium text-gray-600">{stat.label}</p>
                      <p className="text-lg sm:text-2xl font-bold text-gray-900">{stat.value}</p>
                    </div>
                    <span className={`text-xs sm:text-sm font-medium ${stat.color}`}>{stat.change}</span>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="bg-white p-3 sm:p-6 rounded-lg shadow border">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Recent Activity</h3>
              <div className="space-y-2 sm:space-y-3">
                {recentActivities.length > 0 ? (
                  recentActivities.map((activity) => {
                    const getActivityColor = (type: string) => {
                      switch (type) {
                        case 'user_registration': return 'bg-green-500';
                        case 'content_reported': return 'bg-blue-500';
                        case 'post_created': return 'bg-purple-500';
                        case 'user_login': return 'bg-yellow-500';
                        default: return 'bg-gray-500';
                      }
                    };

                    const getTimeAgo = (timestamp: string) => {
                      const now = new Date();
                      const activityTime = new Date(timestamp);
                      const diffInMinutes = Math.floor((now.getTime() - activityTime.getTime()) / (1000 * 60));
                      
                      if (diffInMinutes < 1) return 'just now';
                      if (diffInMinutes < 60) return `${diffInMinutes} min ago`;
                      
                      const diffInHours = Math.floor(diffInMinutes / 60);
                      if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
                      
                      const diffInDays = Math.floor(diffInHours / 24);
                      return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
                    };

                    return (
                      <div key={activity.id} className="flex items-center space-x-2 sm:space-x-3 p-2 sm:p-3 bg-gray-50 rounded">
                        <div className={`w-2 h-2 ${getActivityColor(activity.type)} rounded-full flex-shrink-0`}></div>
                        <span className="text-xs sm:text-sm text-gray-600">{activity.message}</span>
                        <span className="text-xs text-gray-400 ml-auto flex-shrink-0">
                          {getTimeAgo(activity.timestamp)}
                        </span>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    {loadingStats ? 'Loading activities...' : 'No recent activities'}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      
      case 'users':
        return (
          <div className="space-y-4 sm:space-y-6">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">User Management</h2>
            <AdminUserManagement section="all-users" />
          </div>
        );

      case 'content':
        return (
          <div className="space-y-4 sm:space-y-6">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Content Moderation</h2>
            <AdminContentModeration />
          </div>
        );

      case 'analytics':
        return (
          <div className="space-y-4 sm:space-y-6">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Analytics & Reports</h2>
            <AdminAnalytics />
          </div>
        );

      case 'settings':
        return (
          <div className="space-y-4 sm:space-y-6">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Admin Settings</h2>
            <AdminSettings />
          </div>
        );

      case 'livestream':
        return (
          <div className="space-y-4 sm:space-y-6">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Livestream Controls</h2>
            
            {/* Active Streams */}
            <div className="bg-white p-3 sm:p-6 rounded-lg shadow border">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Active Livestreams</h3>
              <div className="space-y-3 sm:space-y-4">
                <div className="border border-gray-200 rounded-lg p-3 sm:p-4">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start space-y-3 sm:space-y-0">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 text-sm sm:text-base">Gaming Stream by @GamerPro</h4>
                      <p className="text-xs sm:text-sm text-gray-600">Playing Call of Duty • 1,234 viewers</p>
                      <p className="text-xs text-gray-500 mt-1">Started: 2 hours ago • Category: Gaming</p>
                    </div>
                    <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                      <button 
                        className="bg-yellow-600 text-white px-2 sm:px-3 py-1 sm:py-2 rounded text-xs sm:text-sm hover:bg-yellow-700 w-full sm:w-auto"
                        onClick={() => toast.success('Stream flagged for review')}
                      >
                        Flag
                      </button>
                      <button 
                        className="bg-red-600 text-white px-2 sm:px-3 py-1 sm:py-2 rounded text-xs sm:text-sm hover:bg-red-700 w-full sm:w-auto"
                        onClick={() => toast.success('Stream ended successfully')}
                      >
                        End Stream
                      </button>
                    </div>
                  </div>
                </div>
                <div className="border border-gray-200 rounded-lg p-3 sm:p-4">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start space-y-3 sm:space-y-0">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 text-sm sm:text-base">Music Session by @MusicLover</h4>
                      <p className="text-xs sm:text-sm text-gray-600">Acoustic guitar covers • 567 viewers</p>
                      <p className="text-xs text-gray-500 mt-1">Started: 1 hour ago • Category: Music</p>
                    </div>
                    <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                      <button 
                        className="bg-yellow-600 text-white px-2 sm:px-3 py-1 sm:py-2 rounded text-xs sm:text-sm hover:bg-yellow-700 w-full sm:w-auto"
                        onClick={() => toast.success('Stream flagged for review')}
                      >
                        Flag
                      </button>
                      <button 
                        className="bg-red-600 text-white px-2 sm:px-3 py-1 sm:py-2 rounded text-xs sm:text-sm hover:bg-red-700 w-full sm:w-auto"
                        onClick={() => toast.success('Stream ended successfully')}
                      >
                        End Stream
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Streamer Management */}
            <div className="bg-white p-3 sm:p-6 rounded-lg shadow border">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Streamer Access Control</h3>
              <div className="space-y-3 sm:space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 bg-gray-50 rounded-lg space-y-3 sm:space-y-0">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 text-sm sm:text-base">@GamerPro</h4>
                    <p className="text-xs sm:text-sm text-gray-600">Verified Streamer • Gaming Category</p>
                  </div>
                  <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                    <button 
                      className="bg-green-600 text-white px-2 sm:px-3 py-1 sm:py-2 rounded text-xs sm:text-sm hover:bg-green-700 w-full sm:w-auto"
                      onClick={() => toast.success('Streamer access allowed')}
                    >
                      Allow
                    </button>
                    <button 
                      className="bg-red-600 text-white px-2 sm:px-3 py-1 sm:py-2 rounded text-xs sm:text-sm hover:bg-red-700 w-full sm:w-auto"
                      onClick={() => toast.success('Streamer suspended')}
                    >
                      Suspend
                    </button>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 bg-gray-50 rounded-lg space-y-3 sm:space-y-0">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 text-sm sm:text-base">@MusicLover</h4>
                    <p className="text-xs sm:text-sm text-gray-600">New Streamer • Music Category</p>
                  </div>
                  <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                    <button 
                      className="bg-green-600 text-white px-2 sm:px-3 py-1 sm:py-2 rounded text-xs sm:text-sm hover:bg-green-700 w-full sm:w-auto"
                      onClick={() => toast.success('Streamer access allowed')}
                    >
                      Allow
                    </button>
                    <button 
                      className="bg-red-600 text-white px-2 sm:px-3 py-1 sm:py-2 rounded text-xs sm:text-sm hover:bg-red-700 w-full sm:w-auto"
                      onClick={() => toast.success('Streamer suspended')}
                    >
                      Suspend
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'notifications':
        return <AdminNotifications />;

      case 'matchmaking':
        return (
          <div className="space-y-4 sm:space-y-6">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Matchmaking Oversight</h2>
            <div className="bg-white p-3 sm:p-6 rounded-lg shadow border">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Active Matches</h3>
              <div className="space-y-3 sm:space-y-4">
                <div className="border border-gray-200 rounded-lg p-3 sm:p-4">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start space-y-3 sm:space-y-0">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 text-sm sm:text-base">Match #1234</h4>
                      <p className="text-xs sm:text-sm text-gray-600">User A ↔ User B • Started: 2 hours ago</p>
                      <p className="text-xs text-gray-500 mt-1">Status: Active • Duration: 2h 15m</p>
                    </div>
                    <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                      <button 
                        className="bg-yellow-600 text-white px-2 sm:px-3 py-1 sm:py-2 rounded text-xs sm:text-sm hover:bg-yellow-700 w-full sm:w-auto"
                        onClick={() => toast.success('Match flagged for review')}
                      >
                        Flag
                      </button>
                      <button 
                        className="bg-red-600 text-white px-2 sm:px-3 py-1 sm:py-2 rounded text-xs sm:text-sm hover:bg-red-700 w-full sm:w-auto"
                        onClick={() => toast.success('Match ended successfully')}
                      >
                        End Match
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'subscriptions':
        return (
          <div className="space-y-4 sm:space-y-6">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Subscription Management</h2>
            <div className="bg-white p-3 sm:p-6 rounded-lg shadow border">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Create New Subscription Plan</h3>
              <div className="space-y-3 sm:space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">Plan Name</label>
                    <input 
                      type="text" 
                      placeholder="Enter plan name"
                      value={planName}
                      onChange={(e) => {
                        setPlanName(e.target.value);
                        if (!planCode.trim()) {
                          const generated = e.target.value
                            .toLowerCase()
                            .replace(/[^a-z0-9]+/g, '-')
                            .replace(/^-+|-+$/g, '');
                          setPlanCode(generated);
                        }
                      }}
                      className="w-full px-2 sm:px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                    />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">Plan Code</label>
                    <input 
                      type="text" 
                      placeholder="gold"
                      value={planCode}
                      onChange={(e) => setPlanCode(e.target.value)}
                      className="w-full px-2 sm:px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                    />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">Price</label>
                    <input 
                      type="number" 
                      placeholder="0.00"
                      value={planPrice}
                      onChange={(e) => setPlanPrice(e.target.value)}
                      className="w-full px-2 sm:px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                    />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">Features (comma separated)</label>
                    <input 
                      type="text" 
                      placeholder="Priority chat, Exclusive content"
                      value={planFeaturesInput}
                      onChange={(e) => setPlanFeaturesInput(e.target.value)}
                      className="w-full px-2 sm:px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-900 mb-1 sm:mb-2">Description</label>
                  <textarea 
                    rows={3}
                    placeholder="Enter plan description"
                    value={planDescription}
                    onChange={(e) => setPlanDescription(e.target.value)}
                    className="w-full px-2 sm:px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                  />
                </div>
                <button 
                  className="bg-blue-600 text-white px-4 sm:px-6 py-2 rounded-lg hover:bg-blue-700 w-full sm:w-auto text-sm sm:text-base"
                  onClick={handleCreateSubscriptionPlan}
                >
                  Create Plan
                </button>

                <div className="mt-6 border-t pt-4">
                  <h4 className="text-sm sm:text-base font-semibold text-gray-900 mb-3">Existing Plans</h4>
                  {plansLoading ? (
                    <p className="text-sm text-gray-600">Loading plans...</p>
                  ) : subscriptionPlans.length === 0 ? (
                    <p className="text-sm text-gray-600">No plans created yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {subscriptionPlans.map((plan) => (
                        <div key={plan._id} className="flex items-center justify-between border rounded-md p-3">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{plan.name} ({plan.code})</p>
                            <p className="text-xs text-gray-600">{formatCurrencyAmount(plan.price, plan.currency)} / {normalizeCurrency(plan.currency)}</p>
                          </div>
                          <span className={`text-xs px-2 py-1 rounded ${plan.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                            {plan.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mt-6 border-t pt-4">
                  <h4 className="text-sm sm:text-base font-semibold text-gray-900 mb-3">Purchased Subscriptions</h4>
                  {purchasesLoading ? (
                    <p className="text-sm text-gray-600">Loading purchases...</p>
                  ) : subscriptionPurchases.length === 0 ? (
                    <p className="text-sm text-gray-600">No purchases yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {subscriptionPurchases.map((purchase) => (
                        <div key={purchase._id} className="border rounded-md p-3">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {(purchase.subscriberId?.name || purchase.subscriberId?.username || 'Unknown User')} bought {purchase.planName} ({purchase.planCode})
                              </p>
                              <p className="text-xs text-gray-600">
                                {purchase.subscriberId?.email || 'No email'}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                Order: {purchase.orderId} {purchase.paymentId ? `| Payment: ${purchase.paymentId}` : ''}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-semibold text-gray-900">
                                {formatCurrencyAmount(Number(purchase.amount || 0), purchase.currency)}
                              </p>
                              <span className={`text-xs px-2 py-1 rounded ${purchase.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                                {purchase.status}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );

      case 'website':
        return (
          <div className="space-y-4 sm:space-y-6">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Website Management</h2>
            <div className="bg-white p-3 sm:p-6 rounded-lg shadow border">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">SEO Settings</h3>
              <div className="space-y-3 sm:space-y-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">Meta Title</label>
                  <input 
                    type="text" 
                    placeholder="Enter meta title"
                    className="w-full px-2 sm:px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-900 mb-1 sm:mb-2">Meta Description</label>
                  <textarea 
                    rows={3}
                    placeholder="Enter meta description"
                    className="w-full px-2 sm:px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                  />
                </div>
                <button 
                  className="bg-blue-600 text-white px-4 sm:px-6 py-2 rounded-lg hover:bg-blue-700 w-full sm:w-auto text-sm sm:text-base"
                  onClick={() => toast.success('SEO settings updated successfully')}
                >
                  Update SEO
                </button>
              </div>
            </div>
          </div>
        );
      
      case 'psa':
        return <AdminPSAManagement />;
      
      default:
        return (
          <div className="p-4 sm:p-8 text-center">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">Welcome to Admin Dashboard</h2>
            <p className="text-sm sm:text-base text-gray-600">Please select a tab from the sidebar to get started.</p>
            <div className="mt-3 sm:mt-4 p-3 sm:p-4 bg-blue-50 rounded-lg">
              <p className="text-xs sm:text-sm text-blue-800">Current tab: <strong>{activeTab}</strong></p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile Sidebar Overlay */}
      {mobileSidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <div className={`lg:hidden fixed inset-y-0 left-0 z-50 w-64 sm:w-72 transform transition-transform duration-300 ease-in-out ${
        mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <AdminSidebar 
          activeTab={activeTab} 
          onTabChange={handleTabChange}
          isMobile={true}
          onClose={() => setMobileSidebarOpen(false)}
        />
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <AdminSidebar 
          activeTab={activeTab} 
          onTabChange={handleTabChange}
          isMobile={false}
          onClose={() => {}}
        />
      </div>
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:ml-0">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-white">
          <div className="flex items-center space-x-3">
            {/* Mobile Menu Button */}
            <button
              onClick={toggleMobileSidebar}
              className={`lg:hidden p-2 rounded-lg transition-all duration-200 ${
                mobileSidebarOpen 
                  ? 'bg-treesh-primary text-white hover:bg-treesh-primary/90' 
                  : 'hover:bg-gray-100 text-gray-600'
              }`}
              aria-label="Toggle mobile menu"
            >
              {mobileSidebarOpen ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
            <img src={logo} alt="Admin Logo" className="h-8 w-8" />
            <h1 className="text-xl font-bold text-gray-900">Admin Panel</h1>
          </div>
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setShowProfile(true);
                setMobileSidebarOpen(false); // Close mobile sidebar
              }}
              className="flex items-center space-x-2"
            >
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Profile</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setShowLogout(true);
                setMobileSidebarOpen(false);
              }}
              className="flex items-center space-x-2 text-red-600 hover:text-red-700"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <main className="flex-1 p-3 sm:p-4 lg:p-6 overflow-auto">
          <div className="max-w-7xl mx-auto">
            {renderContent()}
          </div>
        </main>
      </div>

      {/* Profile Modal */}
      {showProfile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Admin Profile</h2>
              <button 
                onClick={() => setShowProfile(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-4">
              {/* Profile Header */}
              <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                <div className="w-16 h-16 bg-gradient-to-r from-treesh-primary to-treesh-secondary rounded-full flex items-center justify-center text-white text-2xl font-bold">
                  A
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Admin User</h3>
                  <p className="text-gray-600">Super Administrator</p>
                  <p className="text-sm text-gray-500">Last active: {new Date().toLocaleString()}</p>
                </div>
              </div>

              {/* Profile Information */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <input 
                    type="text" 
                    defaultValue="Admin User"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-treesh-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input 
                    type="email" 
                    defaultValue="admin@treesh.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-treesh-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input 
                    type="tel" 
                    defaultValue="+1 (555) 123-4567"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-treesh-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                  <input 
                    type="text" 
                    defaultValue="Administration"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-treesh-primary"
                  />
                </div>
              </div>

              {/* Preferences */}
              <div className="border-t pt-4">
                <h4 className="font-medium text-gray-900 mb-3">Preferences</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">Email Notifications</p>
                      <p className="text-xs text-gray-500">Receive updates via email</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" defaultChecked className="sr-only peer" />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-treesh-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-treesh-primary"></div>
                    </label>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">Two-Factor Authentication</p>
                      <p className="text-xs text-gray-500">Extra security for your account</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-treesh-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-treesh-primary"></div>
                    </label>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">Dark Mode</p>
                      <p className="text-xs text-gray-500">Use dark theme</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-treesh-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-treesh-primary"></div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 pt-4 border-t">
                <button 
                  onClick={() => toast.success('Profile updated successfully')}
                  className="bg-treesh-primary hover:bg-treesh-secondary text-white px-4 py-2 rounded-lg w-full sm:w-auto text-sm sm:text-base"
                >
                  Save Changes
                </button>
                <button 
                  onClick={() => setShowProfile(false)}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 w-full sm:w-auto text-sm sm:text-base"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Logout Modal */}
      {showLogout && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-4 sm:p-6">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">Logout</h2>
            <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4">Are you sure you want to logout?</p>
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
              <button 
                onClick={() => setShowLogout(false)}
                className="bg-gray-300 text-gray-700 px-3 sm:px-4 py-2 rounded-lg hover:bg-gray-400 w-full sm:w-auto text-sm sm:text-base"
              >
                Cancel
              </button>
              <button 
                onClick={handleLogout}
                className="bg-red-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-red-700 w-full sm:w-auto text-sm sm:text-base"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toaster for notifications */}
      <Toaster 
        position="top-right"
        richColors
        closeButton
      />
    </div>
  );
};

export default AdminDashboard;