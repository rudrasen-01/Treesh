import { api } from './config';

export interface AdminNotificationData {
  title: string;
  message: string;
  type?: 'general' | 'feature' | 'maintenance' | 'policy' | 'announcement';
  priority?: 'low' | 'medium' | 'high' | 'critical';
  targetAudience?: 'all' | 'premium' | 'new' | 'specific';
  specificGroup?: string;
  scheduledFor?: string;
}

export interface AdminNotificationHistory {
  _id: string;
  title: string;
  message: string;
  type: string;
  priority: string;
  targetAudience: string;
  sentBy: {
    _id: string;
    username: string;
    name: string;
  };
  sentAt: string;
  status: string;
  totalRecipients: number;
  deliveredCount: number;
  readCount: number;
  openRate: string;
}

export interface NotificationStats {
  totalSent: number;
  todaySent: number;
  totalUsers: number;
  avgOpenRate: string;
}

export const notificationService = {
  // Send notification to users
  sendNotification: async (notificationData: AdminNotificationData) => {
    const response = await api.post('/api/admin/notifications/send', notificationData);
    return response.data;
  },

  // Get notification history
  getNotificationHistory: async (page: number = 1, limit: number = 10) => {
    const response = await api.get('/api/admin/notifications/history', {
      params: { page, limit }
    });
    return response.data;
  },

  // Get notification statistics
  getNotificationStats: async (): Promise<NotificationStats> => {
    const response = await api.get('/api/admin/notifications/stats');
    return response.data;
  },

  // Delete notification
  deleteNotification: async (notificationId: string) => {
    const response = await api.delete(`/api/admin/notifications/${notificationId}`);
    return response.data;
  }
};