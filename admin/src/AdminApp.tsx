import React, { useState, useEffect } from "react";
import AdminLandingPage from "./components/AdminLandingPage";
import AdminDashboard from "./components/AdminDashboard";
import AdminLogin from "./components/AdminLogin";
import { authService } from "./services/api/auth";
import { api } from "./services/api/config";
import logo from "./components/logo.svg";

const AdminApp = () => {
  const [currentPage, setCurrentPage] = useState("landing");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  // Check authentication status on app load
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem("admin_token");
      if (!token) {
        console.log("❌ No admin token found");
        setLoading(false);
        return;
      }
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;

      // Validate token with backend
      console.log("🔍 Validating admin token...");
      const response = await authService.checkAuth();

      if (response && response.user && response.user.role === "admin") {
        setIsAuthenticated(true);
        setUser(response.user);
        console.log("✅ Admin authenticated:", response.user);
      } else {
        // Invalid token or not admin
        console.log("❌ Invalid admin token or insufficient privileges");
        localStorage.removeItem("admin_token");
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error("❌ Token validation failed:", error);

      // If it's a network error, still try to stay logged in
      // Only clear token if it's explicitly unauthorized
      if (error.response && error.response.status === 401) {
        localStorage.removeItem("admin_token");
        setIsAuthenticated(false);
      } else {
        // For network errors or other issues, keep the token and retry
        console.log("⚠️ Network error, keeping session alive for retry");
        const token = localStorage.getItem("admin_token");
        if (token) {
          setIsAuthenticated(true);
          // Set a generic user if we can't validate
          setUser({ role: "admin", username: "admin" });
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSuccess = (userData: any) => {
    setIsAuthenticated(true);
    setUser(userData);
    setCurrentPage("landing");
    console.log("✅ Admin login successful:", userData);
  };

  const handleLogout = () => {
    // Use auth service to logout
    authService.logout();

    // Update app state
    setIsAuthenticated(false);
    setUser(null);
    setCurrentPage("landing");
    console.log("👋 Admin logged out");
  };

  // Loading screen
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <img
            src={logo}
            alt="Trees Admin"
            className="h-16 w-16 mx-auto mb-4 animate-pulse"
          />
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // Show login page if not authenticated
  if (!isAuthenticated) {
    return <AdminLogin onLoginSuccess={handleLoginSuccess} />;
  }

  // Show main app if authenticated
  if (currentPage === "dashboard") {
    return <AdminDashboard onLogout={handleLogout} user={user} />;
  }

  if (currentPage === "analytics") {
    return (
      <AdminDashboard
        initialSection="analytics"
        onLogout={handleLogout}
        user={user}
      />
    );
  }

  return (
    <div>
      <AdminLandingPage
        onGoToDashboard={() => setCurrentPage("dashboard")}
        onLogout={handleLogout}
      />
    </div>
  );
};

export default AdminApp;
