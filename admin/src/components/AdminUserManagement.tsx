import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { Input } from "./ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import {
  Eye,
  Ban,
  UserCheck,
  Search,
  Filter,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Key,
  Award,
  Clock,
  Shield,
} from "lucide-react";
import { toast } from "sonner";
import { userService, User } from "../services/api/users";

interface UserFilters {
  status?: string;
  role?: string;
  search?: string;
}

const ITEMS_PER_PAGE = 10;

interface UserActivity {
  _id: string;
  userId: string;
  action: string;
  details: string;
  timestamp: string;
}

const STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "suspended", label: "Suspended" },
  { value: "banned", label: "Banned" },
  { value: "pending", label: "Pending" },
];

const ROLE_OPTIONS = [
  { value: "user", label: "User" },
  { value: "moderator", label: "Moderator" },
  { value: "admin", label: "Admin" },
];

const mockActivityLogs = [
  {
    id: "1",
    user: "Alice Johnson",
    action: "Posted new content",
    timestamp: "2024-01-20 14:30",
    details: "Uploaded a new photo",
    ipAddress: "192.168.1.100",
    userAgent: "Chrome 120.0.0.0",
  },
  {
    id: "2",
    user: "Bob Smith",
    action: "Account blocked",
    timestamp: "2024-01-20 10:15",
    details: "Violated community guidelines",
    ipAddress: "192.168.1.101",
    userAgent: "Firefox 121.0.0.0",
  },
  {
    id: "3",
    user: "Alice Johnson",
    action: "Login successful",
    timestamp: "2024-01-20 14:30",
    details: "Login from new device",
    ipAddress: "192.168.1.100",
    userAgent: "Chrome 120.0.0.0",
  },
  {
    id: "4",
    user: "Bob Smith",
    action: "Login failed",
    timestamp: "2024-01-20 10:15",
    details: "Invalid password attempt",
    ipAddress: "192.168.1.101",
    userAgent: "Firefox 121.0.0.0",
  },
];

const availableBadges = [
  "Verified",
  "Top Creator",
  "Moderator",
  "Early Adopter",
  "Premium Member",
  "Community Helper",
  "Content Creator",
  "Influencer",
];

interface AdminUserManagementProps {
  section: "all-users" | "blocked-users" | "activity-logs" | "pending-users";
}

