import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Crown,
  Star,
  Heart,
  Users,
  Calendar,
  CreditCard,
  Gift,
  Plus,
  Settings,
  CheckCircle,
  XCircle,
  AlertCircle,
  Zap,
  Shield,
  Lock,
  Unlock,
  Star as StarIcon,
  Heart as HeartIcon,
  Crown as CrownIcon,
  Gift as GiftIcon,
  CreditCard as PaymentIcon,
  Users as SubscribersIcon,
  TrendingUp,
  Bell,
  Clock,
  Check,
  X,
  ArrowRight,
  Play,
  Pause,
  RefreshCw,
  Download,
  Upload,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Filter,
  Search,
  SortAsc,
  SortDesc,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { getApiBaseUrl } from "@/config/env";
import { subscriptionAPI } from "@/services/api";

// Mock data for active subscriptions
const mockActiveSubscriptions = [
  {
    id: "1",
    streamer: {
      id: "1",
      name: "Emma Wilson",
      username: "emma_gaming",
      avatar: "/placeholder.svg",
      verified: true,
      followers: 125000,
      isLive: true,
      category: "Gaming",
    },
    tier: "diamond",
    price: 16.99,
    status: "active",
    startDate: "2024-01-15T00:00:00Z",
    nextBilling: "2024-02-15T00:00:00Z",
    autoRenew: true,
    benefits: [
      "Diamond subscriber badge",
      "Custom emotes (10)",
      "VIP chat access",
      "Exclusive merchandise",
    ],
  },
  {
    id: "2",
    streamer: {
      id: "2",
      name: "Alex Chen",
      username: "alex_fitness",
      avatar: "/placeholder.svg",
      verified: true,
      followers: 89000,
      isLive: false,
      category: "Fitness",
    },
    tier: "gold",
    price: 9.99,
    status: "active",
    startDate: "2024-01-10T00:00:00Z",
    nextBilling: "2024-02-10T00:00:00Z",
    autoRenew: true,
    benefits: [
      "Gold subscriber badge",
      "Custom emotes (5)",
      "Priority chat access",
      "Exclusive content library",
    ],
  },
];

// Mock data for subscription history
const mockSubscriptionHistory = [
  {
    id: "1",
    streamer: {
      name: "Sarah Johnson",
      username: "sarah_art",
      avatar: "/placeholder.svg",
    },
    tier: "chrome",
    price: 39.99,
    status: "expired",
    startDate: "2023-11-01T00:00:00Z",
    endDate: "2024-01-01T00:00:00Z",
    cancelledAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "2",
    streamer: {
      name: "Mike Rodriguez",
      username: "mike_tech",
      avatar: "/placeholder.svg",
    },
    tier: "diamond",
    price: 16.99,
    status: "cancelled",
    startDate: "2023-12-01T00:00:00Z",
    endDate: "2024-01-01T00:00:00Z",
    cancelledAt: "2024-01-01T00:00:00Z",
  },
];

// Mock data for streamer discovery
const mockStreamerDiscovery = [
  {
    id: "1",
    name: "Jessica Kim",
    username: "jessica_food",
    avatar: "/placeholder.svg",
    verified: true,
    followers: 156000,
    isLive: true,
    category: "Food & Cooking",
    description: "Professional chef sharing cooking tips and recipes",
    subscriptionTiers: ["gold", "diamond"],
    topTier: "diamond",
    subscriberCount: 2340,
    rating: 4.8,
  },
  {
    id: "2",
    name: "David Park",
    username: "david_music",
    avatar: "/placeholder.svg",
    verified: true,
    followers: 203000,
    isLive: false,
    category: "Music",
    description: "Pianist and music producer creating original compositions",
    subscriptionTiers: ["gold", "diamond", "chrome"],
    topTier: "chrome",
    subscriberCount: 1890,
    rating: 4.9,
  },
  {
    id: "3",
    name: "Lisa Wang",
    username: "lisa_travel",
    avatar: "/placeholder.svg",
    verified: false,
    followers: 67000,
    isLive: true,
    category: "Travel",
    description: "Adventure traveler exploring the world",
    subscriptionTiers: ["gold"],
    topTier: "gold",
    subscriberCount: 890,
    rating: 4.6,
  },
];

