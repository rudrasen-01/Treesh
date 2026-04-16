import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { toast } from "sonner";
import { authService } from "../services/api/auth";
import logo from "./logo.svg";

interface AdminLoginProps {
  onLoginSuccess: (userData: any) => void;
}

const AdminLogin = ({ onLoginSuccess }: AdminLoginProps) => {
  const [credentials, setCredentials] = useState({
    identifier: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!credentials.identifier || !credentials.password) {
      toast.error("Please enter both identifier/username and password");
      return;
    }

    try {
      setLoading(true);
      console.log("🔐 Attempting admin login...");

      // Use the auth service to login
      const response = await authService.adminLogin(credentials);

      // Check if user has admin role
      if (response.user.role !== "admin") {
        toast.error("Access denied. Admin privileges required.");
        localStorage.removeItem("admin_token"); // Clear any token
        localStorage.removeItem("admin_session_expires_at");
        return;
      }

      console.log("✅ Admin login successful:", response);
      toast.success(
        `Welcome ${response.user.username}! Loading admin panel...`,
      );

      onLoginSuccess(response.user);
    } catch (error) {
      console.error("❌ Login failed:", error);

      // Clear any existing token on login failure
      localStorage.removeItem("admin_token");
      localStorage.removeItem("admin_session_expires_at");

      // Show specific error messages
      if (error.response?.status === 401) {
        toast.error(
          "Invalid credentials. Please check your identifier/username and password.",
        );
      } else if (error.response?.status === 403) {
        toast.error("Access denied. Admin privileges required.");
      } else if (error.message?.includes("Admin privileges required")) {
        toast.error(
          "Access denied. This account does not have admin privileges.",
        );
      } else {
        toast.error(
          error.response?.data?.error || "Login failed. Please try again.",
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCredentials({
      ...credentials,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <img src={logo} alt="Trees Admin" className="h-12 w-12" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            Admin Login
          </CardTitle>
          <p className="text-gray-600">Sign in to access the admin panel</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="identifier">identifier or Username</Label>
              <Input
                id="identifier"
                name="identifier"
                type="text"
                placeholder="admin@trees.com or admin"
                value={credentials.identifier}
                onChange={handleChange}
                disabled={loading}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Enter your password"
                value={credentials.password}
                onChange={handleChange}
                disabled={loading}
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-600">
            <p>Demo Admin Credentials:</p>
            <p className="font-mono text-xs bg-gray-100 p-2 rounded mt-2">
              identifier: admin@trees.com
              <br />
              Password: admin123
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminLogin;