export const AdminUserManagement = ({ section }: AdminUserManagementProps) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState<UserFilters>({});
  const [showAddUser, setShowAddUser] = useState(false);
  const [showEditUser, setShowEditUser] = useState(false);
  const [showDeleteUser, setShowDeleteUser] = useState(false);
  const [showBadgeManagement, setShowBadgeManagement] = useState(false);
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedBadges, setSelectedBadges] = useState<string[]>([]);

  // Fetch users on component mount and when filters change
  useEffect(() => {
    fetchUsers();
  }, [currentPage, filters]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await userService.getUsers(
        currentPage,
        ITEMS_PER_PAGE,
        filters,
      );
      setUsers(response.users || []);
      setTotalPages(Math.ceil((response.total || 0) / ITEMS_PER_PAGE));
    } catch (error) {
      console.error("Failed to fetch users:", error);
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  // Form states
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    displayName: "",
    role: "user" as const,
    status: "active" as const,
  });

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "active":
        return "default";
      case "blocked":
        return "destructive";
      case "suspended":
        return "secondary";
      case "pending":
        return "outline";
      default:
        return "outline";
    }
  };

  const handleAddUser = async () => {
    if (!formData.displayName || !formData.username || !formData.email) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      const newUserData = {
        username: formData.username,
        email: formData.email,
        name: formData.displayName,
        role: formData.role,
        status: formData.status,
      };

      await userService.createUser(newUserData);
      toast.success("User created successfully");
      fetchUsers();
      setShowAddUser(false);
      setFormData({
        username: "",
        email: "",
        displayName: "",
        role: "user",
        status: "active",
      });
    } catch (error) {
      console.error("Failed to create user:", error);
      toast.error("Failed to create user");
    }
  };

  const handleStatusChange = async (userId: string, newStatus: string) => {
    try {
      await userService.updateUser(userId, {
        status: newStatus as User["status"],
      });
      toast.success("User status updated successfully");
      fetchUsers();
    } catch (error) {
      console.error("Failed to update user status:", error);
      toast.error("Failed to update user status");
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      await userService.updateUser(userId, { role: newRole as User["role"] });
      toast.success("User role updated successfully");
      fetchUsers();
    } catch (error) {
      console.error("Failed to update user role:", error);
      toast.error("Failed to update user role");
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      await userService.deleteUser(userId);
      toast.success("User deleted successfully");
      fetchUsers();
    } catch (error) {
      console.error("Failed to delete user:", error);
      toast.error("Failed to delete user");
    }
  };

  const handleEditUser = async () => {
    if (
      !selectedUser ||
      !formData.displayName ||
      !formData.username ||
      !formData.email
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      await userService.updateUser(selectedUser._id, formData);
      toast.success("User updated successfully");
      fetchUsers();
      setShowEditUser(false);
      setSelectedUser(null);
      setFormData({
        username: "",
        email: "",
        displayName: "",
        role: "user",
        status: "active",
      });
    } catch (error) {
      console.error("Failed to update user:", error);
      toast.error("Failed to update user");
    }
  };

  const confirmDeleteUser = async () => {
    if (!selectedUser) return;

    try {
      await userService.deleteUser(selectedUser._id);
      toast.success("User deleted successfully");
      fetchUsers();
      setShowDeleteUser(false);
      setSelectedUser(null);
    } catch (error) {
      console.error("Failed to delete user:", error);
      toast.error("Failed to delete user");
    }
  };

  const handlePasswordReset = async () => {
    if (!selectedUser) return;

    try {
      await userService.sendPasswordReset(selectedUser._id);
      toast.success(`Password reset email sent to ${selectedUser.email}`);
      setShowPasswordReset(false);
      setSelectedUser(null);
    } catch (error) {
      console.error("Error sending password reset:", error);
      toast.error("Failed to send password reset email");
    }
  };

  const handleBadgeUpdate = async () => {
    if (!selectedUser) return;

    try {
      await userService.updateUserBadges(selectedUser._id, selectedBadges);

      setUsers(
        users.map((user) =>
          user._id === selectedUser._id
            ? { ...user, badges: selectedBadges }
            : user,
        ),
      );

      setShowBadgeManagement(false);
      setSelectedUser(null);
      setSelectedBadges([]);
      toast.success("User badges updated successfully");
    } catch (error) {
      console.error("Error updating badges:", error);
      toast.error("Failed to update badges");
    }
  };

  const openEditDialog = (user: User) => {
    setSelectedUser(user);
    setFormData({
      username: user.username,
      email: user.email,
      displayName: user.displayName || "",
      role: user.role as any,
      status: user.status as any,
    });
    setShowEditUser(true);
  };

  const openDeleteUser = (user: User) => {
    setSelectedUser(user);
    setShowDeleteUser(true);
  };

  const openPasswordReset = (user: User) => {
    setSelectedUser(user);
    setShowPasswordReset(true);
  };

  const openBadgeManagement = (user: User) => {
    setSelectedUser(user);
    setSelectedBadges(user.badges || []);
    setShowBadgeManagement(true);
  };

  const openUserProfile = (user: User) => {
    setSelectedUser(user);
    setShowUserProfile(true);
  };

  const filteredUsers = users.filter((user) => {
    const displayName = user.displayName || user.username;
    const matchesSearch =
      displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || user.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Mobile-friendly user card component
  const renderUserCard = (user: User) => (
    <div
      key={user._id}
      className="bg-white p-3 sm:p-4 rounded-lg shadow border space-y-3"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-3">
          <Avatar className="w-10 h-10 sm:w-12 sm:h-12">
            <AvatarImage src={user.profilePicture || "/placeholder.svg"} />
            <AvatarFallback className="text-sm sm:text-base">
              {(user.displayName || user.username)[0]}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-medium text-gray-900 text-sm sm:text-base">
              {user.displayName || user.username}
            </h3>
            <p className="text-xs sm:text-sm text-gray-500">@{user.username}</p>
            <p className="text-xs sm:text-sm text-gray-500">{user.email}</p>
          </div>
        </div>
        <div className="text-right">
          <Badge
            variant={getStatusBadgeVariant(user.status)}
            className="text-xs"
          >
            {user.status}
          </Badge>
          <Badge variant="outline" className="text-xs ml-1">
            {user.role}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs sm:text-sm">
        <div>
          <span className="text-gray-500">Posts:</span>
          <span className="ml-1 font-medium">{user.postCount || 0}</span>
        </div>
        <div>
          <span className="text-gray-500">Followers:</span>
          <span className="ml-1 font-medium">
            {(user.followerCount || 0).toLocaleString()}
          </span>
        </div>
        <div>
          <span className="text-gray-500">Joined:</span>
          <span className="ml-1 font-medium">
            {new Date(user.createdAt).toLocaleDateString()}
          </span>
        </div>
        <div>
          <span className="text-gray-500">Last Login:</span>
          <span className="ml-1 font-medium">
            {user.lastLoginAt
              ? new Date(user.lastLoginAt).toLocaleDateString()
              : "Never"}
          </span>
        </div>
      </div>

      <div className="flex flex-wrap gap-1 pt-2 border-t">
        <Button
          size="sm"
          variant="outline"
          title="View Profile"
          onClick={() => openUserProfile(user)}
          className="text-xs px-2 py-1 h-7"
        >
          <Eye className="w-3 h-3" />
        </Button>
        <Button
          size="sm"
          variant="outline"
          title="Edit User"
          onClick={() => openEditDialog(user)}
          className="text-xs px-2 py-1 h-7"
        >
          <Edit className="w-3 h-3" />
        </Button>
        <Button
          size="sm"
          variant="outline"
          title="Manage Badges"
          onClick={() => openBadgeManagement(user)}
          className="text-xs px-2 py-1 h-7"
        >
          <Award className="w-3 h-3" />
        </Button>
        <Button
          size="sm"
          variant="outline"
          title="Reset Password"
          onClick={() => openPasswordReset(user)}
          className="text-xs px-2 py-1 h-7"
        >
          <Key className="w-3 h-3" />
        </Button>

        {user.status === "pending" && (
          <>
            <Button
              size="sm"
              variant="outline"
              title="Approve User"
              onClick={() => handleStatusChange(user._id, "active")}
              className="text-xs px-2 py-1 h-7 text-green-600 hover:text-green-700"
            >
              <CheckCircle className="w-3 h-3" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              title="Reject User"
              onClick={() => handleStatusChange(user._id, "blocked")}
              className="text-xs px-2 py-1 h-7 text-red-600 hover:text-red-700"
            >
              <XCircle className="w-3 h-3" />
            </Button>
          </>
        )}

        {user.status === "active" && (
          <Button
            size="sm"
            variant="outline"
            title="Block User"
            onClick={() => handleStatusChange(user._id, "blocked")}
            className="text-xs px-2 py-1 h-7 text-red-600 hover:text-red-700"
          >
            <Ban className="w-3 h-3" />
          </Button>
        )}

        {(user.status === "blocked" || user.status === "suspended") && (
          <Button
            size="sm"
            variant="outline"
            title="Unblock User"
            onClick={() => handleStatusChange(user._id, "active")}
            className="text-xs px-2 py-1 h-7 text-green-600 hover:text-green-700"
          >
            <UserCheck className="w-3 h-3" />
          </Button>
        )}

        <Button
          size="sm"
          variant="outline"
          title="Delete User"
          onClick={() => openDeleteUser(user)}
          className="text-xs px-2 py-1 h-7 text-red-600 hover:text-red-700"
        >
          <Trash2 className="w-3 h-3" />
        </Button>
      </div>
    </div>
  );

  const renderUserTable = (users: User[]) => (
    <Card>
      <CardHeader>
        <CardTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
          <span className="text-lg sm:text-xl font-semibold">
            {section === "all-users"
              ? "All Users"
              : section === "blocked-users"
              ? "Blocked Users"
              : section === "pending-users"
              ? "Pending Users"
              : "User Activity"}
          </span>
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                className="pl-8 w-full sm:w-64 text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-32 text-sm">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="blocked">Blocked</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
            <Dialog open={showAddUser} onOpenChange={setShowAddUser}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto text-sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Add User
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px] max-w-[95vw]">
                <DialogHeader>
                  <DialogTitle>Add New User</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4">
                    <Label htmlFor="displayName" className="text-right text-sm">
                      Display Name
                    </Label>
                    <Input
                      id="displayName"
                      value={formData.displayName}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          displayName: e.target.value,
                        })
                      }
                      className="col-span-1 sm:col-span-3 text-sm"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4">
                    <Label htmlFor="username" className="text-right text-sm">
                      Username
                    </Label>
                    <Input
                      id="username"
                      value={formData.username}
                      onChange={(e) =>
                        setFormData({ ...formData, username: e.target.value })
                      }
                      className="col-span-1 sm:col-span-3 text-sm"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4">
                    <Label htmlFor="email" className="text-right text-sm">
                      Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      className="col-span-1 sm:col-span-3 text-sm"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4">
                    <Label htmlFor="role" className="text-right text-sm">
                      Role
                    </Label>
                    <Select
                      value={formData.role}
                      onValueChange={(value: any) =>
                        setFormData({ ...formData, role: value })
                      }
                    >
                      <SelectTrigger className="col-span-1 sm:col-span-3 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">User</SelectItem>
                        <SelectItem value="moderator">Moderator</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4">
                    <Label htmlFor="status" className="text-right text-sm">
                      Status
                    </Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value: any) =>
                        setFormData({ ...formData, status: value })
                      }
                    >
                      <SelectTrigger className="col-span-1 sm:col-span-3 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="suspended">Suspended</SelectItem>
                        <SelectItem value="blocked">Blocked</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowAddUser(false)}
                    className="w-full sm:w-auto text-sm"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleAddUser}
                    className="w-full sm:w-auto text-sm"
                  >
                    Add User
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Mobile View - Cards */}
        <div className="block sm:hidden space-y-3">
          {filteredUsers.map((user) => renderUserCard(user))}

          {/* Mobile Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 px-2">
              <div className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage <= 1}
                >
                  Previous
                </Button>
                <span className="text-sm font-medium">{currentPage}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage >= totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Desktop View - Table */}
        <div className="hidden sm:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Badges</TableHead>
                <TableHead>Posts</TableHead>
                <TableHead>Followers</TableHead>
                <TableHead>Last Active</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user._id}>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Avatar className="w-8 h-8">
                        <AvatarImage
                          src={user.profilePicture || "/placeholder.svg"}
                        />
                        <AvatarFallback>
                          {(user.displayName || user.username)[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">
                          {user.displayName || user.username}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          @{user.username}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(user.status)}>
                      {user.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{user.role}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {user.isVerified && (
                        <Badge variant="secondary" className="text-xs">
                          Verified
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{user.postCount || 0}</TableCell>
                  <TableCell>
                    {(user.followerCount || 0).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    {new Date(user.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        title="View Profile"
                        onClick={() => openUserProfile(user)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        title="Edit User"
                        onClick={() => openEditDialog(user)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        title="Manage Badges"
                        onClick={() => openBadgeManagement(user)}
                      >
                        <Award className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        title="Reset Password"
                        onClick={() => openPasswordReset(user)}
                      >
                        <Key className="w-4 h-4" />
                      </Button>
                      {user.status === "pending" && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            title="Approve User"
                            onClick={() =>
                              handleStatusChange(user._id, "active")
                            }
                            className="text-green-600 hover:text-green-700"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            title="Reject User"
                            onClick={() =>
                              handleStatusChange(user._id, "blocked")
                            }
                            className="text-red-600 hover:text-red-700"
                          >
                            <XCircle className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                      {user.status === "active" && (
                        <Button
                          size="sm"
                          variant="outline"
                          title="Block User"
                          onClick={() =>
                            handleStatusChange(user._id, "blocked")
                          }
                          className="text-red-600 hover:text-red-700"
                        >
                          <Ban className="w-4 h-4" />
                        </Button>
                      )}
                      {(user.status === "blocked" ||
                        user.status === "suspended") && (
                        <Button
                          size="sm"
                          variant="outline"
                          title="Unblock User"
                          onClick={() => handleStatusChange(user._id, "active")}
                          className="text-green-600 hover:text-green-700"
                        >
                          <UserCheck className="w-4 h-4" />
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        title="Delete User"
                        onClick={() => openDeleteUser(user)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 px-2">
            <div className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages} ({users.length} users shown)
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage <= 1}
              >
                Previous
              </Button>
              <div className="flex items-center space-x-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (page) => (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(page)}
                      className="w-8 h-8 p-0"
                    >
                      {page}
                    </Button>
                  ),
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage >= totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );

  const renderActivityLogs = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Clock className="w-5 h-5" />
          <span>User Activity Logs</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Mobile View - Cards */}
        <div className="block sm:hidden space-y-3">
          {mockActivityLogs.map((log) => (
            <div
              key={log.id}
              className="bg-white p-3 border rounded-lg space-y-2"
            >
              <div className="flex justify-between items-start">
                <span className="font-medium text-sm">{log.user}</span>
                <Badge
                  variant={
                    log.action.includes("failed") ? "destructive" : "default"
                  }
                  className="text-xs"
                >
                  {log.action}
                </Badge>
              </div>
              <p className="text-xs text-gray-600">{log.details}</p>
              <div className="text-xs text-gray-500 space-y-1">
                <p>Time: {log.timestamp}</p>
                <p>IP: {log.ipAddress}</p>
                <p className="truncate">Device: {log.userAgent}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop View - Table */}
        <div className="hidden sm:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Timestamp</TableHead>
                <TableHead>IP Address</TableHead>
                <TableHead>User Agent</TableHead>
                <TableHead>Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockActivityLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="font-medium">{log.user}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        log.action.includes("failed")
                          ? "destructive"
                          : "default"
                      }
                    >
                      {log.action}
                    </Badge>
                  </TableCell>
                  <TableCell>{log.timestamp}</TableCell>
                  <TableCell className="font-mono text-sm">
                    {log.ipAddress}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                    {log.userAgent}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {log.details}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );

  // Edit User Modal
  const renderEditUserModal = () => (
    <Dialog open={showEditUser} onOpenChange={setShowEditUser}>
      <DialogContent className="sm:max-w-[425px] max-w-[95vw]">
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4">
            <Label htmlFor="edit-name" className="text-right text-sm">
              Name
            </Label>
            <Input
              id="edit-displayName"
              value={formData.displayName}
              onChange={(e) =>
                setFormData({ ...formData, displayName: e.target.value })
              }
              className="col-span-1 sm:col-span-3 text-sm"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4">
            <Label htmlFor="edit-username" className="text-right text-sm">
              Username
            </Label>
            <Input
              id="edit-username"
              value={formData.username}
              onChange={(e) =>
                setFormData({ ...formData, username: e.target.value })
              }
              className="col-span-1 sm:col-span-3 text-sm"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4">
            <Label htmlFor="edit-email" className="text-right text-sm">
              Email
            </Label>
            <Input
              id="edit-email"
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              className="col-span-1 sm:col-span-3 text-sm"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4">
            <Label htmlFor="edit-role" className="text-right text-sm">
              Role
            </Label>
            <Select
              value={formData.role}
              onValueChange={(value: any) =>
                setFormData({ ...formData, role: value })
              }
            >
              <SelectTrigger className="col-span-1 sm:col-span-3 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="moderator">Moderator</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4">
            <Label htmlFor="edit-status" className="text-right text-sm">
              Status
            </Label>
            <Select
              value={formData.status}
              onValueChange={(value: any) =>
                setFormData({ ...formData, status: value })
              }
            >
              <SelectTrigger className="col-span-1 sm:col-span-3 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
                <SelectItem value="blocked">Blocked</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2">
          <Button
            variant="outline"
            onClick={() => setShowEditUser(false)}
            className="w-full sm:w-auto text-sm"
          >
            Cancel
          </Button>
          <Button onClick={handleEditUser} className="w-full sm:w-auto text-sm">
            Update User
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );

  // Delete User Modal
  const renderDeleteUserModal = () => (
    <Dialog open={showDeleteUser} onOpenChange={setShowDeleteUser}>
      <DialogContent className="sm:max-w-[425px] max-w-[95vw]">
        <DialogHeader>
          <DialogTitle>Delete User</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <p className="text-sm sm:text-base text-gray-600">
            Are you sure you want to delete{" "}
            <strong>
              {selectedUser?.displayName || selectedUser?.username}
            </strong>
            ? This action cannot be undone.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2">
          <Button
            variant="outline"
            onClick={() => setShowDeleteUser(false)}
            className="w-full sm:w-auto text-sm"
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={confirmDeleteUser}
            className="w-full sm:w-auto text-sm"
          >
            Delete User
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );

  // Password Reset Modal
  const renderPasswordResetModal = () => (
    <Dialog open={showPasswordReset} onOpenChange={setShowPasswordReset}>
      <DialogContent className="sm:max-w-[425px] max-w-[95vw]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Key className="w-5 h-5" />
            <span>Reset Password</span>
          </DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <p className="text-sm sm:text-base text-gray-600">
            This will send a password reset email to{" "}
            <strong>{selectedUser?.email}</strong>. The user will receive a link
            to create a new password.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2">
          <Button
            variant="outline"
            onClick={() => setShowPasswordReset(false)}
            className="w-full sm:w-auto text-sm"
          >
            Cancel
          </Button>
          <Button
            onClick={handlePasswordReset}
            className="w-full sm:w-auto text-sm"
          >
            Send Reset Email
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );

  // Badge Management Modal
  const renderBadgeManagementModal = () => (
    <Dialog open={showBadgeManagement} onOpenChange={setShowBadgeManagement}>
      <DialogContent className="sm:max-w-[500px] max-w-[95vw]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Award className="w-5 h-5" />
            <span>Manage User Badges</span>
          </DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <p className="text-sm sm:text-base text-gray-600 mb-4">
            Select badges for{" "}
            <strong>
              {selectedUser?.displayName || selectedUser?.username}
            </strong>
            :
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {availableBadges.map((badge) => (
              <label
                key={badge}
                className="flex items-center space-x-2 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedBadges.includes(badge)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedBadges([...selectedBadges, badge]);
                    } else {
                      setSelectedBadges(
                        selectedBadges.filter((b) => b !== badge),
                      );
                    }
                  }}
                  className="rounded border-gray-300"
                />
                <span className="text-sm">{badge}</span>
              </label>
            ))}
          </div>
        </div>
        <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2">
          <Button
            variant="outline"
            onClick={() => setShowBadgeManagement(false)}
            className="w-full sm:w-auto text-sm"
          >
            Cancel
          </Button>
          <Button
            onClick={handleBadgeUpdate}
            className="w-full sm:w-auto text-sm"
          >
            Update Badges
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );

  // User Profile Modal
  const renderUserProfileModal = () => (
    <Dialog open={showUserProfile} onOpenChange={setShowUserProfile}>
      <DialogContent className="sm:max-w-[600px] max-w-[95vw]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Eye className="w-5 h-5" />
            <span>User Profile</span>
          </DialogTitle>
        </DialogHeader>
        <div className="py-4">
          {selectedUser && (
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <Avatar className="w-16 h-16">
                  <AvatarImage
                    src={selectedUser.profilePicture || "/placeholder.svg"}
                  />
                  <AvatarFallback className="text-lg">
                    {(selectedUser.displayName || selectedUser.username)[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-lg font-semibold">
                    {selectedUser.displayName || selectedUser.username}
                  </h3>
                  <p className="text-sm text-gray-500">
                    @{selectedUser.username}
                  </p>
                  <div className="flex items-center space-x-2 mt-1">
                    <Badge variant={getStatusBadgeVariant(selectedUser.status)}>
                      {selectedUser.status}
                    </Badge>
                    <Badge variant="outline">{selectedUser.role}</Badge>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-600">Email:</span>
                  <p>{selectedUser.email}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Joined:</span>
                  <p>{new Date(selectedUser.createdAt).toLocaleDateString()}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Last Login:</span>
                  <p>
                    {selectedUser.lastLoginAt
                      ? new Date(selectedUser.lastLoginAt).toLocaleDateString()
                      : "Never"}
                  </p>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Posts:</span>
                  <p>{selectedUser.postCount || 0}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Followers:</span>
                  <p>{(selectedUser.followerCount || 0).toLocaleString()}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-600">User ID:</span>
                  <p className="text-xs font-mono">{selectedUser._id}</p>
                </div>
              </div>

              {selectedUser.badges && selectedUser.badges.length > 0 && (
                <div>
                  <span className="font-medium text-gray-600">Badges:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selectedUser.badges.map((badge) => (
                      <Badge
                        key={badge}
                        variant="secondary"
                        className="text-xs"
                      >
                        {badge}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        <div className="flex justify-end">
          <Button
            variant="outline"
            onClick={() => setShowUserProfile(false)}
            className="w-full sm:w-auto text-sm"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );

  if (section === "activity-logs") {
    return renderActivityLogs();
  }

  const filteredUsersBySection =
    section === "blocked-users"
      ? filteredUsers.filter((user) => user.status === "blocked")
      : section === "pending-users"
      ? filteredUsers.filter((user) => user.status === "pending")
      : filteredUsers;

  return (
    <>
      {renderUserTable(filteredUsersBySection)}
      {renderEditUserModal()}
      {renderDeleteUserModal()}
      {renderPasswordResetModal()}
      {renderBadgeManagementModal()}
      {renderUserProfileModal()}
    </>
  );
};
