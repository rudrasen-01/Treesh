import { api } from './config';

export interface User {
  _id: string;
  id: string;
  username: string;
  email: string;
  name: string;
  displayName?: string;
  profilePicture?: string;
  lastLoginAt?: string;
  role: 'user' | 'admin' | 'moderator';
  status: 'active' | 'banned' | 'suspended' | 'blocked' | 'pending';
  createdAt: string;
  badges?: string[];
  postCount?: number;
  followerCount?: number;
  isVerified?: boolean;
}export const userService = {
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
    },

    // Ban user
    banUser: async (userId: string, reason?: string) => {
        const response = await api.put(`/api/admin/users/${userId}/ban`, { reason });
        return response.data;
    }
};