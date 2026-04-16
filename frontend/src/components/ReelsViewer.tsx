import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Heart,
  MessageCircle,
  Share,
  Volume2,
  VolumeX,
  CheckCircle,
  Music,
  Eye,
  Film,
} from "lucide-react";
import { postsAPI, usersAPI } from "@/services/api";
import { Bookmark } from "lucide-react";
import { getApiBaseUrl } from "@/config/env";
import "./ReelsViewer.css";

interface ReelUser {
  id?: string;
  name?: string;
  username?: string;
  avatar?: string;
  verified?: boolean;
}

interface ReelItem {
  id: string;
  user?: ReelUser;
  video?: string;
  caption?: string;
  content?: string;
  likes?: number;
  comments?: number;
  shares?: number;
  views?: number;
  liked?: boolean;
  saved?: boolean;
  music?: string;
}

interface ReelsViewerProps {
  sidebarWidth?: number;
  onCreateReel?: () => void;
  onUserClick?: (userId: string, username: string) => void;
}

export const ReelsViewer = ({ sidebarWidth = 0, onCreateReel, onUserClick }: ReelsViewerProps) => {
  const [currentReel, setCurrentReel] = useState(0);
  const [muted, setMuted] = useState(true);
  const [reels, setReels] = useState<ReelItem[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Array<any>>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showLikeAnimation, setShowLikeAnimation] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [followingMap, setFollowingMap] = useState<Record<string, boolean>>({});
  const [followingLoading, setFollowingLoading] = useState<Record<string, boolean>>({});
  const [loadingMore, setLoadingMore] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const lastTapRef = useRef<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartRef = useRef<number>(0);
  const touchLastTriggerRef = useRef<number>(0);
  const wheelLastTriggerRef = useRef<number>(0);
  const transitionLockRef = useRef<boolean>(false);
  const transitionTimeoutRef = useRef<number | null>(null);

  // Disable body scroll when reels are active
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
      if (transitionTimeoutRef.current) {
        window.clearTimeout(transitionTimeoutRef.current);
        transitionTimeoutRef.current = null;
      }
      transitionLockRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = muted;
    }
  }, [muted]);

  const resolveMediaUrl = (url?: string) => {
    if (!url) return "";
    if (/^https?:\/\//i.test(url) || url.startsWith("data:")) return url;
    const base = getApiBaseUrl().replace(/\/api\/?$/, "");
    if (url.startsWith("/")) return `${base}${url}`;
    return `${base}/${url}`;
  };

  const getAvatarSrc = (avatar?: string) => {
    if (!avatar) return "";
    // If already full URL (Cloudinary, etc)
    if (avatar.startsWith("http")) {
      return avatar;
    }
    // If base64
    if (avatar.startsWith("data:image")) {
      return avatar;
    }
    // Otherwise resolve relative path
    return resolveMediaUrl(avatar);
  };

  const normalize = (arr: any[]): ReelItem[] => {
    console.log("Normalizing array:", arr.length, "items");
    return (arr || []).map((r: any, index: number) => {
      try {
        const mediaArray = r.media || [];
        const firstVideo =
          mediaArray.find((m: any) => m?.type === "video")?.url ||
          mediaArray[0]?.url;

        const reel: ReelItem = {
          id: r.id || r._id || r.postId,
          video: r.video || r.videoUrl || firstVideo,
          caption: r.caption || r.content || "",
          content: r.content || r.caption || "",
          likes: r.likesCount || r.likes || 0,
          comments: Array.isArray(r.comments)
            ? r.comments.length
            : r.commentsCount || r.comments || 0,
          shares: r.shares || 0,
          views: r.views || 0,
          liked: r.isLiked || r.liked || false,
          saved: r.isBookmarked || r.isSaved || r.saved || false,
          user: {
            id: (r.author?.id || r.author?._id || r.user?.id || r.user?._id || r.userId)?.toString?.() || r.author?.id || r.author?._id || r.user?.id || r.user?._id || r.userId,
            name:
              r.author?.fullName ||
              r.author?.name ||
              r.authorName ||
              r.user?.name,
            username: r.author?.username || r.user?.username || r.username,
            avatar:
              r.author?.avatar || r.user?.avatar || r.authorAvatar,
            verified: r.author?.isVerified || r.user?.verified || false,
          },
          music: r.music,
        };

        if (!reel.id) {
          console.warn(`Reel ${index} missing ID:`, r);
        }
        if (!reel.video) {
          console.warn(`Reel ${index} missing video:`, r);
        }

        return reel;
      } catch (err) {
        console.error(`Error normalizing reel ${index}:`, err, r);
        throw err;
      }
    });
  };

  const loadReels = useCallback(async (pageNum: number, append = true) => {
    try {
      if (!append) {
        setLoading(true);
      } else if (loadingMore) {
        console.log("Already loading more reels, skipping request");
        return;
      } else {
        setLoadingMore(true);
      }

      console.log(`Loading reels page ${pageNum}, append=${append}`);
      const res = await postsAPI.getReels(pageNum, 10);
      console.log("Reels API response:", res);

      if (res.success && res.data) {
        const data: any = res.data;
        // Accept multiple possible shapes from API: array | {reels} | {items} | {posts}
        const arr = Array.isArray(data)
          ? data
          : data.reels || data.items || data.posts || [];

        console.log(`Got ${arr.length} reels from API`);

        if (arr.length === 0) {
          console.log("No more reels available");
          setHasMore(false);
          if (append) setLoadingMore(false);
          if (!append) setLoading(false);
          return;
        }

        const mapped = normalize(arr);
        console.log(`Normalized to ${mapped.length} reels`);

        setReels((prev) => (append ? [...prev, ...mapped] : mapped));

        const has =
          typeof data.hasMore === "boolean"
            ? data.hasMore
            : typeof data.hasNextPage === "boolean"
            ? data.hasNextPage
            : Array.isArray(arr)
            ? arr.length === 10
            : false;

        console.log(`hasMore: ${has}`);
        setHasMore(has);
        setPage(pageNum);
      } else {
        console.error("API returned error:", res.error);
        alert(`Error loading reels: ${res.error || "Unknown error"}`);
      }
    } catch (e) {
      console.error("Error loading reels:", e);
      alert(`Error: Could not load reels. Check console for details.`);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [loadingMore]);

  useEffect(() => {
    loadReels(1, false);
  }, [loadReels]);

  useEffect(() => {
    const onPostCreated = (e: any) => {
      if (e?.detail?.type === "reel") {
        loadReels(1, false);
      }
    };
    window.addEventListener("postCreated", onPostCreated);
    return () => window.removeEventListener("postCreated", onPostCreated);
  }, [loadReels]);

  const handleScroll = (direction: "up" | "down") => {
    // Use a ref lock so repeated events in the same frame cannot pass through.
    if (transitionLockRef.current || loadingMore) return;
    transitionLockRef.current = true;
    setIsTransitioning(true);
    
    if (direction === "down") {
      if (currentReel < reels.length - 1) {
        setCurrentReel((i) => i + 1);
      } else if (hasMore && !loadingMore) {
        console.log("Loading next page of reels...");
        loadReels(page + 1, true);
      } else if (!hasMore) {
        console.log("No more reels to load");
      }
    } else if (direction === "up" && currentReel > 0) {
      setCurrentReel((i) => i - 1);
    }

    if (transitionTimeoutRef.current) {
      window.clearTimeout(transitionTimeoutRef.current);
    }
    transitionTimeoutRef.current = window.setTimeout(() => {
      setIsTransitioning(false);
      transitionLockRef.current = false;
      transitionTimeoutRef.current = null;
    }, 900);
  };

  const handleWheelScroll = (e: WheelEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const now = Date.now();
    if (now - wheelLastTriggerRef.current < 1100) return;
    wheelLastTriggerRef.current = now;

    const direction = e.deltaY > 0 ? "down" : "up";
    handleScroll(direction);
  };

  const handleLike = async (index: number) => {
    // optimistic update
    let prev: ReelItem | undefined;
    setReels((prevArr) => {
      const next = [...prevArr];
      prev = { ...next[index] } as ReelItem;
      const item = { ...next[index] } as ReelItem;
      const liked = !item.liked;
      const likes = (item.likes || 0) + (liked ? 1 : -1);
      item.liked = liked;
      item.likes = Math.max(0, likes);
      next[index] = item;
      return next;
    });
    try {
      const postId = reels[index]?.id;
      if (postId) {
        const res = await postsAPI.likePost(postId);
        if (!res.success) throw new Error("like failed");
      }
    } catch (e) {
      // revert on failure
      setReels((arr) => {
        if (!prev) return arr;
        const next = [...arr];
        next[index] = prev as ReelItem;
        return next;
      });
    }
  };

  // Mouse wheel auto-scroll
  useEffect(() => {
    window.addEventListener("wheel", handleWheelScroll, { passive: false });
    return () => window.removeEventListener("wheel", handleWheelScroll);
  }, [handleWheelScroll]);

  const handleShare = async () => {
    try {
      const reel = reels[currentReel];
      if (!reel) return;

      const reelUrl = `${window.location.origin}/?reel=${reel.id}`;

      // Try native share API first
      if (navigator.share) {
        await navigator.share({
          title: `Check out this reel by @${reel.user?.username}`,
          text: reel.caption || reel.content || "Check out this reel!",
          url: reelUrl,
        });
        // Increment share count
        setReels((arr) => {
          const next = [...arr];
          const item = { ...next[currentReel] } as ReelItem;
          item.shares = (item.shares || 0) + 1;
          next[currentReel] = item;
          return next;
        });
      } else {
        // Fallback: Copy to clipboard
        await navigator.clipboard.writeText(reelUrl);
        alert("Reel link copied to clipboard!");
      }
    } catch (error) {
      console.error("Share failed:", error);
    }
  };

  const handleFollow = async () => {
    try {
      const reel = reels[currentReel];
      console.log("Follow button clicked");
      console.log("Current reel:", reel);
      console.log("User ID:", reel?.user?.id);
      
      if (!reel?.user?.id) {
        console.error("Cannot follow: user ID not found");
        alert("Cannot follow: user not found");
        return;
      }

      const userId = reel.user.id;
      console.log("Attempting to follow user:", userId);
      
      // Set loading state
      setFollowingLoading((prev) => ({ ...prev, [userId]: true }));

      const res = await usersAPI.followUser(userId);
      console.log("Follow API response:", res);
      
      if (res.success) {
        // Toggle following status
        setFollowingMap((prev) => ({
          ...prev,
          [userId]: !prev[userId],
        }));
        console.log("Follow action successful");
        alert(res.data?.message || "Follow action completed!");
      } else {
        console.error("Follow failed:", res);
        alert("Failed to follow user: " + (res.error || "Unknown error"));
      }
    } catch (error) {
      console.error("Follow error:", error);
      alert("Error: Could not follow user. Please try again. Check console for details.");
    } finally {
      const reel = reels[currentReel];
      if (reel?.user?.id) {
        setFollowingLoading((prev) => ({
          ...prev,
          [reel.user.id]: false,
        }));
      }
    }
  };

  const trackView = useCallback(async () => {
    try {
      const reel = reels[currentReel];
      if (!reel?.id) return;

      const base = getApiBaseUrl();
      await fetch(`${base}/posts/${reel.id}/view`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }).catch(() => {
        // silently fail if view tracking endpoint doesn't exist
      });
    } catch (error) {
      // silent fail
    }
  }, [currentReel, reels]);

  useEffect(() => {
    trackView();
  }, [currentReel, trackView]);

  const handleDoubleTap = () => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;
    
    if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
      if (!reels[currentReel]?.liked) {
        handleLike(currentReel);
        setShowLikeAnimation(true);
        setTimeout(() => setShowLikeAnimation(false), 600);
      }
    }
    lastTapRef.current = now;
  };

  // Auto-scroll disabled - manual control only
  // useEffect(() => {
  //   const handleWheel = (e: WheelEvent) => {
  //     if (e.deltaY > 0) handleScroll("down");
  //     else handleScroll("up");
  //   };
  //
  //   window.addEventListener("wheel", handleWheel);
  //   return () => window.removeEventListener("wheel", handleWheel);
  // }, [handleScroll]);

  // Keyboard controls for navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown" || e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        handleScroll("down");
      } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
        e.preventDefault();
        handleScroll("up");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleScroll]);

  // Touch/Swipe controls for mobile
  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      touchStartRef.current = e.touches[0].clientY;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const now = Date.now();
      if (now - touchLastTriggerRef.current < 1100) return;

      const touchEnd = e.changedTouches[0].clientY;
      const diff = touchStartRef.current - touchEnd;
      const SWIPE_THRESHOLD = 140;

      if (Math.abs(diff) > SWIPE_THRESHOLD) {
        touchLastTriggerRef.current = now;
        if (diff > 0) {
          handleScroll("down"); // Swiped up
        } else {
          handleScroll("up"); // Swiped down
        }
      }
    };

    window.addEventListener("touchstart", handleTouchStart);
    window.addEventListener("touchend", handleTouchEnd);
    return () => {
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, [handleScroll]);

  const toggleSave = async (index: number) => {
    let prev: ReelItem | undefined;
    setReels((arr) => {
      const next = [...arr];
      prev = { ...next[index] } as ReelItem;
      const item = { ...next[index] } as ReelItem;
      item.saved = !item.saved;
      next[index] = item;
      return next;
    });
    try {
      const id = reels[index]?.id;
      if (!id) return;
      // First try posts bookmark (most reels come from posts/reels feed)
      let ok = false;
      try {
        const res = await postsAPI.bookmarkPost(id);
        ok = !!res.success;
      } catch (_) {
        ok = false;
      }
      if (!ok) {
        // Fallback to reels specific endpoint
        const base = getApiBaseUrl();
        const resp = await fetch(`${base}/reels/${id}/save`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(localStorage.getItem("token") && {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            }),
          },
        });
        if (!resp.ok) throw new Error("save failed");
      }
      try {
        window.dispatchEvent(new CustomEvent("treesh:saved-updated"));
      } catch {}
    } catch (e) {
      // revert on failure
      setReels((arr) => {
        if (!prev) return arr;
        const next = [...arr];
        next[index] = prev as ReelItem;
        return next;
      });
    }
  };

  const loadComments = useCallback(async () => {
    const postId = reels[currentReel]?.id;
    if (!postId) return;
    try {
      setCommentsLoading(true);
      const res = await postsAPI.getComments(postId);
      if (res.success) {
        const data: any = res.data;
        const arr = Array.isArray(data)
          ? data
          : data.comments || data.items || [];
        setComments(arr);
      }
    } catch (_) {
      // ignore
    } finally {
      setCommentsLoading(false);
    }
  }, [reels, currentReel]);

  const submitComment = async () => {
    const postId = reels[currentReel]?.id;
    const content = newComment.trim();
    if (!postId || !content || submitting) return;
    setSubmitting(true);
    try {
      const res = await postsAPI.addComment(postId, content);
      if (res.success) {
        const item: any = res.data || (res as any).comment || null;
        if (item) setComments((prev) => [...prev, item]);
        // bump comment count on the reel
        setReels((prev) => {
          const next = [...prev];
          const r = { ...next[currentReel] } as ReelItem;
          r.comments = (r.comments || 0) + 1;
          next[currentReel] = r;
          return next;
        });
        setNewComment("");
      }
    } catch (_) {
      // ignore
    } finally {
      setSubmitting(false);
    }
  };

  const reel = reels[currentReel];

  // Try to auto-play when reel changes
  useEffect(() => {
    if (!videoRef.current) return;
    const v = videoRef.current;
    const attemptPlay = async () => {
      try {
        await v.play();
      } catch (err) {
        // ensure muted then retry
        try {
          v.muted = true;
          await v.play();
        } catch (_) {}
      }
    };
    attemptPlay();
  }, [reel?.id, reel?.video]);

  return (
    <div
      ref={containerRef}
      className="reel-container"
      style={{
        width: `calc(100% - ${sidebarWidth}px)`,
        left: `${sidebarWidth}px`,
      }}
    >
      <div className="reel-stage">
        {loading ? (
          <div className="flex flex-col items-center justify-center space-y-3 text-white/70">
            <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin" />
            <p className="text-sm">Loading reels...</p>
          </div>
        ) : !reel ? (
          <div className="flex flex-col items-center justify-center space-y-3 text-white/70">
            <Music className="w-10 h-10 text-white/40" />
            <p className="text-sm">No reels yet</p>
          </div>
        ) : (
          <div className="reel-shell">
            {/* Top Navigation Button */}
            {currentReel > 0 && (
              <button
                onClick={() => handleScroll("up")}
                className="absolute top-20 right-4 z-40 bg-white/10 hover:bg-white/20 p-3 rounded-full transition-all backdrop-blur-sm border border-white/20 hover:border-white/40 text-white hover:scale-110"
                title="Previous reel (↑)"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7-7-7 7" />
                </svg>
              </button>
            )}

            {/* Card - Center Content */}
            <div className="reel-card-wrapper">
              <div className="reel-card">
                <video
                  ref={videoRef}
                  className="reel-video"
                  loop
                  autoPlay
                  muted={muted}
                  playsInline
                  controls={false}
                  key={reel?.id || "reel-video"}
                  src={resolveMediaUrl(reel?.video)}
                  onClick={handleDoubleTap}
                />

                {showLikeAnimation && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
                    <div className="like-burst">
                      <Heart className="w-24 h-24 text-red-500 fill-red-500" />
                    </div>
                  </div>
                )}

                <div className="reel-meta">
                  <div className="flex items-center space-x-2.5 mb-2">
                <Avatar
                  className="w-10 h-10 ring-2 ring-white/40 cursor-pointer hover:ring-white/60 transition-all shadow-lg"
                  onClick={() =>
                    reel?.user?.id && onUserClick?.(reel.user.id, reel.user.username || "user")
                  }
                >
                  <AvatarImage src={getAvatarSrc(reel?.user?.avatar)} alt={reel?.user?.username} />
                  <AvatarFallback className="bg-gradient-to-br from-pink-500 to-purple-500 text-white font-bold">
                    {(reel?.user?.name || "U").charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 flex items-center space-x-1.5">
                  <button
                    onClick={() =>
                      reel?.user?.id && onUserClick?.(reel.user.id, reel.user.username || "user")
                    }
                    className="text-white font-bold text-sm hover:text-white/80 transition-colors truncate max-w-[120px]"
                  >
                    @{reel?.user?.username || "user"}
                  </button>

                  {reel?.user?.verified && (
                    <CheckCircle className="w-4 h-4 text-blue-400 fill-blue-400 flex-shrink-0" />
                  )}
                </div>

                <Button
                  onClick={handleFollow}
                  disabled={followingLoading[reel?.user?.id || ""] || false}
                  variant="outline"
                  size="sm"
                  className={`h-7 px-4 text-xs font-semibold rounded-full transition-all backdrop-blur-sm flex-shrink-0 ${
                    followingMap[reel?.user?.id || ""]
                      ? "bg-white text-black border-white hover:bg-white/90"
                      : "bg-white/10 hover:bg-white hover:text-black border-white/40 hover:border-white text-white"
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {followingLoading[reel?.user?.id || ""]
                    ? "..."
                    : followingMap[reel?.user?.id || ""]
                    ? "Following"
                    : "Follow"}
                </Button>
              </div>

              {(reel?.content || reel?.caption) && (
                <p className="text-white/90 text-sm leading-snug mt-2.5 line-clamp-2 font-medium">
                  {reel?.content || reel?.caption}
                </p>
              )}

              <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-white/10">
                <div className="flex items-center space-x-3 text-white/70">
                  {reel?.music && (
                    <div className="flex items-center space-x-1.5 text-xs hover:text-white/90 transition-colors cursor-pointer">
                      <Music className="w-3.5 h-3.5" />
                      <span className="truncate max-w-[160px]">{reel.music}</span>
                    </div>
                  )}
                  <div className="flex items-center space-x-1.5 text-xs hover:text-white/90 transition-colors">
                    <Eye className="w-3.5 h-3.5" />
                    <span className="font-medium">{(reel?.views || 0).toLocaleString()}</span>
                  </div>
                </div>

                <button
                  onClick={() => setMuted(!muted)}
                  className="bg-white/10 hover:bg-white/20 p-2 rounded-full transition-all backdrop-blur-sm border border-white/15 hover:border-white/30"
                >
                  {muted ? (
                    <VolumeX className="w-4 h-4 text-white" />
                  ) : (
                    <Volume2 className="w-4 h-4 text-white" />
                  )}
                </button>
              </div>
              </div>
            </div>
            </div>

            {/* Bottom Navigation Button */}
            {currentReel < reels.length - 1 || hasMore ? (
              <button
                onClick={() => handleScroll("down")}
                className="absolute bottom-20 right-4 z-40 bg-white/10 hover:bg-white/20 p-3 rounded-full transition-all backdrop-blur-sm border border-white/20 hover:border-white/40 text-white hover:scale-110"
                title="Next reel (↓)"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7 7 7-7" />
                </svg>
              </button>
            ) : null}

            {/* Action Tray - Right Sidebar */}
            <div className="reel-actions">
              <div className="flex flex-col items-center space-y-1">
                <button
                  onClick={() => handleLike(currentReel)}
                  className="reel-action-btn group"
                >
                  <Heart
                    className={`w-5 h-5 transition-all duration-300 ${
                      reel?.liked
                        ? "fill-red-500 text-red-500"
                        : "text-white group-hover:text-red-500"
                    }`}
                  />
                </button>
                <span className="text-white text-xs font-semibold">
                  {(reel?.likes || 0).toLocaleString()}
                </span>
              </div>

              <div className="flex flex-col items-center space-y-1">
                <button
                  onClick={() => {
                    setShowComments(true);
                    loadComments();
                  }}
                  className="reel-action-btn group"
                >
                  <MessageCircle className="w-5 h-5 text-white transition-transform duration-200 group-hover:scale-110" />
                </button>
                <span className="text-white text-xs font-semibold">
                  {(reel?.comments || 0).toLocaleString()}
                </span>
              </div>

              <div className="flex flex-col items-center space-y-1">
                <button onClick={handleShare} className="reel-action-btn group">
                  <Share className="w-5 h-5 text-white transition-transform duration-200 group-hover:scale-110" />
                </button>
                <span className="text-white text-xs font-semibold">
                  {(reel?.shares || 0).toLocaleString()}
                </span>
              </div>

              <div className="flex flex-col items-center space-y-1">
                <button
                  onClick={onCreateReel}
                  className="reel-action-btn group"
                  title="Create Reel"
                >
                  <Film className="w-5 h-5 text-white transition-transform duration-200 group-hover:scale-110 group-hover:text-pink-400" />
                </button>
                <span className="text-white text-xs font-semibold">Create</span>
              </div>

              <div className="flex flex-col items-center space-y-1">
                <button
                  onClick={() => toggleSave(currentReel)}
                  className="reel-action-btn group"
                >
                  <Bookmark
                    className={`w-5 h-5 transition-all duration-300 ${
                      reel?.saved
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-white group-hover:text-yellow-400"
                    }`}
                  />
                </button>
                <span className="text-white text-xs font-semibold">
                  {reel?.saved ? "Saved" : "Save"}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Progress Indicator - Bottom */}
      <div className="absolute bottom-4 left-0 right-0 flex justify-center items-center pointer-events-none z-20">
        <div className="flex space-x-1">
          {reels.slice(0, 5).map((_, index) => (
            <div
              key={index}
              className={`progress-bar transition-all duration-500 ${
                index === currentReel ? "bg-white w-2 h-1" : "bg-white/30 w-1 h-1"
              }`}
            />
          ))}
          {reels.length > 5 && (
            <span className="text-white/50 text-xs ml-2">
              {currentReel + 1} / {reels.length}
            </span>
          )}
        </div>
      </div>

      {/* Comments Dialog - Modern Design */}
      <Dialog open={showComments} onOpenChange={(o) => setShowComments(o)}>
        <DialogContent className="sm:max-w-md backdrop-blur-xl border-white/10 shadow-2xl rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Comments</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col h-[60vh] space-y-4">
            <div className="flex-1 rounded-xl border border-white/10 bg-white/5 overflow-hidden">
              <ScrollArea className="h-full">
                {commentsLoading ? (
                  <div className="p-6 flex flex-col items-center justify-center space-y-2">
                    <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    <p className="text-sm text-white/60">Loading comments...</p>
                  </div>
                ) : comments.length === 0 ? (
                  <div className="p-6 flex flex-col items-center justify-center space-y-2">
                    <MessageCircle className="w-8 h-8 text-white/30" />
                    <p className="text-sm text-white/60">No comments yet.</p>
                    <p className="text-xs text-white/40">Be the first to share your thoughts!</p>
                  </div>
                ) : (
                  <ul className="divide-y divide-white/10">
                    {comments.map((c: any) => (
                      <li
                        key={c._id}
                        className="p-4 hover:bg-white/5 transition-colors"
                      >
                        <div className="flex items-start space-x-3">
                          <Avatar className="w-8 h-8 flex-shrink-0 ring-1 ring-white/10">
                            <AvatarImage
                              src={c.user?.avatar || "/placeholder.svg"}
                            />
                            <AvatarFallback className="bg-gradient-to-br from-pink-500 to-purple-500 text-white text-xs">
                              {(c.user?.name || c.user?.username || "U").charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2">
                              <span className="text-sm font-semibold text-white">
                                {c.user?.username || c.user?.name || "User"}
                              </span>
                              {c.user?.verified && (
                                <CheckCircle className="w-3 h-3 text-blue-400 fill-blue-400" />
                              )}
                            </div>
                            <p className="text-sm text-white/80 mt-1 break-words">
                              {c.content}
                            </p>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </ScrollArea>
            </div>
            <div className="flex items-center space-x-2">
              <Input
                placeholder="Add a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    submitComment();
                  }
                }}
                className="rounded-full bg-white/10 border-white/20 text-white placeholder:text-white/40"
              />
              <Button
                onClick={submitComment}
                disabled={submitting || !newComment.trim()}
                className="rounded-full bg-gradient-to-r from-pink-500 to-purple-500 text-white font-semibold hover:shadow-lg transition-shadow"
              >
                Post
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
