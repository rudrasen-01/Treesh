import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { api } from "../services/api/config";

interface PSA {
  _id: string;
  title: string;
  content: string;
  type:
    | "general"
    | "security"
    | "maintenance"
    | "feature"
    | "promotion"
    | "warning"
    | "celebration";
  status: "draft" | "scheduled" | "active" | "inactive" | "expired";
  priority: "low" | "medium" | "high" | "urgent";
  scheduledFor?: string;
  createdAt: string;
  createdBy: string;
  targetAudience: any;
  metrics?: {
    views: number;
    clicks: number;
    shares: number;
  };
}

const AdminPSAManagement: React.FC = () => {
  const [psas, setPSAs] = useState<PSA[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingPSA, setEditingPSA] = useState<PSA | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    type: "general" as PSA["type"],
    priority: "medium" as PSA["priority"],
    targetAudience: "all",
    scheduledFor: "",
  });

  // Reset form
  const resetForm = () => {
    setFormData({
      title: "",
      content: "",
      type: "general",
      priority: "medium",
      targetAudience: "all",
      scheduledFor: "",
    });
    setEditingPSA(null);
    setShowCreateForm(false);
  };

  // Load PSAs
  useEffect(() => {
    fetchPSAs();
  }, []);

  const fetchPSAs = async () => {
    try {
      setLoading(true);
      console.log("🔄 Fetching PSAs from Admin API...");
      const response = await api.get("/api/admin/psa");

      const data = response.data;
      console.log("📥 Raw API response:", data);

      // The admin API returns { psas: [...], total: 3, page: 1, limit: 10, pages: 1 }
      if (data && Array.isArray(data.psas)) {
        setPSAs(data.psas);
        console.log("✅ Successfully loaded", data.psas.length, "PSAs");
      } else {
        console.warn(
          "⚠️ API response does not contain psas array, setting empty array",
        );
        setPSAs([]);
      }
    } catch (error) {
      console.error("❌ Error fetching PSAs:", error);
      setPSAs([]); // Ensure PSAs is always an array
      toast({
        title: "Error",
        description:
          "Failed to load announcements. Check if backend is running.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Create PSA
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.content) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      const psaData = {
        ...formData,
        // createdBy: 'admin',
        status: "active",
      };

      let response;
      if (editingPSA) {
        response = await api.put(`/api/admin/psa/${editingPSA._id}`, psaData);
      } else {
        response = await api.post("/api/admin/psa", psaData);
      }

      toast({
        title: "Success",
        description: editingPSA
          ? "Announcement updated successfully"
          : "Announcement created successfully",
      });

      resetForm();
      fetchPSAs();
    } catch (error) {
      console.error("Error saving PSA:", error);
      toast({
        title: "Error",
        description: "Failed to save announcement",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Delete PSA
  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this announcement?")) return;

    try {
      setLoading(true);
      await api.delete(`/api/admin/psa/${id}`);

      toast({
        title: "Success",
        description: "Announcement deleted successfully",
      });

      fetchPSAs();
    } catch (error) {
      console.error("Error deleting PSA:", error);
      toast({
        title: "Error",
        description: "Failed to delete announcement",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Edit PSA
  const handleEdit = (psa: PSA) => {
    setFormData({
      title: psa.title,
      content: psa.content,
      type: psa.type,
      priority: psa.priority,
      targetAudience: psa.targetAudience || "all",
      scheduledFor: psa.scheduledFor || "",
    });
    setEditingPSA(psa);
    setShowCreateForm(true);
  };

  // Get type emoji
  const getTypeEmoji = (type: string) => {
    const emojiMap: { [key: string]: string } = {
      general: "📢",
      security: "🔒",
      maintenance: "🔧",
      feature: "✨",
      promotion: "🎯",
      warning: "⚠️",
      celebration: "🎉",
    };
    return emojiMap[type] || "📢";
  };

  // Get priority color
  const getPriorityColor = (priority: string) => {
    const colorMap: { [key: string]: string } = {
      low: "bg-green-100 text-green-800",
      medium: "bg-yellow-100 text-yellow-800",
      high: "bg-orange-100 text-orange-800",
      urgent: "bg-red-100 text-red-800",
    };
    return colorMap[priority] || "bg-gray-100 text-gray-800";
  };

  // Get status color
  const getStatusColor = (status: string) => {
    const colorMap: { [key: string]: string } = {
      draft: "bg-gray-100 text-gray-800",
      scheduled: "bg-blue-100 text-blue-800",
      active: "bg-green-100 text-green-800",
      inactive: "bg-yellow-100 text-yellow-800",
      expired: "bg-red-100 text-red-800",
    };
    return colorMap[status] || "bg-gray-100 text-gray-800";
  };

  // Ensure psas is always an array and add safety checks
  const safePSAs = Array.isArray(psas) ? psas : [];
  const activePSAs = safePSAs.filter((psa) => psa.status === "active");
  const draftPSAs = safePSAs.filter((psa) => psa.status === "draft");
  const scheduledPSAs = safePSAs.filter((psa) => psa.status === "scheduled");
  const totalViews = safePSAs.reduce(
    (sum, psa) => sum + (psa.metrics?.views || 0),
    0,
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-2">
                  🚀 PSA Broadcasting Hub
                </h1>
                <p className="text-gray-600 text-lg">
                  Manage and broadcast important announcements to your community
                </p>
              </div>
              <Button
                onClick={() => setShowCreateForm(!showCreateForm)}
                className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white px-6 py-3 rounded-2xl shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105"
              >
                ✨ {showCreateForm ? "Cancel" : "Create New PSA"}
              </Button>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-r from-green-400 to-emerald-500 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">
                  Active PSAs
                </p>
                <p className="text-3xl font-bold">{activePSAs.length}</p>
              </div>
              <div className="text-4xl">📢</div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-blue-400 to-cyan-500 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Scheduled</p>
                <p className="text-3xl font-bold">{scheduledPSAs.length}</p>
              </div>
              <div className="text-4xl">⏰</div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-orange-400 to-pink-500 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm font-medium">Drafts</p>
                <p className="text-3xl font-bold">{draftPSAs.length}</p>
              </div>
              <div className="text-4xl">📝</div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-400 to-indigo-500 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium">
                  Total Views
                </p>
                <p className="text-3xl font-bold">
                  {totalViews.toLocaleString()}
                </p>
              </div>
              <div className="text-4xl">👁️</div>
            </div>
          </div>
        </div>

        {/* Create/Edit Form */}
        {showCreateForm && (
          <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white/20 mb-8">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-6">
              {editingPSA
                ? "✏️ Edit Announcement"
                : "✨ Create New Announcement"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="title" className="text-gray-700 font-medium">
                    Title *
                  </Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    placeholder="Enter announcement title..."
                    className="mt-2 rounded-xl border-gray-200 focus:border-purple-400 focus:ring-purple-400"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="type" className="text-gray-700 font-medium">
                    Type
                  </Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) =>
                      setFormData({ ...formData, type: value as PSA["type"] })
                    }
                  >
                    <SelectTrigger className="mt-2 rounded-xl border-gray-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">📢 General</SelectItem>
                      <SelectItem value="security">🔒 Security</SelectItem>
                      <SelectItem value="maintenance">
                        🔧 Maintenance
                      </SelectItem>
                      <SelectItem value="feature">✨ Feature</SelectItem>
                      <SelectItem value="promotion">🎯 Promotion</SelectItem>
                      <SelectItem value="warning">⚠️ Warning</SelectItem>
                      <SelectItem value="celebration">
                        🎉 Celebration
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="content" className="text-gray-700 font-medium">
                  Content *
                </Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) =>
                    setFormData({ ...formData, content: e.target.value })
                  }
                  placeholder="Enter announcement content..."
                  className="mt-2 rounded-xl border-gray-200 focus:border-purple-400 focus:ring-purple-400 min-h-[120px]"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <Label
                    htmlFor="priority"
                    className="text-gray-700 font-medium"
                  >
                    Priority
                  </Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value) =>
                      setFormData({
                        ...formData,
                        priority: value as PSA["priority"],
                      })
                    }
                  >
                    <SelectTrigger className="mt-2 rounded-xl border-gray-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">🟢 Low</SelectItem>
                      <SelectItem value="medium">🟡 Medium</SelectItem>
                      <SelectItem value="high">🟠 High</SelectItem>
                      <SelectItem value="urgent">🔴 Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label
                    htmlFor="targetAudience"
                    className="text-gray-700 font-medium"
                  >
                    Target Audience
                  </Label>
                  <Select
                    value={formData.targetAudience}
                    onValueChange={(value) =>
                      setFormData({ ...formData, targetAudience: value })
                    }
                  >
                    <SelectTrigger className="mt-2 rounded-xl border-gray-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">👥 All Users</SelectItem>
                      <SelectItem value="premium">💎 Premium Users</SelectItem>
                      <SelectItem value="new">🆕 New Users</SelectItem>
                      <SelectItem value="active">⚡ Active Users</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label
                    htmlFor="scheduledFor"
                    className="text-gray-700 font-medium"
                  >
                    Schedule For
                  </Label>
                  <Input
                    id="scheduledFor"
                    type="datetime-local"
                    value={formData.scheduledFor}
                    onChange={(e) =>
                      setFormData({ ...formData, scheduledFor: e.target.value })
                    }
                    className="mt-2 rounded-xl border-gray-200 focus:border-purple-400 focus:ring-purple-400"
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <Button
                  type="submit"
                  disabled={loading}
                  className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white px-8 py-3 rounded-2xl shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105"
                >
                  {loading
                    ? "⏳ Saving..."
                    : editingPSA
                    ? "💾 Update PSA"
                    : "🚀 Create PSA"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetForm}
                  className="px-8 py-3 rounded-2xl border-gray-200 hover:bg-gray-50 transition-all duration-300"
                >
                  ❌ Cancel
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* PSAs List */}
        <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white/20">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-6">
            📋 All Announcements
          </h2>

          {loading && !showCreateForm ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin text-4xl">🔄</div>
              <p className="mt-4 text-gray-600">Loading announcements...</p>
            </div>
          ) : safePSAs.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📢</div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                No announcements yet
              </h3>
              <p className="text-gray-500 mb-6">
                Create your first PSA to get started!
              </p>
              <Button
                onClick={() => setShowCreateForm(true)}
                className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white px-6 py-3 rounded-2xl shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105"
              >
                ✨ Create First PSA
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {safePSAs.map((psa) => (
                <div
                  key={psa._id}
                  className="bg-white/80 rounded-2xl p-6 shadow-lg border border-white/30 hover:shadow-xl transition-all duration-300 hover:scale-[1.02]"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-2xl">
                          {getTypeEmoji(psa.type)}
                        </span>
                        <h3 className="text-xl font-bold text-gray-800">
                          {psa.title}
                        </h3>
                        <Badge
                          className={`${getStatusColor(
                            psa.status,
                          )} rounded-full px-3 py-1`}
                        >
                          {psa.status.toUpperCase()}
                        </Badge>
                        <Badge
                          className={`${getPriorityColor(
                            psa.priority,
                          )} rounded-full px-3 py-1`}
                        >
                          {psa.priority.toUpperCase()}
                        </Badge>
                      </div>
                      <p className="text-gray-600 mb-4 leading-relaxed">
                        {psa.content}
                      </p>
                      <div className="flex items-center gap-6 text-sm text-gray-500">
                        <span>
                          📅 {new Date(psa.createdAt).toLocaleDateString()}
                        </span>
                        <span>👤 {psa.createdBy}</span>
                        {psa.metrics && (
                          <span>👁️ {psa.metrics.views} views</span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 ml-6">
                      <Button
                        onClick={() => handleEdit(psa)}
                        variant="outline"
                        size="sm"
                        className="rounded-xl hover:bg-blue-50 hover:border-blue-300 transition-all duration-300"
                      >
                        ✏️ Edit
                      </Button>
                      <Button
                        onClick={() => handleDelete(psa._id)}
                        variant="outline"
                        size="sm"
                        className="rounded-xl hover:bg-red-50 hover:border-red-300 text-red-600 hover:text-red-700 transition-all duration-300"
                      >
                        🗑️ Delete
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPSAManagement;
