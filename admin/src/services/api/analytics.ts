import { api } from './config';

export interface AnalyticsData {
    totalUsers: number;
    activeUsers: number;
    totalPosts: number;
    totalEngagement: number;
    // Add other analytics fields as needed
}

export const analyticsService = {
    // Get overall platform analytics - uses admin dashboard endpoint
    getOverallAnalytics: async (timeRange: string = '7d') => {
        const response = await api.get('/api/admin/dashboard/stats', { params: { period: timeRange } });
        return response.data;
    },

    // Get user engagement metrics
    getUserEngagementMetrics: async (timeRange: string = '7d') => {
        const response = await api.get('/analytics/user-engagement', { params: { timeRange } });
        return response.data;
    },

    // Get content performance metrics
    getContentMetrics: async (timeRange: string = '7d') => {
        const response = await api.get('/analytics/content', { params: { timeRange } });
        return response.data;
    },

    // Get real-time active users
    getRealTimeUsers: async () => {
        const response = await api.get('/analytics/real-time-users');
        return response.data;
    },

    // Get custom analytics report
    getCustomReport: async (metrics: string[], timeRange: string, filters?: Record<string, any>) => {
        const response = await api.post('/analytics/custom-report', {
            metrics,
            timeRange,
            filters
        });
        return response.data;
    }
};