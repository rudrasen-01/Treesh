import { api } from './config';

export interface Reel {
    _id: string;
    userId: string;
    title: string;
    description?: string;
    video: string;
    thumbnail?: string;
    views: number;
    likes: number;
    comments: number;
    shares: number;
    status: string;
    isReported: boolean;
    reports?: number;
    duration: number;
    createdAt: string;
    updatedAt: string;
}

export interface ReelListResponse {
    reels: Reel[];
    total: number;
    page: number;
    limit: number;
}

export const reelService = {
    // Get all reels with pagination and filters
    getReels: async (page: number = 1, limit: number = 10, filters?: Record<string, any>): Promise<ReelListResponse> => {
        const response = await api.get('/reels', { params: { page, limit, ...filters } });
        return response.data;
    },

    // Get a single reel by ID
    getReelById: async (reelId: string): Promise<Reel> => {
        const response = await api.get(`/reels/${reelId}`);
        return response.data;
    },

    // Update reel status
    updateReelStatus: async (reelId: string, status: string): Promise<Reel> => {
        const response = await api.patch(`/reels/${reelId}/status`, { status });
        return response.data;
    },

    // Delete reel
    deleteReel: async (reelId: string): Promise<void> => {
        await api.delete(`/reels/${reelId}`);
    },

    // Get reported reels
    getReportedReels: async (page: number = 1, limit: number = 10): Promise<ReelListResponse> => {
        const response = await api.get('/reels/reported', { params: { page, limit } });
        return response.data;
    },

    // Get reel reports
    getReelReports: async (reelId: string): Promise<any[]> => {
        const response = await api.get(`/reels/${reelId}/reports`);
        return response.data;
    },

    // Clear reel reports
    clearReelReports: async (reelId: string): Promise<Reel> => {
        const response = await api.post(`/reels/${reelId}/clear-reports`);
        return response.data;
    },

    // Get trending reels
    getTrendingReels: async (limit: number = 10): Promise<Reel[]> => {
        const response = await api.get('/reels/trending', { params: { limit } });
        return response.data;
    },

    // Get reel statistics
    getReelStats: async (reelId: string): Promise<any> => {
        const response = await api.get(`/reels/${reelId}/stats`);
        return response.data;
    }
};