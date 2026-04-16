import { api } from './config';

export interface Post {
    _id: string;
    userId: string;
    content: string;
    media?: string[];
    likes: number;
    comments: number;
    shares: number;
    status: string;
    isReported: boolean;
    reports?: number;
    createdAt: string;
    updatedAt: string;
}

export interface PostListResponse {
    posts: Post[];
    total: number;
    page: number;
    limit: number;
}

export const postService = {
    // Get all posts with pagination and filters
    getPosts: async (page: number = 1, limit: number = 10, filters?: Record<string, any>): Promise<PostListResponse> => {
        const response = await api.get('/posts', { params: { page, limit, ...filters } });
        return response.data;
    },

    // Get a single post by ID
    getPostById: async (postId: string): Promise<Post> => {
        const response = await api.get(`/posts/${postId}`);
        return response.data;
    },

    // Update post status (published/hidden/deleted)
    updatePostStatus: async (postId: string, status: string): Promise<Post> => {
        const response = await api.patch(`/posts/${postId}/status`, { status });
        return response.data;
    },

    // Delete post
    deletePost: async (postId: string): Promise<void> => {
        await api.delete(`/posts/${postId}`);
    },

    // Get reported posts
    getReportedPosts: async (page: number = 1, limit: number = 10): Promise<PostListResponse> => {
        const response = await api.get('/posts/reported', { params: { page, limit } });
        return response.data;
    },

    // Get post reports
    getPostReports: async (postId: string): Promise<any[]> => {
        const response = await api.get(`/posts/${postId}/reports`);
        return response.data;
    },

    // Clear post reports
    clearPostReports: async (postId: string): Promise<Post> => {
        const response = await api.post(`/posts/${postId}/clear-reports`);
        return response.data;
    }
};