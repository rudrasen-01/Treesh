import { api } from './config';

export interface PSA {
    _id: string;
    title: string;
    content: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    status: 'draft' | 'published' | 'archived';
    audience: string[];
    startDate: string;
    endDate?: string;
    media?: string[];
    createdBy: string;
    createdAt: string;
    updatedAt: string;
}

export interface PSAListResponse {
    psas: PSA[];
    total: number;
    page: number;
    limit: number;
}

export const psaService = {
    // Get all PSAs with pagination and filters
    getPSAs: async (page: number = 1, limit: number = 10, filters?: Record<string, any>): Promise<PSAListResponse> => {
        const response = await api.get('/psa', { params: { page, limit, ...filters } });
        return response.data;
    },

    // Get a single PSA by ID
    getPSAById: async (psaId: string): Promise<PSA> => {
        const response = await api.get(`/psa/${psaId}`);
        return response.data;
    },

    // Create new PSA
    createPSA: async (psaData: Partial<PSA>): Promise<PSA> => {
        const response = await api.post('/psa', psaData);
        return response.data;
    },

    // Update PSA
    updatePSA: async (psaId: string, psaData: Partial<PSA>): Promise<PSA> => {
        const response = await api.put(`/psa/${psaId}`, psaData);
        return response.data;
    },

    // Update PSA status
    updatePSAStatus: async (psaId: string, status: PSA['status']): Promise<PSA> => {
        const response = await api.patch(`/psa/${psaId}/status`, { status });
        return response.data;
    },

    // Delete PSA
    deletePSA: async (psaId: string): Promise<void> => {
        await api.delete(`/psa/${psaId}`);
    },

    // Get active PSAs
    getActivePSAs: async (): Promise<PSA[]> => {
        const response = await api.get('/psa/active');
        return response.data;
    },

    // Get PSA statistics
    getPSAStats: async (psaId: string): Promise<any> => {
        const response = await api.get(`/psa/${psaId}/stats`);
        return response.data;
    }
};