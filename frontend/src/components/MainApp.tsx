import { useState, useEffect } from "react";
import { Navigation, MobileNavigation } from "./Navigation";
import { EnhancedAuthModal } from "./EnhancedAuthModal";
import { StoryBar } from "./StoryBar";
import { InfiniteScrollFeed } from "./InfiniteScrollFeed";
import { EnhancedSearch } from "./EnhancedSearch";
import { ReelsViewer } from "./ReelsViewer";
import { LiveStream } from "./LiveStream";
import { ProfilePage } from "./ProfilePage";
import { MessagingPage } from "./MessagingPage";
import { ArcadePage } from "./ArcadePage";
import { NotificationPage } from "./NotificationPage";
import { AboutPage, TermsPage, PrivacyPage, SupportPage } from "./StaticPages";
import Footer from "./Footer";
import { UploadModal, GoLiveModal } from "./UploadModal";
import { ReportModal } from "./ReportModal";
import { StreamerSubscriptionSetup } from "./StreamerSubscriptionSetup";
import { StreamerSubscriptionStatus } from "./StreamerSubscriptionStatus";
import { SubscriptionHistoryPage } from "./SubscriptionHistoryPage";
import { StreamerDiscoveryPage } from "./StreamerDiscoveryPage";
import { SettingsPage } from "./SettingsPage";
import { SubscriptionsPage } from "./SubscriptionsPage";
import { UserProfilePage } from "./UserProfilePage";
import { ErrorBoundary } from "./ErrorBoundary";
import { SuggestedPeople } from "./SuggestedPeople";
import { useAuth } from "@/hooks/useAuth";
import { notificationsAPI } from "@/services/api";
import { useChat } from "@/hooks/useChat";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Plus,
  Bell,
  Settings,
  LogOut,
  Crown,
  Gift,
  Heart,
  User,
  ArrowLeft,
  FileText,
  ImagePlus,
  Film,
  Radio,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const mockPosts = [
  {
    id: "1",
    user: {
      name: "Alice Johnson",
      username: "alice",
      avatar: "/placeholder.svg",
      verified: true,
    },
    content: "Beautiful sunset today! 🌅",
    image: "/placeholder.svg",
    timestamp: "2h ago",
    likes: 234,
    comments: 12,
    shares: 5,
    liked: false,
    saved: false,
    type: "post" as const,
  },
  {
    id: "2",
    user: {
      name: "Admin",
      username: "admin",
      avatar: "/placeholder.svg",
      verified: true,
    },
    content: "🚨 IMPORTANT: New community guidelines are now in effect.",
    timestamp: "4h ago",
    likes: 89,
    comments: 23,
    shares: 45,
    liked: false,
    saved: true,
    type: "psa" as const,
  },
];

interface MainAppProps {
  // No props needed anymore
}

