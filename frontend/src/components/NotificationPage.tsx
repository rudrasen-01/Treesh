import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Heart,
  MessageCircle,
  UserPlus,
  Megaphone,
  Settings,
  Bell,
  ChevronRight,
  Check,
  UserCheck,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useIsMobile } from "@/hooks/use-mobile";
import { notificationsAPI } from "@/services/api";
import { usersAPI } from "@/services/api";
import { toast } from "@/hooks/use-toast";

type BackendNotification = {
  _id: string;
  type:
    | "follow"
    | "follow_request"
    | "follow_request_accepted"
    | "like"
    | "comment"
    | "mention"
    | "psa";
  sender?: { _id: string; username?: string; name?: string; profileImage?: string; avatar?: string } | string;
  recipient: string;
  title?: string;
  message?: string;
  isRead: boolean;
  createdAt: string;
  /** Optional: post/story id to link to */
  postId?: string;
  storyId?: string;
  referenceId?: string;
};

const normalizeSenderId = (notification: BackendNotification) => {
  if (notification.sender && typeof notification.sender === "object") {
    return notification.sender._id;
  }
  if (typeof notification.sender === "string") {
    return notification.sender;
  }
  return "";
};

const dedupeNotifications = (list: BackendNotification[]) => {
  const seen = new Set<string>();
  const deduped: BackendNotification[] = [];

  for (const notification of list) {
    const senderId = normalizeSenderId(notification);
    const shouldDedupeFollowType =
      notification.type === "follow" ||
      notification.type === "follow_request" ||
      notification.type === "follow_request_accepted";

    if (shouldDedupeFollowType && senderId) {
      const key = `${notification.type}:${senderId}:${notification.recipient}`;
      if (seen.has(key)) {
        continue;
      }
      seen.add(key);
    }

    deduped.push(notification);
  }

  return deduped;
};

/** Navigate to a user's profile page */
const goToUserProfile = (userId: string) => {
  window.dispatchEvent(
    new CustomEvent("navigateToUserProfile", { detail: { userId } }),
  );
};

/** Navigate to a named tab (feed, messages, etc.) */
const goToTab = (tab: string) => {
  window.dispatchEvent(
    new CustomEvent("treesh:navigate", { detail: { tab } }),
  );
};

