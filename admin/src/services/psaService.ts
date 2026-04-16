import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.inventurcubes.com';

export const psaService = {
  // Get all PSAs
  getAllPSAs: async (page = 1, limit = 10, status = '', type = '') => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    
    if (status) params.append('status', status);
    if (type) params.append('type', type);
    
    const response = await axios.get(`${API_BASE_URL}/api/admin/psa?${params}`);
    return response.data;
  },

  // Create new PSA
  createPSA: async (psaData) => {
    console.log('=== PSA Service: Creating PSA ===');
    console.log('API URL:', `${API_BASE_URL}/api/admin/psa`);
    console.log('PSA Data:', psaData);
    const response = await axios.post(`${API_BASE_URL}/api/admin/psa`, psaData);
    console.log('API Response:', response.data);
    return response.data;
  },

  // Update PSA
  updatePSA: async (id, psaData) => {
    const response = await axios.put(`${API_BASE_URL}/api/admin/psa/${id}`, psaData);
    return response.data;
  },

  // Delete PSA
  deletePSA: async (id) => {
    const response = await axios.delete(`${API_BASE_URL}/api/admin/psa/${id}`);
    return response.data;
  },

  // Get PSA analytics
  getPSAAnalytics: async (id) => {
    const response = await axios.get(`${API_BASE_URL}/api/admin/psa/${id}/analytics`);
    return response.data;
  },
};

export default psaService;