export const SubscriptionsPage = () => {
  const [subscriptionTiers, setSubscriptionTiers] = useState<any[]>([]);
  const [tiersLoading, setTiersLoading] = useState(true);
  const [activeSubscriptions, setActiveSubscriptions] = useState<any[]>([]);
  const [subscriptionHistory, setSubscriptionHistory] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("active");
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [showGiftModal, setShowGiftModal] = useState(false);
  const [showManageModal, setShowManageModal] = useState(false);
  const [selectedStreamer, setSelectedStreamer] = useState<any>(null);
  const [selectedTier, setSelectedTier] = useState("");
  const [giftQuantity, setGiftQuantity] = useState(1);
  const [giftRecipients, setGiftRecipients] = useState<string[]>([]);
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [autoRenew, setAutoRenew] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("popularity");
  const { user } = useAuth();

  const token = localStorage.getItem("token");

  const loadUserSubscriptions = async () => {
    if (!token) {
      setActiveSubscriptions([]);
      setSubscriptionHistory([]);
      return;
    }

    try {
      const response = await fetch(
        `${getApiBaseUrl()}/payment/my-plan-subscriptions`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          cache: "no-store",
        },
      );

      const parsed = await response.json();
      if (!parsed?.success) {
        setActiveSubscriptions([]);
        setSubscriptionHistory([]);
        return;
      }

      const active = Array.isArray(parsed?.data?.active) ? parsed.data.active : [];
      const history = Array.isArray(parsed?.data?.history) ? parsed.data.history : [];

      const toUiShape = (sub: any) => ({
        id: sub._id,
        streamer: {
          id: "platform",
          name: "Treesh",
          username: "treesh",
          avatar: "/placeholder.svg",
          verified: true,
          followers: 0,
          isLive: false,
          category: "Subscription",
        },
        tier: sub.planCode || "plan",
        price: Number(sub.price || 0),
        status: sub.status || "active",
        paymentStatus: sub.paymentStatus || "pending",
        startDate: sub.startsAt || sub.createdAt,
        nextBilling: sub.endsAt,
        endDate: sub.endsAt,
        autoRenew: true,
        isGifted: sub.isGifted || false,
        benefits: Array.isArray(sub?.planId?.features) ? sub.planId.features : [],
        planName: sub.planName || sub?.planId?.name || "Subscription",
      });

      setActiveSubscriptions(active.map(toUiShape));
      setSubscriptionHistory(history.map(toUiShape));
    } catch (error) {
      console.error("Failed to load user subscriptions:", error);
      setActiveSubscriptions([]);
      setSubscriptionHistory([]);
    }
  };

  useEffect(() => {
    const loadTiers = async () => {
      setTiersLoading(true);
      try {
        const response = await subscriptionAPI.getTiers();
        if (!response.success || !Array.isArray(response.data)) {
          setSubscriptionTiers([]);
          return;
        }

        const normalized = response.data.map((tier: any) => {
          const id = String(tier.id || tier.code || "").toLowerCase();
          const planId = String(tier.planId || tier._id || "");
          const icon =
            id === "chrome" ? Crown : id === "diamond" ? Heart : Star;
          const color =
            id === "chrome" ? "bg-blue-500" : id === "diamond" ? "bg-red-500" : "bg-yellow-500";

          return {
            id,
            planId,
            name: tier.name || "Subscription Tier",
            price: Number(tier.price) || 0,
            color,
            icon,
            features: Array.isArray(tier.features) ? tier.features : [],
            popular: false,
            subscribers: 0,
            revenue: 0,
          };
        });

        setSubscriptionTiers(normalized);
      } catch (error) {
        console.error("Failed to load dynamic subscription tiers:", error);
        setSubscriptionTiers([]);
      } finally {
        setTiersLoading(false);
      }
    };

    loadTiers();
  }, []);

  useEffect(() => {
    loadUserSubscriptions();
  }, [token]);

  const getTierById = (tierId: string) =>
    subscriptionTiers.find((tier) => tier.id === tierId) || null;

  const handlePayment = async (tier: any, quantity = 1) => {
    try {
      if (!user) {
        toast({
          title: "Please login first",
          variant: "destructive",
        });
        return;
      }

      const res = await fetch(
        `${getApiBaseUrl()}/payment/create-order`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ planId: tier.planId || tier.id, quantity }),
        },
      );

      const orderData = await res.json();
      if (!orderData?.success || !orderData?.order) {
        toast({
          title: "Unable to create payment order",
          description: orderData?.error || "Please try again.",
          variant: "destructive",
        });
        return;
      }

      const order = orderData.order;
      const razorpayKey =
        orderData?.razorpayKeyId || import.meta.env.VITE_RAZORPAY_KEY_ID;

      if (!razorpayKey || String(razorpayKey).trim() === "") {
        toast({
          title: "Payment configuration is incomplete",
          description:
            "Razorpay key is missing. Set VITE_RAZORPAY_KEY_ID or expose key from backend.",
          variant: "destructive",
        });
        return;
      }

      // DEBUG: Log payment info
      console.log("🔵 Razorpay Payment Init:", {
        key: razorpayKey?.substring(0, 10) + "...",
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        planName: tier.name,
      });

      const options = {
        key: razorpayKey,
        amount: order.amount,
        currency: order.currency,
        name: "Treesh",
        description: `${tier.name} Subscription`,
        order_id: order.id,

        handler: async function (response: any) {
          const verifyRes = await fetch(
            `${getApiBaseUrl()}/payment/verify-payment`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
              },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                planId: tier.planId,
              }),
            },
          );

          const verifyData = await verifyRes.json();

          if (verifyData.success) {
            await loadUserSubscriptions();
            toast({
              title: "Payment Successful 🎉",
              description: "Your subscription is now active.",
            });
          } else {
            toast({
              title: "Payment Verification Failed",
              description: verifyData?.error || "Please contact support if amount was debited.",
              variant: "destructive",
            });
          }
        },

        theme: { color: "#7c3aed" },
      };

      const razor = new (window as any).Razorpay(options);
      razor.open();
    } catch (error) {
      console.error("Payment error:", error);
    }
  };

  // Keep mock streamer discovery while subscriptions are now backend-driven
  const streamerDiscovery = mockStreamerDiscovery;

  const handleSubscribe = (streamer: any, tier: string) => {
    setSelectedStreamer(streamer);
    setSelectedTier(tier);
    setShowSubscriptionModal(true);
  };

  const handleGiftSubscription = (streamer: any) => {
    setSelectedStreamer(streamer);
    setShowGiftModal(true);
  };

  const handleManageSubscription = (subscription: any) => {
    setSelectedStreamer(subscription.streamer);
    setSelectedTier(subscription.tier);
    setShowManageModal(true);
  };

  const confirmSubscription = () => {
    if (!selectedStreamer || !selectedTier) return;

    const tier = subscriptionTiers.find((t) => t.id === selectedTier);
    if (!tier) return;

    toast({
      title: "Subscription Successful! 🎉",
      description: `You are now subscribed to ${selectedStreamer.name} at ${tier.name} tier!`,
    });

    setShowSubscriptionModal(false);
    setSelectedStreamer(null);
    setSelectedTier("");
  };

  const confirmGiftSubscription = () => {
    if (!selectedStreamer || giftQuantity < 1) return;

    const tier = subscriptionTiers.find((t) => t.id === selectedTier);
    if (!tier) return;

    toast({
      title: "Gift Subscriptions Sent! 🎁",
      description: `Successfully sent ${giftQuantity} ${tier.name} subscriptions to ${selectedStreamer.name}!`,
    });

    setShowGiftModal(false);
    setSelectedStreamer(null);
    setSelectedTier("");
    setGiftQuantity(1);
  };

  const cancelSubscription = (subscriptionId: string) => {
    if (
      confirm(
        "Are you sure you want to cancel this subscription? You will lose access to perks at the end of the current billing period.",
      )
    ) {
      toast({
        title: "Subscription Cancelled",
        description: "Your subscription will end at the next billing cycle.",
      });
    }
  };

  const toggleAutoRenew = (subscriptionId: string) => {
    toast({
      title: "Auto-renewal Updated",
      description: "Your auto-renewal preference has been updated.",
    });
  };

  const filteredStreamers = streamerDiscovery.filter(
    (streamer) =>
      streamer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      streamer.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      streamer.category.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const sortedStreamers = [...filteredStreamers].sort((a, b) => {
    switch (sortBy) {
      case "popularity":
        return b.followers - a.followers;
      case "subscribers":
        return b.subscriberCount - a.subscriberCount;
      case "rating":
        return b.rating - a.rating;
      default:
        return 0;
    }
  });

  const renderDiscover = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2">Discover Amazing Streamers</h2>
        <p className="text-muted-foreground">
          Support your favorite creators and unlock exclusive content
        </p>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search streamers by name, username, or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-full md:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="popularity">Sort by Popularity</SelectItem>
            <SelectItem value="subscribers">Sort by Subscribers</SelectItem>
            <SelectItem value="rating">Sort by Rating</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Subscription Tiers Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {!tiersLoading && subscriptionTiers.length === 0 && (
          <Card className="md:col-span-3">
            <CardContent className="py-8 text-center text-muted-foreground">
              No subscription plans available yet. Please check again after admin adds plans.
            </CardContent>
          </Card>
        )}
        {subscriptionTiers.map((tier) => (
          <Card
            key={tier.id}
            className={`relative ${tier.popular ? "ring-2 ring-primary" : ""
              } h-full flex flex-col`}
          >
            {tier.popular && (
              <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary">
                Most Popular
              </Badge>
            )}
            <CardHeader className="text-center">
              <div
                className={`w-16 h-16 rounded-full ${tier.color} flex items-center justify-center mx-auto mb-4`}
              >
                <tier.icon className="w-8 h-8 text-white" />
              </div>
              <CardTitle>{tier.name}</CardTitle>
              <div className="text-3xl font-bold">
                ${tier.price}
                <span className="text-sm font-normal text-muted-foreground">
                  /month
                </span>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col flex-1">
              <ul className="space-y-3 mb-6">
                {tier.features.map((feature, index) => (
                  <li key={index} className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
              <div className="text-center text-sm text-muted-foreground mb-4">
                <p>{tier.subscribers.toLocaleString()} active subscribers</p>
                <p>${tier.revenue.toLocaleString()} monthly revenue</p>
              </div>
              <Button
                onClick={() => handlePayment(tier)}
                className="w-full mt-auto bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-600 text-white font-semibold"
              >
                <Zap className="w-4 h-4 mr-2" />
                Buy Now
              </Button>{" "}
              {/* <Button className="w-full mt-auto bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-600 text-white font-semibold shadow-md hover:shadow-lg hover:scale-[1.01] transition-all">
                <Zap className="w-4 h-4 mr-2" />
                Buy Now
              </Button> */}
            </CardContent>
          </Card>
        ))}
      </div>
      {/* Streamer Discovery Grid removed as requested */}

      {/* Gift Subscriptions Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Gift className="w-5 h-5" />
            <span>Gift Subscriptions</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            Surprise your friends with a subscription to their favorite
            streamer! Gift subscriptions include all the same perks and
            benefits.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {subscriptionTiers.map((tier) => (
              <div key={tier.id} className="text-center p-4 border rounded-lg">
                <tier.icon
                  className={`w-8 h-8 mx-auto mb-2 ${tier.color.replace(
                    "bg-",
                    "text-",
                  )}`}
                />
                <h4 className="font-semibold">{tier.name}</h4>
                <p className="text-2xl font-bold text-primary">${tier.price}</p>
                <p className="text-sm text-muted-foreground">per month</p>
                {/* <Button className="mt-3 w-full bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-white font-semibold shadow-md hover:shadow-lg hover:scale-[1.01] transition-all">
                  <Zap className="w-4 h-4 mr-2" />
                  Buy Now
                </Button> */}
                <Button
                  onClick={() => handlePayment(tier, giftQuantity)}
                  className="w-full mt-auto bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-600 text-white font-semibold"
                >
                  <Zap className="w-4 h-4 mr-2" />
                  Buy Now
                </Button>{" "}
              </div>
            ))}
            {!tiersLoading && subscriptionTiers.length === 0 && (
              <p className="text-sm text-muted-foreground md:col-span-3 text-center">
                Gift plans will appear here after admin creates subscription plans.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderActive = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Heart className="w-5 h-5 text-red-500" />
            <span>Active Subscriptions</span>
          </CardTitle>
          <CardDescription>
            Your current active subscriptions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {activeSubscriptions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Heart className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold mb-2">
                No Active Subscriptions
              </h3>
              <p className="mb-4">
                Start by discovering and subscribing to your favorite creators!
              </p>
              <Button 
                onClick={() => setActiveTab("discover")}
                className="bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-600 text-white font-semibold"
              >
                <Zap className="w-4 h-4 mr-2" />
                Explore Plans
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {activeSubscriptions.map((subscription) => (
                <div key={subscription.id} className="border rounded-lg p-4 bg-card hover:bg-accent/50 transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={subscription.streamer.avatar} />
                        <AvatarFallback>{subscription.streamer.name[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold">{subscription.planName}</p>
                        <p className="text-sm text-muted-foreground">{subscription.streamer.name}</p>
                      </div>
                    </div>
                    <Badge className="bg-green-100 text-green-800 border-green-200">
                      Active
                    </Badge>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-sm mb-3">
                    <div>
                      <span className="text-muted-foreground block text-xs">Price</span>
                      <p className="font-semibold">${subscription.price.toFixed(2)}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-xs">Renews</span>
                      <p className="font-semibold">
                        {subscription.nextBilling 
                          ? new Date(subscription.nextBilling).toLocaleDateString()
                          : "N/A"}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-xs">Duration</span>
                      <p className="font-semibold">30 days</p>
                    </div>
                  </div>

                  {subscription.benefits && subscription.benefits.length > 0 && (
                    <div className="mb-3">
                      <p className="text-xs font-semibold mb-2">Benefits:</p>
                      <ul className="text-xs space-y-1">
                        {subscription.benefits.slice(0, 3).map((benefit, idx) => (
                          <li key={idx} className="flex items-center space-x-2">
                            <CheckCircle className="w-3 h-3 text-green-500" />
                            <span>{benefit}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <Button 
                    variant="outline" 
                    size="sm"
                    className="w-full"
                  >
                    Manage Subscription
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const renderHistory = () => {
    // Status info for display
    const statusConfig = {
      active: { color: "bg-green-100 text-green-800", icon: "✓", label: "Active" },
      expired: { color: "bg-gray-100 text-gray-800", icon: "⏱", label: "Expired" },
      cancelled: { color: "bg-yellow-100 text-yellow-800", icon: "✕", label: "Cancelled" },
      pending: { color: "bg-blue-100 text-blue-800", icon: "⋯", label: "Pending" },
      failed: { color: "bg-red-100 text-red-800", icon: "✗", label: "Failed" },
    };

    const paymentStatusConfig = {
      completed: { color: "bg-green-50 text-green-700", label: "Paid" },
      pending: { color: "bg-blue-50 text-blue-700", label: "Awaiting Payment" },
      failed: { color: "bg-red-50 text-red-700", label: "Payment Failed" },
      refunded: { color: "bg-purple-50 text-purple-700", label: "Refunded" },
    };

    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="w-5 h-5" />
              <span>Transaction History</span>
            </CardTitle>
            <CardDescription>
              All your subscription transactions - active, expired, cancelled, and failed
            </CardDescription>
          </CardHeader>
          <CardContent>
            {subscriptionHistory.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Clock className="w-16 h-16 mx-auto mb-4 opacity-30" />
                <h3 className="text-lg font-semibold mb-2">
                  No Transaction History
                </h3>
                <p>
                  Your transaction history will appear here once you subscribe to plans.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {subscriptionHistory.map((subscription) => {
                  const statusInfo = statusConfig[subscription.status as keyof typeof statusConfig] || statusConfig.pending;
                  const paymentInfo = paymentStatusConfig[subscription.paymentStatus as keyof typeof paymentStatusConfig] || paymentStatusConfig.pending;

                  return (
                    <div 
                      key={subscription.id} 
                      className="border rounded-lg p-4 bg-card hover:bg-accent/30 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        {/* Left: Plan Info */}
                        <div className="flex items-start space-x-3 flex-1 min-w-0">
                          <Avatar className="w-10 h-10 flex-shrink-0">
                            <AvatarImage src={subscription.streamer.avatar} />
                            <AvatarFallback>{subscription.streamer.name[0]}</AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <h4 className="font-semibold text-sm truncate">
                              {subscription.planName}
                            </h4>
                            <p className="text-xs text-muted-foreground">
                              {subscription.streamer.name} • ${subscription.price.toFixed(2)}
                            </p>
                          </div>
                        </div>

                        {/* Right: Status & Payment */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {/* Subscription Status */}
                          <Badge className={statusInfo.color + " border-0"}>
                            {statusInfo.label}
                          </Badge>
                          
                          {/* Payment Status */}
                          <Badge variant="outline" className={paymentInfo.color + " border"}>
                            {paymentInfo.label}
                          </Badge>
                        </div>
                      </div>

                      {/* Timeline Info */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3 pt-3 border-t border-border/50">
                        <div className="text-xs">
                          <span className="text-muted-foreground block">Started</span>
                          <p className="font-medium text-sm">
                            {subscription.startDate
                              ? new Date(subscription.startDate).toLocaleDateString()
                              : "N/A"}
                          </p>
                        </div>
                        <div className="text-xs">
                          <span className="text-muted-foreground block">Expires</span>
                          <p className="font-medium text-sm">
                            {subscription.endDate
                              ? new Date(subscription.endDate).toLocaleDateString()
                              : "N/A"}
                          </p>
                        </div>
                        <div className="text-xs">
                          <span className="text-muted-foreground block">Duration</span>
                          <p className="font-medium text-sm">
                            {subscription.startDate && subscription.endDate
                              ? Math.ceil(
                                  (new Date(subscription.endDate).getTime() -
                                    new Date(subscription.startDate).getTime()) /
                                  (1000 * 60 * 60 * 24),
                                ) + " days"
                              : "N/A"}
                          </p>
                        </div>
                        <div className="text-xs">
                          <span className="text-muted-foreground block">Amount</span>
                          <p className="font-medium text-sm">
                            ${(subscription.price || 0).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  };

  // Billing section removed as requested

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <header className="bg-card border-b border-border px-4 py-3 flex items-center justify-between sticky top-0 z-30 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="flex flex-col">
            <h1 className="text-lg font-bold text-foreground">Subscriptions</h1>
            <p className="text-sm text-muted-foreground">
              Manage your streaming subscriptions
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 hover:bg-muted"
          >
            <Search className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 hover:bg-muted"
          >
            <Filter className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto p-4">
        {/* Stats Overview - DYNAMIC */}
        {/* Calculate stats from real subscription data */}
        {(() => {
          const activeCount = activeSubscriptions.length;
          const monthlySpending = activeSubscriptions.reduce((sum, sub) => sum + (Number(sub.price) || 0), 0);
          const uniqueStreamers = new Set(activeSubscriptions.map(sub => sub.streamer?.username)).size;
          const totalGifts = activeSubscriptions.filter(sub => sub.isGifted).length;
          
          return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="flex items-center justify-center w-12 h-12 bg-blue-100 dark:bg-blue-950/50 rounded-full mx-auto mb-3">
                    <Crown className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="text-2xl font-bold text-foreground">{activeCount}</div>
                  <div className="text-sm text-muted-foreground">Active Subscriptions</div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 text-center">
                  <div className="flex items-center justify-center w-12 h-12 bg-green-100 dark:bg-green-950/50 rounded-full mx-auto mb-3">
                    <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="text-2xl font-bold text-foreground">${monthlySpending.toFixed(2)}</div>
                  <div className="text-sm text-muted-foreground">Monthly Spending</div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 text-center">
                  <div className="flex items-center justify-center w-12 h-12 bg-purple-100 dark:bg-purple-950/50 rounded-full mx-auto mb-3">
                    <Users className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="text-2xl font-bold text-foreground">{uniqueStreamers}</div>
                  <div className="text-sm text-muted-foreground">Total Streamers</div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 text-center">
                  <div className="flex items-center justify-center w-12 h-12 bg-orange-100 dark:bg-orange-950/50 rounded-full mx-auto mb-3">
                    <Gift className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div className="text-2xl font-bold text-foreground">{totalGifts}</div>
                  <div className="text-sm text-muted-foreground">Gifts Sent</div>
                </CardContent>
              </Card>
            </div>
          );
        })()}

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 h-10 sm:h-12 mb-4 sm:mb-6">
            <TabsTrigger value="active" className="text-xs sm:text-sm">
              <Heart className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              <span>Active</span>
            </TabsTrigger>
            <TabsTrigger value="discover" className="text-xs sm:text-sm">
              Discover
            </TabsTrigger>
            <TabsTrigger value="history" className="text-xs sm:text-sm">
              History
            </TabsTrigger>
          </TabsList>

          {/* Active Tab */}
          <TabsContent value="active" className="space-y-6">
            {renderActive()}
          </TabsContent>

          {/* Discover Tab */}
          <TabsContent value="discover" className="space-y-6">
            {renderDiscover()}
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="space-y-6">
            {renderHistory()}
          </TabsContent>
        </Tabs>

        {/* Subscription Modal */}
        <Dialog
          open={showSubscriptionModal}
          onOpenChange={setShowSubscriptionModal}
        >
          <DialogContent className="w-[95vw] max-w-md">
            <DialogHeader>
              <DialogTitle>Subscribe to {selectedStreamer?.name}</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              {selectedTier && (
                (() => {
                  const selectedTierData = getTierById(selectedTier);
                  if (!selectedTierData) return null;
                  const SelectedIcon = selectedTierData.icon || Star;

                  return (
                <div className="text-center p-4 border rounded-lg">
                  <div
                    className={`w-16 h-16 rounded-full mx-auto mb-4 ${selectedTierData.color || "bg-yellow-500"} flex items-center justify-center`}
                  >
                    <SelectedIcon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold">
                    {selectedTierData.name}
                  </h3>
                  <p className="text-3xl font-bold text-primary">
                    ${selectedTierData.price}
                    /month
                  </p>
                </div>
                  );
                })()
              )}

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span>Payment Method:</span>
                  <Select
                    value={paymentMethod}
                    onValueChange={setPaymentMethod}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="card">Credit Card</SelectItem>
                      <SelectItem value="paypal">PayPal</SelectItem>
                      <SelectItem value="wallet">Wallet</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="auto-renew"
                    checked={autoRenew}
                    onChange={(e) => setAutoRenew(e.target.checked)}
                    className="rounded"
                  />
                  <Label htmlFor="auto-renew">Auto-renew subscription</Label>
                </div>
              </div>

              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setShowSubscriptionModal(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                {/* <Button onClick={confirmSubscription} className="flex-1">
                  Subscribe Now
                </Button> */}
                <Button
                  className="flex-1"
                  onClick={() => {
                    const tier = subscriptionTiers.find(
                      (t) => t.id === selectedTier,
                    );
                    if (tier) {
                      handlePayment(tier);
                    }
                  }}
                >
                  Subscribe Now
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Gift Subscription Modal */}
        <Dialog open={showGiftModal} onOpenChange={setShowGiftModal}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                Gift Subscription to {selectedStreamer?.name}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label>Select Tier</Label>
                <Select value={selectedTier} onValueChange={setSelectedTier}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a tier" />
                  </SelectTrigger>
                  <SelectContent>
                    {subscriptionTiers.map((tier) => (
                      <SelectItem key={tier.id} value={tier.id}>
                        {tier.name} - ${tier.price}/month
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Quantity</Label>
                <Input
                  type="number"
                  min="1"
                  max="10"
                  value={giftQuantity}
                  onChange={(e) =>
                    setGiftQuantity(parseInt(e.target.value) || 1)
                  }
                />
              </div>

              <div>
                <Label>Payment Method</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="card">Credit Card</SelectItem>
                    <SelectItem value="paypal">PayPal</SelectItem>
                    <SelectItem value="wallet">Wallet</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {selectedTier && (
                <div className="text-center p-4 border rounded-lg bg-muted">
                  <p className="text-sm text-muted-foreground">Total Cost:</p>
                  <p className="text-2xl font-bold text-primary">
                    $
                    {(subscriptionTiers.find((t) => t.id === selectedTier)
                      ?.price || 0) * giftQuantity}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {giftQuantity} x{" "}
                    {subscriptionTiers.find((t) => t.id === selectedTier)?.name}{" "}
                    subscription{giftQuantity > 1 ? "s" : ""}
                  </p>
                </div>
              )}

              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setShowGiftModal(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  disabled={!selectedTier}
                  className="flex-1"
                  onClick={() => {
                    const tier = subscriptionTiers.find(
                      (t) => t.id === selectedTier,
                    );
                    if (tier) {
                      handlePayment(tier, giftQuantity);
                    }
                  }}
                >
                  Send Gift
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Manage Subscription Modal */}
        <Dialog open={showManageModal} onOpenChange={setShowManageModal}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Manage Subscription</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div className="text-center p-4 border rounded-lg">
                <h3 className="font-semibold mb-2">Current Plan</h3>
                <p className="text-2xl font-bold text-primary">
                  ${subscriptionTiers.find((t) => t.id === selectedTier)?.price}
                  /month
                </p>
                <p className="text-sm text-muted-foreground">
                  {subscriptionTiers.find((t) => t.id === selectedTier)?.name}{" "}
                  Tier
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span>Auto-renewal:</span>
                  <Button variant="outline" size="sm">
                    <Settings className="w-4 h-4 mr-2" />
                    Configure
                  </Button>
                </div>

                <div className="flex items-center justify-between">
                  <span>Payment method:</span>
                  <Button variant="outline" size="sm">
                    <CreditCard className="w-4 h-4 mr-2" />
                    Change
                  </Button>
                </div>

                <div className="flex items-center justify-between">
                  <span>Billing cycle:</span>
                  <span className="text-sm text-muted-foreground">Monthly</span>
                </div>
              </div>

              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setShowManageModal(false)}
                  className="flex-1"
                >
                  Close
                </Button>
                <Button variant="destructive" className="flex-1">
                  Cancel Subscription
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};
