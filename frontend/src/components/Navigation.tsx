import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Home,
  Search,
  Play,
  Radio,
  Heart,
  MessageCircle,
  User,
  Settings,
  Bell,
  Crown,
  Gift,
  LogOut,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

interface NavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  className?: string;
  notificationCount?: number;
  onHoverChange?: (hovered: boolean) => void;
}

export const Navigation = ({
  activeTab,
  onTabChange,
  className,
  notificationCount,
  onHoverChange,
}: NavigationProps) => {
  const notifications = Math.max(0, Number(notificationCount ?? 0));
  const [messageBadges, setMessageBadges] = useState({ total: 0, chats: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const { logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    window.location.href = '/';
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
    onHoverChange?.(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    onHoverChange?.(false);
  };

  // Subscribe to global messages badge updates from useChat
  useEffect(() => {
    const onSet = (e: Event) => {
      const detail = (e as CustomEvent).detail as
        | { total?: number; chatsCount?: number }
        | undefined;
      setMessageBadges({
        total: Math.max(0, Number(detail?.total ?? 0)),
        chats: Math.max(0, Number(detail?.chatsCount ?? 0)),
      });
    };
    window.addEventListener(
      "treesh:messages-badge-set",
      onSet as EventListener
    );
    // Request initial state
    try {
      window.dispatchEvent(new Event("treesh:messages-badge-request"));
    } catch {}
    return () =>
      window.removeEventListener(
        "treesh:messages-badge-set",
        onSet as EventListener
      );
  }, []);

  // Allow rerender on chatRead; useChat updates its internal state on this event
  useEffect(() => {
    const onRead = () => setTimeout(() => {}, 0);
    window.addEventListener("chatRead", onRead);
    return () => window.removeEventListener("chatRead", onRead);
  }, []);

  const navItems = [
    { id: "home", label: "Home", icon: Home, badge: 0 },
    { id: "search", label: "Search", icon: Search, badge: 0 },
    { id: "reels", label: "Reels", icon: Play, badge: 0 },
    { id: "live", label: "Live", icon: Radio, badge: 0 },
    { id: "arcade", label: "Arcade", icon: Heart, badge: 0 },
    { id: "subscriptions", label: "Subscriptions", icon: Crown, badge: 0 },
    {
      id: "messages",
      label: "Messages",
      icon: MessageCircle,
      badge: messageBadges.chats,
    },
    {
      id: "notifications",
      label: "Notifications",
      icon: Bell,
      badge: notifications,
    },
    { id: "profile", label: "Profile", icon: User, badge: 0 },
  ];

  return (
    <nav
      className={cn(
        "bg-offwhite border-r border-accent/20 shadow-sm transition-all duration-300 fixed left-0 top-0 h-screen z-40",
        isHovered ? "w-64" : "w-16",
        className
      )}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="px-3 pt-2 pb-3 h-full flex flex-col">
        {/* Brand */}
        <button
          type="button"
          onClick={() => onTabChange("home")}
          className={cn(
            "mb-2 flex h-12 w-full items-center rounded-xl border border-transparent transition-all duration-300 hover:bg-primary/5",
            isHovered ? "justify-start px-2" : "justify-center px-0"
          )}
          title={!isHovered ? "Treesh" : ""}
        >
          <div className="flex items-center gap-3 w-full">
            <img
              src="/logo.svg"
              alt="Treesh"
              className="w-8 h-8 object-contain flex-shrink-0"
            />
            <span
              className={cn(
                "text-xl font-bold text-primary whitespace-nowrap transition-all duration-300",
                !isHovered && "opacity-0 w-0 overflow-hidden"
              )}
            >
              Treesh
            </span>
          </div>
        </button>

        <div className="mb-2 border-t border-accent/20" />

        {/* Navigation Items */}
        <div className="flex-1 flex flex-col gap-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <Button
                key={item.id}
                variant={isActive ? "default" : "ghost"}
                className={cn(
                  "transition-all duration-300 flex-shrink-0 h-12",
                  isHovered ? "justify-start px-4" : "justify-center px-2",
                  isActive && "bg-primary hover:bg-primary-dark text-white rounded-xl",
                  !isActive && !isHovered && "rounded-xl"
                )}
                onClick={() => onTabChange(item.id)}
                title={!isHovered ? item.label : ""}
              >
                <div className="flex items-center gap-3 relative w-full">
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <span
                    className={cn(
                      "font-medium whitespace-nowrap transition-all duration-300",
                      !isHovered && "opacity-0 w-0 overflow-hidden"
                    )}
                  >
                    {item.label}
                  </span>
                  {item.badge > 0 && (
                    <Badge
                      variant="destructive"
                      className={cn(
                        "h-5 w-5 p-0 flex items-center justify-center text-xs flex-shrink-0 transition-all duration-300",
                        !isHovered && "-ml-8"
                      )}
                    >
                      {item.badge > 9 ? "9+" : item.badge}
                    </Badge>
                  )}
                </div>
              </Button>
            );
          })}
        </div>

        {/* Settings - Always at bottom */}
        <div className="mt-auto pt-4 border-t border-accent/20 flex-shrink-0 space-y-2">
          <Button
            variant="ghost"
            className={cn(
              "transition-all duration-300 flex-shrink-0 w-full h-12 rounded-xl font-inter text-red-500 hover:bg-red-50 hover:text-red-600",
              isHovered ? "justify-start px-4" : "justify-center px-2"
            )}
            onClick={handleLogout}
            title={!isHovered ? "Logout" : ""}
          >
            <div className="flex items-center gap-3 relative w-full">
              <LogOut className="w-5 h-5 flex-shrink-0" />
              <span
                className={cn(
                  "font-medium whitespace-nowrap transition-all duration-300",
                  !isHovered && "opacity-0 w-0 overflow-hidden"
                )}
              >
                Logout
              </span>
            </div>
          </Button>
          <Button
            variant="ghost"
            className={cn(
              "transition-all duration-300 flex-shrink-0 w-full h-12 rounded-xl font-inter",
              isHovered ? "justify-start px-4" : "justify-center px-2"
            )}
            onClick={() => onTabChange("settings")}
            title={!isHovered ? "Settings" : ""}
          >
            <div className="flex items-center gap-3 relative w-full">
              <Settings className="w-5 h-5 flex-shrink-0" />
              <span
                className={cn(
                  "font-medium whitespace-nowrap transition-all duration-300",
                  !isHovered && "opacity-0 w-0 overflow-hidden"
                )}
              >
                Settings
              </span>
            </div>
          </Button>
        </div>
      </div>
    </nav>
  );
};

