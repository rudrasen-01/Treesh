import axios from "axios";

// Base API configuration
// This should match your backend server's URL
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "https://api.inventurcubes.com";

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add request interceptor for authentication
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("admin_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      console.warn("401 Unauthorized - Using demo data for admin panel");

      // Don't redirect in admin panel, just log the issue
      // The individual components will handle showing demo data

      // Only redirect if we're not in the admin panel context
      const isAdminPanel =
        window.location.pathname.includes("admin") ||
        window.location.hostname === "localhost";

      if (!isAdminPanel) {
        localStorage.removeItem("admin_token");
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  },
);
