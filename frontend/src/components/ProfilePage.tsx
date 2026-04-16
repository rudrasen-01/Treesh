import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Settings,
  Users,
  Lock,
  Shield,
  UserX,
  Edit,
  Save,
  X,
  AlertCircle,
  CheckCircle,
  Bookmark,
  Plus,
  Crown,
  Gift,
  Heart,
  MessageCircle,
  Share2,
  MapPin,
  Globe,
  Phone,
  Camera,
  Video,
  Star,
  Eye,
  TrendingUp,
  ChevronLeft,
  MoreVertical,
  Play,
  Mail,
  Share,
  Trash2,
} from "lucide-react";
import SegmentedRing from "./SegmentedRing";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import { ProfilePictureUpload } from "./ProfilePictureUpload";
import { StoryViewer } from "./StoryViewer";
import { storiesAPI } from "@/services/api";
import { useSettings } from "@/hooks/useSettings";
import { UploadModal } from "./UploadModal";
import { PrivacySettings } from "./PrivacySettings";
import { PostDetail } from "./PostDetail";
import { SavedPosts } from "./SavedPosts";
import { StreamerSubscriptionModal } from "./StreamerSubscriptionModal";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/hooks/useAuth";
import { UserProfile, postsAPI, authAPI, usersAPI, subscriptionAPI } from "@/services/api";
import { useStorySeen } from "@/hooks/useStorySeen";
import { usePosts } from "@/hooks/usePosts";
import { FollowListDialog, FollowUser } from "./FollowListDialog";

// Real user profile management with authentication
interface ExtendedUserProfile extends UserProfile {
  followers?: number;
  following?: number;
  posts?: number;
  isPrivate?: boolean;
  phone?: string;
  subscriptionTier?: "gold" | "diamond" | "chrome";
  streamerStatus?: "active" | "inactive";
  verified?: boolean;
}

interface PostData {
  id: string;
  image: string;
  video?: string;
  type: "post" | "reel";
  likes: number;
  caption: string;
  user: {
    name: string;
    username: string;
    avatar: string;
    verified: boolean;
  };
  timestamp: string;
  location?: string;
  comments: any[];
  views?: number;
  shares?: number;
  saves?: number;
  liked?: boolean;
  saved?: boolean;
}

// Posts will be loaded from API
const initialPosts: PostData[] = [];

// These would be fetched from API in a real implementation
const initialFollowers: any[] = [];
const initialFollowing: any[] = [];

