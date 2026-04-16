import { AdminUserManagement } from './AdminUserManagement';
// import { AdminContentModeration } from './AdminContentModeration';
import { AdminLivestreamControls } from './AdminLivestreamControls';
import AdminPSAManagement from './AdminPSAManagement';
import { AdminReportsAnalytics } from './AdminReportsAnalytics';
import { AdminNotifications } from './AdminNotifications';
import AdminMatchmakingOversight from './AdminMatchmakingOversight';
import { AdminSettings } from './AdminSettings';
import { AdminAnalyticsReports } from './AdminAnalyticsReports';
import { AdminStaticWebsiteManagement } from './AdminStaticWebsiteManagement';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Users, Shield, Video, Heart, TrendingUp, Bell, BarChart3, Megaphone } from 'lucide-react';
import { useIsMobile } from '../hooks/use-mobile';

interface AdminContentProps {
  activeSection: string;
}

const DashboardOverview = () => {
  const isMobile = useIsMobile();

  const metrics = [
    {
      title: 'Total Users',
      value: '45,231',
      change: '+20.1% from last month',
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200'
    },
    {
      title: 'Active Users',
      value: '12,543',
      change: '+8.2% from last month',
      icon: Users,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200'
    },
    {
      title: 'Total Posts',
      value: '89,432',
      change: '+12.5% from last month',
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200'
    },
    {
      title: 'Live Streams',
      value: '156',
      change: '+3.1% from last month',
      icon: Video,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200'
    },
    {
      title: 'Total Stories',
      value: '23,891',
      change: '+18.7% from last month',
      icon: Bell,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200'
    },
    {
      title: 'Total Reels',
      value: '45,672',
      change: '+25.3% from last month',
      icon: Video,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      borderColor: 'border-indigo-200'
    },
    {
      title: 'Active Matches',
      value: '1,234',
      change: '+15.3% from last month',
      icon: Heart,
      color: 'text-pink-600',
      bgColor: 'bg-pink-50',
      borderColor: 'border-pink-200'
    },
    {
      title: 'Reports Pending',
      value: '23',
      change: '-5.2% from last month',
      icon: Shield,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="text-center lg:text-left">
        <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">Dashboard Overview</h2>
        <p className="text-gray-600 text-sm lg:text-base">Monitor your platform's key performance indicators</p>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        {metrics.map((metric, index) => {
          const Icon = metric.icon;
          return (
            <Card 
              key={index} 
              className={`${metric.bgColor} ${metric.borderColor} border-2 hover:shadow-lg transition-all duration-200 cursor-pointer`}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className={`text-sm font-semibold ${metric.color}`}>
                  {metric.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${metric.bgColor} ${metric.borderColor} border`}>
                  <Icon className={`h-4 w-4 ${metric.color}`} />
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-2xl lg:text-3xl font-bold text-gray-900">
                  {metric.value}
                </div>
                <p className="text-xs text-gray-600 leading-relaxed">
                  {metric.change}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Actions Section */}
      <div className="mt-8">
        <h3 className="text-xl font-semibold text-gray-900 mb-4 text-center lg:text-left">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="hover:shadow-md transition-shadow cursor-pointer border-2 border-gray-200 hover:border-blue-300">
            <CardContent className="p-4 text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-1">Manage Users</h4>
              <p className="text-sm text-gray-600">View and manage user accounts</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer border-2 border-gray-200 hover:border-green-300">
            <CardContent className="p-4 text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Shield className="h-6 w-6 text-green-600" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-1">Moderate Content</h4>
              <p className="text-sm text-gray-600">Review and moderate posts</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer border-2 border-gray-200 hover:border-purple-300">
            <CardContent className="p-4 text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <BarChart3 className="h-6 w-6 text-purple-600" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-1">View Analytics</h4>
              <p className="text-sm text-gray-600">Check platform statistics</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer border-2 border-gray-200 hover:border-orange-300">
            <CardContent className="p-4 text-center">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Megaphone className="h-6 w-6 text-orange-600" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-1">Send PSA</h4>
              <p className="text-sm text-gray-600">Broadcast announcements</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent Activity Section */}
      <div className="mt-8">
        <h3 className="text-xl font-semibold text-gray-900 mb-4 text-center lg:text-left">Recent Activity</h3>
        <Card className="border-2 border-gray-200">
          <CardContent className="p-4">
            <div className="space-y-3">
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <Users className="h-4 w-4 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">New user registration</p>
                  <p className="text-xs text-gray-600">John Doe joined the platform</p>
                </div>
                <span className="text-xs text-gray-500">2 min ago</span>
              </div>
              
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <Video className="h-4 w-4 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Live stream started</p>
                  <p className="text-xs text-gray-600">Sarah's cooking show is now live</p>
                </div>
                <span className="text-xs text-gray-500">15 min ago</span>
              </div>
              
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                  <Shield className="h-4 w-4 text-red-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Content reported</p>
                  <p className="text-xs text-gray-600">Post flagged for review</p>
                </div>
                <span className="text-xs text-gray-500">1 hour ago</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export const AdminContent: React.FC<AdminContentProps> = ({ activeSection }) => {
  console.log('🔍 AdminContent received activeSection:', activeSection);
  
  const renderSection = () => {
    console.log('🎯 Switching on activeSection:', activeSection);
    switch (activeSection) {
    case 'dashboard':
      return <DashboardOverview />;
    case 'users':
    case 'blocked-users':
    case 'activity-logs':
      return <AdminUserManagement section={activeSection as any} />;
    case 'review-posts':
    case 'review-reels':
    case 'review-stories':
    case 'reported-content':
      return <div>Content Moderation - Coming Soon</div>;
    case 'match-logs':
    case 'flagged-conversations':
      return <AdminMatchmakingOversight />;
    case 'live-streams':
    case 'scheduled-streams':
    case 'stream-categories':
      return <AdminLivestreamControls section={activeSection as any} />;
    case 'push-announcement':
    case 'past-psas':
    case 'psa':
      console.log('✅ PSA case matched! Loading AdminPSAManagement...');
      console.log('📍 About to return AdminPSAManagement component');
      return <AdminPSAManagement />;
    case 'engagement-trends':
    case 'top-users':
    case 'top-creators':
    case 'login-stats':
      return <AdminAnalyticsReports />;
    case 'notifications':
      return <AdminNotifications />;
    case 'admin-users':
    case 'security':
    case 'activity-logs-admin':
      return <AdminSettings />;
    case 'homepage-content':
    case 'seo-settings':
    case 'banners-management':
      return <AdminStaticWebsiteManagement />;
    default:
      console.log('⚠️ No match found, showing default DashboardOverview for:', activeSection);
      return <DashboardOverview />;
    }
  };

  return (
    <div className="flex-1 overflow-y-auto">
      {renderSection()}
    </div>
  );
};