export const MainApp = () => {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  // Mount chat hook globally to keep unread badges in sync app-wide
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _chat = useChat();
  const [activeTab, setActiveTab] = useState("home");
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewingUserId, setViewingUserId] = useState<string | null>(null);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploadType, setUploadType] = useState<"post" | "story" | "reel">(
    "post",
  );
  const [goLiveModalOpen, setGoLiveModalOpen] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const [showWelcomeScreen, setShowWelcomeScreen] = useState(() => {
    // Avoid replaying welcome on every route remount for logged-in users.
    const seenWelcome = sessionStorage.getItem("treesh:welcome-seen") === "1";
    return !seenWelcome;
  });
  const [sidebarHovered, setSidebarHovered] = useState(false);
  const [reportData, setReportData] = useState<{
    type: "user" | "post" | "reel" | "stream" | "story";
    targetId: string;
    targetName: string;
  }>({
    type: "post",
    targetId: "",
    targetName: "",
  });

  const desktopSidebarWidth = sidebarHovered ? 256 : 64;

  const getHeaderTitle = () => {
    if (activeTab === "profile") return "Profile";
    if (activeTab === "user-profile") return "User Profile";
    return "Treesh";
  };

  // Function to refresh notification count
  const refreshNotificationCount = async () => {
    if (user?.id) {
      try {
        const response = await notificationsAPI.getUnreadCount();
        if (response.data) {
          setNotificationCount(response.data.count);
        }
      } catch (error) {
        console.error("Failed to fetch notification count:", error);
      }
    }
  };

  // Fetch unread notification count
  useEffect(() => {
    refreshNotificationCount();
  }, [user?.id]);

  // Sync header badge with NotificationPage events
  useEffect(() => {
    const onDec = (e: Event) => {
      const detail = (e as CustomEvent).detail as { by?: number } | undefined;
      const by = Math.max(1, Number(detail?.by ?? 1));
      setNotificationCount((prev) => Math.max(0, prev - by));
    };
    const onInc = (e: Event) => {
      const detail = (e as CustomEvent).detail as { by?: number } | undefined;
      const by = Math.max(1, Number(detail?.by ?? 1));
      setNotificationCount((prev) => prev + by);
    };
    const onSet = (e: Event) => {
      const detail = (e as CustomEvent).detail as
        | { count?: number }
        | undefined;
      const count = Math.max(0, Number(detail?.count ?? 0));
      setNotificationCount(count);
    };
    window.addEventListener(
      "treesh:notifications-decrement",
      onDec as EventListener,
    );
    window.addEventListener(
      "treesh:notifications-increment",
      onInc as EventListener,
    );
    window.addEventListener("treesh:notifications-set", onSet as EventListener);
    return () => {
      window.removeEventListener(
        "treesh:notifications-decrement",
        onDec as EventListener,
      );
      window.removeEventListener(
        "treesh:notifications-increment",
        onInc as EventListener,
      );
      window.removeEventListener(
        "treesh:notifications-set",
        onSet as EventListener,
      );
    };
  }, []);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Show welcome screen for a few seconds before checking auth

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowWelcomeScreen(false);
      sessionStorage.setItem("treesh:welcome-seen", "1");
    }, 2000); // Show welcome screen for 2 seconds

    return () => clearTimeout(timer);
  }, []);

  // Ensure login UI hides and tab resets when auth becomes true
  useEffect(() => {
    if (isAuthenticated) {
      setIsAuthOpen(false);
      setShowWelcomeScreen(false);
      sessionStorage.setItem("treesh:welcome-seen", "1");
      if (activeTab === "home") return;
      // Stay on current tab if it was public; otherwise default to home
      const publicTabs = new Set([
        "home",
        "search",
        "about",
        "terms",
        "privacy",
        "reels",
        "live",
      ]);
      if (!publicTabs.has(activeTab)) {
        setActiveTab("home");
      }
    }
  }, [isAuthenticated]);

  const handleLogin = () => {
    // Close modal and take the user to the app immediately
    setIsAuthOpen(false);
    setShowWelcomeScreen(false);
    sessionStorage.setItem("treesh:welcome-seen", "1");
    setActiveTab("home");
  };

  const handleLogout = () => {
    logout(); //added logout functionality
    // This will be handled by the useAuth hook
    setActiveTab("home");
    sessionStorage.removeItem("treesh:welcome-seen");
    setShowWelcomeScreen(true); // Show welcome screen again after logout
  };

  const handleUpload = (type: "post" | "story" | "reel") => {
    setUploadType(type);
    setUploadModalOpen(true);
  };

  const handleReport = (
    type: "user" | "post" | "reel" | "stream" | "story",
    targetId: string,
    targetName?: string,
  ) => {
    setReportData({ type, targetId, targetName: targetName || "" });
    setReportModalOpen(true);
  };

  const handlePostReport = (
    type: "post",
    targetId: string,
    targetName?: string,
  ) => {
    handleReport(type, targetId, targetName);
  };

  const handleTabChange = (tab: string) => {
    console.log("Tab change requested:", tab);
    console.log("Previous active tab:", activeTab);
    setActiveTab(tab);
    console.log("New active tab set to:", tab);
  };

  const handleBackToHome = () => {
    console.log("Back to home requested");
    setActiveTab("home");
  };

  const handleUserSelect = (userId: string) => {
    console.log("User selected:", userId);
    setViewingUserId(userId);
    setActiveTab("user-profile");
  };

  const handleBackFromUserProfile = () => {
    setViewingUserId(null);
    setActiveTab("search");
  };

  // Deep-link from Messaging: open user profile when requested
  useEffect(() => {
    const onNavigateToUserProfile = (e: any) => {
      const uid = String(e?.detail?.userId || "");
      if (!uid) return;
      setViewingUserId(uid);
      setActiveTab("user-profile");
    };
    window.addEventListener(
      "navigateToUserProfile",
      onNavigateToUserProfile as EventListener,
    );
    return () =>
      window.removeEventListener(
        "navigateToUserProfile",
        onNavigateToUserProfile as EventListener,
      );
  }, []);

  // Global navigation handler (e.g., from ProfilePage: Subscribe/Gift)
  useEffect(() => {
    const onNavigate = (e: any) => {
      const tab = String(e?.detail?.tab || "");
      if (!tab) return;
      setActiveTab(tab);
    };
    window.addEventListener("treesh:navigate", onNavigate as EventListener);
    return () =>
      window.removeEventListener(
        "treesh:navigate",
        onNavigate as EventListener,
      );
  }, []);

  // Show welcome screen
  if (showWelcomeScreen) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary via-primary-dark to-accent flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-amber-50/95 backdrop-blur-sm shadow-2xl border-0">
          <CardContent className="pt-8 pb-8 text-center">
            <div className="flex items-center justify-center mb-6">
              <img
                src="/logo.svg"
                alt="Treesh"
                className="w-16 h-16 object-contain"
              />
            </div>
            <h1 className="text-5xl font-bold text-primary mb-4 font-treesh">
              Treesh
            </h1>
            <p className="text-muted-foreground mb-8 font-inter text-lg">
              Connect, Share, Stream
            </p>
            <Button
              onClick={() => setIsAuthOpen(true)}
              className="w-full bg-primary hover:bg-primary-dark text-white font-inter text-lg py-3 px-6 rounded-lg shadow-lg transition-all duration-200 hover:shadow-xl"
            >
              Get Started
            </Button>
          </CardContent>
        </Card>
        <EnhancedAuthModal
          isOpen={isAuthOpen}
          onClose={() => setIsAuthOpen(false)}
          onLogin={handleLogin}
        />
      </div>
    );
  }

  // Show loading state while authentication is being initialized
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary via-primary-dark to-accent flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-amber-50/95 backdrop-blur-sm shadow-2xl border-0">
          <CardContent className="pt-8 pb-8 text-center">
            <div className="flex items-center justify-center mb-6">
              <img
                src="/logo.svg"
                alt="Treesh"
                className="w-16 h-16 object-contain"
              />
            </div>
            <h1 className="text-5xl font-bold text-primary mb-4 font-treesh">
              Treesh
            </h1>
            <div className="flex items-center justify-center space-x-2">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
              <span className="text-muted-foreground font-inter">
                Loading...
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const renderContent = () => {
    console.log(
      "Current activeTab:",
      activeTab,
      "isAuthenticated:",
      isAuthenticated,
    );

    // If not logged in, show login prompt for protected features
    if (
      !isAuthenticated &&
      ["arcade", "subscriptions", "messages", "profile", "settings"].includes(
        activeTab,
      )
    ) {
      return (
        <div className="flex-1 flex items-center justify-center p-6">
          <Card className="w-full max-w-md">
            <CardContent className="pt-8 pb-8 text-center">
              <div className="flex items-center justify-center mb-6">
                <img
                  src="/logo.svg"
                  alt="Treesh"
                  className="w-16 h-16 object-contain"
                />
              </div>
              <h2 className="text-2xl font-bold text-primary mb-4 font-treesh">
                Login Required
              </h2>
              <p className="text-muted-foreground mb-6 font-inter">
                Please log in to access {activeTab} features.
              </p>
              <Button
                onClick={() => setIsAuthOpen(true)}
                className="w-full bg-primary hover:bg-primary-dark text-white font-inter py-3 px-6 rounded-lg shadow-lg transition-all duration-200 hover:shadow-xl"
              >
                Login Now
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }

    switch (activeTab) {
      case "home":
        return (
          <>
            {/* Suggestions Box - Moves with content on scroll */}
            <div className="hidden lg:block absolute right-4 top-0 w-80">
              <div className="sticky top-20 z-30 max-h-[calc(100vh-6rem)] overflow-y-auto">
                <SuggestedPeople limit={5} />
              </div>
            </div>

            <div className="w-full px-3 sm:px-4 md:px-6 relative">
              <StoryBar />
              <div className="py-4">
                <InfiniteScrollFeed onReport={handlePostReport} />
              </div>
            </div>
          </>
        );

      case "search":
        console.log("Rendering EnhancedSearch component");
        return (
          <ErrorBoundary>
            <EnhancedSearch onUserSelect={handleUserSelect} />
          </ErrorBoundary>
        );

      case "user-profile":
        if (viewingUserId) {
          return (
            <ErrorBoundary>
              <UserProfilePage
                userId={viewingUserId}
                onBack={handleBackFromUserProfile}
                onFollowAction={refreshNotificationCount}
              />
            </ErrorBoundary>
          );
        }
        // Fallback to search if no user is selected
        return (
          <ErrorBoundary>
            <EnhancedSearch onUserSelect={handleUserSelect} />
          </ErrorBoundary>
        );

      case "reels":
        console.log("Rendering ReelsViewer component");
        return (
          <ErrorBoundary>
            <ReelsViewer 
              sidebarWidth={isMobile ? 0 : desktopSidebarWidth}
              onCreateReel={() => {
                setUploadType("reel");
                setUploadModalOpen(true);
              }}
              onUserClick={(userId, username) => {
                console.log("Navigating to user profile:", userId, username);
                setViewingUserId(userId);
                setActiveTab("user-profile");
              }}
            />
          </ErrorBoundary>
        );

      case "live":
        console.log("Rendering LiveStream component");
        return (
          <ErrorBoundary>
            <LiveStream />
          </ErrorBoundary>
        );

      case "arcade":
        console.log("Rendering ArcadePage component");
        return (
          <ErrorBoundary>
            <ArcadePage />
          </ErrorBoundary>
        );

      case "subscriptions":
        console.log("Rendering SubscriptionsPage component");
        return (
          <ErrorBoundary>
            <SubscriptionsPage />
          </ErrorBoundary>
        );

      case "discover-streamers":
        return <StreamerDiscoveryPage />;

      case "subscription-setup":
        return <StreamerSubscriptionSetup />;

      case "my-subscriptions":
        console.log("Rendering StreamerSubscriptionStatus component");
        return (
          <ErrorBoundary>
            <StreamerSubscriptionStatus />
          </ErrorBoundary>
        );

      case "subscription-history":
        console.log("Rendering SubscriptionHistoryPage component");
        return (
          <ErrorBoundary>
            <SubscriptionHistoryPage />
          </ErrorBoundary>
        );

      case "messages":
        console.log("Rendering MessagingPage component");
        return (
          <ErrorBoundary>
            <MessagingPage />
          </ErrorBoundary>
        );

      case "notifications":
        console.log("Rendering NotificationPage component");
        return (
          <ErrorBoundary>
            <NotificationPage />
          </ErrorBoundary>
        );

      case "profile":
        console.log("Rendering ProfilePage component");
        return (
          <ErrorBoundary>
            <ProfilePage />
          </ErrorBoundary>
        );

      case "settings":
        console.log("Rendering SettingsPage component");
        return (
          <ErrorBoundary>
            <SettingsPage />
          </ErrorBoundary>
        );

      case "about":
        console.log("Rendering AboutPage component");
        return (
          <ErrorBoundary>
            <AboutPage />
          </ErrorBoundary>
        );

      case "terms":
        console.log("Rendering TermsPage component");
        return (
          <ErrorBoundary>
            <TermsPage />
          </ErrorBoundary>
        );

      case "privacy":
        console.log("Rendering PrivacyPage component");
        return (
          <ErrorBoundary>
            <PrivacyPage />
          </ErrorBoundary>
        );

      default:
        console.log("Unknown tab:", activeTab, "showing default content");
        return (
          <div className="p-6">
            <Card>
              <CardContent className="pt-6">
                <h2 className="text-xl font-semibold text-center mb-4">
                  Page Not Found
                </h2>
                <p className="text-center text-muted-foreground font-inter mb-4">
                  The page "{activeTab}" is not available yet.
                </p>
                <div className="text-center">
                  <Button onClick={handleBackToHome} variant="outline">
                    Back to Home
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        );
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary via-primary-dark to-accent flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-offwhite/95 backdrop-blur-sm shadow-2xl border-0">
          <CardContent className="pt-8 pb-8 text-center">
            <div className="flex items-center justify-center mb-6">
              <img
                src="/logo.svg"
                alt="Treesh"
                className="w-16 h-16 object-contain"
              />
            </div>
            <h1 className="text-5xl font-bold text-primary mb-4 font-treesh">
              Treesh
            </h1>
            <p className="text-muted-foreground mb-8 font-inter text-lg">
              Connect, Share, Stream
            </p>
            <Button
              onClick={() => setIsAuthOpen(true)}
              className="w-full bg-primary hover:bg-primary-dark text-white font-inter text-lg py-3 px-6 rounded-lg shadow-lg transition-all duration-200 hover:shadow-xl"
            >
              Get Started
            </Button>
          </CardContent>
        </Card>
        <EnhancedAuthModal
          isOpen={isAuthOpen}
          onClose={() => setIsAuthOpen(false)}
          onLogin={handleLogin}
        />
      </div>
    );
  }

  // tailwind responsive added code
  return (
    <div className="min-h-screen w-full bg-background flex flex-col overflow-x-hidden overscroll-x-none">
      {/* ================= HEADER ================= */}
      {activeTab !== "reels" && (
      <header
        className="sticky top-0 z-50 hidden md:block transition-all duration-300"
        style={{
          marginLeft: `${desktopSidebarWidth}px`,
          width: `calc(100% - ${desktopSidebarWidth}px)`,
        }}
      >
        <div className="w-full px-3 sm:px-4 md:px-6 py-2">
          <div className="h-12 sm:h-14 bg-card border border-border shadow-sm rounded-2xl px-3 sm:px-4 md:px-6 flex items-center justify-between">
            {/* LEFT SIDE */}
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-shrink-0">
              {activeTab !== "home" && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleBackToHome}
                  className="h-8 w-8 sm:h-9 sm:w-9 flex-shrink-0"
                >
                  <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                </Button>
              )}
              <h1 className="text-lg sm:text-xl font-semibold text-foreground truncate">
                {getHeaderTitle()}
              </h1>
            </div>

            {/* RIGHT SIDE */}
            <div className="flex items-center gap-1 sm:gap-2">
              {/* CREATE */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 sm:h-9 sm:w-9"
                  >
                    <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-64" align="end">
                  <DropdownMenuItem onClick={() => handleUpload("post")} className="flex items-center gap-3 cursor-pointer py-2">
                    <FileText className="w-5 h-5 text-blue-500" />
                    <div>
                      <div className="font-medium">Create Post</div>
                      <div className="text-xs text-muted-foreground">Share your thoughts</div>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleUpload("story")} className="flex items-center gap-3 cursor-pointer py-2">
                    <ImagePlus className="w-5 h-5 text-purple-500" />
                    <div>
                      <div className="font-medium">Add Story</div>
                      <div className="text-xs text-muted-foreground">Share for 24 hours</div>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleUpload("reel")} className="flex items-center gap-3 cursor-pointer py-2">
                    <Film className="w-5 h-5 text-pink-500" />
                    <div>
                      <div className="font-medium">Create Reel</div>
                      <div className="text-xs text-muted-foreground">Upload a video</div>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setGoLiveModalOpen(true)} className="flex items-center gap-3 cursor-pointer py-2">
                    <Radio className="w-5 h-5 text-red-500" />
                    <div>
                      <div className="font-medium">Go Live</div>
                      <div className="text-xs text-muted-foreground">Stream now</div>
                    </div>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* NOTIFICATIONS */}
              <Button
                variant="ghost"
                size="icon"
                className="relative h-8 w-8 sm:h-9 sm:w-9"
                onClick={() => setActiveTab("notifications")}
              >
                <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
                {notificationCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 w-5 h-5 text-xs bg-primary flex justify-center items-center">
                    {notificationCount}
                  </Badge>
                )}
              </Button>

              {/* PROFILE - hidden on small screens */}

              <Button
                variant="ghost"
                className="flex items-center gap-2 h-8 px-2 sm:h-9 sm:px-3"
                onClick={() => setActiveTab("profile")}
              >
                <User className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden sm:inline">Profile</span>
              </Button>
            </div>
          </div>
        </div>
      </header>
      )}

      {/* Mobile Header */}
      {activeTab !== "reels" && (
      <header className="sticky top-0 z-50 w-full md:hidden">
        <div className="w-full px-2 sm:px-3 py-2">
          <div className="h-12 sm:h-14 bg-card border border-border shadow-sm rounded-2xl px-2 sm:px-3 flex items-center justify-between">
            {/* LEFT SIDE */}
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-shrink-0">
              {activeTab !== "home" && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleBackToHome}
                  className="h-8 w-8 flex-shrink-0"
                >
                  <ArrowLeft className="w-4 h-4" />
                </Button>
              )}

              <img
                src="/logo.svg"
                alt="Treesh"
                className={`w-7 h-7 object-contain flex-shrink-0 ${
                  activeTab === "profile" || activeTab === "user-profile"
                    ? "hidden"
                    : ""
                }`}
              />

              <h1
                className={`text-lg font-bold truncate ${
                  activeTab === "profile" || activeTab === "user-profile"
                    ? "text-foreground"
                    : "text-primary"
                }`}
              >
                {getHeaderTitle()}
              </h1>
            </div>

            {/* RIGHT SIDE */}
            <div className="flex items-center gap-1">
              {/* CREATE */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-64" align="end">
                  <DropdownMenuItem onClick={() => handleUpload("post")} className="flex items-center gap-3 cursor-pointer py-2">
                    <FileText className="w-5 h-5 text-blue-500" />
                    <div>
                      <div className="font-medium">Create Post</div>
                      <div className="text-xs text-muted-foreground">Share your thoughts</div>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleUpload("story")} className="flex items-center gap-3 cursor-pointer py-2">
                    <ImagePlus className="w-5 h-5 text-purple-500" />
                    <div>
                      <div className="font-medium">Add Story</div>
                      <div className="text-xs text-muted-foreground">Share for 24 hours</div>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleUpload("reel")} className="flex items-center gap-3 cursor-pointer py-2">
                    <Film className="w-5 h-5 text-pink-500" />
                    <div>
                      <div className="font-medium">Create Reel</div>
                      <div className="text-xs text-muted-foreground">Upload a video</div>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setGoLiveModalOpen(true)} className="flex items-center gap-3 cursor-pointer py-2">
                    <Radio className="w-5 h-5 text-red-500" />
                    <div>
                      <div className="font-medium">Go Live</div>
                      <div className="text-xs text-muted-foreground">Stream now</div>
                    </div>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* NOTIFICATIONS */}
              <Button
                variant="ghost"
                size="icon"
                className="relative h-8 w-8"
                onClick={() => setActiveTab("notifications")}
              >
                <Bell className="w-4 h-4" />
                {notificationCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 w-5 h-5 text-xs bg-primary flex justify-center items-center">
                    {notificationCount}
                  </Badge>
                )}
              </Button>


            </div>
          </div>
        </div>
      </header>
      )}

      {/* ================= BODY ================= */}
      <div
        className="flex flex-1 min-w-0 transition-all duration-300"
        style={{
          marginLeft: isMobile ? 0 : `${desktopSidebarWidth}px`,
        }}
      >
        {/* DESKTOP SIDEBAR */}
        <div className="hidden md:block">
          <Navigation
            activeTab={activeTab}
            onTabChange={handleTabChange}
            className=""
            notificationCount={notificationCount}
            onHoverChange={setSidebarHovered}
          />
        </div>

        {/* MAIN CONTENT */}
        <main className={`flex-1 min-w-0 overflow-x-hidden relative pb-24 md:pb-6`}>
          <ErrorBoundary>{renderContent()}</ErrorBoundary>
        </main>
      </div>

      {/* FOOTER - Full Width */}
      {activeTab === "home" && (
        <div
          className="transition-all duration-300 px-3 sm:px-4 md:px-6 pb-24 md:pb-6"
          style={{
            marginLeft: isMobile ? 0 : `${desktopSidebarWidth}px`,
            width: isMobile ? "100%" : `calc(100% - ${desktopSidebarWidth}px)`,
          }}
        >
          <Footer variant="full" />
        </div>
      )}

      {/* MOBILE NAVIGATION - Always Visible */}
      <div className="md:hidden">
        <MobileNavigation
          activeTab={activeTab}
          onTabChange={handleTabChange}
          notificationCount={notificationCount}
        />
      </div>

      {/* MODALS */}
      <UploadModal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        type={uploadType}
      />

      <GoLiveModal
        isOpen={goLiveModalOpen}
        onClose={() => setGoLiveModalOpen(false)}
      />

      <ReportModal
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        type={reportData.type}
        targetId={reportData.targetId}
        targetName={reportData.targetName}
      />

      <EnhancedAuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onLogin={handleLogin}
      />
    </div>
  );
};

