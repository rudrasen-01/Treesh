import { useState, useEffect, useMemo, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, UserCheck, UserPlus, X, Users } from "lucide-react";
import { usersAPI } from "@/services/api";
import { useAuth } from "@/hooks/useAuth";

export interface FollowUser {
  id: string;
  _id?: string;
  username: string;
  fullName?: string;
  name?: string;
  avatar?: string;
  isVerified?: boolean;
  verified?: boolean;
  bio?: string;
  /** Whether the current logged-in user already follows this person */
  isFollowing?: boolean;
  mutual?: boolean;
}

interface FollowListDialogProps {
  isOpen: boolean;
  onClose: () => void;
  /** "followers" or "following" */
  type: "followers" | "following";
  /** The pre-loaded list of users */
  users: FollowUser[];
  /** Total count to display in the header (may differ before list loads) */
  totalCount?: number;
  isLoading?: boolean;
  onFollowToggle?: (userId: string, nowFollowing: boolean) => void;
}

export const FollowListDialog = ({
  isOpen,
  onClose,
  type,
  users,
  totalCount,
  isLoading = false,
  onFollowToggle,
}: FollowListDialogProps) => {
  const { user: authUser } = useAuth();
  const [search, setSearch] = useState("");
  const [followingMap, setFollowingMap] = useState<Record<string, boolean>>({});
  const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({});
  const searchRef = useRef<HTMLInputElement>(null);

  // Reset search when dialog opens/closes
  useEffect(() => {
    if (isOpen) {
      setSearch("");
      setTimeout(() => searchRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Build initial followingMap from users list
  useEffect(() => {
    const map: Record<string, boolean> = {};
    users.forEach((u) => {
      const uid = u.id || u._id || "";
      if (uid) map[uid] = !!u.isFollowing;
    });
    setFollowingMap(map);
  }, [users]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return users;
    return users.filter((u) => {
      const name = (u.fullName || u.name || "").toLowerCase();
      const uname = (u.username || "").toLowerCase();
      const bio = (u.bio || "").toLowerCase();
      return name.includes(q) || uname.includes(q) || bio.includes(q);
    });
  }, [users, search]);

  const handleFollowToggle = async (userId: string) => {
    const currentlyFollowing = followingMap[userId] ?? false;
    // Optimistic update
    setFollowingMap((prev) => ({ ...prev, [userId]: !currentlyFollowing }));
    setLoadingMap((prev) => ({ ...prev, [userId]: true }));
    try {
      await usersAPI.followUser(userId);
      onFollowToggle?.(userId, !currentlyFollowing);
      // Fire global event so counts update elsewhere
      window.dispatchEvent(new Event("followUpdate"));
    } catch (err) {
      // Revert on failure
      setFollowingMap((prev) => ({ ...prev, [userId]: currentlyFollowing }));
    } finally {
      setLoadingMap((prev) => ({ ...prev, [userId]: false }));
    }
  };

  const title = type === "followers" ? "Followers" : "Following";
  const count = totalCount ?? users.length;

  const getDisplayName = (u: FollowUser) =>
    u.fullName || u.name || u.username || "Unknown";

  const getAvatarFallback = (u: FollowUser) =>
    (getDisplayName(u).charAt(0) || "U").toUpperCase();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="p-0 overflow-hidden border border-border shadow-2xl bg-card text-card-foreground sm:max-w-[400px]"
        style={{
          width: "min(100vw, 400px)",
          maxHeight: "90vh",
          borderRadius: "16px",
        }}
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/40">
          <DialogTitle className="text-base font-semibold text-foreground m-0">
            {title}{" "}
            <span className="text-muted-foreground font-normal text-sm">
              ({count})
            </span>
          </DialogTitle>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted transition-colors text-muted-foreground"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── Search Bar ── */}
        <div className="px-4 pt-3 pb-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <Input
              ref={searchRef}
              type="text"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-3 h-9 text-sm bg-muted border-0 rounded-lg focus-visible:ring-1 focus-visible:ring-ring"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* ── User List ── */}
        <div
          className="overflow-y-auto px-2 pb-4"
          style={{ maxHeight: "calc(90vh - 140px)" }}
        >
          {isLoading ? (
            /* Loading skeleton */
            <div className="space-y-1 px-2 py-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl">
                  <div className="w-11 h-11 rounded-full bg-muted animate-pulse flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3.5 bg-muted rounded animate-pulse w-32" />
                    <div className="h-3 bg-muted rounded animate-pulse w-24" />
                  </div>
                  <div className="w-20 h-8 bg-muted rounded-lg animate-pulse flex-shrink-0" />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            /* Empty state */
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Users className="w-14 h-14 mb-4 opacity-30" />
              {search ? (
                <>
                  <p className="text-sm font-medium text-muted-foreground">
                    No results for "{search}"
                  </p>
                  <p className="text-xs mt-1">Try a different name or username</p>
                </>
              ) : type === "followers" ? (
                <>
                  <p className="text-sm font-medium text-muted-foreground">No followers yet</p>
                  <p className="text-xs mt-1">Share your profile to get followers!</p>
                </>
              ) : (
                <>
                  <p className="text-sm font-medium text-muted-foreground">Not following anyone yet</p>
                  <p className="text-xs mt-1">Discover and follow interesting people!</p>
                </>
              )}
            </div>
          ) : (
            /* User rows */
            filtered.map((u) => {
              const uid = u.id || u._id || "";
              const isMe = uid === (authUser?.id || (authUser as any)?._id);
              const currently = followingMap[uid] ?? !!u.isFollowing;
              const isLoadingThis = loadingMap[uid] ?? false;
              const displayName = getDisplayName(u);
              const isVerified = u.isVerified || u.verified;

              return (
                <div
                  key={uid}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted/60 transition-colors group"
                >
                  {/* Avatar */}
                  <div
                    className="flex-shrink-0 cursor-pointer"
                    onClick={() => {
                      if (uid) {
                        onClose();
                        window.dispatchEvent(
                          new CustomEvent("navigateToUserProfile", {
                            detail: { userId: uid },
                          })
                        );
                      }
                    }}
                  >
                    <Avatar className="w-11 h-11 ring-1 ring-border">
                      <AvatarImage src={u.avatar} alt={displayName} />
                      <AvatarFallback className="bg-gradient-to-br from-purple-400 to-pink-400 text-white text-sm font-semibold">
                        {getAvatarFallback(u)}
                      </AvatarFallback>
                    </Avatar>
                  </div>

                  {/* Name / username */}
                  <div
                    className="flex-1 min-w-0 cursor-pointer"
                    onClick={() => {
                      if (uid) {
                        onClose();
                        window.dispatchEvent(
                          new CustomEvent("navigateToUserProfile", {
                            detail: { userId: uid },
                          })
                        );
                      }
                    }}
                  >
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-sm font-semibold text-foreground truncate max-w-[160px]">
                        {displayName}
                      </span>
                      {isVerified && (
                        <span className="inline-flex items-center justify-center w-4 h-4 bg-blue-500 rounded-full flex-shrink-0">
                          <svg
                            className="w-2.5 h-2.5 text-white"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </span>
                      )}
                      {u.mutual && (
                        <Badge
                          variant="outline"
                          className="text-[10px] py-0 px-1.5 h-4 border-border text-muted-foreground"
                        >
                          Mutual
                        </Badge>
                      )}
                      {/* Show "Follows you" if in following list and they follow you back */}
                      {type === "following" && u.mutual && (
                        <span className="text-[10px] text-muted-foreground/80">
                          · Follows you
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate max-w-[180px]">
                      @{u.username}
                    </p>
                  </div>

                  {/* Follow / Unfollow button */}
                  {!isMe && (
                    <div className="flex-shrink-0">
                      {type === "following" ? (
                        /* In "following" list — always show "Following" with ability to unfollow */
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={isLoadingThis}
                          onClick={() => handleFollowToggle(uid)}
                          className="h-8 px-3 text-xs font-semibold border-border text-foreground hover:bg-destructive/10 hover:border-destructive/30 hover:text-destructive transition-colors min-w-[80px]"
                        >
                          {isLoadingThis ? (
                            <div className="w-3 h-3 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <>
                              <UserCheck className="w-3 h-3 mr-1" />
                              Following
                            </>
                          )}
                        </Button>
                      ) : currently ? (
                        /* Already following this follower */
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={isLoadingThis}
                          onClick={() => handleFollowToggle(uid)}
                          className="h-8 px-3 text-xs font-semibold border-border text-foreground hover:bg-destructive/10 hover:border-destructive/30 hover:text-destructive transition-colors min-w-[80px]"
                        >
                          {isLoadingThis ? (
                            <div className="w-3 h-3 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <>
                              <UserCheck className="w-3 h-3 mr-1" />
                              Following
                            </>
                          )}
                        </Button>
                      ) : (
                        /* Not following — show "Follow back" */
                        <Button
                          size="sm"
                          disabled={isLoadingThis}
                          onClick={() => handleFollowToggle(uid)}
                          className="h-8 px-3 text-xs font-semibold bg-blue-500 hover:bg-blue-600 text-white min-w-[80px]"
                        >
                          {isLoadingThis ? (
                            <div className="w-3 h-3 border-2 border-white/60 border-t-white rounded-full animate-spin" />
                          ) : (
                            <>
                              <UserPlus className="w-3 h-3 mr-1" />
                              Follow
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
