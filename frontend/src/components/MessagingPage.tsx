import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Search,
  MoreVertical,
  Smile,
  Phone,
  Video as VideoCall,
  MessageCircle,
  Mic,
  Paperclip,
  Copy,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { useChat } from "@/hooks/useChat";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import {
  usersAPI,
  UserProfile,
  storiesAPI,
  arcadeAPI,
  chatAPI,
} from "@/services/api";
import { getApiBaseUrl } from "@/config/env";
import { StoryViewer } from "./StoryViewer";
import { useStorySeen } from "@/hooks/useStorySeen";
import { ReportModal } from "./ReportModal";

export const MessagingPage = () => {
  const API_BASE_URL = getApiBaseUrl();
  const { user: authUser } = useAuth();
  const {
    chats,
    activeChat,
    messages,
    isLoading,
    selectChat,
    sendMessage,
    deleteMessage,
    createChat,
  } = useChat("trees") as any; // Only show Trees chats (not arcade chats)
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [showChatList, setShowChatList] = useState(true);
  const [isOpeningChat, setIsOpeningChat] = useState(false);
  const [followingUsers, setFollowingUsers] = useState<UserProfile[]>([]);
  const [storyOpen, setStoryOpen] = useState(false);
  const [storyItems, setStoryItems] = useState<any[]>([]);
  const [storyIndex, setStoryIndex] = useState(0);
  const [selectedStoryUserId, setSelectedStoryUserId] = useState<string | null>(
    null
  );
  const { hasSeen, markSeen } = useStorySeen();
  const isMobile = useIsMobile();
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const recognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingIntervalRef = useRef<number | null>(null);
  const recordingTimeoutRef = useRef<number | null>(null);
  const voiceTranscriptRef = useRef("");
  const [blockedByPeer, setBlockedByPeer] = useState(false);
  const [iBlocked, setIBlocked] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [userToReport, setUserToReport] = useState<any>(null);
  const [isListening, setIsListening] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [messageReactions, setMessageReactions] = useState<Record<string, string>>({});
  const [audioPlayback, setAudioPlayback] = useState<Record<string, { playing: boolean; duration: number; currentTime: number }>>({});
  const [openMenuMessageId, setOpenMenuMessageId] = useState<string | null>(null);
  const audioRefsMap = useRef<Record<string, HTMLAudioElement>>({});
  const VOICE_LIMIT_SECONDS = 20;

  const scrollToBottom = (behavior: ScrollBehavior = "auto") => {
    requestAnimationFrame(() => {
      bottomRef.current?.scrollIntoView({ behavior, block: "end" });
    });
  };

  const toggleAudioPlayback = (messageId: string, audioUrl: string) => {
    const audio = audioRefsMap.current[messageId];
    if (!audio) return;

    if (audioPlayback[messageId]?.playing) {
      audio.pause();
      setAudioPlayback(prev => ({
        ...prev,
        [messageId]: { ...prev[messageId], playing: false }
      }));
    } else {
      audio.play();
      setAudioPlayback(prev => ({
        ...prev,
        [messageId]: { ...prev[messageId], playing: true }
      }));
    }
  };

  const handleAudioLoadedMetadata = (messageId: string, duration: number) => {
    setAudioPlayback(prev => ({
      ...prev,
      [messageId]: {
        ...prev[messageId],
        duration: duration || 3
      }
    }));
  };

  const handleAudioTimeUpdate = (messageId: string, currentTime: number) => {
    setAudioPlayback(prev => ({
      ...prev,
      [messageId]: {
        ...prev[messageId],
        currentTime
      }
    }));
  };

  const handleAudioEnded = (messageId: string) => {
    setAudioPlayback(prev => ({
      ...prev,
      [messageId]: { ...prev[messageId], playing: false, currentTime: 0 }
    }));
  };

  useEffect(() => {
    scrollToBottom("auto");
  }, [messages?.length]);

  useEffect(() => {
    return () => {
      try {
        recognitionRef.current?.stop?.();
      } catch {
        // ignore cleanup errors
      }
      if (recordingIntervalRef.current) {
        window.clearInterval(recordingIntervalRef.current);
      }
      if (recordingTimeoutRef.current) {
        window.clearTimeout(recordingTimeoutRef.current);
      }
    };
  }, []);

  // Load following users for search suggestions (followed-only)
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await usersAPI.getCurrentUserFollowing();
        if (mounted && res.success && Array.isArray(res.data)) {
          setFollowingUsers(res.data as UserProfile[]);
        }
      } catch (e) {
        // noop; toast handled in api.ts
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Deep-link: open/create chat with a user if requested (from profile Message button)
  useEffect(() => {
    const startWith = localStorage.getItem("startChatWithUserId");
    if (!startWith) return;
    const targetUserId = String(startWith);
    const existing = (chats || []).find((c: any) =>
      (c.participants || []).some((p: any) => (p._id || p.id) === targetUserId)
    );
    const proceed = async () => {
      try {
        if (existing) {
          const cid = existing.id || existing._id;
          if (cid) await selectChat(String(cid));
        } else {
          const created = await createChat([targetUserId]);
          const cid = created?.id || created?._id;
          if (cid) await selectChat(String(cid));
        }
        // Pre-check relationship
        try {
          const rel = await arcadeAPI.getRelationship(targetUserId);
          if (rel?.success && rel.data) {
            setIBlocked(Boolean(rel.data.iBlocked));
            setBlockedByPeer(Boolean(rel.data.blockedByPeer));
          }
        } catch {}
        if (isMobile) setShowChatList(false);
      } finally {
        localStorage.removeItem("startChatWithUserId");
      }
    };
    proceed();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chats?.length]);

  // Load reactions from localStorage when chat changes
  useEffect(() => {
    if (activeChat) {
      const chatId = String(activeChat.id || activeChat._id);
      const storageKey = `reactions_${chatId}`;
      const savedReactions = JSON.parse(localStorage.getItem(storageKey) || '{}');
      setMessageReactions(savedReactions);
    }
  }, [activeChat?.id || activeChat?._id]);

  const validateMessage = (message: string, type: "text" | "audio" = "text"): boolean => {
    if (!message.trim()) {
      toast({ title: "Message cannot be empty", variant: "destructive" });
      return false;
    }
    // Audio messages (base64 data URLs) can be much longer
    const maxLength = type === "audio" ? 50000000 : 1000;
    if (message.length > maxLength) {
      toast({
        title: "Message too long",
        description: type === "audio" ? "Audio file too large" : "Max 1000 characters",
        variant: "destructive",
      });
      return false;
    }
    return true;
  };

  const sendTextContent = async (content: string, type: "text" | "audio" = "text") => {
    if (!validateMessage(content, type)) return false;
    if (!activeChat) {
      toast({ title: "Select a chat first" });
      return false;
    }
    if (iBlocked) {
      toast({
        title: "Blocked",
        description: "Unblock to send messages.",
        variant: "destructive",
      });
      return false;
    }

    if (blockedByPeer) {
      toast({
        title: "Cannot Send",
        description: "You can't send because this user has blocked you.",
        variant: "destructive",
      });
      return false;
    }

    setIsSending(true);
    try {
      const id = (activeChat as any).id || (activeChat as any)._id;
      const res = await sendMessage(String(id), content.trim(), type);
      if (res) {
        setNewMessage("");
        scrollToBottom("auto");
        return true;
      } else {
        toast({ title: "Failed to send message", variant: "destructive" });
        return false;
      }
    } catch {
      toast({ title: "Failed to send message", variant: "destructive" });
      return false;
    } finally {
      setIsSending(false);
    }
  };

  const handleSendMessage = async () => {
    await sendTextContent(newMessage);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const insertEmoji = (emoji: string) => {
    setNewMessage((prev) => `${prev}${emoji}`);
  };

  const toggleVoiceInput = async () => {
    if (isListening && mediaRecorderRef.current) {
      // Stop recording
      mediaRecorderRef.current.stop();
      setIsListening(false);
      if (recordingIntervalRef.current) {
        window.clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }
      return;
    }

    // Start recording
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const audioChunks: Blob[] = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: "audio/webm" });

        // Convert blob to data URL for sending
        const reader = new FileReader();
        reader.onloadend = async () => {
          const audioUrl = reader.result as string;
          await sendTextContent(audioUrl, "audio");
          stream.getTracks().forEach((track) => track.stop());
        };
        reader.readAsDataURL(audioBlob);

        setIsListening(false);
        setRecordingSeconds(0);
      };

      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;
      setIsListening(true);
      setRecordingSeconds(0);

      // Timer for recording duration
      recordingIntervalRef.current = window.setInterval(() => {
        setRecordingSeconds((prev) => {
          if (prev >= VOICE_LIMIT_SECONDS) {
            mediaRecorder.stop();
            return VOICE_LIMIT_SECONDS;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (error) {
      toast({
        title: "Microphone error",
        description: "Could not access microphone. Please check permissions.",
        variant: "destructive",
      });
    }
  };

  const handleAttachmentChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!activeChat) {
      toast({ title: "Select a chat first" });
      e.target.value = "";
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Maximum file size is 10MB.",
        variant: "destructive",
      });
      e.target.value = "";
      return;
    }

    setIsSending(true);
    try {
      const id = (activeChat as any).id || (activeChat as any)._id;
      const isImage = file.type.startsWith("image/");
      let payload = `${isImage ? "📷" : "📎"} ${file.name}`;

      if (isImage) {
        const uploadFormData = new FormData();
        uploadFormData.append("image", file);
        const uploadResponse = await fetch(`${API_BASE_URL}/uploads/image`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: uploadFormData,
        });

        if (!uploadResponse.ok) {
          throw new Error("Image upload failed");
        }

        const uploadResult = await uploadResponse.json();
        payload = uploadResult?.data?.url || payload;
      }

      const sent = await sendMessage(
        String(id),
        payload,
        isImage ? "image" : "file"
      );

      if (!sent) {
        toast({
          title: "Attachment failed",
          description: "Could not send attachment.",
          variant: "destructive",
        });
      }
      scrollToBottom("auto");
    } catch {
      toast({
        title: "Attachment failed",
        description: "Could not send attachment.",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
      e.target.value = "";
    }
  };

  const setReaction = (messageId: string, emoji: string) => {
    // Update local state immediately for UI feedback
    setMessageReactions((prev) => ({ ...prev, [messageId]: emoji }));

    // Save to localStorage
    if (activeChat) {
      const chatId = String(activeChat.id || activeChat._id);
      const storageKey = `reactions_${chatId}`;
      const reactions = JSON.parse(localStorage.getItem(storageKey) || '{}');
      reactions[messageId] = emoji;
      localStorage.setItem(storageKey, JSON.stringify(reactions));
    }
  };

  const unsendMessage = async (messageId: string) => {
    if (!activeChat) return;
    
    const chatId = String(activeChat.id || activeChat._id);
    await deleteMessage(chatId, messageId);
    setOpenMenuMessageId(null);
  };

  const copyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
    toast({
      title: "Copied",
      description: "Message copied to clipboard",
    });
  };

  const meId = (authUser as any)?.id || (authUser as any)?._id;

  const filteredChats = useMemo(() => {
    const q = searchQuery.toLowerCase();
    const base = (chats || []).filter((c: any) => {
      const others = (c.participants || []).filter(
        (p: any) => String(p._id || p.id || p.userId || "") !== String(meId || "")
      );
      const other = others[0] || {};
      const name = other.fullName || other.name || other.username || "";
      return name.toLowerCase().includes(q);
    });

    const byUser = new Map<string, any>();

    const toTime = (chat: any) => {
      const ts =
        chat?.lastActivity ||
        chat?.updatedAt ||
        chat?.lastMessage?.createdAt ||
        chat?.createdAt ||
        0;
      const t = new Date(ts).getTime();
      return Number.isNaN(t) ? 0 : t;
    };

    for (const chat of base) {
      const other = (chat?.participants || []).find(
        (p: any) => String(p?._id || p?.id || p?.userId || "") !== String(meId || "")
      );
      const otherId = String(other?._id || other?.id || other?.userId || "");
      const key = otherId || String(chat?.id || chat?._id || "");
      const existing = byUser.get(key);

      if (!existing || toTime(chat) > toTime(existing)) {
        byUser.set(key, chat);
      }
    }

    return Array.from(byUser.values()).sort((a: any, b: any) => toTime(b) - toTime(a));
  }, [chats, searchQuery, meId]);

  const followedSearchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [] as UserProfile[];
    return (followingUsers || []).filter((u) => {
      const name = (u.fullName || u.username || "").toLowerCase();
      return name.includes(q);
    });
  }, [followingUsers, searchQuery]);

  // Optionally hide users who don't allow messages from anyone
  const followedSearchVisible = useMemo(() => {
    return (followedSearchResults || []).filter(
      (u: any) => (u?.privacy?.allowMessagesFrom ?? "everyone") !== "none"
    );
  }, [followedSearchResults]);
  const hiddenDueToPrivacy = Math.max(
    0,
    (followedSearchResults?.length || 0) - (followedSearchVisible?.length || 0)
  );

  const handleChatSelect = async (chat: any) => {
    const id = chat.id || chat._id;
    if (!id) return;
    setIsOpeningChat(true);
    try {
      const opened = await selectChat(String(id));
      if (isMobile && opened !== false) {
        setShowChatList(false);
      }
    } finally {
      setIsOpeningChat(false);
    }
  };

  const getOtherParticipant = (chatLike: any) => {
    const others = (chatLike?.participants || []).filter(
      (p: any) => String(p._id || p.id || p.userId || "") !== String(meId || "")
    );
    return others[0] || {};
  };

  // Compute display metadata for the other participant, with fallbacks for deleted users
  const getOtherDisplay = (chatLike: any) => {
    const other = getOtherParticipant(chatLike) as any;
    const missing = !other || (!other.username && !other.fullName);
    const name = missing
      ? "Treesh User"
      : other.fullName || other.username || "Treesh User";
    const avatar = missing
      ? "/placeholder.svg"
      : other.avatar || "/placeholder.svg";
    const isOnline = missing ? false : Boolean(other.isOnline);
    const lastSeen = missing ? undefined : other.lastSeen;
    const privacy = missing ? {} : other.privacy || {};
    const id = missing ? undefined : other._id || other.id || undefined;
    return { other, missing, name, avatar, isOnline, lastSeen, privacy, id };
  };

  const extractPhone = (chatLike: any): string | null => {
    const other = getOtherParticipant(chatLike) as any;
    const raw =
      other?.phone ||
      other?.mobile ||
      other?.mobileNumber ||
      other?.contactNumber ||
      "";
    const cleaned = String(raw).replace(/[^\d+]/g, "");
    return cleaned.length >= 7 ? cleaned : null;
  };

  const openMeetCall = (
    chatLike: any,
    mode: "audio" | "video" = "video"
  ) => {
    const chatId = String(chatLike?.id || chatLike?._id || "chat");
    const other = getOtherDisplay(chatLike);
    const roomSeed = String(other.id || other.name || "user")
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "-");
    const room = `treesh-${mode}-${chatId}-${roomSeed}`;
    const hash =
      mode === "audio"
        ? "#config.startWithVideoMuted=true"
        : "#config.startWithVideoMuted=false";
    const url = `https://meet.jit.si/${room}${hash}`;
    const win = window.open(url, "_blank", "noopener,noreferrer");
    if (!win) {
      toast({
        title: "Popup blocked",
        description: "Please allow popups to start the call.",
        variant: "destructive",
      });
    }
  };

  const handleAudioCall = (chatLike: any) => {
    const phone = extractPhone(chatLike);
    if (phone) {
      window.location.href = `tel:${phone}`;
      return;
    }
    toast({ title: "Starting audio call" });
    openMeetCall(chatLike, "audio");
  };

  const handleVideoCall = (chatLike: any) => {
    toast({ title: "Starting video call" });
    openMeetCall(chatLike, "video");
  };

  // Update relationship block state when active chat changes
  useEffect(() => {
    const run = async () => {
      try {
        setBlockedByPeer(false);
        setIBlocked(false);
        const other = getOtherParticipant(activeChat);
        const uid = String((other as any)?._id || (other as any)?.id || "");
        if (!uid) return;
        const rel = await arcadeAPI.getRelationship(uid);
        if (rel?.success && (rel as any).data) {
          setIBlocked(Boolean((rel as any).data.iBlocked));
          setBlockedByPeer(Boolean((rel as any).data.blockedByPeer));
        }
      } catch {}
    };
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeChat && ((activeChat as any).id || (activeChat as any)._id)]);

  const fetchUserStories = async (userId: string) => {
    try {
      // Follow-gate: ensure current user follows them before viewing
      try {
        const prof = await usersAPI.getUserProfile(userId);
        const me = String((authUser as any)?.id || (authUser as any)?._id);
        if (
          prof?.success &&
          prof.data &&
          String(prof.data.id) !== me &&
          prof.data.isFollowing === false
        ) {
          toast({
            title: "Follow to view stories",
            description: "You need to follow this user to view their stories.",
          });
          return;
        }
      } catch {}
      const res = await storiesAPI.getUserStories(userId);
      if (res.success && Array.isArray(res.data) && res.data.length > 0) {
        setStoryItems(
          res.data.map((s: any) => ({
            id: String(s.id || s._id),
            image: s.media?.[0]?.url || "/placeholder.svg",
            textOverlays: [],
            stickers: [],
            createdAt: new Date(s.createdAt || Date.now()),
            expiresAt: new Date(
              new Date(s.createdAt || Date.now()).getTime() +
                24 * 60 * 60 * 1000
            ),
            user: {
              id: userId,
              name: s.author?.fullName || s.author?.username || "User",
              username: s.author?.username || "user",
              avatar: s.author?.avatar || "/placeholder.svg",
            },
          }))
        );
        setStoryIndex(0);
        setSelectedStoryUserId(String(userId));
        setStoryOpen(true);
      } else {
        toast({ title: "No story", description: "User has no active story" });
      }
    } catch {
      toast({ title: "Failed to load story", variant: "destructive" });
    }
  };

  // useStorySeen handles persistence and cross-component sync

  return (
    <div className="w-full h-[calc(100dvh-88px)] min-h-0 flex flex-col">
      {previewImageUrl && (
        <div
          className="fixed inset-0 z-[70] bg-black/80 flex items-center justify-center p-4"
          onClick={() => setPreviewImageUrl(null)}
        >
          <img
            src={previewImageUrl}
            alt="Message preview"
            className="max-h-[90vh] max-w-[90vw] rounded-lg shadow-2xl object-contain"
          />
        </div>
      )}
      {/* Story Viewer Modal */}
      <StoryViewer
        isOpen={storyOpen}
        onClose={() => {
          setStoryOpen(false);
          if (selectedStoryUserId) {
            markSeen(selectedStoryUserId);
            // force rerender to update rings
            setSelectedStoryUserId((prev) => (prev ? `${prev}` : prev));
          }
        }}
        stories={storyItems as any}
        currentStoryIndex={storyIndex}
        onStoryChange={(i) => setStoryIndex(i)}
      />

      <div className="flex-1 flex px-3 sm:px-4 md:px-6 py-3 min-h-0 overflow-hidden">
        <div className="flex w-full h-full bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
          {/* Chat List */}
          <div
            className={`${
              isMobile ? (showChatList ? "w-full" : "hidden") : "w-80"
            } bg-card border-r border-border flex flex-col min-h-0 overflow-hidden`}
          >
            <div className="px-4 pt-3 pb-3">
              <h2 className="text-2xl font-bold text-foreground">Messages</h2>
            </div>
            <div className="px-3 py-2 border-b border-border">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-9 text-sm bg-muted/50 border border-border/50"
                  ref={searchInputRef}
                />
              </div>
              {searchQuery.trim() && (
                <div className="mt-3">
                  <p className="text-xs text-muted-foreground mb-1">Followed users</p>
                  <div className="max-h-56 overflow-auto rounded-md border border-border">
                    {(followedSearchVisible.slice(0, 8) as UserProfile[]).map(
                      (u) => {
                        const uid = (u as any).id || (u as any)._id;
                        return (
                          <div
                            key={String(uid)}
                            className="flex items-center gap-3 p-2 hover:bg-muted/60 cursor-pointer"
                            onClick={async () => {
                              // open or create chat with this user
                              const existing = (chats || []).find((c: any) =>
                                (c.participants || []).some(
                                  (p: any) => (p._id || p.id) === String(uid)
                                )
                              );
                              if (existing) {
                                const cid = existing.id || existing._id;
                                if (cid) {
                                  const opened = await selectChat(String(cid));
                                  if (opened !== false && isMobile)
                                    setShowChatList(false);
                                }
                              } else {
                                const created = await createChat([String(uid)]);
                                const cid = created?.id || created?._id;
                                if (cid) {
                                  const opened = await selectChat(String(cid));
                                  if (opened !== false && isMobile)
                                    setShowChatList(false);
                                }
                              }
                              setSearchQuery("");
                            }}
                          >
                            <Avatar className="w-8 h-8">
                              <AvatarImage
                                src={u.avatar || "/placeholder.svg"}
                              />
                              <AvatarFallback>
                                {(u.fullName || u.username || "U").charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-foreground truncate">
                                {u.fullName || u.username}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">
                                @{u.username}
                              </p>
                            </div>
                          </div>
                        );
                      }
                    )}
                    {followedSearchVisible.length === 0 && (
                      <div className="p-3 text-sm text-muted-foreground">
                        No followed users match
                      </div>
                    )}
                    {hiddenDueToPrivacy > 0 && (
                      <div className="px-3 pb-3 text-xs text-muted-foreground/80">
                        {hiddenDueToPrivacy} user(s) hidden due to privacy
                        settings
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            {/* Quick-select stories / online follows */}
            {!searchQuery.trim() && followingUsers.length > 0 && (
              <div className="px-3 py-2.5 border-b border-border bg-background/50">
                <ScrollArea className="w-full whitespace-nowrap">
                  <div className="flex space-x-3 pb-1">
                    {followingUsers.slice(0, 10).map((u) => {
                      const uid = (u as any).id || (u as any)._id;
                      return (
                        <div
                          key={String(uid)}
                          className="flex flex-col items-center space-y-1 cursor-pointer w-14"
                          onClick={async () => {
                            const cidOrWait = (chats || []).find((c: any) =>
                              (c.participants || []).some(
                                (p: any) => (p._id || p.id) === String(uid)
                              )
                            );
                            if (cidOrWait) {
                              const cid = cidOrWait.id || cidOrWait._id;
                              if (cid) await selectChat(String(cid));
                            } else {
                              const created = await createChat([String(uid)]);
                              const cid = created?.id || created?._id;
                              if (cid) await selectChat(String(cid));
                            }
                            if (isMobile) setShowChatList(false);
                          }}
                        >
                          <Avatar className="w-11 h-11 ring-2 ring-primary/20 ring-offset-2 hover:ring-primary/40 transition-all">
                            <AvatarImage src={u.avatar || "/placeholder.svg"} />
                            <AvatarFallback>
                              {(u.fullName || u.username || "U").charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-[10px] text-muted-foreground truncate w-full text-center">
                            {u.fullName?.split(" ")[0] || u.username}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </div>
            )}

            <ScrollArea className="flex-1 min-h-0">
              <div className="px-1 py-2 space-y-1">
                {isLoading && (
                  <div className="space-y-3">
                    {[...Array(6)].map((_, i) => (
                      <div key={i} className="flex items-center space-x-3 p-2">
                        <Skeleton className="h-12 w-12 rounded-full" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-1/2" />
                          <Skeleton className="h-3 w-2/3" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {!isLoading &&
                  filteredChats.length === 0 &&
                  !searchQuery.trim() && (
                    <div className="flex flex-col items-center justify-center p-6 text-center">
                      <MessageCircle className="w-10 h-10 text-muted-foreground/25 mb-2" />
                      <p className="text-sm font-medium text-muted-foreground">
                        Your conversations will appear here
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Start chatting with people you follow below
                      </p>
                    </div>
                  )}

                {!isLoading &&
                  (filteredChats || []).map((chat: any) => {
                    const d = getOtherDisplay(chat);
                    const chatId = chat.id || chat._id;
                    const lastType =
                      chat?.lastMessage?.type || chat?.lastMessage?.messageType;
                    const rawContent = chat.lastMessage?.content || "Say hello";
                    const isOwnMessage = chat.lastMessage?.senderId === meId;
                    
                    let lastPreview = "Say hello";
                    if (lastType === "image") {
                      lastPreview = isOwnMessage ? "You: 🖼️ Photo" : "🖼️ Photo";
                    } else if (lastType === "audio") {
                      lastPreview = isOwnMessage ? "You: 🎤 Voice message" : "🎤 Voice message";
                    } else if (lastType === "file") {
                      lastPreview = isOwnMessage ? "You: 📎 File" : "📎 File";
                    } else if (typeof rawContent === "string" && rawContent.startsWith("data:audio")) {
                      lastPreview = isOwnMessage ? "You: 🎤 Voice message" : "🎤 Voice message";
                    } else {
                      const truncatedText =
                        rawContent.length > 28
                          ? rawContent.substring(0, 28) + "..."
                          : rawContent;
                      lastPreview = isOwnMessage ? `You: ${truncatedText}` : truncatedText;
                    }
                    
                    const isActive =
                      activeChat &&
                      ((activeChat as any)._id || (activeChat as any).id) ===
                        chatId;
                    return (
                      <div
                        key={String(chatId)}
                        className={`px-2 py-2.5 mx-1 rounded-lg cursor-pointer transition-colors ${
                          isActive
                            ? "bg-primary/15 border border-primary/25"
                            : "hover:bg-muted/50"
                        }`}
                        onClick={() => handleChatSelect(chat)}
                      >
                        <div className="flex items-center space-x-3">
                          <div className="relative">
                            <Avatar
                              className={`w-12 h-12 ring-2 ring-transparent ${
                                chat?.participants?.some(
                                  (p: any) => p?.hasActiveStory
                                )
                                  ? hasSeen(String(d.id || ""))
                                    ? "ring-gray-400"
                                    : "ring-red-500"
                                  : ""
                              }`}
                            >
                              <AvatarImage src={d.avatar} />
                              <AvatarFallback>
                                {(d.name || "U").charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            {d.isOnline &&
                              (d?.privacy?.showOnlineStatus ?? true) && (
                                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-card rounded-full"></div>
                              )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h3 className="font-medium text-foreground truncate">
                                {d.name}
                              </h3>
                            </div>
                            <p className="text-sm text-muted-foreground truncate">
                              {lastPreview}
                            </p>
                          </div>

                          {Number(chat.unreadCount) > 0 && chat.lastMessage?.senderId !== meId && (
                            <Badge variant="destructive" className="ml-2 whitespace-nowrap">
                              {chat.unreadCount === 1 ? "1 new" : `${chat.unreadCount}+ new`}
                            </Badge>
                          )}

                        </div>
                      </div>
                    );
                  })}
              </div>
            </ScrollArea>
          </div>

          {/* Chat Area */}
          {activeChat ? (
            <div
              className={`${
                isMobile ? (showChatList ? "hidden" : "w-full") : "flex-1"
              } bg-card flex flex-col h-full min-h-0 overflow-hidden pt-0`}
            >
              {!isMobile && (
                <div className="p-3 sm:p-4 border-b border-border bg-card flex-shrink-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <Avatar
                          className={`w-10 h-10 cursor-pointer ring-2 ring-transparent ${
                            (activeChat?.participants || []).some(
                              (p: any) => p?.hasActiveStory
                            )
                              ? hasSeen(
                                  String(getOtherDisplay(activeChat).id || "")
                                )
                                ? "ring-gray-400"
                                : "ring-red-500"
                              : ""
                          }`}
                          onClick={async () => {
                            const d = getOtherDisplay(activeChat);
                            if (d.id) await fetchUserStories(String(d.id));
                            else toast({ title: "User deleted" });
                          }}
                        >
                          {(() => {
                            const d = getOtherDisplay(activeChat);
                            return (
                              <>
                                <AvatarImage src={d.avatar} />
                                <AvatarFallback>
                                  {(d.name || "U").charAt(0)}
                                </AvatarFallback>
                              </>
                            );
                          })()}
                        </Avatar>
                        {(() => {
                          const d = getOtherDisplay(activeChat);
                          return (
                            d.isOnline && (d?.privacy?.showOnlineStatus ?? true)
                          );
                        })() && (
                          <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 bg-green-500 border-2 border-card rounded-full"></div>
                        )}
                      </div>
                      <div>
                        {(() => {
                          const d = getOtherDisplay(activeChat);
                          return (
                            <>
                              <h3 className="font-medium text-foreground">
                                {d.name}
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                {d?.privacy?.showOnlineStatus ?? true
                                  ? d.isOnline
                                    ? "Online"
                                    : (d?.privacy?.showLastSeen ?? true) &&
                                      d?.lastSeen
                                    ? `Last seen ${new Date(
                                        d.lastSeen as any
                                      ).toLocaleString()}`
                                    : "Offline"
                                  : ""}
                              </p>
                            </>
                          );
                        })()}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleAudioCall(activeChat)}
                      >
                        <Phone className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleVideoCall(activeChat)}
                      >
                        <VideoCall className="h-4 w-4" />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => {
                              const d = getOtherDisplay(activeChat);
                              if (d.id) {
                                try {
                                  window.dispatchEvent(
                                    new CustomEvent("navigateToUserProfile", {
                                      detail: { userId: String(d.id) },
                                    })
                                  );
                                } catch {}
                              } else {
                                toast({
                                  title: "User deleted",
                                  variant: "destructive",
                                });
                              }
                            }}
                          >
                            View Profile
                          </DropdownMenuItem>
                          {(() => {
                            const other = getOtherParticipant(activeChat);
                            const uid = String(
                              (other as any)?.id || (other as any)?._id || ""
                            );
                            const isBlocked = Boolean(iBlocked && uid);
                            return (
                              <DropdownMenuItem
                                onClick={async () => {
                                  if (!uid) return;
                                  try {
                                    if (isBlocked) {
                                      const res = await arcadeAPI.unblockUser(
                                        uid
                                      );
                                      if (res.success) {
                                        setIBlocked(false);
                                        toast({
                                          title: "User Unblocked",
                                          description: "You can message again.",
                                        });
                                      }
                                    } else {
                                      const res = await arcadeAPI.blockUser(uid);
                                      if (res.success) {
                                        setIBlocked(true);
                                        toast({
                                          title: "User Blocked",
                                          description: "They can't message you.",
                                        });
                                      }
                                    }
                                  } catch {}
                                }}
                              >
                                {isBlocked ? "Unblock User" : "Block User"}
                              </DropdownMenuItem>
                            );
                          })()}
                          <DropdownMenuItem
                            onClick={() => {
                              const other = getOtherParticipant(activeChat) as any;
                              const resolvedId = String(
                                other?._id || other?.id || other?.userId || ""
                              );
                              if (!resolvedId) {
                                toast({
                                  title: "Unable to report",
                                  description: "User id not found for this chat.",
                                  variant: "destructive",
                                });
                                return;
                              }
                              setUserToReport({ ...other, _resolvedId: resolvedId });
                              setIsReportModalOpen(true);
                            }}
                          >
                            Report User
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              )}

              <ScrollArea className="flex-1 min-h-0 p-3 pb-1">
                <div className="space-y-6">
                  {(activeChat as any)?.isApproved === false && (
                    <div className="sticky top-0 z-10 -mt-2 mb-2 bg-yellow-50 border border-yellow-200 text-yellow-800 rounded px-3 py-2 text-sm flex items-center justify-between">
                      <span>
                        Message request pending. Approve to start chatting.
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                          try {
                            const cid = String(
                              (activeChat as any).id || (activeChat as any)._id
                            );
                            const res = await chatAPI.approveChat(cid);
                            if (res.success) {
                              toast({ title: "Messages approved" });
                              // Update activeChat state locally
                              (activeChat as any).isApproved = true;
                              // Also update chats list item
                              try {
                                // Force a rerender: refresh chat from server best-effort
                                await selectChat(cid);
                              } catch {}
                            }
                          } catch {}
                        }}
                      >
                        Approve
                      </Button>
                    </div>
                  )}
                  {(() => {
                    const renderedMessages: React.ReactNode[] = [];
                    let lastDate: string | null = null;

                    (messages || []).forEach((m: any, index: number) => {
                      const msgDate = new Date(m.timestamp || m.createdAt || Date.now());
                      const dateStr = msgDate.toLocaleDateString([], {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      });

                      if (dateStr !== lastDate) {
                        renderedMessages.push(
                          <div key={`date-${dateStr}`} className="flex justify-center my-2">
                            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider bg-muted/30 px-2 py-0.5 rounded-full">
                              {dateStr}
                            </span>
                          </div>
                        );
                        lastDate = dateStr;
                      }

                      const key = m.id || m._id;
                      const messageId = String(key);
                      const selectedReaction = messageReactions[messageId];
                      const messageType = m.type || m.messageType || "text";
                      const isImageMessage =
                        messageType === "image" &&
                        typeof m.content === "string" &&
                        (m.content.startsWith("http") || m.content.startsWith("data:image"));
                      const isAudioMessage =
                        messageType === "audio" &&
                        typeof m.content === "string" &&
                        (m.content.startsWith("data:audio") || m.content.includes("audio"));
                      const rawSender = (m.senderId &&
                        (typeof m.senderId === "object"
                          ? m.senderId._id || m.senderId.id
                          : m.senderId)) as string | undefined;
                      const isMe = rawSender === meId;

                      const other = getOtherDisplay(activeChat);
                      const isLastInGroup = index === messages.length - 1 ||
                        (() => {
                          const next = messages[index + 1];
                          if (!next) return true;
                          const nextSender = (next.senderId && (typeof next.senderId === "object" ? next.senderId._id || next.senderId.id : next.senderId)) as string | undefined;
                          return nextSender !== rawSender;
                        })();

                      renderedMessages.push(
                        <div
                          key={messageId}
                          className={`flex items-end ${
                            isMe ? "justify-end" : "justify-start"
                          } ${selectedReaction ? "mb-16" : "mb-5"} group`}
                        >
                          {!isMe && (
                            <div className="w-8 h-8 mr-2 flex-shrink-0">
                              {isLastInGroup ? (
                                <Avatar className="w-7 h-7">
                                  <AvatarImage src={other.avatar} />
                                  <AvatarFallback className="text-[10px] bg-muted">
                                    {other.name.charAt(0)}
                                  </AvatarFallback>
                                </Avatar>
                              ) : (
                                <div className="w-7 h-7" />
                              )}
                            </div>
                          )}

                          <div className={`flex items-center gap-2 min-w-0 ${!isMe ? "flex-row-reverse" : ""}`}>
                            <div className={`w-fit flex ${!isMe ? "justify-start" : "justify-end"} ${openMenuMessageId === messageId ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity`}>
                              <div className="flex items-center gap-1 bg-background/75 border border-border/60 rounded-full px-1.5 py-0.5 backdrop-blur-sm shadow-sm">
                                <DropdownMenu open={openMenuMessageId === messageId} onOpenChange={(open) => setOpenMenuMessageId(open ? messageId : null)}>
                                  <DropdownMenuTrigger asChild>
                                    <button
                                      type="button"
                                      className="h-5 w-5 rounded-full inline-flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/60"
                                      onClick={(ev) => ev.stopPropagation()}
                                    >
                                      <MoreVertical className="h-3.5 w-3.5" />
                                    </button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align={!isMe ? "start" : "end"} className="w-auto">
                                    <DropdownMenuItem
                                      onClick={(ev) => {
                                        ev.stopPropagation();
                                        unsendMessage(messageId);
                                        setOpenMenuMessageId(null);
                                      }}
                                      className="text-red-500 focus:text-red-500 focus:bg-red-50/20"
                                    >
                                      Unsend
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                                <button
                                  type="button"
                                  className="h-5 w-5 rounded-full inline-flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/60"
                                  onClick={(ev) => {
                                    ev.stopPropagation();
                                    const textContent = typeof m.content === 'string' ? m.content : 'Message';
                                    copyMessage(textContent);
                                  }}
                                >
                                  <Copy className="h-3.5 w-3.5" />
                                </button>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <button
                                      type="button"
                                      className="h-5 w-5 rounded-full inline-flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/60"
                                      onClick={(ev) => ev.stopPropagation()}
                                    >
                                      <Smile className="h-3.5 w-3.5" />
                                    </button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align={!isMe ? "start" : "start"} className="w-auto p-2">
                                    <div className="grid grid-cols-4 gap-1">
                                      {(["👍", "❤️", "😂", "🔥", "😍", "😮", "😢", "👏"] as const).map((emoji) => (
                                        <button
                                          key={`${messageId}-${emoji}`}
                                          type="button"
                                          className="h-7 w-7 rounded hover:bg-muted text-base"
                                          onClick={(ev) => {
                                            ev.stopPropagation();
                                            setReaction(messageId, emoji);
                                          }}
                                        >
                                          {emoji}
                                        </button>
                                      ))}
                                    </div>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                                <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                                  {msgDate.toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </span>
                              </div>
                            </div>
                            <div className={`relative inline-block ${selectedReaction ? "pb-3" : ""} ${
                              isImageMessage
                                ? "w-fit max-w-[72%] p-0"
                                : isAudioMessage
                                ? "w-fit max-w-[78%] p-3 rounded-3xl"
                                : "w-fit max-w-[78%] lg:max-w-md px-3.5 py-2 rounded-2xl"
                            } shadow-[0_1px_2px_rgba(0,0,0,0.18)] ${
                              !isImageMessage && (
                                isMe
                                  ? "bg-blue-600 text-white rounded-br-md"
                                  : "bg-muted/80 text-foreground rounded-bl-md"
                              )
                            }`}>
                              {isImageMessage ? (
                                <button
                                  type="button"
                                  className="block"
                                  onClick={() => setPreviewImageUrl(m.content)}
                                >
                                  <img
                                    src={m.content}
                                    alt="Sent image"
                                    className="max-h-72 w-auto rounded-xl object-cover"
                                  />
                                </button>
                              ) : isAudioMessage ? (
                                <>
                                  <audio
                                    ref={(el) => {
                                      if (el) audioRefsMap.current[messageId] = el;
                                    }}
                                    src={m.content}
                                    onLoadedMetadata={(e) =>
                                      handleAudioLoadedMetadata(messageId, (e.target as HTMLAudioElement).duration)
                                    }
                                    onTimeUpdate={(e) =>
                                      handleAudioTimeUpdate(messageId, (e.target as HTMLAudioElement).currentTime)
                                    }
                                    onEnded={() => handleAudioEnded(messageId)}
                                  />
                                  <div className="flex items-center gap-3">
                                    <button
                                      type="button"
                                      onClick={() => toggleAudioPlayback(messageId, m.content)}
                                      className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                                        isMe ? "bg-white/20 hover:bg-white/30" : "bg-white/10 hover:bg-white/20"
                                      }`}
                                    >
                                      <svg
                                        className="w-5 h-5 fill-current"
                                        viewBox="0 0 24 24"
                                      >
                                        {audioPlayback[messageId]?.playing ? (
                                          <>
                                            <rect x="5" y="4" width="3" height="16" />
                                            <rect x="16" y="4" width="3" height="16" />
                                          </>
                                        ) : (
                                          <path d="M8 5v14l11-7z" />
                                        )}
                                      </svg>
                                    </button>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 mb-1">
                                        <div className="flex gap-0.5">
                                          {[...Array(12)].map((_, i) => {
                                            const progress = audioPlayback[messageId]?.currentTime || 0;
                                            const duration = audioPlayback[messageId]?.duration || 3;
                                            const percentage = Math.min((progress / duration) * 12, 11);
                                            return (
                                              <div
                                                key={i}
                                                className={`w-0.5 rounded-full transition-all ${
                                                  i <= percentage
                                                    ? isMe
                                                      ? "h-2 bg-white"
                                                      : "h-2 bg-foreground"
                                                    : isMe
                                                    ? "h-1 bg-white/40"
                                                    : "h-1 bg-foreground/30"
                                                }`}
                                              />
                                            );
                                          })}
                                        </div>
                                        <span className={`text-xs font-medium whitespace-nowrap ${
                                          isMe ? "text-white/80" : "text-foreground/60"
                                        }`}>
                                          {Math.floor(audioPlayback[messageId]?.currentTime || 0)}:
                                          {String(Math.floor(((audioPlayback[messageId]?.currentTime || 0) % 1) * 60)).padStart(2, "0")}
                                        </span>
                                      </div>
                                      <p className={`text-xs ${isMe ? "text-white/60" : "text-foreground/50"}`}>
                                        Voice message
                                      </p>
                                    </div>
                                  </div>
                                </>
                              ) : (
                                <p className="text-sm break-words whitespace-pre-wrap leading-relaxed">
                                  {m.content}
                                </p>
                              )}
                              {selectedReaction && (
                                <span
                                  className={`absolute bottom-0 ${isMe ? "right-0" : "left-0"} translate-y-1/2 inline-flex items-center justify-center text-sm bg-muted/40 border border-white/20 rounded-full px-1.5 py-0.5 shadow-sm backdrop-blur-sm`}
                                >
                                  {selectedReaction}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    });
                    return renderedMessages;
                  })()}
                  <div ref={bottomRef} className="h-0" />
                </div>
              </ScrollArea>

              <div className="p-4 border-t border-border bg-card">
                {iBlocked && (
                  <div className="mb-2 text-sm bg-yellow-50 border border-yellow-200 text-yellow-800 rounded px-3 py-2">
                    You have blocked this user. Unblock to send messages.
                  </div>
                )}
                {blockedByPeer && !iBlocked && (
                  <div className="mb-2 text-sm bg-red-50 border border-red-200 text-red-800 rounded px-3 py-2">
                    You can't send because this user has blocked you.
                  </div>
                )}
                <div
                  className={`flex items-center space-x-2 ${
                    (activeChat as any)?.isApproved === false
                      ? "opacity-60"
                      : ""
                  }`}
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 rounded-full bg-muted/40 text-muted-foreground hover:bg-muted/70 hover:text-foreground"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={
                      iBlocked ||
                      blockedByPeer ||
                      (activeChat as any)?.isApproved === false ||
                      isSending
                    }
                  >
                    <Paperclip className="h-5 w-5" />
                  </Button>
                  <div className={`flex-1 rounded-full px-4 flex items-center space-x-2 shadow-sm ${
                    isListening
                      ? "bg-red-500/20 border-2 border-red-500"
                      : "bg-muted/40 border border-white/10 focus-within:border-white/20"
                  }`}>
                    <Input
                      placeholder={isListening ? "Recording voice message..." : "Message..."}
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={handleKeyPress}
                      className="flex-1 bg-transparent border-none shadow-none focus:ring-0 focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none focus-visible:border-none h-10 p-0 text-sm text-foreground placeholder:text-muted-foreground"
                      disabled={
                        iBlocked ||
                        blockedByPeer ||
                        (activeChat as any)?.isApproved === false ||
                        isListening
                      }
                    />
                    <div className="flex items-center space-x-1 pr-1">
                      {isListening && (
                        <div className="flex items-center gap-1 px-2 py-1 bg-red-500/30 rounded-full">
                          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                          <span className="text-xs font-semibold text-red-500">
                            {recordingSeconds}s
                          </span>
                        </div>
                      )}
                      {!isListening && (
                        <>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted/60">
                                <Smile className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-auto p-2">
                              <div className="grid grid-cols-6 gap-1">
                                {["😀", "😂", "😍", "🔥", "❤️", "🙏", "👍", "👏", "😎", "🤝", "🎉", "✨"].map((emoji) => (
                                  <button
                                    key={emoji}
                                    type="button"
                                    className="h-8 w-8 rounded hover:bg-muted text-lg"
                                    onClick={() => insertEmoji(emoji)}
                                  >
                                    {emoji}
                                  </button>
                                ))}
                              </div>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className={`h-8 w-8 ${isListening ? "text-red-500 bg-red-500/20" : "text-muted-foreground hover:text-foreground hover:bg-muted/60"}`}
                        onClick={toggleVoiceInput}
                        disabled={
                          iBlocked ||
                          blockedByPeer ||
                          (activeChat as any)?.isApproved === false
                        }
                      >
                        <Mic className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <Button
                    onClick={isListening ? toggleVoiceInput : handleSendMessage}
                    disabled={isSending || (!newMessage.trim() && !isListening)}
                    className={`font-bold shadow-none ${
                      isListening
                        ? "text-white bg-red-500 hover:bg-red-600"
                        : "text-foreground bg-transparent hover:bg-transparent disabled:opacity-40"
                    }`}
                  >
                    {isListening
                      ? `⏹ ${recordingSeconds}s/${VOICE_LIMIT_SECONDS}s`
                      : isSending
                        ? "..."
                        : "Send"}
                  </Button>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  onChange={handleAttachmentChange}
                  accept="image/*,application/pdf,.doc,.docx,.txt,.zip"
                />
              </div>
            </div>
          ) : (
            <div
              className={`${
                isMobile ? (showChatList ? "hidden" : "w-full") : "flex-1"
              } flex items-center justify-center bg-muted/30 p-6`}
            >
              <div className="text-center">
                <MessageCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">
                  {isOpeningChat ? "Opening conversation..." : "Select a conversation"}
                </h3>
                <p className="text-muted-foreground">
                  {isOpeningChat
                    ? "Please wait while we load your chat"
                    : "Choose a chat to start messaging"}
                </p>
                {isMobile && !showChatList && (
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => setShowChatList(true)}
                  >
                    Back to chat list
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <ReportModal
        isOpen={isReportModalOpen}
        onClose={() => {
          setIsReportModalOpen(false);
          setUserToReport(null);
        }}
        type="user"
        targetId={userToReport?._resolvedId || userToReport?.id || userToReport?._id || userToReport?.userId || ""}
        targetName={
          userToReport?.username ||
          userToReport?.fullName ||
          userToReport?.name ||
          ""
        }
      />
    </div>
  );
};
