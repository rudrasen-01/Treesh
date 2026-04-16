import { api } from "./config";

const ADMIN_TOKEN_KEY = "admin_token";
const ADMIN_SESSION_EXPIRES_AT_KEY = "admin_session_expires_at";
const ADMIN_SESSION_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

const setAdminSessionExpiry = () => {
  const expiresAt = Date.now() + ADMIN_SESSION_DURATION_MS;
  localStorage.setItem(ADMIN_SESSION_EXPIRES_AT_KEY, String(expiresAt));
};

const hasAdminSessionExpired = (): boolean => {
  const raw = localStorage.getItem(ADMIN_SESSION_EXPIRES_AT_KEY);
  if (!raw) {
    return false;
  }

  const expiresAt = Number(raw);
  if (Number.isNaN(expiresAt)) {
    return true;
  }

  return Date.now() > expiresAt;
};

export interface LoginCredentials {
  identifier?: string; // For backwards compatibility
  email?: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: {
    _id: string;
    email: string;
    role: string;
    username: string;
  };
}

export const authService = {
  // Admin login
  login: async (credentials: LoginCredentials) => {
    const response = await api.post("/auth/admin/login", credentials);
    const { token, user } = response.data;
    localStorage.setItem(ADMIN_TOKEN_KEY, token);
    setAdminSessionExpiry();
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;

    return { token, user };
  },

  // Admin login (alias for regular login)
  adminLogin: async (credentials: LoginCredentials) => {
    // Convert identifier to email for API call
    const loginData = {
      identifier: credentials.identifier || credentials.email,
      password: credentials.password,
    };

    const response = await api.post("/api/auth/login", loginData);
    const { token, user } = response.data;

    // Check if user has admin role
    if (user.role !== "admin") {
      throw new Error("Access denied. Admin privileges required.");
    }

    localStorage.setItem(ADMIN_TOKEN_KEY, token);
    setAdminSessionExpiry();
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    return { token, user };
  },

  // Check authentication status
  checkAuth: async () => {
    const token = localStorage.getItem(ADMIN_TOKEN_KEY);
    if (!token) {
      throw new Error("No admin session found");
    }

    if (hasAdminSessionExpired()) {
      authService.logout();
      throw new Error("Admin session expired. Please login again.");
    }

    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    const response = await api.get("/api/auth/me");

    const rawUser = response.data?.user || response.data;
    const normalizedUser = rawUser
      ? {
          ...rawUser,
          _id: rawUser._id || rawUser.id,
        }
      : null;

    return { user: normalizedUser };
  },

  // Logout
  logout: () => {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
    localStorage.removeItem(ADMIN_SESSION_EXPIRES_AT_KEY);
    delete api.defaults.headers.common["Authorization"];
    console.log("🔐 Admin token cleared");
    // Don't automatically redirect - let the app handle it
  },

  // Change password
  changePassword: async (oldPassword: string, newPassword: string) => {
    const response = await api.post("/auth/admin/change-password", {
      oldPassword,
      newPassword,
    });
    return response.data;
  },
};
