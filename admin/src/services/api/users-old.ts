import { api } from './config';

export interface User {
    _id: string;
    username: string;
    email: string;
    displayName?: string;
    role: string;
    status: string;
    badges: string[];
    createdAt: string;
    lastActive?: string;
    avatar?: string;
    bio?: string;
    location?: string;
    isVerified: boolean;
    postCount: number;
    followerCount: number;
}

export const userService = {
    // Get all users with pagination and filters
    getUsers: async (page: number = 1, limit: number = 10, filters?: Record<string, any>) => {
        const response = await api.get('/api/admin/users', { 
            params: { page, limit, ...filters } 
        });
        return response.data;
    },

    // Get a single user by ID
    getUserById: async (userId: string) => {
        const response = await api.get(`/api/admin/users/${userId}`);
        return response.data;
    },

    // Update user details
    updateUser: async (userId: string, userData: Partial<User>) => {
        const response = await api.patch(`/api/admin/users/${userId}`, userData);
        return response.data;
    },

    // Update user status (active/blocked)
    updateUserStatus: async (userId: string, isActive: boolean) => {
        const response = await api.patch(`/api/admin/users/${userId}/status`, { isActive });
        return response.data;
    },

    // Update user role
    updateUserRole: async (userId: string, role: string) => {
        const response = await api.patch(`/api/admin/users/${userId}`, { role });
        return response.data;
    },

    // Delete user
    deleteUser: async (userId: string) => {
        const response = await api.delete(`/api/admin/users/${userId}`);
        return response.data;
    },

    // Create new user
    createUser: async (userData: {
        username: string;
        email: string;
        name: string;
        role?: string;
        password?: string;
    }) => {
        const response = await api.post('/api/admin/users', userData);
        return response.data;
    },

    // Manage user badges
    updateUserBadges: async (userId: string, badges: string[]) => {
        const response = await api.patch(`/api/admin/users/${userId}/badges`, { badges });
        return response.data;
    },

    // Send password reset email
    sendPasswordReset: async (userId: string) => {
        const response = await api.post(`/api/admin/users/${userId}/reset-password`);
        return response.data;
    }
};

    // Create new user
    createUser: async (userData: Partial<User>) => {
        const response = await api.post('/users', userData);
        return response.data;
    },

    // Update user
    updateUser: async (userId: string, userData: Partial<User>) => {
        const response = await api.patch(`/users/${userId}`, userData);
        return response.data;
    },

    // Get user analytics
    getUserAnalytics: async (userId: string) => {
        const response = await api.get(`/users/${userId}/analytics`);
        return response.data;
    },

    // Ban user
    banUser: async (userId: string, reason: string) => {
        const response = await api.post(`/users/${userId}/ban`, { reason });
        return response.data;
    },

    // Verify user
    verifyUser: async (userId: string) => {
        const response = await api.post(`/users/${userId}/verify`);
        return response.data;
    },

    // Get user reports
    getUserReports: async (userId: string) => {
        const response = await api.get(`/users/${userId}/reports`);
        return response.data;
    },

    // Get user activity
    getUserActivity: async (userId: string) => {
        const response = await api.get(`/users/${userId}/activity`);
        return response.data;
    },

    // Reset user strikes
    resetStrikes: async (userId: string) => {
        const response = await api.post(`/users/${userId}/reset-strikes`);
        return response.data;
    }
};