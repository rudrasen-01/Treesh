import React, { useState, useEffect, useRef } from "react";
import { storiesAPI } from "@/services/api";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Eye,
  Heart,
  Users,
  MessageCircle,
  Share2,
  Trash2,
  User,
  Calendar,
  BarChart3,
  ChevronDown,
  Send,
  Play,
  Pause,
  Volume2,
  VolumeX,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";

interface StoryViewerProps {
  isOpen: boolean;
  onClose: () => void;
  stories: StoryData[];
  currentStoryIndex: number;
  onStoryChange: (index: number) => void;
}

interface StoryData {
  id: string;
  image: string;
  textOverlays: TextOverlay[];
  stickers: Sticker[];
  createdAt: Date;
  expiresAt: Date;
  views?: number;
  likes?: number;
  likedByMe?: boolean;
  viewers?: StoryViewer[];
  reactions?: StoryReaction[];
  user?: {
    id: string;
    name: string;
    username: string;
    avatar?: string;
  };
}

interface TextOverlay {
  id: string;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  color: string;
  fontFamily: string;
}

interface Sticker {
  id: string;
  emoji: string;
  x: number;
  y: number;
  size: number;
}

interface StoryViewer {
  id: string;
  name: string;
  username: string;
  avatar: string;
  viewedAt: Date;
  isFollowing: boolean;
}

interface StoryReaction {
  id: string;
  type: "like" | "heart" | "laugh" | "wow" | "sad" | "angry";
  user: {
    id: string;
    name: string;
    username: string;
    avatar: string;
  };
  timestamp: Date;
}

interface StoryComment {
  id: string;
  content: string;
  createdAt: Date;
  user: {
    id: string;
    name: string;
    username: string;
    avatar: string | null;
  } | null;
}