export const ProfilePage = () => {
  const { user: authUser, updateUser } = useAuth();
  const [user, setUser] = useState<ExtendedUserProfile | null>(null);
  const [editName, setEditName] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [editWebsite, setEditWebsite] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [activeTab, setActiveTab] = useState("posts");
  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Move all other useState hooks here before any returns
  const [isSaving, setIsSaving] = useState(false);
  const [showProfilePictureUpload, setShowProfilePictureUpload] = useState(
    false,
  );
  const [showStoryUpload, setShowStoryUpload] = useState(false);
  const [showStoryViewer, setShowStoryViewer] = useState(false);
  const [userStories, setUserStories] = useState<any[]>([]);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [showPrivacySettings, setShowPrivacySettings] = useState(false);
  const [selectedPost, setSelectedPost] = useState<PostData | null>(null);
  const [showPostDetail, setShowPostDetail] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [showGiftSubscriptionModal, setShowGiftSubscriptionModal] = useState(
    false,
  );
  const [giftPlans, setGiftPlans] = useState<any[]>([]);
  const [selectedGiftPlanId, setSelectedGiftPlanId] = useState("");
  const [followers, setFollowers] = useState<FollowUser[]>(initialFollowers as FollowUser[]);
  const [following, setFollowing] = useState<FollowUser[]>(initialFollowing as FollowUser[]);
  const [isLoadingFollowers, setIsLoadingFollowers] = useState(false);
  const [isLoadingFollowing, setIsLoadingFollowing] = useState(false);
  const [posts, setPosts] = useState(initialPosts);
  const [postsLoading, setPostsLoading] = useState(true);
  const [deletingPostId, setDeletingPostId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [postToDelete, setPostToDelete] = useState<string | null>(null);
  const isMobile = useIsMobile();
  const { hasSeen, markSeen } = useStorySeen();
  const { settings, updatePrivacySettings, refreshSettings } = useSettings();
  const { deletePost } = usePosts();

  useEffect(() => {
    const loadGiftPlans = async () => {
      if (!showGiftSubscriptionModal) return;

      try {
        const response = await subscriptionAPI.getTiers();
        if (response.success && Array.isArray(response.data)) {
          setGiftPlans(response.data);
          return;
        }
      } catch (error) {
        console.error("Failed to load gift subscription plans:", error);
      }

      setGiftPlans([]);
    };

    loadGiftPlans();
  }, [showGiftSubscriptionModal]);

  const getAvatarSrc = (avatar?: string) => {
    if (!avatar) return undefined;

    // If already full URL (Cloudinary)
    if (avatar.startsWith("http")) {
      return avatar;
    }

    // If base64
    if (avatar.startsWith("data:image")) {
      return avatar;
    }

    return avatar; // fallback
  };

  // Navigate to another user's profile and close any open follower/following modal
  const openUserProfile = useCallback((userId: string) => {
    try {
      setShowFollowers(false);
      setShowFollowing(false);
      window.dispatchEvent(
        new CustomEvent("navigateToUserProfile", { detail: { userId } }),
      );
    } catch (e) {
      console.warn("Failed to navigate to user profile", e);
    }
  }, []);

  // Helper: check if current user follows a given userId
  const isUserFollowed = useCallback(
    (userId: string) => {
      return Array.isArray(following)
        ? following.some((u: any) => u?.id === userId)
        : false;
    },
    [following],
  );

  // Refresh authenticated user data and reflect counts locally
  const refreshUserData = useCallback(async () => {
    try {
      const response = await authAPI.getProfile();
      if (response.success && response.data) {
        const freshUserData = response.data as any;
        updateUser(freshUserData);
        setUser((prev) =>
          prev
            ? {
                ...prev,
                followers:
                  (freshUserData?.followers?.length ??
                    freshUserData?.followerCount ??
                    0) ||
                  0,
                following:
                  (freshUserData?.following?.length ??
                    freshUserData?.followingCount ??
                    0) ||
                  0,
              }
            : prev,
        );
      }
    } catch (error) {
      console.error("Error refreshing user data:", error);
    }
  }, [updateUser]);

  // Refresh posts for the current user
  const refreshPosts = useCallback(async () => {
    if (!authUser?.id) return;
    setPostsLoading(true);
    try {
      const response = await postsAPI.getUserPosts(authUser.id);
      if (response.success && response.data) {
        const postsArray = Array.isArray(response.data) ? response.data : [];
        const transformed: PostData[] = postsArray.map((post: any) => ({
          id: post.id || post._id,
          image:
            post.image ||
            post.media?.find((m: any) => m?.type === "image")?.url ||
            "",
          video:
            post.video ||
            post.media?.find((m: any) => m?.type === "video")?.url ||
            "",
          type:
            post.video || post.media?.find((m: any) => m?.type === "video")?.url
              ? "reel"
              : post.type === "reel"
              ? "reel"
              : "post",
          likes: Array.isArray(post.likes)
            ? post.likes.length
            : post.likes || 0,
          caption: post.content || post.caption || "",
          user: {
            name:
              post.authorId?.name ||
              post.authorId?.fullName ||
              authUser.fullName,
            username: post.authorId?.username || authUser.username,
            avatar: post.authorId?.avatar || authUser.avatar || "",
            verified: post.authorId?.isVerified || false,
          },
          timestamp:
            post.createdAt || post.timestamp || new Date().toISOString(),
          location: post.location || "",
          comments: Array.isArray(post.comments) ? post.comments : [],
          views: Array.isArray(post.views)
            ? post.views.length
            : post.views || 0,
          shares: Array.isArray(post.shares)
            ? post.shares.length
            : post.shares || 0,
          saves: post.saves || 0,
          liked: !!post.isLiked,
          saved: !!post.isBookmarked,
        }));
        setPosts(transformed);
        setUser((prev) =>
          prev ? { ...prev, posts: transformed.length } : prev,
        );
      }
    } catch (error) {
      console.error("Error refreshing user posts:", error);
    } finally {
      setPostsLoading(false);
    }
  }, [authUser?.id]);

  // Function to fetch followers list
  const fetchFollowers = useCallback(async () => {
    if (!authUser?.id) return;
    setIsLoadingFollowers(true);
    try {
      const response = await usersAPI.getCurrentUserFollowers();
      if (response.success && response.data) {
        const data = (response.data as any[]).map((u: any) => ({
          id: u.id || u._id,
          _id: u._id || u.id,
          username: u.username,
          fullName: u.fullName || u.name,
          name: u.name || u.fullName,
          avatar: u.avatar,
          isVerified: u.isVerified || false,
          bio: u.bio || "",
          isFollowing: u.isFollowing ?? false,
          mutual: u.mutual ?? false,
        }));
        setFollowers(data);
        setUser((prev) =>
          prev ? { ...prev, followers: data.length } : prev,
        );
      }
    } catch (error) {
      console.error("Error fetching followers:", error);
    } finally {
      setIsLoadingFollowers(false);
    }
  }, [authUser?.id]);

  // Function to fetch following list
  const fetchFollowing = useCallback(async () => {
    if (!authUser?.id) return;
    setIsLoadingFollowing(true);
    try {
      const response = await usersAPI.getCurrentUserFollowing();
      if (response.success && response.data) {
        const data = (response.data as any[]).map((u: any) => ({
          id: u.id || u._id,
          _id: u._id || u.id,
          username: u.username,
          fullName: u.fullName || u.name,
          name: u.name || u.fullName,
          avatar: u.avatar,
          isVerified: u.isVerified || false,
          bio: u.bio || "",
          isFollowing: true, // You always follow people in your following list
          mutual: u.mutual ?? false,
        }));
        setFollowing(data);
        setUser((prev) =>
          prev ? { ...prev, following: data.length } : prev,
        );
      }
    } catch (error) {
      console.error("Error fetching following:", error);
    } finally {
      setIsLoadingFollowing(false);
    }
  }, [authUser?.id]);

  // Delete post function
  const handleDeletePost = async (postId: string) => {
    try {
      setDeletingPostId(postId);
      const success = await deletePost(postId);

      if (success) {
        // Remove post from local state
        setPosts((prev) => prev.filter((post) => post.id !== postId));
        // Update post count
        setUser((prev) =>
          prev ? { ...prev, posts: (prev.posts || 1) - 1 } : prev,
        );
        toast({
          title: "Success",
          description: "Post deleted successfully",
        });
      }
    } catch (error) {
      console.error("Error deleting post:", error);
      toast({
        title: "Error",
        description: "Failed to delete post",
        variant: "destructive",
      });
    } finally {
      setDeletingPostId(null);
      setShowDeleteConfirm(false);
      setPostToDelete(null);
    }
  };

  // Confirm delete function
  const confirmDelete = (postId: string) => {
    setPostToDelete(postId);
    setShowDeleteConfirm(true);
  };

  // Handler to open followers modal - sets loading immediately to prevent empty state flash
  const handleShowFollowers = useCallback(() => {
    setIsLoadingFollowers(true);
    setShowFollowers(true);
  }, []);

  // Handler to open following modal - sets loading immediately to prevent empty state flash
  const handleShowFollowing = useCallback(() => {
    setIsLoadingFollowing(true);
    setShowFollowing(true);
  }, []);

  // Initialize user data from auth context
  useEffect(() => {
    if (authUser) {
      const extendedUser: ExtendedUserProfile = {
        ...authUser,
        followers:
          (authUser as any)?.followers?.length || authUser.followerCount || 0, // Get actual followers count
        following:
          (authUser as any)?.following?.length || authUser.followingCount || 0, // Get actual following count
        posts: 0, // This would come from API calls
        isPrivate: false,
        phone: "",
        subscriptionTier: authUser.isStreamer ? "gold" : undefined,
        streamerStatus: authUser.isStreamer ? "active" : "inactive",
        verified: false,
      };

      setUser(extendedUser);
      setEditName(authUser.fullName || "");
      setEditBio(authUser.bio || "");
      setEditLocation(authUser.location || "");
      setEditWebsite(authUser.website || "");
      setEditPhone(""); // Phone not in auth user initially
      setIsPrivate(false); // Default privacy setting
    }
  }, [authUser]);

  // Fetch user stories
  useEffect(() => {
    const fetchUserStories = async () => {
      if (!authUser?.id) return;

      try {
        const response = await storiesAPI.getUserStories();
        if (response.success && response.data) {
          setUserStories(response.data);
        }
      } catch (error) {
        console.error("Error fetching user stories:", error);
      }
    };

    fetchUserStories();
  }, [authUser?.id]);

  // Fetch user posts
  useEffect(() => {
    if (authUser?.id) {
      refreshPosts();
    }
  }, [authUser?.id]); // Remove refreshPosts from deps to prevent infinite loop

  // Listen for post creation events
  useEffect(() => {
    const handlePostCreated = () => {
      console.log("Post created event received, refreshing posts...");
      refreshPosts();
    };

    const handlePostDeleted = (e: any) => {
      const { postId } = e.detail || {};
      if (postId) {
        console.log("Post deleted event received, removing from state...");
        setPosts((prev) => prev.filter((post) => post.id !== postId));
        setUser((prev) =>
          prev ? { ...prev, posts: (prev.posts || 1) - 1 } : prev,
        );
      }
    };

    // Listen for custom post events
    window.addEventListener("postCreated", handlePostCreated);
    window.addEventListener("postDeleted", handlePostDeleted);

    return () => {
      window.removeEventListener("postCreated", handlePostCreated);
      window.removeEventListener("postDeleted", handlePostDeleted);
    };
  }, []); // Empty deps since we want this to be stable

  // Listen for story creation to refresh stories list
  useEffect(() => {
    const onStoryCreated = (e: any) => {
      const type = e?.detail?.type;
      if (type !== "story") return;
      (async () => {
        try {
          const response = await storiesAPI.getUserStories();
          if (response.success && response.data) {
            setUserStories(response.data);
          }
        } catch (err) {
          console.warn("Failed to refresh stories after creation", err);
        }
      })();
    };
    window.addEventListener("postCreated", onStoryCreated as EventListener);
    return () =>
      window.removeEventListener(
        "postCreated",
        onStoryCreated as EventListener,
      );
  }, []);

  // Listen for follow events to refresh counts
  useEffect(() => {
    const handleFollowUpdate = () => {
      console.log("Follow update event received, refreshing user data...");
      refreshUserData();
    };

    // Listen for custom follow events
    window.addEventListener("followUpdate", handleFollowUpdate);

    return () => {
      window.removeEventListener("followUpdate", handleFollowUpdate);
    };
  }, []); // Empty deps to prevent recreating the listener

  // Initial fetch of FULL followers/following data so counts and arrays are ready
  useEffect(() => {
    if (!authUser?.id) return;
    (async () => {
      try {
        const [folRes, ingRes] = await Promise.all([
          usersAPI.getCurrentUserFollowers(),
          usersAPI.getCurrentUserFollowing(),
        ]);
        if (folRes.success && Array.isArray(folRes.data)) {
          const data = (folRes.data as any[]).map((u: any) => ({
            id: u.id || u._id,
            _id: u._id || u.id,
            username: u.username,
            fullName: u.fullName || u.name,
            name: u.name || u.fullName,
            avatar: u.avatar,
            isVerified: u.isVerified || false,
            bio: u.bio || "",
            isFollowing: u.isFollowing ?? false,
            mutual: u.mutual ?? false,
          }));
          setFollowers(data);
          setUser((prev) =>
            prev ? { ...prev, followers: data.length } : prev,
          );
        }
        if (ingRes.success && Array.isArray(ingRes.data)) {
          const data = (ingRes.data as any[]).map((u: any) => ({
            id: u.id || u._id,
            _id: u._id || u.id,
            username: u.username,
            fullName: u.fullName || u.name,
            name: u.name || u.fullName,
            avatar: u.avatar,
            isVerified: u.isVerified || false,
            bio: u.bio || "",
            isFollowing: true,
            mutual: u.mutual ?? false,
          }));
          setFollowing(data);
          setUser((prev) =>
            prev ? { ...prev, following: data.length } : prev,
          );
        }
      } catch (e) {
        console.warn("Prefetch followers/following failed", e);
      } finally {
        // Clear any pre-set loading states (from handleShowFollowers/Following clicking too fast)
        setIsLoadingFollowers(false);
        setIsLoadingFollowing(false);
      }
    })();
  }, [authUser?.id]);

  // Fetch followers when followers modal opens
  useEffect(() => {
    if (showFollowers && authUser?.id) {
      fetchFollowers();
    }
  }, [showFollowers, authUser?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch following when following modal opens
  useEffect(() => {
    if (showFollowing && authUser?.id) {
      fetchFollowing();
    }
  }, [showFollowing, authUser?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Reflect like/comment changes coming from PostDetail/Feed in real-time
  useEffect(() => {
    const handler = (e: any) => {
      const { postId, isLiked, likesCount } = e.detail || {};
      if (!postId) return;
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? {
                ...p,
                likes: typeof likesCount === "number" ? likesCount : p.likes,
                liked: typeof isLiked === "boolean" ? isLiked : p.liked,
              }
            : p,
        ),
      );
    };
    window.addEventListener("treesh:post-updated", handler as any);
    return () => {
      window.removeEventListener("treesh:post-updated", handler as any);
    };
  }, []);

  // Loading state
  if (!authUser || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary via-primary-dark to-accent flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-amber-50/95 backdrop-blur-sm shadow-2xl border-0">
          <CardContent className="pt-8 pb-8 text-center">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
              <span className="text-muted-foreground font-inter">
                Loading profile...
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!editName.trim()) {
      newErrors.name = "Name is required";
    } else if (editName.length < 2) {
      newErrors.name = "Name must be at least 2 characters long";
    } else if (editName.length > 50) {
      newErrors.name = "Name cannot exceed 50 characters";
    }

    if (editBio.length > 200) {
      newErrors.bio = "Bio cannot exceed 200 characters";
    }

    if (editWebsite && !isValidUrl(editWebsite)) {
      newErrors.website = "Please enter a valid URL";
    }

    if (editPhone && !isValidPhone(editPhone)) {
      newErrors.phone = "Please enter a valid phone number";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const isValidPhone = (phone: string): boolean => {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ""));
  };

  const handleSaveProfile = async () => {
    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors before saving",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);

    try {
      // Persist profile via API
      const payload = {
        fullName: editName.trim(),
        bio: editBio.trim(),
        location: editLocation.trim(),
        website: editWebsite.trim(),
      } as Partial<UserProfile>;

      const resp = await usersAPI.updateProfile(payload);
      if (!resp.success || !resp.data) {
        throw new Error(resp.error || "Failed to update profile");
      }

      // Update the auth user context with server response
      updateUser(resp.data);

      // Update local state
      if (user) {
        setUser({
          ...user,
          fullName: resp.data.fullName || payload.fullName || user.fullName,
          bio: resp.data.bio ?? payload.bio ?? user.bio,
          location: resp.data.location ?? payload.location ?? user.location,
          website: resp.data.website ?? payload.website ?? user.website,
          phone: editPhone.trim(),
          isPrivate,
        });
      }

      toast({
        title: "Profile Updated!",
        description: "Your profile has been saved successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // const handleAvatarSave = async (imageData: string) => {
  //   try {
  //     const resp = await usersAPI.updateProfile({
  //       avatar: imageData,
  //     });

  //     if (!resp.success) {
  //       throw new Error(resp.error || "Failed to update avatar");
  //     }

  //     updateUser(resp.data);

  //     toast({
  //       title: "Profile Picture Updated!",
  //       description: "Saved successfully",
  //     });
  //   } catch (error) {
  //     toast({
  //       title: "Error",
  //       description: "Failed to update profile picture",
  //       variant: "destructive",
  //     });
  //   }
  // };

  const handleAvatarSave = async (imageData: string) => {
    try {
      const resp = await usersAPI.updateProfile({
        avatar: imageData,
      });

      if (!resp.success || !resp.data) {
        throw new Error(resp.error || "Failed to update avatar");
      }

      // 🔥 Update auth context
      updateUser(resp.data);

      // 🔥 IMPORTANT: Update local state also
      setUser((prev) => (prev ? { ...prev, avatar: resp.data.avatar } : prev));

      toast({
        title: "Profile Picture Updated!",
        description: "Saved successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update profile picture",
        variant: "destructive",
      });
    }
  };

  const handleFollow = async (userId: string) => {
    try {
      const response = await usersAPI.followUser(userId);
      if (response.success) {
        // Refresh both followers and following lists
        await fetchFollowers();
        await fetchFollowing();
        // Also refresh the main profile data
        await refreshUserData();

        // Notify other parts of the app (e.g., feed) to refresh
        window.dispatchEvent(new Event("userFollowed"));
        window.dispatchEvent(new Event("followUpdate"));

        toast({
          title: "Followed!",
          description: "You are now following this user",
        });
      }
    } catch (error) {
      console.error("Error following user:", error);
      toast({
        title: "Error",
        description: "Failed to follow user",
        variant: "destructive",
      });
    }
  };

  const handleUnfollow = async (userId: string) => {
    try {
      const response = await usersAPI.followUser(userId); // Same endpoint toggles follow/unfollow
      if (response.success) {
        // Refresh both followers and following lists
        await fetchFollowers();
        await fetchFollowing();
        // Also refresh the main profile data
        await refreshUserData();

        // Notify other parts of the app (e.g., feed) to refresh
        window.dispatchEvent(new Event("userFollowed"));
        window.dispatchEvent(new Event("followUpdate"));

        toast({
          title: "Unfollowed",
          description: "You have unfollowed this user",
        });
      }
    } catch (error) {
      console.error("Error unfollowing user:", error);
      toast({
        title: "Error",
        description: "Failed to unfollow user",
        variant: "destructive",
      });
    }
  };

  const handleBlock = (userId: string) => {
    setFollowers((prev) => prev.filter((follower) => follower.id !== userId));
    setFollowing((prev) => prev.filter((following) => following.id !== userId));
    toast({
      title: "User Blocked",
      description: "User has been blocked successfully",
    });
  };

  const handleReport = (userId: string) => {
    toast({
      title: "User Reported",
      description: "Thank you for helping keep our community safe",
    });
  };

  const handlePrivacyChange = (newValue: boolean) => {
    setIsPrivate(newValue);
    toast({
      title: newValue ? "Account Made Private" : "Account Made Public",
      description: newValue
        ? "Only approved followers can see your content"
        : "Your content is now visible to everyone",
    });
  };

  // const handleProfilePictureUpdate = (imageData: string) => {
  //   setUser((prev) => ({
  //     ...prev,
  //     avatar: imageData,
  //   }));
  //   toast({
  //     title: "Profile Picture Updated!",
  //     description: "Your new profile picture has been saved",
  //   });
  // };

  const handleStoryCreate = (storyData: any) => {
    toast({
      title: "Story Created!",
      description: "Your story will be visible for 24 hours",
    });
  };

  const handlePrivacySettingsSave = async (modalSettings: any) => {
    try {
      // Map modal isPrivate -> profileVisibility
      const profileVisibility = modalSettings.isPrivate ? "private" : "public";
      const ok = await updatePrivacySettings({ profileVisibility });
      if (ok) {
        await refreshSettings();
        setUser((prev) =>
          prev ? { ...prev, isPrivate: modalSettings.isPrivate } : prev,
        );
        toast({
          title: "Privacy Settings Updated!",
          description: "Your privacy preferences have been saved successfully",
        });
      } else {
        throw new Error("Failed to save privacy settings");
      }
    } catch (e) {
      toast({
        title: "Error",
        description: "Failed to save privacy settings",
        variant: "destructive",
      });
    }
  };

  const handlePostClick = (post: PostData) => {
    // Ensure reels carry video url to detail view
    setSelectedPost(post);
    setShowPostDetail(true);
  };

  const handleSubscriptionClick = () => {
    // Navigate to subscriptions section
    window.dispatchEvent(
      new CustomEvent("treesh:navigate", { detail: { tab: "subscriptions" } }),
    );
  };

  // Check if user has active stories
  const hasActiveStories = userStories.length > 0;
  const latestUserStory = userStories[0];

  const handleProfilePictureClick = () => {
    if (hasActiveStories) {
      // Convert user stories to StoryData format for the viewer
      const convertedStories = userStories.map((story) => ({
        id: story._id || story.id,
        image: story.media?.[0]?.url || story.image || "/placeholder.svg",
        textOverlays: story.textOverlays || [],
        stickers: story.stickers || [],
        createdAt: new Date(story.createdAt),
        expiresAt: new Date(
          story.expiresAt || new Date(Date.now() + 24 * 60 * 60 * 1000),
        ),
        views: story.views || 0,
        likes: story.likes || 0,
        viewers: story.viewers || [],
        reactions: story.reactions || [],
      }));

      // Open story viewer with user's stories
      setCurrentStoryIndex(0);
      setShowStoryViewer(true);
    } else {
      // Open profile picture upload modal
      setShowProfilePictureUpload(true);
    }
  };

  const handleGiftSubscriptionClick = () => {
    // Navigate to subscriptions section
    window.dispatchEvent(
      new CustomEvent("treesh:navigate", { detail: { tab: "subscriptions" } }),
    );
  };

  const handleLikePost = (postId: string) => {
    // This would typically update the post in a database
    toast({
      title: "Post Liked!",
      description: "You liked this post",
    });
  };

  const handleSavePost = (postId: string) => {
    toast({
      title: "Post Saved!",
      description: "Post has been added to your saved items",
    });
  };

  // const handleSharePost = (postId: string) => {
  //   toast({
  //     title: "Post Shared!",
  //     description: "Post has been shared successfully",
  //   });
  // };
  const handleShareProfile = async () => {
    if (!user) return;

    const shareUrl = `${window.location.origin}/profile/${user.id}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: user.fullName,
          text: `Check out ${user.fullName}'s profile on Trees!`,
          url: shareUrl,
        });

        toast({
          title: "Profile Shared!",
        });
      } catch (error) {
        console.log("Share cancelled");
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareUrl);

        toast({
          title: "Link Copied!",
          description: "Profile link copied to clipboard",
        });
      } catch {
        toast({
          title: "Share failed",
          variant: "destructive",
        });
      }
    }
  };

  const handleCommentPost = (postId: string) => {
    // This would typically open a comment input
    toast({
      title: "Comment Feature",
      description: "Comment functionality will be implemented here",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      {isMobile && (
        <header className="bg-card border-b border-border px-4 py-3 flex items-center justify-between sticky top-0 z-30 shadow-sm">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 hover:bg-muted"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <div className="flex flex-col">
              <h1 className="text-lg font-bold text-foreground">Profile</h1>
              <p className="text-sm text-muted-foreground">@{user.username}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 hover:bg-muted"
            >
              <MoreVertical className="h-5 w-5" />
            </Button>
          </div>
        </header>
      )}

      {/* Desktop Header */}
      {!isMobile && (
        <header className="bg-card border-b border-border px-6 py-4">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold text-foreground">Profile</h1>
          </div>
        </header>
      )}

      <div className="max-w-4xl mx-auto">
        {/* Profile Header Section - Instagram Style */}
        <div className="px-4 sm:px-6 py-4 sm:py-6">
          {/* Profile Info Row */}
          <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-8">
            {/* Profile Picture */}
            <div className="relative mx-auto sm:mx-0">
              {hasActiveStories ? (
                // Profile picture with Instagram-style story ring
                <button
                  onClick={handleProfilePictureClick}
                  className="relative w-20 h-20 sm:w-24 sm:h-24 lg:w-32 lg:h-32 rounded-full hover:scale-105 transition-transform"
                >
                  {/* Segmented ring overlay */}
                  <div className="absolute inset-0 -m-[2px] flex items-center justify-center">
                    {(() => {
                      const activeCount = (userStories || []).filter(
                        (s: any) => {
                          const expiryTime = new Date(s.createdAt);
                          expiryTime.setHours(expiryTime.getHours() + 24);
                          return new Date() < expiryTime;
                        },
                      ).length;
                      const seen = hasSeen(String(authUser?.id));
                      return (
                        <SegmentedRing
                          segments={Math.max(1, activeCount)}
                          color={seen ? "#9ca3af" : "#ef4444"}
                          size={128}
                          strokeWidth={4}
                          gapRatio={0.06}
                        />
                      );
                    })()}
                  </div>
                  {/* <div className="w-20 h-20 sm:w-24 sm:h-24 lg:w-32 lg:h-32 rounded-full bg-white p-1"> */}
                  {/* <Avatar className="w-full h-full">
                      <AvatarImage src={user.avatar || undefined} />
                      <AvatarFallback className="text-xl sm:text-2xl lg:text-3xl bg-gray-200">
                        {user.fullName.charAt(0)}
                      </AvatarFallback>
                    </Avatar> */}
                  <div className="w-32 h-32 rounded-full overflow-hidden ring-2 ring-border">
                    <img
                      src={getAvatarSrc(user.avatar)}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  {/* </div> */}
                </button>
              ) : (
                // Regular profile picture
                <div className="w-32 h-32 rounded-full overflow-hidden ring-2 ring-border">
                  <img
                    src={getAvatarSrc(user.avatar)}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                </div>

                // <Avatar
                //   className="w-20 h-20 sm:w-24 sm:h-24 lg:w-32 lg:h-32 cursor-pointer hover:opacity-80 transition-opacity ring-2 ring-gray-200"
                //   onClick={handleProfilePictureClick}
                // >
                //   <AvatarImage src={user.avatar} />
                //   <AvatarFallback className="text-2xl sm:text-3xl lg:text-4xl bg-gray-200">
                //     {user.fullName.charAt(0)}
                //   </AvatarFallback>
                // </Avatar>
              )}

              {/* Edit button - only show when not viewing stories */}
              {!hasActiveStories && (
                <Button
                  size="sm"
                  className="absolute -bottom-1 -right-1 rounded-full w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 p-0 bg-blue-500 hover:bg-blue-600 text-white shadow-lg"
                  onClick={() => setShowProfilePictureUpload(true)}
                >
                  <Edit className="w-3 h-3 sm:w-4 sm:h-4" />
                </Button>
              )}
            </div>

            {/* Profile Details */}
            <div className="flex-1 text-center sm:text-left w-full">
              <div className="flex items-center justify-center sm:justify-start gap-2 mb-3">
                <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground">
                  {user.fullName}
                </h2>
                {user.verified && (
                  <div className="w-4 h-4 sm:w-5 sm:h-5 bg-blue-500 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-2 h-2 sm:w-3 sm:h-3 text-white" />
                  </div>
                )}
                {user.isPrivate && (
                  <Badge variant="outline" className="text-xs">
                    Private
                  </Badge>
                )}
              </div>

              <p className="text-muted-foreground mb-2 text-sm">@{user.username}</p>

              <p className="text-foreground/90 mb-3 text-sm sm:text-base max-w-md mx-auto sm:mx-0">
                {user.bio}
              </p>

              {/* Contact Info - Compact */}
              <div className="flex flex-wrap justify-center sm:justify-start gap-2 mb-4 text-xs text-muted-foreground">
                {user.location && (
                  <div className="flex items-center space-x-1">
                    <MapPin className="w-3 h-3" />
                    <span>{user.location}</span>
                  </div>
                )}
                {user.website && (
                  <div className="flex items-center space-x-1">
                    <Globe className="w-3 h-3" />
                    <a
                      href={user.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-blue-500 transition-colors underline"
                    >
                      Website
                    </a>
                  </div>
                )}
              </div>

              {/* Action Buttons - Instagram Style */}
              <div className="flex flex-wrap justify-center sm:justify-start gap-2 mb-4">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 sm:h-9 text-xs sm:text-sm px-3 sm:px-4"
                  onClick={() =>
                    window.dispatchEvent(
                      new CustomEvent("treesh:navigate", {
                        detail: { tab: "settings" },
                      }),
                    )
                  }
                >
                  <Settings className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  Edit Profile
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 sm:h-9 text-xs sm:text-sm px-3 sm:px-4"
                  onClick={() => setShowPrivacySettings(true)}
                >
                  <Shield className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  Privacy
                </Button>

                {/* <Button
                  variant="outline"
                  size="sm"
                  className="h-8 sm:h-9 text-xs sm:text-sm px-3 sm:px-4 opacity-50 cursor-not-allowed"
                  disabled
                >
                  <Eye className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  View
                </Button> */}

                <Button
                  variant="outline"
                  size="sm"
                  // className="h-8 sm:h-9 text-xs sm:text-sm px-3 sm:px-4 opacity-50 cursor-not-allowed"
                  // disabled
                  className="h-8 sm:h-9 text-xs sm:text-sm px-3 sm:px-4"
                  onClick={handleShareProfile}
                >
                  <Share2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  Share
                </Button>
              </div>

              {/* Premium Action Buttons */}
              <div className="flex flex-wrap justify-center sm:justify-start gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 sm:h-9 text-xs sm:text-sm px-3 sm:px-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 hover:from-purple-600 hover:to-pink-600"
                  onClick={() => setShowStoryUpload(true)}
                >
                  <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  Create Story
                </Button>

                <Button
                  className="h-8 sm:h-9 text-xs sm:text-sm px-3 sm:px-4 bg-red-500 hover:bg-red-600 text-white"
                  onClick={handleSubscriptionClick}
                >
                  <Crown className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  Subscribe
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 sm:h-9 text-xs sm:text-sm px-3 sm:px-4"
                  onClick={handleGiftSubscriptionClick}
                >
                  <Gift className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  Gift Sub
                </Button>
              </div>
            </div>
          </div>

          {/* Profile Stats Row - Instagram Style */}
          <div className="flex justify-center sm:justify-start items-center space-x-8 sm:space-x-12 mt-6 sm:mt-8 pt-4 border-t border-border">
            <div className="text-center cursor-pointer">
              <div className="text-lg sm:text-xl font-bold text-foreground">
                {user.posts}
              </div>
              <div className="text-xs sm:text-sm text-muted-foreground">Posts</div>
            </div>
            <div
              className="text-center cursor-pointer"
              onClick={handleShowFollowers}
            >
              <div className="text-lg sm:text-xl font-bold text-foreground">
                {user.followers}
              </div>
              <div className="text-xs sm:text-sm text-muted-foreground">Followers</div>
            </div>
            <div
              className="text-center cursor-pointer"
              onClick={handleShowFollowing}
            >
              <div className="text-lg sm:text-xl font-bold text-foreground">
                {user.following}
              </div>
              <div className="text-xs sm:text-sm text-muted-foreground">Following</div>
            </div>
            {user.isStreamer && (
              <div className="text-center">
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-1">
                  <CheckCircle className="w-3 h-3 sm:w-5 sm:h-5 text-green-600" />
                </div>
                <div className="text-xs text-green-600 font-medium">
                  Streamer
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Content Tabs Section - Instagram Style */}
        <div className="bg-card border-t border-border">
          <div className="px-4 sm:px-6">
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-3 h-12 sm:h-14 bg-transparent border-b border-border rounded-none">
                <TabsTrigger
                  value="posts"
                  className="flex items-center space-x-2 text-sm sm:text-base data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent rounded-none"
                >
                  <Camera className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="hidden sm:inline">Posts</span>
                  <Badge variant="secondary" className="ml-1 text-xs">
                    {posts.filter((p) => p.type === "post").length}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger
                  value="reels"
                  className="flex items-center space-x-2 text-sm sm:text-base data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent rounded-none"
                >
                  <Video className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="hidden sm:inline">Reels</span>
                  <Badge variant="secondary" className="ml-1 text-xs">
                    {posts.filter((p) => p.type === "reel").length}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger
                  value="saved"
                  className="flex items-center space-x-2 text-sm sm:text-base data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent rounded-none"
                >
                  <Bookmark className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="hidden sm:inline">Saved</span>
                </TabsTrigger>
              </TabsList>

              {/* Tab Content */}
              <div className="px-2 sm:px-6 py-4">
                {/* Tab Header with Actions */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
                  <div>
                    <h3 className="text-base sm:text-lg font-semibold text-foreground">
                      {activeTab === "posts" && "Your Posts"}
                      {activeTab === "reels" && "Your Reels"}
                      {activeTab === "saved" && "Saved Content"}
                    </h3>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      {activeTab === "posts" &&
                        `Share your moments with ${user.followers} followers`}
                      {activeTab === "reels" && "Create engaging short videos"}
                      {activeTab === "saved" && "Your bookmarked content"}
                    </p>
                  </div>
                </div>

                {/* Posts Grid - Instagram Style */}
                <TabsContent value="posts" className="mt-0">
                  <div className="grid grid-cols-3 gap-1 sm:gap-2">
                    {postsLoading ? (
                      // Loading state for posts
                      Array.from({ length: 6 }).map((_, index) => (
                        <div
                          key={index}
                          className="aspect-square bg-gray-200 rounded-lg overflow-hidden animate-pulse"
                        >
                          <div className="w-full h-full bg-gray-300"></div>
                        </div>
                      ))
                    ) : posts.filter((p) => p.type === "post").length > 0 ? (
                      posts
                        .filter((p) => p.type === "post")
                        .map((post) => (
                          <div
                            key={post.id}
                            className="aspect-square bg-gray-200 rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity relative group"
                            onClick={() => handlePostClick(post)}
                          >
                            {post.video ? (
                              <video
                                src={post.video}
                                className="w-full h-full object-cover"
                                muted
                                autoPlay
                                loop
                                playsInline
                              />
                            ) : (
                              <img
                                src={post.image}
                                alt="Post"
                                className="w-full h-full object-cover"
                              />
                            )}
                            {/* Delete button - only show on hover */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                confirmDelete(post.id);
                              }}
                              className="absolute top-2 right-2 w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 z-10"
                              disabled={deletingPostId === post.id}
                            >
                              {deletingPostId === post.id ? (
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                            </button>
                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center">
                              <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-white text-center">
                                <div className="flex items-center justify-center space-x-4 text-sm">
                                  <div className="flex items-center space-x-1">
                                    <Heart className="w-4 h-4" />
                                    <span>{post.likes}</span>
                                  </div>
                                  <div className="flex items-center space-x-1">
                                    <MessageCircle className="w-4 h-4" />
                                    <span>{post.comments?.length || 0}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))
                    ) : (
                      <div className="col-span-3 py-12 text-center">
                        <div className="flex flex-col items-center space-y-3">
                          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                            <Camera className="w-8 h-8 text-gray-400" />
                          </div>
                          <h3 className="text-lg font-semibold text-foreground">
                            No posts yet
                          </h3>
                          <p className="text-gray-500 max-w-xs">
                            Share your first post to get started on your
                            journey!
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="reels" className="mt-0">
                  <div className="grid grid-cols-3 gap-1 sm:gap-2">
                    {postsLoading ? (
                      // Loading state for reels
                      Array.from({ length: 6 }).map((_, index) => (
                        <div
                          key={index}
                          className="aspect-square bg-gray-200 rounded-lg overflow-hidden animate-pulse"
                        >
                          <div className="w-full h-full bg-gray-300"></div>
                        </div>
                      ))
                    ) : posts.filter((p) => p.type === "reel").length > 0 ? (
                      posts
                        .filter((p) => p.type === "reel")
                        .map((post) => (
                          <div
                            key={post.id}
                            className="aspect-square bg-gray-200 rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity relative group"
                            onClick={() => handlePostClick(post)}
                          >
                            {post.image ? (
                              <img
                                src={post.image}
                                alt="Reel"
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  // hide broken image element if thumbnail URL is bad
                                  (e.currentTarget as HTMLImageElement).style.display =
                                    "none";
                                }}
                              />
                            ) : post.video ? (
                              // Fallback to a muted, auto-playing video preview when no thumbnail
                              <video
                                src={post.video}
                                className="w-full h-full object-cover"
                                muted
                                autoPlay
                                loop
                                playsInline
                              />
                            ) : (
                              <div className="w-full h-full bg-gray-300" />
                            )}
                            <div className="absolute top-2 left-2">
                              <Play className="w-4 h-4 text-white drop-shadow-lg" />
                            </div>
                            {/* Delete button - only show on hover */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                confirmDelete(post.id);
                              }}
                              className="absolute top-2 right-2 w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 z-10"
                              disabled={deletingPostId === post.id}
                            >
                              {deletingPostId === post.id ? (
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                            </button>
                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center">
                              <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-white text-center">
                                <div className="flex items-center justify-center space-x-4 text-sm">
                                  <div className="flex items-center space-x-1">
                                    <Heart className="w-4 h-4" />
                                    <span>{post.likes}</span>
                                  </div>
                                  <div className="flex items-center space-x-1">
                                    <MessageCircle className="w-4 h-4" />
                                    <span>{post.comments?.length || 0}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))
                    ) : (
                      <div className="col-span-3 py-12 text-center">
                        <div className="flex flex-col items-center space-y-3">
                          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                            <Video className="w-8 h-8 text-gray-400" />
                          </div>
                          <h3 className="text-lg font-semibold text-foreground">
                            No reels yet
                          </h3>
                          <p className="text-gray-500 max-w-xs">
                            Create your first reel to share short videos with
                            your audience!
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="saved" className="mt-0">
                  {/* Render real saved posts/reels */}
                  <SavedPosts />
                </TabsContent>
              </div>
            </Tabs>
          </div>
        </div>
      </div>

      {/* Followers Modal — Instagram Style */}
      <FollowListDialog
        isOpen={showFollowers}
        onClose={() => setShowFollowers(false)}
        type="followers"
        users={followers}
        totalCount={user?.followers ?? followers.length}
        isLoading={isLoadingFollowers}
        onFollowToggle={(userId, nowFollowing) => {
          // Update local state so button flips immediately
          setFollowers((prev) =>
            prev.map((f) =>
              f.id === userId ? { ...f, isFollowing: nowFollowing } : f
            )
          );
          // Refresh counts
          fetchFollowers();
          fetchFollowing();
          refreshUserData();
        }}
      />

      {/* Following Modal — Instagram Style */}
      <FollowListDialog
        isOpen={showFollowing}
        onClose={() => setShowFollowing(false)}
        type="following"
        users={following}
        totalCount={user?.following ?? following.length}
        isLoading={isLoadingFollowing}
        onFollowToggle={(userId, nowFollowing) => {
          if (!nowFollowing) {
            // Optimistically remove from following list
            setFollowing((prev) => prev.filter((f) => f.id !== userId));
            setUser((prev) =>
              prev ? { ...prev, following: Math.max(0, (prev.following ?? 1) - 1) } : prev
            );
          }
          refreshUserData();
        }}
      />

      {/* Profile Picture Upload Modal */}
      <ProfilePictureUpload
        isOpen={showProfilePictureUpload}
        onClose={() => setShowProfilePictureUpload(false)}
        // onSave={handleProfilePictureUpdate}
        onSave={handleAvatarSave}
        currentAvatar={user.avatar}
      />

      {/* Story Upload Modal - use the same form as the global + → Add Story */}
      <UploadModal
        isOpen={showStoryUpload}
        onClose={() => setShowStoryUpload(false)}
        type="story"
      />

      {/* Privacy Settings Modal */}
      <PrivacySettings
        isOpen={showPrivacySettings}
        onClose={() => setShowPrivacySettings(false)}
        onSave={handlePrivacySettingsSave}
        currentSettings={{
          isPrivate:
            (settings?.privacy?.profileVisibility || "public") === "private",
          showOnlineStatus: true,
          allowMessages: true,
          showLocation: true,
          showWebsite: true,
          showPhone: false,
          allowTagging: true,
          allowMentions: true,
          showActivityStatus: true,
          allowStoryViews: true,
        }}
      />

      {/* Post Detail Modal */}
      {selectedPost && (
        <PostDetail
          isOpen={showPostDetail}
          onClose={() => {
            setShowPostDetail(false);
            setSelectedPost(null);
          }}
          post={selectedPost}
        />
      )}

      {/* Streamer Subscription Modal */}
      <StreamerSubscriptionModal
        isOpen={showSubscriptionModal}
        onClose={() => setShowSubscriptionModal(false)}
        streamerName={user.fullName}
        streamerId={user.id}
        tiers={[]}
      />

      {/* Gift Subscription Modal */}
      <Dialog
        open={showGiftSubscriptionModal}
        onOpenChange={(open) => {
          setShowGiftSubscriptionModal(open);
          if (!open) {
            setSelectedGiftPlanId("");
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Gift Subscription to {user.fullName}</DialogTitle>
            <DialogDescription>
              Choose a subscription tier to gift
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Choose a subscription tier to gift to {user.fullName}!
            </p>

            <div className="space-y-3">
              <div className="grid grid-cols-1 gap-3">
                {giftPlans.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    No subscription plans available right now.
                  </p>
                )}

                {giftPlans.map((plan) => {
                  const code = String(plan.id || plan.code || "").toLowerCase();
                  const Icon =
                    code === "diamond"
                      ? Heart
                      : code === "chrome"
                      ? Crown
                      : Star;
                  const iconColor =
                    code === "diamond"
                      ? "text-red-500"
                      : code === "chrome"
                      ? "text-blue-500"
                      : "text-yellow-500";

                  return (
                    <Button
                      key={plan.id || plan.code}
                      variant="outline"
                      className="flex items-center justify-between p-4 h-auto"
                      onClick={() => {
                        setSelectedGiftPlanId(plan.id || plan.code);
                        toast({
                          title: `${plan.name} Gift`,
                          description: `You selected ${plan.name} ($${Number(plan.price || 0).toFixed(2)})`,
                        });
                      }}
                    >
                      <div className="flex items-center space-x-3">
                        <Icon className={`w-6 h-6 ${iconColor}`} />
                        <div className="text-left">
                          <div className="font-semibold">{plan.name}</div>
                          <div className="text-sm text-muted-foreground">
                            ${Number(plan.price || 0).toFixed(2)}/month
                          </div>
                        </div>
                      </div>
                      <Badge variant={selectedGiftPlanId === (plan.id || plan.code) ? "default" : "outline"}>
                        {selectedGiftPlanId === (plan.id || plan.code) ? "Selected" : "Select"}
                      </Badge>
                    </Button>
                  );
                })}
              </div>
            </div>

            <div className="pt-4 border-t">
              <Button
                disabled={!selectedGiftPlanId}
                className="w-full"
                onClick={() => {
                  if (!selectedGiftPlanId) return;

                  const selectedPlan = giftPlans.find(
                    (plan) => (plan.id || plan.code) === selectedGiftPlanId,
                  );

                  toast({
                    title: "Gift Sent!",
                    description: selectedPlan
                      ? `${selectedPlan.name} gift subscription sent to ${user.fullName}!`
                      : `Gift subscription sent to ${user.fullName}!`,
                  });
                  setShowGiftSubscriptionModal(false);
                  setSelectedGiftPlanId("");
                }}
              >
                <Gift className="w-4 h-4 mr-2" />
                Send Gift Subscription
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Post</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this post? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => setShowDeleteConfirm(false)}
              disabled={deletingPostId !== null}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => postToDelete && handleDeletePost(postToDelete)}
              disabled={deletingPostId !== null}
            >
              {deletingPostId ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Story Viewer Modal */}
      <StoryViewer
        isOpen={showStoryViewer}
        onClose={() => {
          setShowStoryViewer(false);
          // Mark own story as seen when viewer closes
          if (authUser?.id) markSeen(String(authUser.id));
        }}
        stories={userStories.map((story) => ({
          id: story._id || story.id,
          image: story.media?.[0]?.url || story.image || "/placeholder.svg",
          textOverlays: story.textOverlays || [],
          stickers: story.stickers || [],
          createdAt: new Date(story.createdAt),
          expiresAt: new Date(
            story.expiresAt || new Date(Date.now() + 24 * 60 * 60 * 1000),
          ),
          views: story.views || 0,
          likes: story.likes || 0,
          viewers: story.viewers || [],
          reactions: story.reactions || [],
        }))}
        currentStoryIndex={currentStoryIndex}
        onStoryChange={setCurrentStoryIndex}
      />
    </div>
  );
};
