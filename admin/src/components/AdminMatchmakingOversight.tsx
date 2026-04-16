import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from './ui/card';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from './ui/table';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  AlertTriangle, 
  Eye, 
  Ban, 
  Shield, 
  Clock, 
  MessageSquare, 
  Users, 
  Activity,
  Search,
  Filter,
  ChevronDown,
  CheckCircle,
  XCircle,
  AlertCircle,
  UserX
} from 'lucide-react';
import { Alert, AlertDescription } from './ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';

interface Match {
  _id: string;
  userId: {
    _id: string;
    username: string;
    name?: string;
    profilePicture?: string;
  };
  matchedUserId: {
    _id: string;
    username: string;
    name?: string;
    profilePicture?: string;
  };
  matchDate: string;
  messageCount: number;
  lastMessageTime: string | null;
  isFlagged: boolean;
  chatId: string | null;
  messagingApproved: boolean;
  messageRequestPending: boolean;
  isBlocked: boolean;
}

interface FlaggedChat {
  _id: string;
  reportType: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: string;
  description: string;
  createdAt: string;
  reporterId: {
    username: string;
    name?: string;
  };
  chatDetails: {
    _id: string;
    user1: {
      username: string;
      name?: string;
      profilePicture?: string;
    };
    user2: {
      username: string;
      name?: string;
      profilePicture?: string;
    };
    messageCount: number;
    createdAt: string;
  };
  recentMessages: Array<{
    _id: string;
    content: string;
    senderId: {
      username: string;
    };
    createdAt: string;
  }>;
}

interface OverviewStats {
  totalMatches: number;
  activeChats: number;
  reportedChats: number;
  blockedUsers: number;
  newMatches: number;
  messagesSent: number;
  successRate: string;
}

