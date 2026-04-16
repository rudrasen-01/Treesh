import { api } from './config';

export interface ReportedContent {
  _id: string;
  reporter: {
    _id: string;
    username: string;
    name: string;
    profilePicture?: string;
  };
  reportedUser: {
    _id: string;
    username: string;
    name: string;
    profilePicture?: string;
  };
  content: {
    type: 'post' | 'reel' | 'story';
    text: string;
    media?: string[];
    createdAt: string;
  };
  reportType: 'inappropriate' | 'spam' | 'harassment' | 'fake_profile' | 'other';
  reason: string;
  evidence?: string;
  status: 'pending' | 'investigating' | 'resolved' | 'dismissed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignedTo?: {
    _id: string;
    username: string;
    name: string;
  };
  adminNotes?: string;
  actionsTaken: Array<{
    action: string;
    duration?: number;
    reason: string;
    takenBy?: string;
    takenAt: string;
  }>;
  createdAt: string;
  updatedAt: string;
  reportCount: number;
}

export interface ContentDetails {
  _id: string;
  type: 'post' | 'reel' | 'story';
  text: string;
  media: string[];
  author: {
    _id: string;
    username: string;
    name: string;
    profilePicture?: string;
  };
  createdAt: string;
  likes: number;
  comments: number;
  shares: number;
  reports: Array<{
    _id: string;
    reporter: {
      _id: string;
      username: string;
      name: string;
    };
    reason: string;
    evidence?: string;
    createdAt: string;
  }>;
  reportReasons: Array<{
    type: string;
    label: string;
  }>;
  contentWarnings: string[];
  status: string;
  adminNotes?: string;
  actionsTaken: Array<{
    action: string;
    duration?: number;
    reason: string;
    takenBy?: string;
    takenAt: string;
  }>;
}

export const moderationService = {
  // Get reported content for moderation
  getReportedContent: async (page: number = 1, limit: number = 10, filters?: Record<string, any>) => {
    const response = await api.get('/api/admin/moderation/reports', { 
      params: { page, limit, ...filters } 
    });
    return response.data;
  },

  // Get detailed content information for preview
  getContentDetails: async (reportId: string) => {
    const response = await api.get(`/api/admin/moderation/reports/${reportId}`);
    return response.data;
  },

  // Moderate content (approve/reject/mark safe)
  moderateContent: async (reportId: string, action: 'approve' | 'reject' | 'mark_safe', reason?: string, adminNotes?: string) => {
    const response = await api.patch(`/api/admin/moderation/reports/${reportId}/moderate`, {
      action,
      reason,
      adminNotes
    });
    return response.data;
  },

  // Delete content
  deleteContent: async (contentId: string, reason?: string) => {
    const response = await api.delete(`/api/admin/moderation/content/${contentId}`, {
      data: { reason }
    });
    return response.data;
  },

  // Ban user from content moderation
  banUser: async (userId: string, reason: string, duration?: string, reportId?: string) => {
    const response = await api.post(`/api/admin/moderation/ban-user/${userId}`, {
      reason,
      duration,
      reportId
    });
    return response.data;
  }
};