import { useState, useEffect } from "react";
import { X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { usersAPI } from "@/services/api";
import { toast } from "@/hooks/use-toast";

interface SuggestedUser {
  id: string;
  fullName: string;
  username: string;
  avatar: string;
  isStreamer: boolean;
  mutualFriendsCount?: number;
}

interface SuggestedPeopleProps {
  limit?: number;
}

export const SuggestedPeople = ({ limit = 5 }: SuggestedPeopleProps) => {
  const [isOpen, setIsOpen] = useState(true);
  const [suggestedUsers, setSuggestedUsers] = useState<SuggestedUser[]>([]);
  const [followedUsers, setFollowedUsers] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [displayCount, setDisplayCount] = useState(limit);
  const [hasMore, setHasMore] = useState(true);

  const handleOpenProfile = (userId: string) => {
    window.dispatchEvent(
      new CustomEvent("navigateToUserProfile", { detail: { userId } })
    );
  };

  // Fetch suggested users from API
  useEffect(() => {
    const fetchSuggestedUsers = async () => {
      setIsLoading(true);
      try {
        // Call the suggested users API endpoint
        const response = await usersAPI.getSuggestions(displayCount);
        if (response.success && response.data) {
          const normalizedUsers = response.data.map((user: any) => ({
            id: user._id || user.id,
            fullName: user.fullName || user.name || user.username || "Unknown",
            username: typeof user.username === "string" ? user.username : "",
            avatar: user.avatar || "/placeholder.svg",
            isStreamer: !!user.isStreamer,
            mutualFriendsCount:
              typeof user.mutualFriendsCount === "number"
                ? user.mutualFriendsCount
                : undefined,
          }));
          setSuggestedUsers(normalizedUsers);
          setHasMore(normalizedUsers.length >= displayCount);
        }
      } catch (error) {
        console.error("Failed to fetch suggested users:", error);
        toast({
          title: "Error",
          description: "Failed to load suggestions",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchSuggestedUsers();
  }, [displayCount]);

  const handleFollow = async (userId: string) => {
    try {
      const response = await usersAPI.followUser(userId);
      if (response.success) {
        setFollowedUsers((prev) => new Set(prev).add(userId));
        toast({
          title: "Success",
          description: "User followed successfully",
        });
      }
    } catch (error) {
      console.error("Failed to follow user:", error);
      toast({
        title: "Error",
        description: "Failed to follow user",
        variant: "destructive",
      });
    }
  };

  const handleSeeMore = () => {
    setIsLoadingMore(true);
    setTimeout(() => {
      setDisplayCount((prev) => prev + limit);
      setIsLoadingMore(false);
    }, 300);
  };

  if (!isOpen) return null;

  return (
    <div className="bg-card border-2 border-border rounded-xl shadow-lg p-4 w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-border">
        <h2 className="font-semibold text-sm text-foreground">Suggested for you</h2>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 p-0 hover:bg-transparent"
          onClick={() => setIsOpen(false)}
        >
          <X className="w-4 h-4 text-muted-foreground hover:text-foreground transition-colors" />
        </Button>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Suggestions List */}
      {!isLoading && suggestedUsers.length > 0 && (
        <div className="space-y-3">
          {suggestedUsers.map((user) => (
            <div
              key={user.id}
              className="flex items-center justify-between p-2 hover:bg-accent/50 rounded-lg transition-colors duration-200"
            >
              {/* User Info */}
              <div className="flex items-center gap-2.5 flex-1 min-w-0">
                <Avatar
                  className="h-10 w-10 flex-shrink-0 border border-border cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => handleOpenProfile(user.id)}
                >
                  <AvatarImage src={user.avatar} />
                  <AvatarFallback>{(user.fullName || "U").charAt(0)}</AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <span
                      className="font-semibold text-sm text-foreground truncate cursor-pointer hover:text-primary transition-colors"
                      onClick={() => handleOpenProfile(user.id)}
                    >
                      {user.fullName}
                    </span>
                    {user.isStreamer && (
                      <Badge className="bg-blue-500 text-white text-xs py-0 px-1.5 flex-shrink-0 h-5">
                        ✓
                      </Badge>
                    )}
                  </div>
                  <p
                    className="text-xs text-muted-foreground truncate cursor-pointer hover:text-primary transition-colors"
                    onClick={() => handleOpenProfile(user.id)}
                  >
                    {user.username ? `@${user.username}` : "View profile"}
                  </p>
                  {typeof user.mutualFriendsCount === "number" && user.mutualFriendsCount > 0 && (
                    <p className="text-xs text-muted-foreground">
                      {user.mutualFriendsCount} mutual friend{user.mutualFriendsCount > 1 ? "s" : ""}
                    </p>
                  )}
                </div>
              </div>

              {/* Follow Button */}
              <Button
                size="sm"
                variant={followedUsers.has(user.id) ? "outline" : "default"}
                className={`ml-2 flex-shrink-0 h-8 px-3 text-xs font-semibold transition-all duration-200 ${
                  followedUsers.has(user.id)
                    ? "text-foreground border-border hover:bg-accent"
                    : "bg-primary text-white hover:bg-primary/90"
                }`}
                onClick={() => handleFollow(user.id)}
              >
                {followedUsers.has(user.id) ? "Following" : "Follow"}
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && suggestedUsers.length === 0 && (
        <div className="text-center py-6">
          <p className="text-sm text-muted-foreground">No suggestions available right now</p>
          <p className="text-xs text-muted-foreground mt-2">Come back later for more suggestions</p>
        </div>
      )}

      {/* See More Button */}
      {!isLoading && suggestedUsers.length > 0 && hasMore && (
        <div className="mt-4 text-center pt-3 border-t border-border">
          <Button
            variant="ghost"
            className="w-full text-xs font-semibold text-primary hover:text-primary-dark hover:bg-primary/10 transition-colors"
            onClick={handleSeeMore}
            disabled={isLoadingMore}
          >
            {isLoadingMore ? (
              <>
                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                Loading...
              </>
            ) : (
              "See more"
            )}
          </Button>
        </div>
      )}
    </div>
  );
};