export const NotificationPage = () => {
  const isMobile = useIsMobile();
  const [notifications, setNotifications] = useState<BackendNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [, setUnreadCount] = useState(0);
  const [followRequests, setFollowRequests] = useState<any[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [followingBack, setFollowingBack] = useState<string[]>([]);
  const [followedBack, setFollowedBack] = useState<string[]>([]);
  const [showUnfollowConfirm, setShowUnfollowConfirm] = useState(false);
  const [userToUnfollow, setUserToUnfollow] = useState<{
    id: string;
    name: string;
  } | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const res = await notificationsAPI.getNotifications();
      if (res.success) {
        const data = (res.data as any) || {};
        const list: BackendNotification[] = dedupeNotifications(
          data.notifications || [],
        );
        setNotifications(list);
        const newUnread =
          data.unreadCount ?? list.filter((n) => !n.isRead).length;
        setUnreadCount(newUnread);

        const followNotifications = list.filter(
          (n) =>
            n.type === "follow" && n.sender && typeof n.sender === "object",
        );
        const alreadyFollowing: string[] = [];

        for (const notification of followNotifications) {
          const sender = notification.sender as any;
          if (sender?._id) {
            try {
              const userRes = await usersAPI.getUserProfile(sender._id);
              if (userRes.success && userRes.data?.isFollowing) {
                alreadyFollowing.push(sender._id);
              }
            } catch (_) {}
          }
        }

        setFollowedBack(alreadyFollowing);

        window.dispatchEvent(
          new CustomEvent("treesh:notifications-set", {
            detail: { count: newUnread },
          }),
        );
      }
      setLoading(false);
    };
    load();
  }, []);

  useEffect(() => {
    const loadRequests = async () => {
      setLoadingRequests(true);
      const res = await usersAPI.getIncomingFollowRequests();
      if (res.success) {
        const uniqueRequests = Array.from(
          new Map((res.data || []).map((user: any) => [user._id, user])).values(),
        );
        setFollowRequests(uniqueRequests);
      }
      setLoadingRequests(false);
    };
    loadRequests();
  }, []);

  const allNotifications = notifications.filter(
    (notification) => notification.type !== "follow_request",
  );
  const allUnreadCount = allNotifications.filter(
    (notification) => !notification.isRead,
  ).length;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "like":
        return <Heart className="w-4 h-4 text-red-500" />;
      case "comment":
        return <MessageCircle className="w-4 h-4 text-blue-500" />;
      case "mention":
        return <MessageCircle className="w-4 h-4 text-purple-500" />;
      case "follow":
        return <UserPlus className="w-4 h-4 text-green-500" />;
      case "follow_request":
        return <UserPlus className="w-4 h-4 text-yellow-500" />;
      case "follow_request_accepted":
        return <UserCheck className="w-4 h-4 text-green-600" />;
      case "psa":
        return <Megaphone className="w-4 h-4 text-orange-500" />;
      default:
        return <Bell className="w-4 h-4 text-gray-500" />;
    }
  };

  const getNotificationIconBg = (type: string) => {
    switch (type) {
      case "like": return "bg-red-50 dark:bg-red-950/50";
      case "comment":
      case "mention": return "bg-blue-50 dark:bg-blue-950/50";
      case "follow":
      case "follow_request_accepted": return "bg-green-50 dark:bg-green-950/50";
      case "follow_request": return "bg-yellow-50 dark:bg-yellow-950/40";
      case "psa": return "bg-orange-50 dark:bg-orange-950/40";
      default: return "bg-muted";
    }
  };

  const markAsRead = async (id: string) => {
    const res = await notificationsAPI.markAsRead(id);
    if (res.success) {
      const wasUnread = notifications.find((n) => n._id === id)?.isRead === false;
      setNotifications((prev) =>
        prev.map((n) =>
          n._id === id ? ({ ...n, isRead: true } as BackendNotification) : n,
        ),
      );
      if (wasUnread) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
        window.dispatchEvent(
          new CustomEvent("treesh:notifications-decrement", { detail: { by: 1 } }),
        );
      }
    }
  };

  const markAllAsRead = async () => {
    const res = await notificationsAPI.markAllAsRead();
    if (res.success) {
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
      window.dispatchEvent(
        new CustomEvent("treesh:notifications-set", { detail: { count: 0 } }),
      );
    }
  };

  /**
   * Main click handler: marks as read AND navigates to the related page.
   */
  const handleNotificationClick = async (n: BackendNotification) => {
    // Mark as read first (fire-and-forget)
    if (!n.isRead) {
      markAsRead(n._id);
    }

    const sender = typeof n.sender === "object" && n.sender !== null ? n.sender : undefined;
    const senderId = sender?._id;

    switch (n.type) {
      case "follow":
      case "follow_request":
      case "follow_request_accepted":
        // Navigate to the sender's profile
        if (senderId) {
          goToUserProfile(senderId);
        }
        break;

      case "like":
      case "comment":
      case "mention":
        // Navigate to the post if we have a postId, otherwise go to feed
        if (n.postId || n.referenceId) {
          window.dispatchEvent(
            new CustomEvent("treesh:navigate-to-post", {
              detail: { postId: n.postId || n.referenceId },
            }),
          );
          goToTab("home");
        } else {
          goToTab("home");
        }
        break;

      case "psa":
        goToTab("home");
        break;

      default:
        goToTab("home");
        break;
    }
  };

  const acceptRequest = async (requesterId: string) => {
    const res = await usersAPI.acceptFollowRequest(requesterId);
    if (res.success) {
      toast({
        title: "Request accepted",
        description: "You're now followed by this user.",
      });
      setFollowRequests((prev) => prev.filter((u) => u._id !== requesterId));
      setNotifications((prev) => 
        prev.filter((n) => !(n.type === "follow_request" && typeof n.sender === "object" && n.sender?._id === requesterId))
      );
    }
  };

  const declineRequest = async (requesterId: string) => {
    const res = await usersAPI.declineFollowRequest(requesterId);
    if (res.success) {
      toast({ title: "Request declined" });
      setFollowRequests((prev) => prev.filter((u) => u._id !== requesterId));
      setNotifications((prev) => 
        prev.filter((n) => !(n.type === "follow_request" && typeof n.sender === "object" && n.sender?._id === requesterId))
      );
    }
  };

  const handleFollowBack = async (senderId: string, senderName: string) => {
    if (!senderId) return;
    setFollowingBack((prev) => [...prev, senderId]);
    try {
      const res = await usersAPI.followUser(senderId);
      if (res.success) {
        toast({ title: "Following back", description: `You are now following ${senderName}` });
        setFollowedBack((prev) => [...prev, senderId]);
        const followNotification = notifications.find(
          (n) =>
            n.type === "follow" &&
            typeof n.sender === "object" &&
            n.sender?._id === senderId,
        );
        if (followNotification) {
          await markAsRead(followNotification._id);
        }
      } else {
        toast({ title: "Error", description: "Failed to follow back", variant: "destructive" });
      }
    } catch (_) {
      toast({ title: "Error", description: "Failed to follow back", variant: "destructive" });
    } finally {
      setFollowingBack((prev) => prev.filter((id) => id !== senderId));
    }
  };

  const handleUnfollowClick = (senderId: string, senderName: string) => {
    setUserToUnfollow({ id: senderId, name: senderName });
    setShowUnfollowConfirm(true);
  };

  const handleUnfollowConfirm = async () => {
    if (!userToUnfollow) return;
    setFollowingBack((prev) => [...prev, userToUnfollow.id]);
    try {
      const res = await usersAPI.followUser(userToUnfollow.id);
      if (res.success) {
        toast({ title: "Unfollowed", description: `You unfollowed ${userToUnfollow.name}` });
        setFollowedBack((prev) => prev.filter((id) => id !== userToUnfollow.id));
      } else {
        toast({ title: "Error", description: "Failed to unfollow", variant: "destructive" });
      }
    } catch (_) {
      toast({ title: "Error", description: "Failed to unfollow", variant: "destructive" });
    } finally {
      setFollowingBack((prev) => prev.filter((id) => id !== userToUnfollow.id));
      setShowUnfollowConfirm(false);
      setUserToUnfollow(null);
    }
  };

  const renderNotificationCard = (n: BackendNotification) => {
    const sender = typeof n.sender === "object" && n.sender !== null ? n.sender : undefined;
    const senderName = sender?.username || sender?.name || "Someone";
    const avatar = sender?.avatar || sender?.profileImage || undefined;
    const time = new Date(n.createdAt).toLocaleString(undefined, {
      month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
    });
    const content = n.message || n.title || "";

    return (
      <div
        key={n._id}
        onClick={() => handleNotificationClick(n)}
        className={`group flex items-start gap-3 p-4 rounded-xl border transition-all duration-150 cursor-pointer select-none
          ${n.isRead
            ? "bg-card border-border hover:bg-muted/50"
            : "bg-primary/10 border-primary/20 hover:bg-primary/15 shadow-sm"
          }`}
      >
        {/* Avatar + type icon */}
        <div className="relative flex-shrink-0">
          <Avatar className="h-10 w-10 ring-2 ring-card">
            <AvatarImage src={avatar} />
            <AvatarFallback className="bg-gradient-to-br from-purple-400 to-pink-400 text-white text-sm font-semibold">
              {senderName.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center ${getNotificationIconBg(n.type)} border border-card`}>
            {getNotificationIcon(n.type)}
          </span>
        </div>

        {/* Body */}
        <div className="flex-1 min-w-0">
          <p className="text-sm text-foreground leading-snug">
            <span className="font-semibold">{senderName}</span>{" "}
            {content}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">{time}</p>

          {/* Action buttons for follow notifications – stop propagation so card click doesn't fire */}
          {(n.type === "follow") && sender?._id && (
            <div
              className="mt-2 flex gap-2"
              onClick={(e) => e.stopPropagation()}
            >
              <Button
                size="sm"
                variant={followedBack.includes(sender._id) ? "default" : "outline"}
                className="h-7 px-3 text-xs"
                disabled={followingBack.includes(sender._id)}
                onClick={() =>
                  followedBack.includes(sender._id)
                    ? handleUnfollowClick(sender._id, senderName)
                    : handleFollowBack(sender._id, senderName)
                }
              >
                {followingBack.includes(sender._id)
                  ? (followedBack.includes(sender._id) ? "Unfollowing..." : "Following...")
                  : followedBack.includes(sender._id)
                  ? "Following ✓"
                  : "Follow Back"}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 px-3 text-xs text-primary hover:bg-primary/10"
                onClick={() => goToUserProfile(sender._id)}
              >
                View Profile
              </Button>
            </div>
          )}

          {/* Action buttons for follow request notifications */}
          {n.type === "follow_request" && sender?._id && (
            <div
              className="mt-2 flex gap-2"
              onClick={(e) => e.stopPropagation()}
            >
              <Button
                size="sm"
                className="h-7 px-3 text-xs"
                onClick={() => acceptRequest(sender._id)}
              >
                Accept
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-7 px-3 text-xs"
                onClick={() => declineRequest(sender._id)}
              >
                Decline
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 px-3 text-xs text-primary hover:bg-primary/10"
                onClick={() => goToUserProfile(sender._id)}
              >
                View Profile
              </Button>
            </div>
          )}
        </div>

        {/* Right side: unread dot + chevron */}
        <div className="flex flex-col items-center gap-2 flex-shrink-0 self-center">
          {!n.isRead && (
            <div className="w-2.5 h-2.5 bg-blue-500 rounded-full" />
          )}
          <ChevronRight className="w-4 h-4 text-muted-foreground/50 group-hover:text-muted-foreground transition-colors" />
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      {isMobile && (
        <div className="sticky top-0 z-10 bg-card border-b border-border px-4 py-3">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-semibold text-foreground">Notifications</h1>
            <Button variant="ghost" size="sm" onClick={markAllAsRead}>
              <Check className="h-4 w-4 mr-1" />
              <span className="text-xs">Mark all read</span>
            </Button>
          </div>
        </div>
      )}

      <div className="w-full px-4 py-4 sm:max-w-2xl sm:mx-auto sm:py-6">
        {/* Desktop Header */}
        {!isMobile && (
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Notifications</h1>
              <p className="text-muted-foreground mt-1 text-sm">
                {allUnreadCount > 0
                  ? `${allUnreadCount} unread notification${allUnreadCount !== 1 ? "s" : ""}`
                  : "You're all caught up!"}
              </p>
            </div>
            {allUnreadCount > 0 && (
              <Button variant="outline" size="sm" onClick={markAllAsRead} className="text-xs">
                <Check className="h-3 w-3 mr-1" />
                Mark all as read
              </Button>
            )}
          </div>
        )}

        <Tabs defaultValue="all" className="w-full">
          <TabsList className="mb-4 w-full grid grid-cols-2 bg-muted p-1 rounded-xl h-10">
            <TabsTrigger value="all" className="rounded-lg text-sm font-medium">
              All
              {allUnreadCount > 0 && (
                <span className="ml-2 inline-flex items-center justify-center rounded-full bg-blue-500 text-white text-[10px] px-1.5 min-w-[18px] h-[18px]">
                  {allUnreadCount}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="requests" className="rounded-lg text-sm font-medium">
              Follow Requests
              {followRequests.length > 0 && (
                <span className="ml-2 inline-flex items-center justify-center rounded-full bg-orange-500 text-white text-[10px] px-1.5 min-w-[18px] h-[18px]">
                  {followRequests.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            <div className="space-y-2">
              {loading && (
                <>
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="flex items-center gap-3 p-4 bg-card rounded-xl border border-border">
                      <div className="w-10 h-10 rounded-full bg-muted animate-pulse flex-shrink-0" />
                      <div className="flex-1 space-y-2">
                        <div className="h-3.5 bg-muted rounded animate-pulse w-3/4" />
                        <div className="h-3 bg-muted rounded animate-pulse w-1/2" />
                      </div>
                    </div>
                  ))}
                </>
              )}

              {!loading && allNotifications.length === 0 && (
                <div className="text-center py-16">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                    <Bell className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-base font-semibold text-foreground mb-1">No notifications yet</h3>
                  <p className="text-sm text-muted-foreground">When you get notifications, they'll show up here</p>
                </div>
              )}

              {!loading && allNotifications.map((n) => renderNotificationCard(n))}
            </div>
          </TabsContent>

          <TabsContent value="requests">
            <div className="space-y-3">
              {loadingRequests && (
                <div className="text-sm text-muted-foreground">
                  Loading follow requests...
                </div>
              )}
              {!loadingRequests && followRequests.length === 0 && (
                <div className="text-sm text-muted-foreground">No pending requests</div>
              )}
              {!loadingRequests &&
                followRequests.map((u) => (
                  <Card key={u._id} className="bg-card border-border">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-9 w-9">
                            <AvatarImage
                              src={
                                u.avatar || u.profileImage || "/placeholder.svg"
                              }
                            />
                            <AvatarFallback>
                              {(u.username || "U").slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="text-sm font-medium text-foreground">
                              {u.username}
                            </div>
                            {u.fullName && (
                              <div className="text-xs text-muted-foreground">
                                {u.fullName}
                              </div>
                            )}
                          </div>
                        </div>
                        {/* <div className="flex items-center gap-2"> */}
                        <div className="flex flex-wrap items-center gap-2">
                          <Button
                            size="sm"
                            onClick={() => acceptRequest(u._id)}
                          >
                            Accept
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => declineRequest(u._id)}
                          >
                            Decline
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </TabsContent>
        </Tabs>
        {/* Empty State */}
        {!loading && notifications.length === 0 && (
          <div className="text-center py-12">
            <Bell className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              No notifications yet
            </h3>
            <p className="text-muted-foreground">
              When you get notifications, they'll appear here
            </p>
          </div>
        )}
      </div>

      {/* Unfollow Confirmation Dialog */}
      <Dialog open={showUnfollowConfirm} onOpenChange={setShowUnfollowConfirm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Unfollow {userToUnfollow?.name}?</DialogTitle>
            <DialogDescription>
              Are you sure you want to unfollow {userToUnfollow?.name}? You can
              follow them again anytime.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowUnfollowConfirm(false);
                setUserToUnfollow(null);
              }}
              disabled={
                userToUnfollow && followingBack.includes(userToUnfollow.id)
              }
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleUnfollowConfirm}
              disabled={
                userToUnfollow && followingBack.includes(userToUnfollow.id)
              }
            >
              {userToUnfollow && followingBack.includes(userToUnfollow.id)
                ? "Unfollowing..."
                : "Unfollow"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
