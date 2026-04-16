import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Checkbox } from './ui/checkbox';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
import { Eye, Ban, CheckCircle, XCircle, Search, Filter, Trash2, Shield, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { moderationService, ReportedContent } from '../services/api/moderation';

interface ContentFilters {
  status?: string;
  contentType?: string;
  search?: string;
}

const ITEMS_PER_PAGE = 10;

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending Review' },
  { value: 'investigating', label: 'Investigating' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'dismissed', label: 'Dismissed' }
];

const CONTENT_TYPE_OPTIONS = [
  { value: 'post', label: 'Post' },
  { value: 'reel', label: 'Reel' },
  { value: 'story', label: 'Story' }
];

const BAN_DURATION_OPTIONS = [
  { value: '1', label: '1 Hour' },
  { value: '24', label: '24 Hours' },
  { value: '168', label: '1 Week' },
  { value: '720', label: '1 Month' },
  { value: 'permanent', label: 'Permanent' }
];

const CONTENT_WARNINGS = [
  'Sensitive content',
  'Adult content',
  'Spam content',
  'Harassment',
  'Violence',
  'Hate speech',
  'Copyright violation',
  'Fake information'
];

const AdminContentModeration: React.FC = () => {
  const [reports, setReports] = useState<ReportedContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [filters, setFilters] = useState<ContentFilters>({});
  
  // Dialog states
  const [previewOpen, setPreviewOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [markSafeDialogOpen, setMarkSafeDialogOpen] = useState(false);
  const [banDialogOpen, setBanDialogOpen] = useState(false);
  const [selectedContent, setSelectedContent] = useState<ReportedContent | null>(null);
  
  // Form states
  const [rejectReason, setRejectReason] = useState('');
  const [banReason, setBanReason] = useState('');
  const [banDuration, setBanDuration] = useState('168'); // 1 week default
  const [selectedWarnings, setSelectedWarnings] = useState<string[]>(['Sensitive content']);

  useEffect(() => {
    fetchReports();
  }, [currentPage, filters]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      console.log('Fetching reports with filters:', filters);
      console.log('API URL will be:', `${import.meta.env.VITE_API_BASE_URL}/api/admin/moderation/reports`);
      
      const response = await moderationService.getReportedContent(currentPage, ITEMS_PER_PAGE, filters);
      console.log('Full API response:', response);
      console.log('Reports array:', response.reports);
      console.log('Response pages:', response.pages);
      console.log('Response total:', response.total);
      
      setReports(response.reports || []);
      setTotalPages(response.pages || 1);
      setTotalItems(response.total || 0);
    } catch (error) {
      console.error('Error fetching reports:', error);
      console.error('Error details:', error.response?.data);
      toast.error('Failed to fetch reports');
    } finally {
      setLoading(false);
    }
  };

  // Dialog handlers
  const openPreviewDialog = (content: ReportedContent) => {
    setSelectedContent(content);
    setPreviewOpen(true);
  };

  const openRejectDialog = (content: ReportedContent) => {
    setSelectedContent(content);
    setRejectDialogOpen(true);
  };

  const openMarkSafeDialog = (content: ReportedContent) => {
    setSelectedContent(content);
    setMarkSafeDialogOpen(true);
  };

  const openBanDialog = (content: ReportedContent) => {
    setSelectedContent(content);
    setBanDialogOpen(true);
  };

  // Action handlers
  const handleApproveContent = async (reportId: string) => {
    try {
      await moderationService.moderateContent(reportId, 'approve');
      toast.success('Content approved successfully');
      fetchReports();
    } catch (error) {
      console.error('Error approving content:', error);
      toast.error('Failed to approve content');
    }
  };

  const handleRejectContent = async () => {
    if (!selectedContent || !rejectReason.trim()) return;
    
    try {
      await moderationService.moderateContent(selectedContent._id, 'reject', rejectReason);
      toast.success('Content rejected successfully');
      setRejectDialogOpen(false);
      setRejectReason('');
      fetchReports();
    } catch (error) {
      console.error('Error rejecting content:', error);
      toast.error('Failed to reject content');
    }
  };

  const handleMarkSafe = async () => {
    if (!selectedContent) return;
    
    try {
      await moderationService.moderateContent(selectedContent._id, 'mark_safe', undefined, `Content marked safe with warnings: ${selectedWarnings.join(', ')}`);
      toast.success('Content marked as safe');
      setMarkSafeDialogOpen(false);
      setSelectedWarnings(['Sensitive content']);
      fetchReports();
    } catch (error) {
      console.error('Error marking content as safe:', error);
      toast.error('Failed to mark content as safe');
    }
  };

  const handleBanUser = async () => {
    if (!selectedContent || !banReason.trim()) return;
    
    try {
      await moderationService.banUser(selectedContent.reportedUser._id, banReason, banDuration);
      toast.success(`User banned for ${banDuration === 'permanent' ? 'permanently' : banDuration + ' hours'}`);
      setBanDialogOpen(false);
      setBanReason('');
      setBanDuration('168');
      fetchReports();
    } catch (error) {
      console.error('Error banning user:', error);
      toast.error('Failed to ban user');
    }
  };

  const handleDeleteContent = async (contentId: string, reportId: string) => {
    try {
      console.log('Attempting to delete content:', contentId);
      console.log('API Base URL:', import.meta.env.VITE_API_BASE_URL || 'https://api.inventurcubes.com');
      
      // Delete the report completely from database
      console.log('Calling deleteContent...');
      await moderationService.deleteContent(contentId);
      console.log('deleteContent successful - report deleted from database');
      
      // No need for moderateContent call since the report is completely deleted
      
      toast.success('Content deleted successfully');
      fetchReports();
    } catch (error) {
      console.error('Error deleting content:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        url: error.config?.url
      });
      toast.error('Failed to delete content');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="text-yellow-600 border-yellow-600">Pending</Badge>;
      case 'investigating':
        return <Badge variant="outline" className="text-blue-600 border-blue-600">Investigating</Badge>;
      case 'resolved':
        return <Badge variant="outline" className="text-green-600 border-green-600">Resolved</Badge>;
      case 'dismissed':
        return <Badge variant="outline" className="text-gray-600 border-gray-600">Dismissed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return <Badge variant="destructive">Urgent</Badge>;
      case 'high':
        return <Badge variant="destructive">High</Badge>;
      case 'medium':
        return <Badge variant="outline" className="text-orange-600 border-orange-600">Medium</Badge>;
      case 'low':
        return <Badge variant="outline" className="text-green-600 border-green-600">Low</Badge>;
      default:
        return <Badge variant="outline">{priority}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Content Moderation</h1>
          <p className="text-muted-foreground">Review and moderate reported content</p>
        </div>
        <Card className="p-4">
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <span>Pending: {reports.filter(r => r.status === 'pending').length}</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span>High Priority: {reports.filter(r => r.priority === 'high' || r.priority === 'urgent').length}</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Reports Table */}
      <Card>
        <CardHeader>
          <CardTitle>Reported Content ({totalItems})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : reports.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No reports found</div>
          ) : (
            <div className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Content</TableHead>
                    <TableHead>Author</TableHead>
                    <TableHead>Reporter</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reports.map((report) => (
                    <TableRow key={report._id}>
                      <TableCell>
                        <div className="max-w-xs">
                          <p className="font-medium capitalize">{report.content.type}</p>
                          <p className="text-sm text-muted-foreground truncate">
                            {report.content.text || 'Media content'}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={report.reportedUser.profilePicture} />
                            <AvatarFallback>{report.reportedUser.username?.[0]?.toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{report.reportedUser.username}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={report.reporter.profilePicture} />
                            <AvatarFallback>{report.reporter.username?.[0]?.toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <span>{report.reporter.username}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {report.reportType}
                        </Badge>
                      </TableCell>
                      <TableCell>{getPriorityBadge(report.priority)}</TableCell>
                      <TableCell>{getStatusBadge(report.status)}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {new Date(report.createdAt).toLocaleDateString()}
                          <div className="text-xs text-muted-foreground">
                            {new Date(report.createdAt).toLocaleTimeString()}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openPreviewDialog(report)}
                            title="View Details"
                          >
                            <Eye size={16} />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleApproveContent(report._id)}
                            className="text-green-600 hover:text-green-700"
                            title="Approve"
                          >
                            <CheckCircle size={16} />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openRejectDialog(report)}
                            className="text-red-600 hover:text-red-700"
                            title="Reject"
                          >
                            <XCircle size={16} />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openMarkSafeDialog(report)}
                            className="text-blue-600 hover:text-blue-700"
                            title="Mark Safe"
                          >
                            <Shield size={16} />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openBanDialog(report)}
                            className="text-orange-600 hover:text-orange-700"
                            title="Ban Author"
                          >
                            <Ban size={16} />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-red-600 hover:text-red-700"
                                title="Delete Content"
                              >
                                <Trash2 size={16} />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Content</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to permanently delete this content? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteContent(report._id, report._id)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, totalItems)} of {totalItems} reports
                </p>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <span className="text-sm">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Content Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="w-[calc(100%-1rem)] sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>Content Preview & Moderation</DialogTitle>
              {selectedContent && (
                <Badge variant="outline" className="text-red-600 border-red-600">
                  {selectedContent.status}
                </Badge>
              )}
            </div>
          </DialogHeader>
          {selectedContent && (
            <div className="space-y-6">
              {/* User Info */}
              <div className="flex items-center space-x-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={selectedContent.reportedUser.profilePicture} />
                  <AvatarFallback>{selectedContent.reportedUser.username?.[0]?.toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-lg">{selectedContent.reportedUser.name}</p>
                  <p className="text-sm text-muted-foreground">@{selectedContent.reportedUser.username}</p>
                  <p className="text-xs text-muted-foreground">{new Date(selectedContent.content.createdAt).toLocaleString()}</p>
                </div>
                <div className="ml-auto">
                  <Badge variant="outline" className="capitalize">{selectedContent.content.type}</Badge>
                </div>
              </div>

              {/* Content */}
              <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                <p className="text-lg">{selectedContent.content.text}</p>
                {selectedContent.content.media && selectedContent.content.media.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
                    {selectedContent.content.media.map((mediaUrl, index) => (
                      <img 
                        key={index}
                        src={mediaUrl} 
                        alt={`Content ${index + 1}`} 
                        className="rounded-lg max-h-48 object-cover"
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Report Reasons */}
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-3">
                  <AlertTriangle className="text-red-600" size={20} />
                  <h3 className="font-medium text-red-800">Report Reasons ({selectedContent.reportCount} reports)</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="destructive">{selectedContent.reportType}</Badge>
                  <Badge variant="destructive">Spam</Badge>
                  <Badge variant="destructive">Harassment</Badge>
                </div>
              </div>

              {/* Content Warnings */}
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-3">
                  <Shield className="text-orange-600" size={20} />
                  <h3 className="font-medium text-orange-800">Content Warnings</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="text-orange-600 border-orange-600">Sensitive content</Badge>
                </div>
              </div>

              {/* Quick Actions */}
              <div>
                <h3 className="font-medium mb-3">Quick Actions</h3>
                <div className="flex flex-wrap gap-3">
                  <Button 
                    onClick={() => {
                      handleApproveContent(selectedContent._id);
                      setPreviewOpen(false);
                    }}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="mr-2" size={16} />
                    Approve
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setPreviewOpen(false);
                      openRejectDialog(selectedContent);
                    }}
                    className="text-red-600 border-red-600 hover:bg-red-50"
                  >
                    <XCircle className="mr-2" size={16} />
                    Reject
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => {
                      setPreviewOpen(false);
                      openMarkSafeDialog(selectedContent);
                    }}
                    className="text-blue-600 border-blue-600 hover:bg-blue-50"
                  >
                    <Shield className="mr-2" size={16} />
                    Mark Safe
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => {
                      setPreviewOpen(false);
                      openBanDialog(selectedContent);
                    }}
                    className="text-orange-600 border-orange-600 hover:bg-orange-50"
                  >
                    <Ban className="mr-2" size={16} />
                    Ban Author
                  </Button>
                  <Button 
                    variant="destructive"
                    onClick={() => {
                      handleDeleteContent(selectedContent._id, selectedContent._id);
                      setPreviewOpen(false);
                    }}
                  >
                    <Trash2 className="mr-2" size={16} />
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reject Content Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Content</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="rejectReason">Rejection Reason</Label>
              <Textarea
                id="rejectReason"
                placeholder="Please provide a reason for rejecting this content..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={4}
                className="mt-2"
              />
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-end gap-3">
              <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleRejectContent}
                disabled={!rejectReason.trim()}
              >
                Reject Content
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Mark Safe Dialog */}
      <Dialog open={markSafeDialogOpen} onOpenChange={setMarkSafeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <div className="flex items-center space-x-2">
              <Shield className="text-blue-600" size={20} />
              <DialogTitle>Mark Content as Safe</DialogTitle>
            </div>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Select content warnings for {selectedContent?.reportedUser.name}'s content:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {CONTENT_WARNINGS.map((warning) => (
                <div key={warning} className="flex items-center space-x-2">
                  <Checkbox
                    id={warning}
                    checked={selectedWarnings.includes(warning)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedWarnings([...selectedWarnings, warning]);
                      } else {
                        setSelectedWarnings(selectedWarnings.filter(w => w !== warning));
                      }
                    }}
                  />
                  <Label htmlFor={warning} className="text-sm">{warning}</Label>
                </div>
              ))}
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-end gap-3">
              <Button variant="outline" onClick={() => setMarkSafeDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleMarkSafe}
                className="bg-red-600 hover:bg-red-700"
              >
                Mark as Safe
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Ban Author Dialog */}
      <Dialog open={banDialogOpen} onOpenChange={setBanDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ban Author</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="banReason">Ban Reason</Label>
              <Textarea
                id="banReason"
                placeholder="Please provide a reason for banning this author..."
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                rows={3}
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="banDuration">Ban Duration</Label>
              <Select value={banDuration} onValueChange={setBanDuration}>
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BAN_DURATION_OPTIONS.map(option => (
                    <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-end gap-3">
              <Button variant="outline" onClick={() => setBanDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                variant="destructive"
                onClick={handleBanUser}
                disabled={!banReason.trim()}
                className="bg-red-400 hover:bg-red-500"
              >
                Ban Author
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminContentModeration;
