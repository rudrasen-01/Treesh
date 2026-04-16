import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { usersAPI, UserProfile } from "@/services/api";
import { toast } from "@/hooks/use-toast";
import { Loader2, Users } from "lucide-react";

interface SuggestedUser extends UserProfile {
  isFollowing?: boolean;
}

interface FollowSuggestionsProps {
  layout?: "vertical" | "horizontal";
  limit?: number;
  className?: string;
  onFollow?: (userId: string) => void;
}

export const FollowSuggestions = ({
  layout = "vertical",
  limit = 5,
  className = "",
  onFollow,
}: FollowSuggestionsProps) => {
  const [suggestions, setSuggestions] = useState<SuggestedUser[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSuggestions = async () => {
    setLoading(true);
    try {
      const response = await usersAPI.getSuggestions(limit);
      if (response.success && response.data) {
        setSuggestions(response.data);
      }
    } catch (error) {
      console.error("Failed to fetch suggestions:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuggestions();
    
    // Listen for follow events globally to potentially refresh lists
    const handleFollowUpdate = () => {
      fetchSuggestions();
    };
    
    window.addEventListener("followUpdate", handleFollowUpdate);
    return () => {
      window.removeEventListener("followUpdate", handleFollowUpdate);
    };
  }, [limit]);

  const handleOpenProfile = (userId: string) => {
    window.dispatchEvent(
      new CustomEvent("navigateToUserProfile", { detail: { userId } })
    );
  };

  const handleFollowClick = async (userId: string) => {
    try {
      // Optimistically update UI
      setSuggestions((prev) => 
        prev.map((user) => 
          user.id === userId ? { ...user, isFollowing: true } : user
        )
      );

      const response = await usersAPI.followUser(userId);
      if (response.success) {
        toast({
          title: "Followed!",
          description: "You are now following this user",
        });
        
        // Notify other components
        window.dispatchEvent(new Event("followUpdate"));
        if (onFollow) onFollow(userId);
      } else {
        // Revert on failure
        setSuggestions((prev) => 
          prev.map((user) => 
            user.id === userId ? { ...user, isFollowing: false } : user
          )
        );
        toast({
          title: "Error",
          description: "Failed to follow user",
          variant: "destructive",
        });
      }
    } catch (error) {
      // Revert on failure
      setSuggestions((prev) => 
        prev.map((user) => 
          user.id === userId ? { ...user, isFollowing: false } : user
        )
      );
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <Card className={`overflow-hidden border-border bg-card/90 backdrop-blur-sm shadow-sm ${className}`}>
        <CardHeader className="py-4">
          <CardTitle className="text-lg font-bold font-treesh flex items-center">
            <Users className="w-5 h-5 mr-2 text-primary" />
            Who to Follow
          </CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center py-6">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (suggestions.length === 0) {
    return null; // Don't show anything if no suggestions available
  }

  if (layout === "horizontal") {
    return (
      <div className={`my-6 ${className}`}>
        <div className="flex items-center justify-between mb-3 px-1">
          <h3 className="text-sm font-semibold text-foreground font-inter flex items-center gap-2 leading-none">
            <Users className="w-4 h-4 text-primary flex-shrink-0" />
            Suggested for you
          </h3>
          <Button variant="ghost" size="sm" className="text-xs h-8 text-primary font-medium" onClick={fetchSuggestions}>
            Refresh
          </Button>
        </div>
        
        <div className="flex space-x-3 overflow-x-auto pb-4 scrollbar-hide snap-x">
          {suggestions.map((user) => (
            <Card key={user.id} className="min-w-[160px] max-w-[160px] flex-shrink-0 snap-start border-accent/20 hover:shadow-md transition-shadow">
              <CardContent className="p-4 flex flex-col items-center text-center">
                <Avatar
                  className="w-16 h-16 mb-3 ring-2 ring-primary/10 cursor-pointer"
                  onClick={() => handleOpenProfile(user.id)}
                >
                  <AvatarImage src={user.avatar || "/placeholder.svg"} />
                  <AvatarFallback className="bg-primary/10 text-primary font-bold text-lg">
                    {user.fullName?.charAt(0) || user.username?.charAt(0) || "?"}
                  </AvatarFallback>
                </Avatar>
                
                <h4
                  className="font-semibold text-sm truncate w-full flex items-center justify-center cursor-pointer hover:text-primary transition-colors"
                  onClick={() => handleOpenProfile(user.id)}
                >
                  {user.fullName || user.username}
                  {user.isStreamer && (
                    <Badge className="ml-1 bg-blue-500 text-white text-[10px] w-4 h-4 p-0 flex items-center justify-center rounded-full">✓</Badge>
                  )}
                </h4>
                <p
                  className="text-xs text-muted-foreground truncate w-full mb-3 cursor-pointer hover:text-primary transition-colors"
                  onClick={() => handleOpenProfile(user.id)}
                >
                  {user.username ? `@${user.username}` : "View profile"}
                </p>
                
                <Button 
                  size="sm" 
                  className={`w-full text-xs font-medium rounded-full ${user.isFollowing ? 'bg-muted text-foreground hover:bg-muted/80' : 'bg-primary text-white hover:bg-primary-dark'}`}
                  variant={user.isFollowing ? "secondary" : "default"}
                  onClick={() => handleFollowClick(user.id)}
                  disabled={user.isFollowing}
                >
                  {user.isFollowing ? 'Following' : 'Follow'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Vertical layout (for right sidebar)
  return (
    <Card className={`overflow-hidden border-none shadow-sm bg-transparent ${className}`}>
      <CardHeader className="py-4 px-0 flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-bold text-foreground font-inter">
          Who to Follow
        </CardTitle>
        <Button variant="ghost" size="sm" className="h-6 text-xs font-medium text-primary hover:bg-primary/10 px-2" onClick={fetchSuggestions}>
          Refresh
        </Button>
      </CardHeader>
      <CardContent className="p-0 space-y-4">
        {suggestions.map((user) => (
          <div key={user.id} className="flex items-center justify-between group">
            <div className="flex items-center space-x-3 overflow-hidden">
              <Avatar
                className="w-10 h-10 ring-1 ring-black/5 group-hover:ring-primary/30 transition-all cursor-pointer"
                onClick={() => handleOpenProfile(user.id)}
              >
                <AvatarImage src={user.avatar || "/placeholder.svg"} />
                <AvatarFallback className="bg-primary/10 text-primary font-medium">
                  {user.fullName?.charAt(0) || user.username?.charAt(0) || "?"}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col overflow-hidden">
                <div className="flex items-center space-x-1">
                  <span
                    className="font-semibold text-sm truncate text-foreground group-hover:text-primary transition-colors cursor-pointer"
                    onClick={() => handleOpenProfile(user.id)}
                  >
                    {user.fullName || user.username}
                  </span>
                  {user.isStreamer && (
                    <Badge className="bg-blue-500 text-white text-[8px] w-3 h-3 p-0 flex items-center justify-center rounded-full flex-shrink-0">✓</Badge>
                  )}
                </div>
                <span
                  className="text-xs text-muted-foreground truncate cursor-pointer hover:text-primary transition-colors"
                  onClick={() => handleOpenProfile(user.id)}
                >
                  {user.username ? `@${user.username}` : "View profile"}
                </span>
              </div>
            </div>
            <Button 
              size="sm" 
              className={`h-7 px-3 text-xs font-medium rounded-full transition-all ${user.isFollowing ? 'bg-muted text-foreground hover:bg-muted/80' : 'bg-primary text-white hover:bg-primary/90'}`}
              variant={user.isFollowing ? "secondary" : "default"}
              onClick={() => handleFollowClick(user.id)}
              disabled={user.isFollowing}
            >
              {user.isFollowing ? 'Following' : 'Follow'}
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
