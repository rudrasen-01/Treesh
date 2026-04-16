import { api } from './config';

export interface Story {
    _id: string;
    userId: string;
    media: string[];
    viewers: number;
    duration: number;
    status: string;
    isReported: boolean;
    reports?: number;
    expiresAt: string;
    createdAt: string;
}

export interface StoryListResponse {
    stories: Story[];
    total: number;
    page: number;
    limit: number;
}

export const storyService = {
    // Get all stories with pagination and filters
    getStories: async (page: number = 1, limit: number = 10, filters?: Record<string, any>): Promise<StoryListResponse> => {
        const response = await api.get('/stories', { params: { page, limit, ...filters } });
        return response.data;
    },

    // Get a single story by ID
    getStoryById: async (storyId: string): Promise<Story> => {
        const response = await api.get(`/stories/${storyId}`);
        return response.data;
    },

    // Update story status
    updateStoryStatus: async (storyId: string, status: string): Promise<Story> => {
        const response = await api.patch(`/stories/${storyId}/status`, { status });
        return response.data;
    },

    // Delete story
    deleteStory: async (storyId: string): Promise<void> => {
        await api.delete(`/stories/${storyId}`);
    },

    // Get reported stories
    getReportedStories: async (page: number = 1, limit: number = 10): Promise<StoryListResponse> => {
        const response = await api.get('/stories/reported', { params: { page, limit } });
        return response.data;
    },

    // Get story reports
    getStoryReports: async (storyId: string): Promise<any[]> => {
        const response = await api.get(`/stories/${storyId}/reports`);
        return response.data;
    },

    // Clear story reports
    clearStoryReports: async (storyId: string): Promise<Story> => {
        const response = await api.post(`/stories/${storyId}/clear-reports`);
        return response.data;
    }
};