// Mobile Navigation
export const MobileNavigation = ({
  activeTab,
  onTabChange,
  notificationCount,
}: NavigationProps) => {
  const notifications = Math.max(0, Number(notificationCount ?? 0));
  const [messageBadges, setMessageBadges] = useState({ total: 0, chats: 0 });
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const { logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    setShowMoreMenu(false);
    window.location.href = '/';
  };

  useEffect(() => {
    const onSet = (e: Event) => {
      const detail = (e as CustomEvent).detail as
        | { total?: number; chatsCount?: number }
        | undefined;
      setMessageBadges({
        total: Math.max(0, Number(detail?.total ?? 0)),
        chats: Math.max(0, Number(detail?.chatsCount ?? 0)),
      });
    };
    window.addEventListener(
      "treesh:messages-badge-set",
      onSet as EventListener
    );
    try {
      window.dispatchEvent(new Event("treesh:messages-badge-request"));
    } catch {}
    return () =>
      window.removeEventListener(
        "treesh:messages-badge-set",
        onSet as EventListener
      );
  }, []);

  useEffect(() => {
    const onRead = () => setTimeout(() => {}, 0);
    window.addEventListener("chatRead", onRead);
    return () => window.removeEventListener("chatRead", onRead);
  }, []);

  const navItems = [
    { id: "home", label: "Home", icon: Home, badge: 0 },
    { id: "search", label: "Search", icon: Search, badge: 0 },
    { id: "reels", label: "Reels", icon: Play, badge: 0 },
    { id: "arcade", label: "Arcade", icon: Heart, badge: 0 },
    {
      id: "messages",
      label: "Messages",
      icon: MessageCircle,
      badge: messageBadges.chats,
    },
  ];

  const moreItems = [
    { id: "notifications", label: "Notifications", icon: Bell, badge: notifications },
    { id: "profile", label: "Profile", icon: User, badge: 0 },
    { id: "settings", label: "Settings", icon: Settings, badge: 0 },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50 shadow-lg md:hidden">
      <div className="flex items-center justify-around py-2 px-1 sm:px-2 relative">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <Button
              key={item.id}
              variant="ghost"
              size="sm"
              className={cn(
                "flex flex-col items-center space-y-0.5 h-14 px-1.5 sm:px-2 min-w-0 font-inter text-xs sm:text-sm",
                isActive && "text-primary"
              )}
              onClick={() => {
                onTabChange(item.id);
                setShowMoreMenu(false);
              }}
            >
              <div className="relative">
                <Icon className="w-5 h-5" />
                {item.badge > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute -top-2 -right-2 h-4 w-4 p-0 flex items-center justify-center text-xs"
                  >
                    {item.badge > 9 ? "9+" : item.badge}
                  </Badge>
                )}
              </div>
              <span className="truncate max-w-full">{item.label}</span>
            </Button>
          );
        })}

        {/* More Menu Button */}
        <div className="relative">
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "flex flex-col items-center space-y-0.5 h-14 px-1.5 sm:px-2 min-w-0 font-inter text-xs sm:text-sm",
              showMoreMenu && "text-primary"
            )}
            onClick={() => setShowMoreMenu(!showMoreMenu)}
          >
            <div className="relative">
              <Settings className="w-5 h-5" />
            </div>
            <span className="truncate max-w-full">More</span>
          </Button>

          {/* More Menu Dropdown */}
          {showMoreMenu && (
            <div className="absolute bottom-full right-0 mb-2 bg-card border border-border rounded-lg shadow-xl w-48 p-2 space-y-1 z-[999]">
              {moreItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;

                return (
                  <Button
                    key={item.id}
                    variant="ghost"
                    className={cn(
                      "w-full justify-start text-xs sm:text-sm h-9",
                      isActive && "text-primary bg-primary/10"
                    )}
                    onClick={() => {
                      onTabChange(item.id);
                      setShowMoreMenu(false);
                    }}
                  >
                    <Icon className="w-4 h-4 mr-2 flex-shrink-0" />
                    <span className="flex-1 text-left">{item.label}</span>
                    {item.badge > 0 && (
                      <Badge
                        variant="destructive"
                        className="h-5 w-5 p-0 flex items-center justify-center text-xs flex-shrink-0 ml-2"
                      >
                        {item.badge > 9 ? "9+" : item.badge}
                      </Badge>
                    )}
                  </Button>
                );
              })}
              
              <div className="border-t border-border my-1" />
              
              <Button
                variant="ghost"
                className="w-full justify-start text-xs sm:text-sm h-9 text-red-500 hover:bg-red-50 hover:text-red-600"
                onClick={handleLogout}
              >
                <LogOut className="w-4 h-4 mr-2 flex-shrink-0" />
                <span className="flex-1 text-left">Logout</span>
              </Button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};
