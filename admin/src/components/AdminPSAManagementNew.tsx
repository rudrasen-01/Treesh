import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Megaphone, Edit, Trash2, Plus, Clock, Users, AlertCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import psaService from '@/services/psaService';

interface PSA {
  _id: string;
  title: string;
  content: string;
  type: 'general' | 'security' | 'maintenance' | 'feature' | 'promotion' | 'warning' | 'celebration';
  status: 'draft' | 'scheduled' | 'active' | 'inactive' | 'expired';
  priority: 'low' | 'medium' | 'high' | 'urgent';
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
    title: '',
    content: '',
    type: 'general' as PSA['type'],
    priority: 'medium' as PSA['priority'],
    targetAudience: 'all',
    scheduledFor: '',
  });

  // Reset form
  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      type: 'general',
      priority: 'medium',
      targetAudience: 'all',
      scheduledFor: '',
    });
    setShowCreateForm(false);
    setEditingPSA(null);
  };

  // Fetch PSAs
  const fetchPSAs = async () => {
    try {
      setLoading(true);
      console.log('🔄 Fetching PSAs from backend...');
      const response = await psaService.getAllPSAs();
      console.log('✅ PSAs fetched successfully:', response);
      setPSAs(response.psas || []);
    } catch (error) {
      console.error('❌ Error fetching PSAs:', error);
      toast({
        title: "Error",
        description: "Failed to fetch PSAs. Make sure the backend is running.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Create PSA
  const handleCreatePSA = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('🚀 Creating new PSA...');
    console.log('📝 Form Data:', formData);
    
    if (!formData.title.trim() || !formData.content.trim()) {
      toast({
        title: "Validation Error",
        description: "Title and content are required",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      const result = await psaService.createPSA(formData);
      console.log('✅ PSA created successfully:', result);
      
      toast({
        title: "Success! 🎉",
        description: "PSA created successfully and posted to user feeds!",
      });
      
      resetForm();
      fetchPSAs(); // Refresh the list
    } catch (error) {
      console.error('❌ Error creating PSA:', error);
      toast({
        title: "Error",
        description: "Failed to create PSA. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Update PSA
  const handleUpdatePSA = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPSA) return;
    
    console.log('🔄 Updating PSA:', editingPSA._id);
    
    try {
      setLoading(true);
      const result = await psaService.updatePSA(editingPSA._id, formData);
      console.log('✅ PSA updated successfully:', result);
      
      toast({
        title: "Success! 🎉",
        description: "PSA updated successfully!",
      });
      
      resetForm();
      fetchPSAs(); // Refresh the list
    } catch (error) {
      console.error('❌ Error updating PSA:', error);
      toast({
        title: "Error",
        description: "Failed to update PSA. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Delete PSA
  const handleDeletePSA = async (id: string) => {
    if (!confirm('Are you sure you want to delete this PSA?')) return;
    
    console.log('🗑️ Deleting PSA:', id);
    
    try {
      setLoading(true);
      await psaService.deletePSA(id);
      console.log('✅ PSA deleted successfully');
      
      toast({
        title: "Success! 🎉",
        description: "PSA deleted successfully!",
      });
      
      fetchPSAs(); // Refresh the list
    } catch (error) {
      console.error('❌ Error deleting PSA:', error);
      toast({
        title: "Error",
        description: "Failed to delete PSA. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Edit PSA
  const handleEditPSA = (psa: PSA) => {
    console.log('✏️ Editing PSA:', psa._id);
    setEditingPSA(psa);
    setFormData({
      title: psa.title,
      content: psa.content,
      type: psa.type,
      priority: psa.priority,
      targetAudience: 'all', // Default for now
      scheduledFor: psa.scheduledFor || '',
    });
    setShowCreateForm(true);
  };

  // Load PSAs on component mount
  useEffect(() => {
    console.log('🎯 PSA Manager component mounted');
    fetchPSAs();
  }, []);

  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'inactive': return 'bg-red-100 text-red-800';
      case 'expired': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Megaphone className="h-8 w-8 text-orange-600" />
            PSA Manager
          </h1>
          <p className="text-gray-600 mt-1">
            Create and manage public service announcements for your community
          </p>
        </div>
        <Button 
          onClick={() => setShowCreateForm(true)}
          className="bg-orange-600 hover:bg-orange-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create PSA
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total PSAs</p>
                <p className="text-2xl font-bold text-gray-900">{psas.length}</p>
              </div>
              <Megaphone className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active</p>
                <p className="text-2xl font-bold text-green-600">
                  {psas.filter(psa => psa.status === 'active').length}
                </p>
              </div>
              <Clock className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Scheduled</p>
                <p className="text-2xl font-bold text-blue-600">
                  {psas.filter(psa => psa.status === 'scheduled').length}
                </p>
              </div>
              <Clock className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">High Priority</p>
                <p className="text-2xl font-bold text-red-600">
                  {psas.filter(psa => psa.priority === 'high' || psa.priority === 'urgent').length}
                </p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Create/Edit Form */}
      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingPSA ? 'Edit PSA' : 'Create New PSA'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={editingPSA ? handleUpdatePSA : handleCreatePSA} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Enter PSA title"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="type">Type</Label>
                  <Select value={formData.type} onValueChange={(value: PSA['type']) => setFormData({ ...formData, type: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General</SelectItem>
                      <SelectItem value="security">Security</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                      <SelectItem value="feature">Feature</SelectItem>
                      <SelectItem value="promotion">Promotion</SelectItem>
                      <SelectItem value="warning">Warning</SelectItem>
                      <SelectItem value="celebration">Celebration</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">Content *</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Enter PSA content"
                  rows={4}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select value={formData.priority} onValueChange={(value: PSA['priority']) => setFormData({ ...formData, priority: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="targetAudience">Target Audience</Label>
                  <Select value={formData.targetAudience} onValueChange={(value) => setFormData({ ...formData, targetAudience: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Users</SelectItem>
                      <SelectItem value="new">New Users</SelectItem>
                      <SelectItem value="premium">Premium Users</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="scheduledFor">Schedule For (Optional)</Label>
                <Input
                  id="scheduledFor"
                  type="datetime-local"
                  value={formData.scheduledFor}
                  onChange={(e) => setFormData({ ...formData, scheduledFor: e.target.value })}
                />
              </div>

              <div className="flex gap-2">
                <Button 
                  type="submit" 
                  disabled={loading}
                  className="bg-orange-600 hover:bg-orange-700"
                >
                  {loading ? 'Processing...' : editingPSA ? 'Update PSA' : 'Create PSA'}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={resetForm}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* PSAs List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Active Announcements ({psas.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading && psas.length === 0 ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto"></div>
              <p className="text-gray-500 mt-2">Loading PSAs...</p>
            </div>
          ) : psas.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Megaphone className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No PSAs found. Create your first announcement!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {psas.map((psa) => (
                <div key={psa._id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-lg">{psa.title}</h3>
                        <Badge className={getPriorityColor(psa.priority)}>
                          {psa.priority}
                        </Badge>
                        <Badge className={getStatusColor(psa.status)}>
                          {psa.status}
                        </Badge>
                      </div>
                      <p className="text-gray-600 mb-2">{psa.content}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>Type: {psa.type}</span>
                        <span>Created: {new Date(psa.createdAt).toLocaleDateString()}</span>
                        {psa.metrics && (
                          <span>Views: {psa.metrics.views || 0}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditPSA(psa)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeletePSA(psa._id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminPSAManagement;