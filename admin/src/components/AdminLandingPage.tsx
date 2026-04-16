import React from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { 
  Users, 
  Shield, 
  BarChart3, 
  Settings, 
  ArrowRight,
  CheckCircle,
  Zap,
  Globe
} from 'lucide-react';
import logo from './logo.svg';

interface AdminLandingPageProps {
  onGoToDashboard: () => void;
  onLogout?: () => void;
}

const AdminLandingPage = ({ onGoToDashboard, onLogout }: AdminLandingPageProps) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="max-w-4xl mx-auto text-center p-8">
        <div className="bg-white rounded-2xl shadow-2xl p-12 border border-gray-100">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="flex justify-center mb-6">
              <img src={logo} alt="Admin Logo" className="h-16 w-16" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Welcome to Admin Panel
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Comprehensive administration tools for managing your platform. Monitor users, moderate content, analyze performance, and maintain system integrity.
            </p>
          </div>

          {/* Status Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <div className="text-green-600 text-2xl font-bold">✓</div>
              <h3 className="text-lg font-semibold text-green-800 mt-2">System Ready</h3>
              <p className="text-green-600 text-sm">All services operational</p>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <div className="text-blue-600 text-2xl font-bold">⚡</div>
              <h3 className="text-lg font-semibold text-blue-800 mt-2">Fast Performance</h3>
              <p className="text-blue-600 text-sm">Optimized for speed</p>
            </div>
            
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
              <div className="text-purple-600 text-2xl font-bold">🔒</div>
              <h3 className="text-lg font-semibold text-purple-800 mt-2">Secure Access</h3>
              <p className="text-purple-600 text-sm">Protected admin area</p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-8">
            <button 
              onClick={onGoToDashboard}
              className="bg-treesh-primary hover:bg-treesh-secondary text-white font-semibold py-3 px-8 rounded-lg transition-colors duration-200 font-inter"
            >
              Go to Dashboard
            </button>
            {onLogout && (
              <button
                onClick={onLogout}
                className="bg-white border border-red-200 text-red-600 hover:bg-red-50 font-semibold py-3 px-8 rounded-lg transition-colors duration-200"
              >
                Logout
              </button>
            )}
          </div>

          {/* Info */}
          <div className="text-sm text-gray-500">
                         <p>Server running on port 5173 • React + TypeScript + Tailwind CSS</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLandingPage;