const AdminMatchmakingOversight: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [matches, setMatches] = useState<Match[]>([]);
  const [flaggedChats, setFlaggedChats] = useState<FlaggedChat[]>([]);
  const [overviewStats, setOverviewStats] = useState<OverviewStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedChat, setSelectedChat] = useState<FlaggedChat | null>(null);
  const [suspendDialogOpen, setSuspendDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  
  // Filters
  const [matchFilters, setMatchFilters] = useState({
    status: 'all',
    search: '',
    dateFrom: '',
    dateTo: '',
    sortBy: 'matchDate',
    sortOrder: 'desc'
  });
  
  const [flaggedFilters, setFlaggedFilters] = useState({
    severity: 'all',
    status: 'pending'
  });

  // Pagination
  const [matchPagination, setMatchPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });
  
  const [flaggedPagination, setFlaggedPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });

  useEffect(() => {
    fetchOverview();
  }, []);

  useEffect(() => {
    if (activeTab === 'matches') {
      fetchMatches();
    } else if (activeTab === 'flagged') {
      fetchFlaggedChats();
    }
  }, [activeTab, matchFilters, flaggedFilters, matchPagination.page, flaggedPagination.page]);

  const fetchOverview = async () => {
    try {
      const response = await fetch('https://api.inventurcubes.com/api/admin/matchmaking/overview', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setOverviewStats(data.overview);
      }
    } catch (error) {
      console.error('Error fetching overview stats:', error);
    }
  };

  const fetchMatches = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: matchPagination.page.toString(),
        limit: matchPagination.limit.toString(),
        ...matchFilters
      });

      const response = await fetch(`https://api.inventurcubes.com/api/admin/matchmaking/matches?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setMatches(data.data.matches);
        setMatchPagination(prev => ({
          ...prev,
          total: data.data.pagination.total,
          pages: data.data.pagination.pages
        }));
      }
    } catch (error) {
      console.error('Error fetching matches:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFlaggedChats = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: flaggedPagination.page.toString(),
        limit: flaggedPagination.limit.toString(),
        ...flaggedFilters
      });

      const response = await fetch(`https://api.inventurcubes.com/api/admin/matchmaking/flagged-conversations?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setFlaggedChats(data.data.flaggedChats);
        setFlaggedPagination(prev => ({
          ...prev,
          total: data.data.pagination.total,
          pages: data.data.pagination.pages
        }));
      }
    } catch (error) {
      console.error('Error fetching flagged chats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSuspendUser = async (userId: string, duration: string, reason: string) => {
    try {
      const response = await fetch(`https://api.inventurcubes.com/api/admin/matchmaking/suspend-user/${userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
        },
        body: JSON.stringify({
          reason,
          duration,
          suspendMatching: true,
          suspendMessaging: true
        }),
      });
      
      if (response.ok) {
        alert('User suspended successfully');
        setSuspendDialogOpen(false);
        fetchMatches();
        fetchFlaggedChats();
      }
    } catch (error) {
      console.error('Error suspending user:', error);
    }
  };

  const handleModerateChat = async (chatId: string, action: string, reason: string, reportId?: string) => {
    try {
      const response = await fetch(`https://api.inventurcubes.com/api/admin/matchmaking/moderate-chat/${chatId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
        },
        body: JSON.stringify({
          action,
          reason,
          reportId
        }),
      });
      
      if (response.ok) {
        alert(`Chat ${action} completed successfully`);
        setSelectedChat(null);
        fetchFlaggedChats();
      }
    } catch (error) {
      console.error('Error moderating chat:', error);
    }
  };

  const getStatusBadge = (match: Match) => {
    if (match.isBlocked) {
      return <Badge variant="destructive">Blocked</Badge>;
    }
    if (match.messagingApproved) {
      return <Badge variant="default">Active</Badge>;
    }
    if (match.messageRequestPending) {
      return <Badge variant="secondary">Pending</Badge>;
    }
    return <Badge variant="outline">Matched</Badge>;
  };

  const getSeverityBadge = (severity: string) => {
    const variants: Record<string, any> = {
      low: 'outline',
      medium: 'secondary',
      high: 'destructive',
      critical: 'destructive'
    };
    
    return <Badge variant={variants[severity]}>{severity.toUpperCase()}</Badge>;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString() + ' ' + new Date(dateString).toLocaleTimeString();
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Matchmaking Oversight</h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3 h-auto gap-1">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="matches">Match Logs</TabsTrigger>
          <TabsTrigger value="flagged">Flagged Conversations</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {overviewStats && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Matches</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{overviewStats.totalMatches}</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Chats</CardTitle>
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{overviewStats.activeChats}</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Reported Chats</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{overviewStats.reportedChats}</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{overviewStats.successRate}%</div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="matches" className="space-y-6">
          {/* Match Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Filters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select value={matchFilters.status} onValueChange={(value) => 
                    setMatchFilters(prev => ({ ...prev, status: value }))
                  }>
                    <SelectTrigger>
                      <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="blocked">Blocked</SelectItem>
                      <SelectItem value="unmatched">Unmatched</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="search">Search Users</Label>
                  <Input
                    id="search"
                    placeholder="Username or name..."
                    value={matchFilters.search}
                    onChange={(e) => setMatchFilters(prev => ({ ...prev, search: e.target.value }))}
                  />
                </div>
                
                <div>
                  <Label htmlFor="dateFrom">From Date</Label>
                  <Input
                    id="dateFrom"
                    type="date"
                    value={matchFilters.dateFrom}
                    onChange={(e) => setMatchFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                  />
                </div>
                
                <div>
                  <Label htmlFor="dateTo">To Date</Label>
                  <Input
                    id="dateTo"
                    type="date"
                    value={matchFilters.dateTo}
                    onChange={(e) => setMatchFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                  />
                </div>
                
                <div>
                  <Label htmlFor="sortBy">Sort By</Label>
                  <Select value={matchFilters.sortBy} onValueChange={(value) => 
                    setMatchFilters(prev => ({ ...prev, sortBy: value }))
                  }>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="matchDate">Match Date</SelectItem>
                      <SelectItem value="messageCount">Message Count</SelectItem>
                      <SelectItem value="lastMessageTime">Last Message</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-end">
                  <Button 
                    onClick={() => setMatchPagination(prev => ({ ...prev, page: 1 }))}
                    className="w-full"
                  >
                    <Filter className="w-4 h-4 mr-2" />
                    Apply Filters
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Match Logs Table */}
          <Card>
            <CardHeader>
              <CardTitle>Match Logs</CardTitle>
              <CardDescription>Monitor all matchmaking activities and conversations</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-8">Loading...</div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Users</TableHead>
                        <TableHead>Match Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Messages</TableHead>
                        <TableHead>Last Activity</TableHead>
                        <TableHead>Flags</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {matches.map((match) => (
                        <TableRow key={match._id}>
                          <TableCell>
                            <div className="flex items-center space-x-3">
                              <div className="flex -space-x-2">
                                <Avatar className="h-8 w-8 border-2 border-background">
                                  <AvatarImage src={match.userId.profilePicture} />
                                  <AvatarFallback>{match.userId.username[0].toUpperCase()}</AvatarFallback>
                                </Avatar>
                                <Avatar className="h-8 w-8 border-2 border-background">
                                  <AvatarImage src={match.matchedUserId.profilePicture} />
                                  <AvatarFallback>{match.matchedUserId.username[0].toUpperCase()}</AvatarFallback>
                                </Avatar>
                              </div>
                              <div>
                                <div className="font-medium">
                                  {match.userId.username} ↔ {match.matchedUserId.username}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {match.userId.name} & {match.matchedUserId.name}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{formatDate(match.matchDate)}</TableCell>
                          <TableCell>{getStatusBadge(match)}</TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <MessageSquare className="h-4 w-4" />
                              <span>{match.messageCount}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {match.lastMessageTime 
                              ? formatDate(match.lastMessageTime)
                              : 'No messages'
                            }
                          </TableCell>
                          <TableCell>
                            {match.isFlagged && (
                              <Badge variant="destructive">
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                Flagged
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              {match.chatId && (
                                <Button size="sm" variant="outline">
                                  <Eye className="h-4 w-4" />
                                </Button>
                              )}
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => {
                                  setSelectedUserId(match.userId._id);
                                  setSuspendDialogOpen(true);
                                }}
                              >
                                <UserX className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  
                  {/* Pagination */}
                  <div className="flex justify-between items-center mt-4">
                    <div className="text-sm text-muted-foreground">
                      Showing {((matchPagination.page - 1) * matchPagination.limit) + 1} to{' '}
                      {Math.min(matchPagination.page * matchPagination.limit, matchPagination.total)} of{' '}
                      {matchPagination.total} results
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={matchPagination.page <= 1}
                        onClick={() => setMatchPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={matchPagination.page >= matchPagination.pages}
                        onClick={() => setMatchPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="flagged" className="space-y-6">
          {/* Flagged Chat Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Filters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="severity">Severity</Label>
                  <Select value={flaggedFilters.severity} onValueChange={(value) => 
                    setFlaggedFilters(prev => ({ ...prev, severity: value }))
                  }>
                    <SelectTrigger>
                      <SelectValue placeholder="All severities" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select value={flaggedFilters.status} onValueChange={(value) => 
                    setFlaggedFilters(prev => ({ ...prev, status: value }))
                  }>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="under_review">Under Review</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="dismissed">Dismissed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-end">
                  <Button 
                    onClick={() => setFlaggedPagination(prev => ({ ...prev, page: 1 }))}
                    className="w-full"
                  >
                    <Filter className="w-4 h-4 mr-2" />
                    Apply Filters
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Flagged Conversations Table */}
          <Card>
            <CardHeader>
              <CardTitle>Flagged Conversations</CardTitle>
              <CardDescription>Review and moderate reported conversations</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-8">Loading...</div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Report</TableHead>
                        <TableHead>Participants</TableHead>
                        <TableHead>Severity</TableHead>
                        <TableHead>Reporter</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {flaggedChats.map((report) => (
                        <TableRow key={report._id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{report.reportType}</div>
                              <div className="text-sm text-muted-foreground">{report.description}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-3">
                              <div className="flex -space-x-2">
                                <Avatar className="h-8 w-8 border-2 border-background">
                                  <AvatarImage src={report.chatDetails.user1.profilePicture} />
                                  <AvatarFallback>{report.chatDetails.user1.username[0].toUpperCase()}</AvatarFallback>
                                </Avatar>
                                <Avatar className="h-8 w-8 border-2 border-background">
                                  <AvatarImage src={report.chatDetails.user2.profilePicture} />
                                  <AvatarFallback>{report.chatDetails.user2.username[0].toUpperCase()}</AvatarFallback>
                                </Avatar>
                              </div>
                              <div>
                                <div className="font-medium">
                                  {report.chatDetails.user1.username} ↔ {report.chatDetails.user2.username}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {report.chatDetails.messageCount} messages
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{getSeverityBadge(report.severity)}</TableCell>
                          <TableCell>{report.reporterId.username}</TableCell>
                          <TableCell>{formatDate(report.createdAt)}</TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => setSelectedChat(report)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleModerateChat(report.chatDetails._id, 'approve', 'Approved by admin', report._id)}
                              >
                                <CheckCircle className="h-4 w-4 text-green-600" />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleModerateChat(report.chatDetails._id, 'suspend_chat', 'Inappropriate content', report._id)}
                              >
                                <XCircle className="h-4 w-4 text-red-600" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  
                  {/* Pagination */}
                  <div className="flex justify-between items-center mt-4">
                    <div className="text-sm text-muted-foreground">
                      Showing {((flaggedPagination.page - 1) * flaggedPagination.limit) + 1} to{' '}
                      {Math.min(flaggedPagination.page * flaggedPagination.limit, flaggedPagination.total)} of{' '}
                      {flaggedPagination.total} results
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={flaggedPagination.page <= 1}
                        onClick={() => setFlaggedPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={flaggedPagination.page >= flaggedPagination.pages}
                        onClick={() => setFlaggedPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Chat Details Dialog */}
      <Dialog open={!!selectedChat} onOpenChange={() => setSelectedChat(null)}>
        <DialogContent className="w-[calc(100%-1rem)] sm:max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Chat Details & Moderation</DialogTitle>
            <DialogDescription>
              Review the conversation and take appropriate action
            </DialogDescription>
          </DialogHeader>
          
          {selectedChat && (
            <div className="space-y-6">
              {/* Chat Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Report Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div><strong>Type:</strong> {selectedChat.reportType}</div>
                    <div><strong>Severity:</strong> {getSeverityBadge(selectedChat.severity)}</div>
                    <div><strong>Reporter:</strong> {selectedChat.reporterId.username}</div>
                    <div><strong>Date:</strong> {formatDate(selectedChat.createdAt)}</div>
                    <div><strong>Description:</strong> {selectedChat.description}</div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Chat Info</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div><strong>Participants:</strong> {selectedChat.chatDetails.user1.username} & {selectedChat.chatDetails.user2.username}</div>
                    <div><strong>Messages:</strong> {selectedChat.chatDetails.messageCount}</div>
                    <div><strong>Started:</strong> {formatDate(selectedChat.chatDetails.createdAt)}</div>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Messages */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Recent Messages</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {selectedChat.recentMessages.map((message) => (
                      <div key={message._id} className="flex items-start space-x-3 p-3 rounded border">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>{message.senderId.username[0].toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium text-sm">{message.senderId.username}</span>
                            <span className="text-xs text-muted-foreground">{formatDate(message.createdAt)}</span>
                          </div>
                          <p className="text-sm mt-1">{message.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Moderation Actions */}
              <div className="flex flex-col sm:flex-row flex-wrap gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => handleModerateChat(selectedChat.chatDetails._id, 'approve', 'Approved after review', selectedChat._id)}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approve
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => handleModerateChat(selectedChat.chatDetails._id, 'warn', 'Warning issued for inappropriate content', selectedChat._id)}
                >
                  <AlertCircle className="h-4 w-4 mr-2" />
                  Warn Users
                </Button>
                <Button 
                  variant="destructive"
                  onClick={() => handleModerateChat(selectedChat.chatDetails._id, 'suspend_chat', 'Chat suspended for policy violation', selectedChat._id)}
                >
                  <Ban className="h-4 w-4 mr-2" />
                  Suspend Chat
                </Button>
                <Button 
                  variant="destructive"
                  onClick={() => handleModerateChat(selectedChat.chatDetails._id, 'ban_users', 'Users banned for serious policy violation', selectedChat._id)}
                >
                  <UserX className="h-4 w-4 mr-2" />
                  Ban Users
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Suspend User Dialog */}
      <Dialog open={suspendDialogOpen} onOpenChange={setSuspendDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Suspend User</DialogTitle>
            <DialogDescription>
              Suspend user from matchmaking activities
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="suspendReason">Reason</Label>
              <Textarea
                id="suspendReason"
                placeholder="Enter suspension reason..."
              />
            </div>
            
            <div>
              <Label htmlFor="suspendDuration">Duration (days)</Label>
              <Input
                id="suspendDuration"
                type="number"
                placeholder="Enter number of days (leave empty for permanent)"
              />
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <Button 
                onClick={() => {
                  const reason = (document.getElementById('suspendReason') as HTMLTextAreaElement)?.value;
                  const duration = (document.getElementById('suspendDuration') as HTMLInputElement)?.value;
                  if (reason && duration) {
                    handleSuspendUser(selectedUserId, duration, reason);
                  }
                }}
              >
                Suspend User
              </Button>
              <Button variant="outline" onClick={() => setSuspendDialogOpen(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminMatchmakingOversight;