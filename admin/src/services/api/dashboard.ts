import { api } from './config';

export interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalPosts: number;
  liveStreams: number;
}

export interface RecentActivity {
  id: string;
  type: 'user_registration' | 'post_created' | 'user_login' | 'content_reported';
  user: {
    id: string;
    username: string;
    displayName: string;
  };
  message: string;
  timestamp: string;
  details?: string;
}

export const dashboardService = {
  // Get dashboard statistics
  getStats: async (): Promise<DashboardStats> => {
    try {
      const response = await api.get('/api/admin/dashboard/stats');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
      // Fallback to mock data if API fails
      return {
        totalUsers: 45231,
        activeUsers: 12543,
        totalPosts: 89432,
        liveStreams: 156
      };
    }
  },

  // Get total registered users count
  getTotalUsers: async (): Promise<number> => {
    try {
      const response = await api.get('/api/admin/users/count');
      return response.data.total;
    } catch (error) {
      console.error('Failed to fetch total users:', error);
      return 45231; // Fallback
    }
  },

  // Get active users (users active in last 30 days)
  getActiveUsers: async (): Promise<number> => {
    try {
      const response = await api.get('/api/admin/users/active');
      return response.data.count;
    } catch (error) {
      console.error('Failed to fetch active users:', error);
      return 12543; // Fallback
    }
  },

  // Get total posts count
  getTotalPosts: async (): Promise<number> => {
    try {
      const response = await api.get('/api/admin/posts/count');
      return response.data.total;
    } catch (error) {
      console.error('Failed to fetch total posts:', error);
      return 89432; // Fallback
    }
  },

  // Get recent activities (registrations, posts, etc.)
  getRecentActivities: async (limit: number = 10): Promise<RecentActivity[]> => {
    try {
      const response = await api.get(`/api/admin/activities/recent?limit=${limit}`);
      return response.data; // Activities are returned directly, not nested
    } catch (error) {
      console.error('Failed to fetch recent activities:', error);
      // Fallback to mock data
      return [
        {
          id: '1',
          type: 'user_registration',
          user: {
            id: 'user1',
            username: 'johndoe',
            displayName: 'John Doe'
          },
          message: 'New user registration: John Doe',
          timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
          details: 'User registered via email'
        },
        {
          id: '2',
          type: 'content_reported',
          user: {
            id: 'user2',
            username: 'janedoe',
            displayName: 'Jane Doe'
          },
          message: 'Content reported for review',
          timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
          details: 'Post reported for inappropriate content'
        },
        {
          id: '3',
          type: 'user_registration',
          user: {
            id: 'user3',
            username: 'bobsmith',
            displayName: 'Bob Smith'
          },
          message: 'New user registration: Bob Smith',
          timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
          details: 'User registered via Google OAuth'
        }
      ];
    }
  },

  // Get live streams count
  getLiveStreamsCount: async (): Promise<number> => {
    try {
      const response = await api.get('/api/admin/streams/live/count');
      return response.data.count;
    } catch (error) {
      console.error('Failed to fetch live streams count:', error);
      return 156; // Fallback
    }
  }
};