export const StoryViewer: React.FC<StoryViewerProps> = ({
  isOpen,
  onClose,
  stories,
  currentStoryIndex,
  onStoryChange,
}) => {
  const { user: authUser } = useAuth();
  const [currentStory, setCurrentStory] = useState<StoryData | null>(null);
  const [progress, setProgress] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState<string>("");
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [hasLiked, setHasLiked] = useState(false);
  const [showInsights, setShowInsights] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [authoritativeViewers, setAuthoritativeViewers] = useState<
    StoryViewer[]
  >([]);
  const [likersSet, setLikersSet] = useState<Set<string>>(new Set());

  // Comments state
  const [comments, setComments] = useState<StoryComment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [isPostingComment, setIsPostingComment] = useState(false);
  const [isLoadingComments, setIsLoadingComments] = useState(false);

  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const commentInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const storyDuration = 5000; // 5 seconds per story

  useEffect(() => {
    if (isOpen && stories.length > 0) {
      setCurrentStory(stories[currentStoryIndex]);
      setProgress(0);
      setIsPaused(false);
      setIsMuted(true);
      const initial = stories[currentStoryIndex] as any;
      setHasLiked(Boolean(initial?.likedByMe));
      setShowInsights(false);
      setShowComments(false);
      setComments([]);
      setCommentText("");
      setAuthoritativeViewers([]);
      // Ensure video ref is muted on open
      if (videoRef.current) {
        videoRef.current.muted = true;
      }
      const s = stories[currentStoryIndex];
      if (s?.id) {
        storiesAPI.viewStory(s.id).catch(() => {});
      }
    }
  }, [isOpen, currentStoryIndex, stories]);

  // Handle Mute/Unmute
  const handleMuteUnmute = () => {
    const newMutedState = !isMuted;
    setIsMuted(newMutedState);
    if (videoRef.current) {
      videoRef.current.muted = newMutedState;
    }
  };

  // Fetch viewers automatically for owners
  useEffect(() => {
    const me = String((authUser as any)?.id || (authUser as any)?._id || "");
    const storyUserId = String(currentStory?.user?.id || "");
    const isOwner = me && storyUserId && me === storyUserId;
    const fetchViewers = async () => {
      try {
        if (isOpen && isOwner && currentStory?.id) {
          const res = await storiesAPI.getStoryViewers(currentStory.id);
          const list = Array.isArray(res?.data)
            ? (res.data as any[])
            : Array.isArray((res?.data as any)?.viewers)
            ? ((res?.data as any)?.viewers as any[])
            : [];
          if (res?.success && Array.isArray(list)) {
            const likesArr = Array.isArray((res?.data as any)?.likes)
              ? ((res?.data as any)?.likes as any[])
              : [];
            const likeIds = new Set(
              likesArr
                .map((l: any) => String(l?.user?._id || l?.user?.id || ""))
                .filter(Boolean),
            );
            const normalized = (list
              .map((v: any) => {
                const node = v?.user || v;
                const id = String(
                  node?._id || node?.id || v?._id || v?.id || "",
                );
                const rawUsername = node?.username || node?.handle || "";
                if (!id || !rawUsername) return null;
                const name =
                  node?.name ||
                  node?.fullName ||
                  node?.displayName ||
                  rawUsername;
                const username = rawUsername;
                const avatar =
                  node?.avatar || node?.profileImage || "/placeholder.svg";
                const viewedAt = new Date(
                  v?.viewedAt || v?.createdAt || Date.now(),
                );
                const isFollowing = Boolean(
                  v?.isFollowing || node?.isFollowing,
                );
                return {
                  id,
                  name,
                  username,
                  avatar,
                  viewedAt,
                  isFollowing,
                } as StoryViewer;
              })
              .filter(Boolean) as StoryViewer[]).filter(
              (viewer, idx, arr) =>
                arr.findIndex((x) => x.id === viewer.id) === idx,
            );
            setLikersSet(likeIds);
            setAuthoritativeViewers(normalized);
          }
        }
      } catch {}
    };
    fetchViewers();
  }, [isOpen, currentStory?.id, (authUser as any)?.id]);

  useEffect(() => {
    if (currentStory) {
      updateTimeRemaining();
      const timeInterval = setInterval(updateTimeRemaining, 1000);
      return () => clearInterval(timeInterval);
    }
  }, [currentStory]);

  // Sync video muted state
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
    }
  }, [isMuted]);

  // Effect to handle progress updates when pause state changes
  useEffect(() => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }

    if (!isOpen) return;

    progressIntervalRef.current = setInterval(() => {
      setProgress((prev) => {
        if (isPaused || showInsights || showComments) {
          return prev;
        }
        if (prev >= 100) {
          if (currentStoryIndex < stories.length - 1) {
            onStoryChange(currentStoryIndex + 1);
          } else {
            onClose();
          }
          return 0;
        }
        return prev + 100 / (storyDuration / 100);
      });
    }, 100);

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, [isPaused, showInsights, showComments, currentStoryIndex, stories.length, isOpen, storyDuration, onStoryChange, onClose]);

  const updateTimeRemaining = () => {
    if (!currentStory) return;

    const now = new Date();
    const expiresAt = new Date(currentStory.expiresAt);
    const timeLeft = expiresAt.getTime() - now.getTime();

    if (timeLeft <= 0) {
      setTimeRemaining("Expired");
      return;
    }

    const hours = Math.floor(timeLeft / (1000 * 60 * 60));
    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
      setTimeRemaining(`${hours}h ${minutes}m left`);
    } else {
      setTimeRemaining(`${minutes}m left`);
    }
  };

  const nextStory = () => {
    if (currentStoryIndex < stories.length - 1) {
      onStoryChange(currentStoryIndex + 1);
    } else {
      onClose();
    }
  };

  const previousStory = () => {
    if (currentStoryIndex > 0) {
      onStoryChange(currentStoryIndex - 1);
    }
  };

  const handleLike = async () => {
    try {
      const s = stories[currentStoryIndex];
      if (!s?.id) return;
      const res = await storiesAPI.likeStory(s.id);
      setHasLiked(Boolean(res?.data?.isLiked));
      try {
        window.dispatchEvent(
          new CustomEvent("storyLikeToggled", {
            detail: { storyId: s.id, isLiked: Boolean(res?.data?.isLiked) },
          }),
        );
      } catch {}
      toast({
        title: res?.data?.isLiked ? "Story liked!" : "Story unliked",
        description: res?.data?.isLiked
          ? "You liked this story"
          : "You unliked this story",
      });
    } catch (e) {
      setHasLiked((v) => !v);
    }
  };

  const handlePause = () => {
    const newPauseState = !isPaused;
    setIsPaused(newPauseState);
    if (videoRef.current) {
      if (newPauseState) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch(() => {});
      }
    }
  };

  const handleInsights = async () => {
    const willOpen = !showInsights;
    setShowInsights(willOpen);
    if (willOpen) setShowComments(false);
    if (!willOpen) {
      setIsPaused(false);
      return;
    }
    setIsPaused(true);
    // Fetch authoritative viewers when opening insights
    try {
      const s = stories[currentStoryIndex];
      if (s?.id) {
        const res = await storiesAPI.getStoryViewers(s.id);
        const list = Array.isArray(res?.data)
          ? (res.data as any[])
          : Array.isArray((res?.data as any)?.viewers)
          ? ((res?.data as any)?.viewers as any[])
          : [];
        if (res?.success && Array.isArray(list)) {
          const likesArr = Array.isArray((res?.data as any)?.likes)
            ? ((res?.data as any)?.likes as any[])
            : [];
          const likeIds = new Set(
            likesArr
              .map((l: any) => String(l?.user?._id || l?.user?.id || ""))
              .filter(Boolean),
          );
          const normalized = (list
            .map((v: any) => {
              const node = v?.user || v;
              const id = String(node?._id || node?.id || v?._id || v?.id || "");
              const rawUsername = node?.username || node?.handle || "";
              if (!id || !rawUsername) return null;
              const name =
                node?.name ||
                node?.fullName ||
                node?.displayName ||
                rawUsername;
              const username = rawUsername;
              const avatar =
                node?.avatar || node?.profileImage || "/placeholder.svg";
              const viewedAt = new Date(
                v?.viewedAt || v?.createdAt || Date.now(),
              );
              const isFollowing = Boolean(v?.isFollowing || node?.isFollowing);
              return {
                id,
                name,
                username,
                avatar,
                viewedAt,
                isFollowing,
              } as StoryViewer;
            })
            .filter(Boolean) as StoryViewer[]).filter(
            (viewer, idx, arr) =>
              arr.findIndex((x) => x.id === viewer.id) === idx,
          );
          setLikersSet(likeIds);
          setAuthoritativeViewers(normalized);
        }
      }
    } catch {}
  };

  const handleShowComments = async () => {
    const willOpen = !showComments;
    setShowComments(willOpen);
    if (willOpen) {
      setShowInsights(false);
      setIsPaused(true);
      // Fetch comments
      const s = stories[currentStoryIndex];
      if (s?.id) {
        setIsLoadingComments(true);
        try {
          const res = await storiesAPI.getStoryComments(s.id);
          if (res?.success && Array.isArray(res.data)) {
            setComments(
              res.data.map((c: any) => ({
                id: c.id,
                content: c.content,
                createdAt: new Date(c.createdAt),
                user: c.user
                  ? {
                      id: String(c.user.id || c.user._id),
                      name: c.user.name || c.user.username,
                      username: c.user.username,
                      avatar: c.user.avatar || null,
                    }
                  : null,
              })),
            );
          }
        } catch {
          toast({
            title: "Could not load comments",
            variant: "destructive",
          });
        } finally {
          setIsLoadingComments(false);
        }
        // Focus input after render
        setTimeout(() => commentInputRef.current?.focus(), 300);
      }
    } else {
      setIsPaused(false);
      // We don't need to call startProgress here as the interval is already running 
      // and checking the showComments/isPaused flags.
    }
  };

  const handlePostComment = async () => {
    const text = commentText.trim();
    if (!text) return;
    const s = stories[currentStoryIndex];
    if (!s?.id) return;

    setIsPostingComment(true);
    try {
      const res = await storiesAPI.commentStory(s.id, text);
      if (res?.success && res.data) {
        const newComment: StoryComment = {
          id: res.data.id,
          content: res.data.content,
          createdAt: new Date(res.data.createdAt),
          user: res.data.user
            ? {
                id: String(res.data.user.id || res.data.user._id),
                name: res.data.user.name || res.data.user.username,
                username: res.data.user.username,
                avatar: res.data.user.avatar || null,
              }
            : null,
        };
        setComments((prev) => [...prev, newComment]);
        setCommentText("");
        
        // Auto-close comment modal and unpause story after posting
        setShowComments(false);
        setIsPaused(false);
      }
    } catch {
      toast({
        title: "Failed to post comment",
        variant: "destructive",
      });
    } finally {
      setIsPostingComment(false);
    }
  };

  const handleDeleteStory = async () => {
    try {
      if (!currentStory?.id) return;

      const confirmDelete = window.confirm(
        "Are you sure you want to delete this story?",
      );
      if (!confirmDelete) return;

      const res = await storiesAPI.deleteStory(currentStory.id);

      if (!res.success) {
        throw new Error(res.error || "Delete failed");
      }

      toast({
        title: "Story Deleted",
        description: "Your story has been deleted successfully",
      });

      const updatedStories = stories.filter(
        (story) => story.id !== currentStory.id,
      );

      if (updatedStories.length > 0) {
        onStoryChange(Math.max(0, currentStoryIndex - 1));
      } else {
        onClose();
      }

      window.dispatchEvent(new CustomEvent("storyDeleted"));
    } catch (error) {
      toast({
        title: "Delete failed",
        description: "Unable to delete story",
        variant: "destructive",
      });
    }
  };

  const handleClose = () => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }
    onClose();
  };

  const formatTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffInMinutes = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60),
    );

    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;

    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  const getReactionEmoji = (type: string): string => {
    switch (type) {
      case "like": return "👍";
      case "heart": return "❤️";
      case "laugh": return "😂";
      case "wow": return "😮";
      case "sad": return "😢";
      case "angry": return "😠";
      default: return "👍";
    }
  };

  if (!currentStory) return null;

  const viewersRaw = (currentStory.viewers || []) as any[];
  const baseViewers: StoryViewer[] = (viewersRaw
    .map((v: any) => {
      const node = v?.user || v;
      const id = String(node?._id || node?.id || v?._id || v?.id || "");
      const rawUsername = node?.username || node?.handle || "";
      if (!id || !rawUsername) return null;
      const name =
        node?.name || node?.fullName || node?.displayName || rawUsername;
      const username = rawUsername;
      const avatar = node?.avatar || node?.profileImage || "/placeholder.svg";
      const viewedAt = new Date(v?.viewedAt || v?.createdAt || Date.now());
      const isFollowing = Boolean(v?.isFollowing || node?.isFollowing);
      return {
        id,
        name,
        username,
        avatar,
        viewedAt,
        isFollowing,
      } as StoryViewer;
    })
    .filter(Boolean) as StoryViewer[]).filter(
    (viewer, idx, arr) => arr.findIndex((x) => x.id === viewer.id) === idx,
  );
  const viewers: StoryViewer[] =
    authoritativeViewers.length > 0 ? authoritativeViewers : baseViewers;
  const reactions = (currentStory.reactions || []) as StoryReaction[];
  const viewsCount = viewers.length;

  const me = String((authUser as any)?.id || (authUser as any)?._id || "");
  const isOwner =
    me &&
    currentStory.user?.id &&
    me === String(currentStory.user.id);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="w-full h-full max-w-full max-h-full p-0 bg-black border-0 rounded-none">
        <DialogTitle className="sr-only">
          {currentStory.user?.name
            ? `${currentStory.user.name}'s story`
            : "Story viewer"}
        </DialogTitle>
        <DialogDescription className="sr-only">
          {`Posted ${formatTimeAgo(currentStory.createdAt)} • ${timeRemaining}`}
        </DialogDescription>
        <div className="relative w-full h-full flex flex-col">
          {/* Progress Bar */}
          <div className="absolute top-4 left-4 right-4 z-10">
            <div className="flex gap-1">
              {stories.map((_, index) => (
                <div
                  key={index}
                  className={`h-0.5 flex-1 rounded-full transition-all duration-100 ${
                    index === currentStoryIndex
                      ? index < currentStoryIndex
                        ? "bg-white"
                        : "bg-white/50"
                      : "bg-white/30"
                  }`}
                >
                  {index === currentStoryIndex && (
                    <div
                      className="h-full bg-white rounded-full transition-all duration-100"
                      style={{ width: `${progress}%` }}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Header */}
          <div className="absolute top-12 left-4 right-4 z-10">
            <div className="flex items-center justify-between text-white">
              <div className="flex items-center gap-3">
                <Avatar className="w-8 h-8 border-2 border-white/50">
                  <AvatarImage src={currentStory.user?.avatar} />
                  <AvatarFallback className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-bold">
                    {(currentStory.user?.name || currentStory.id).charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium text-sm">
                    {currentStory.user?.name || "Your Story"}
                  </div>
                  <div className="text-xs text-white/70">
                    {formatTimeAgo(currentStory.createdAt)}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1">
                {/* Mute/Unmute button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleMuteUnmute}
                  className="text-white hover:bg-white/20 p-2"
                  aria-label={isMuted ? "Unmute" : "Mute"}
                >
                  {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </Button>

                {/* Play/Pause button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handlePause}
                  className="text-white hover:bg-white/20 p-2"
                  aria-label={isPaused ? "Play" : "Pause"}
                >
                  {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                </Button>

                {/* Owner-only: Eye/Insights button */}
                {isOwner && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleInsights}
                    className="text-white hover:bg-white/20 p-2 flex items-center gap-1"
                    aria-label="View insights"
                  >
                    <Eye className="w-4 h-4" />
                    <span className="text-xs font-medium">{viewsCount}</span>
                  </Button>
                )}

                {/* Owner-only: Delete button */}
                {isOwner && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDeleteStory}
                    className="text-red-400 hover:bg-red-500/20 hover:text-red-300 p-2"
                    aria-label="Delete story"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Story Image/Video */}
          <div className="flex-1 relative flex items-center justify-center bg-black">
            {/* Image/Video container */}
            <div 
              className="relative w-full h-full flex items-center justify-center p-0"
            >
              {currentStory.image &&
                (/\.(mp4|webm|ogg|mov|avi)$/i.test(currentStory.image) ? (
                  <video
                    ref={videoRef}
                    src={currentStory.image}
                    autoPlay
                    muted={isMuted}
                    className="max-w-full max-h-full object-contain"
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePause();
                    }}
                  />
                ) : (
                  <img
                    src={currentStory.image}
                    alt="Story"
                    className="max-w-full max-h-full object-contain"
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePause();
                    }}
                  />
                ))}
            </div>

            {/* Touch areas for navigation (on top of media but below overlays) */}
            <div 
              className="absolute inset-x-0 top-20 bottom-24 flex z-10" 
              style={{ pointerEvents: showComments || showInsights ? "none" : "auto" }}
            >
              <div 
                className="w-1/3 h-full cursor-pointer" 
                onClick={(e) => {
                  e.stopPropagation();
                  previousStory();
                }} 
              />
              <div className="w-1/3 h-full pointer-events-none" /> {/* Middle ignored for hold */}
              <div 
                className="w-1/3 h-full cursor-pointer" 
                onClick={(e) => {
                  e.stopPropagation();
                  nextStory();
                }} 
              />
            </div>

            {/* Visible Navigation Arrows */}
            {!showComments && !showInsights && (
              <>
                {/* Previous Arrow */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    previousStory();
                  }}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 z-20 text-white/70 hover:text-white hover:scale-110 transition-all p-2 rounded-full hover:bg-white/10"
                  aria-label="Previous story"
                  disabled={showComments || showInsights}
                >
                  <ChevronLeft className="w-8 h-8" />
                </button>

                {/* Next Arrow */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    nextStory();
                  }}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 z-20 text-white/70 hover:text-white hover:scale-110 transition-all p-2 rounded-full hover:bg-white/10"
                  aria-label="Next story"
                  disabled={showComments || showInsights}
                >
                  <ChevronRight className="w-8 h-8" />
                </button>
              </>
            )}

            {/* Text Overlays */}
            {currentStory.textOverlays.map((overlay) => (
              <div
                key={overlay.id}
                className="absolute select-none z-20"
                style={{
                  left: overlay.x,
                  top: overlay.y,
                  fontSize: overlay.fontSize,
                  color: overlay.color,
                  fontFamily: overlay.fontFamily,
                  textShadow: "2px 2px 4px rgba(0,0,0,0.8)",
                }}
              >
                {overlay.text}
              </div>
            ))}

            {/* Stickers */}
            {currentStory.stickers.map((sticker) => (
              <div
                key={sticker.id}
                className="absolute select-none z-20"
                style={{
                  left: sticker.x,
                  top: sticker.y,
                  fontSize: sticker.size,
                }}
              >
                {sticker.emoji}
              </div>
            ))}
          </div>

          {/* Bottom Actions */}
          <div className="absolute bottom-4 left-4 right-4 z-10">
            <div className="flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                {/* Like button */}
                <button
                  onClick={handleLike}
                  className={`flex items-center gap-2 px-3 py-2 rounded-full transition-all ${
                    hasLiked
                      ? "bg-red-500 hover:bg-red-600 scale-105"
                      : "bg-black/30 hover:bg-black/50"
                  }`}
                >
                  <Heart
                    className={`w-4 h-4 ${hasLiked ? "fill-current" : ""}`}
                  />
                </button>

                {/* Comment button — visible to everyone */}
                <button
                  onClick={handleShowComments}
                  className={`flex items-center gap-2 px-3 py-2 rounded-full transition-all ${
                    showComments
                      ? "bg-blue-500 hover:bg-blue-600"
                      : "bg-black/30 hover:bg-black/50"
                  }`}
                  aria-label="View comments"
                >
                  <MessageCircle className="w-4 h-4" />
                  {comments.length > 0 && (
                    <span className="text-sm font-medium">{comments.length}</span>
                  )}
                </button>

                {/* Forward/Share button */}
                <button
                  onClick={() => {
                    toast({
                      title: "Share Story",
                      description: "Sharing this story...",
                    });
                  }}
                  className="flex items-center gap-2 px-3 py-2 bg-black/30 hover:bg-black/50 rounded-full transition-colors"
                  aria-label="Share story"
                >
                  <Send className="w-4 h-4" />
                </button>

                {/* Owner: Eye/viewer count at bottom too (quick glance) */}
                {isOwner && (
                  <button
                    onClick={handleInsights}
                    className="flex items-center gap-2 px-3 py-2 bg-black/30 hover:bg-black/50 rounded-full transition-colors"
                    aria-label="Show viewers"
                  >
                    <Eye className="w-4 h-4" />
                    <span className="text-sm">{viewsCount}</span>
                  </button>
                )}
              </div>

              <div className="text-xs text-white/70">
                {stories.length > 1 &&
                  `${currentStoryIndex + 1} of ${stories.length}`}
              </div>
            </div>
          </div>

          {/* ──────────────── COMMENTS PANEL ──────────────── */}
          {showComments && (
            <div className="absolute inset-0 flex flex-col bg-black/90 z-20">
              {/* Panel header */}
              <div className="flex items-center justify-between p-4 border-b border-white/10">
                <h2 className="text-white font-semibold text-lg flex items-center gap-2">
                  <MessageCircle className="w-5 h-5" />
                  Comments
                  {comments.length > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {comments.length}
                    </Badge>
                  )}
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleShowComments}
                  className="text-white hover:bg-white/20"
                >
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </div>

              {/* Story thumbnail strip */}
              <div className="flex items-center gap-3 px-4 py-3 bg-white/5 border-b border-white/10">
                <img
                  src={currentStory.image}
                  alt="Story"
                  className="w-12 h-12 rounded-lg object-cover opacity-80"
                />
                <div className="text-white">
                  <div className="text-sm font-medium">
                    {currentStory.user?.name || "Story"}
                  </div>
                  <div className="text-xs text-white/60">
                    {formatTimeAgo(currentStory.createdAt)}
                  </div>
                </div>
              </div>

              {/* Comments list */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {isLoadingComments ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="w-6 h-6 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  </div>
                ) : comments.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-white/50">
                    <MessageCircle className="w-12 h-12 mb-3 opacity-40" />
                    <p className="text-sm">No comments yet.</p>
                    <p className="text-xs mt-1">Be the first to comment!</p>
                  </div>
                ) : (
                  comments.map((comment) => (
                    <div key={comment.id} className="flex items-start gap-3">
                      <Avatar className="w-8 h-8 flex-shrink-0">
                        <AvatarImage src={comment.user?.avatar || ""} />
                        <AvatarFallback className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs">
                          {(comment.user?.name || "?").charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="bg-white/10 rounded-2xl rounded-tl-sm px-3 py-2">
                          <span className="text-white font-medium text-xs mr-2">
                            {comment.user?.name || "Unknown"}
                          </span>
                          <span className="text-white/80 text-sm break-words">
                            {comment.content}
                          </span>
                        </div>
                        <span className="text-white/40 text-xs mt-1 ml-2">
                          {formatTimeAgo(comment.createdAt)}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Comment input */}
              <div className="p-4 border-t border-white/10 bg-black/60">
                <div className="flex items-center gap-2">
                  <Avatar className="w-8 h-8 flex-shrink-0">
                    <AvatarImage src={(authUser as any)?.avatar} />
                    <AvatarFallback className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs">
                      {((authUser as any)?.name || "?").charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 flex items-center bg-white/10 rounded-full px-4 py-2 gap-2">
                    <input
                      ref={commentInputRef}
                      type="text"
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handlePostComment();
                        }
                      }}
                      placeholder={isOwner ? "View comments..." : "Add a comment…"}
                      readOnly={isOwner}
                      className={`flex-1 bg-transparent text-white placeholder-white/40 text-sm outline-none ${isOwner ? 'cursor-default' : ''}`}
                    />
                    {!isOwner && (
                      <button
                        onClick={handlePostComment}
                        disabled={!commentText.trim() || isPostingComment}
                        className="text-white/60 hover:text-white disabled:opacity-30 transition-colors"
                        aria-label="Post comment"
                      >
                        {isPostingComment ? (
                          <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                        ) : (
                          <Send className="w-4 h-4" />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ──────────────── STORY INSIGHTS (owner-only) ──────────────── */}
          {showInsights && isOwner && (
            <div className="absolute inset-0 bg-black/95 z-20 overflow-y-auto">
              <div className="p-4">
                {/* Insights Header */}
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    Story Insights
                  </h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleInsights}
                    className="text-white hover:bg-white/20"
                    aria-label="Hide insights"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                </div>

                {/* Story Info */}
                <div className="bg-white/10 rounded-lg p-4 mb-6">
                  <div className="flex items-center gap-3 mb-3">
                    <img
                      src={currentStory.image}
                      alt="Story"
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                    <div className="text-white">
                      <div className="font-medium">Story Details</div>
                      <div className="text-sm text-white/70 flex items-center gap-2">
                        <Calendar className="w-3 h-3" />
                        {formatTimeAgo(currentStory.createdAt)}
                      </div>
                      <div className="text-xs text-white/50 mt-1">
                        <Clock className="w-3 h-3 inline mr-1" />
                        {timeRemaining}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 text-center border-t border-white/10 pt-3">
                    <div className="text-white">
                      <div className="text-2xl font-bold text-blue-400">{viewsCount}</div>
                      <div className="text-xs text-white/70 mt-1 flex items-center justify-center gap-1">
                        <Eye className="w-3 h-3" /> Views
                      </div>
                    </div>
                    <div className="text-white">
                      <div className="text-2xl font-bold text-red-400">
                        {reactions.length || likersSet.size}
                      </div>
                      <div className="text-xs text-white/70 mt-1 flex items-center justify-center gap-1">
                        <Heart className="w-3 h-3" /> Likes
                      </div>
                    </div>
                    <div className="text-white">
                      <div className="text-2xl font-bold text-green-400">
                        {viewers.filter((v) => v.isFollowing).length}
                      </div>
                      <div className="text-xs text-white/70 mt-1 flex items-center justify-center gap-1">
                        <Users className="w-3 h-3" /> Followers
                      </div>
                    </div>
                  </div>
                </div>

                {/* Viewers Section */}
                {viewers.length > 0 ? (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                      <Users className="w-5 h-5 text-blue-400" />
                      Viewers ({viewers.length})
                    </h3>
                    <div className="space-y-2">
                      {viewers.map((viewer) => (
                        <div
                          key={viewer.id}
                          className="flex items-center justify-between bg-white/10 rounded-lg p-3"
                        >
                          <div className="flex items-center gap-3">
                            <Avatar className="w-10 h-10">
                              <AvatarImage src={viewer.avatar} />
                              <AvatarFallback className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                                {viewer.name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="text-white">
                              <div className="font-medium text-sm">{viewer.name}</div>
                              <div className="text-xs text-white/60">
                                @{viewer.username}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {viewer.isFollowing && (
                              <Badge variant="secondary" className="text-xs">
                                Following
                              </Badge>
                            )}
                            {likersSet.has(viewer.id) && (
                              <Heart className="w-4 h-4 text-red-500 fill-red-500" />
                            )}
                            <span className="text-xs text-white/50">
                              {formatTimeAgo(viewer.viewedAt)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-10 text-white/40">
                    <Eye className="w-12 h-12 mb-3 opacity-40" />
                    <p className="text-sm">No viewers yet</p>
                    <p className="text-xs mt-1">Share your story to get views!</p>
                  </div>
                )}

                {/* Reactions Section */}
                {reactions.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                      <Heart className="w-5 h-5 text-red-400" />
                      Reactions ({reactions.length})
                    </h3>
                    <div className="space-y-2">
                      {reactions.map((reaction) => (
                        <div
                          key={reaction.id}
                          className="flex items-center justify-between bg-white/10 rounded-lg p-3"
                        >
                          <div className="flex items-center gap-3">
                            <div className="text-2xl">
                              {getReactionEmoji(reaction.type)}
                            </div>
                            <Avatar className="w-10 h-10">
                              <AvatarImage src={reaction.user.avatar} />
                              <AvatarFallback className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                                {reaction.user.name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="text-white">
                              <div className="font-medium text-sm">
                                {reaction.user.name}
                              </div>
                              <div className="text-xs text-white/60">
                                @{reaction.user.username}
                              </div>
                            </div>
                          </div>
                          <span className="text-xs text-white/50">
                            {formatTimeAgo(new Date(reaction.timestamp))}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3 pt-2">
                  <Button
                    variant="outline"
                    className="flex-1 border-white/30 text-white hover:bg-white/20"
                    onClick={() => {
                      toast({
                        title: "Share Story",
                        description: "Sharing coming soon",
                      });
                    }}
                  >
                    <Share2 className="w-4 h-4 mr-2" />
                    Share
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 border-red-500/50 text-red-400 hover:bg-red-500/20"
                    onClick={handleDeleteStory}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
