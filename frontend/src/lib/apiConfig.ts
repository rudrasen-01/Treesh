import { getApiBaseUrl, getSocketUrl } from "@/config/env";

export const API_CONFIG = {
  BASE_URL: getApiBaseUrl(),
  SOCKET_URL: getSocketUrl(),
  
  // Upload endpoints
  ENDPOINTS: {
    // Authentication
    AUTH: {
      LOGIN: "/auth/login",
      REGISTER: "/auth/register", 
      LOGOUT: "/auth/logout",
      ME: "/auth/me",
      REFRESH: "/auth/refresh",
    },
    
    // File uploads
    UPLOADS: {
      IMAGE: "/uploads/image",
      VIDEO: "/uploads/video",
      AVATAR: "/uploads/avatar",
    },
    
    // Posts
    POSTS: {
      CREATE: "/posts",
      LIST: "/posts",
      DETAIL: "/posts",
    },
    
    // Users
    USERS: {
      PROFILE: "/users/profile",
      SEARCH: "/users/search",
      FOLLOW: "/users",
    },
    
    // Stories
    STORIES: {
      CREATE: "/stories",
      LIST: "/stories",
    }
  }
};

export const buildApiUrl = (endpoint: string): string => {
  const base = API_CONFIG.BASE_URL.replace(/\/$/, "");
  const path = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  return `${base}${path}`;
};

// Helper function for upload endpoints
export const getUploadUrl = (type: 'image' | 'video' | 'avatar'): string => {
  const endpoint = API_CONFIG.ENDPOINTS.UPLOADS[type.toUpperCase() as keyof typeof API_CONFIG.ENDPOINTS.UPLOADS];
  return buildApiUrl(endpoint);
};

// Validation function to check if backend URL is accessible
export const validateBackendConnection = async (): Promise<boolean> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(`${API_CONFIG.BASE_URL.replace('/api', '')}/health`, {
      method: 'GET',
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    console.warn('Backend connection check failed:', error);
    return false;
  }
};

// Debug information
export const getDebugInfo = () => {
  return {
    API_BASE_URL: API_CONFIG.BASE_URL,
    SOCKET_URL: API_CONFIG.SOCKET_URL,
    UPLOAD_IMAGE_URL: getUploadUrl('image'),
    UPLOAD_VIDEO_URL: getUploadUrl('video'),
    ENVIRONMENT: import.meta.env.MODE,
    IS_DEVELOPMENT: import.meta.env.DEV,
    IS_PRODUCTION: import.meta.env.PROD,
  };
};

// Log configuration on load (only in development)
if (import.meta.env.DEV) {
  console.log('🔧 API Configuration:', getDebugInfo());
}
