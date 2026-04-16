// Demo data service to replace API calls
import { toast } from '../hooks/use-toast';
import { getDefaultApiDelay, getRandomApiDelay } from './demoConfig';

// Types
export interface UserProfile {
  id: string;
  username: string;
  email: string;
  name: string;
  avatar?: string;
  bio?: string;
  location?: string;
  website?: string;
  isStreamer: boolean;
  streamerProfile?: {
    category: string;
    totalViews: number;
    totalStreams: number;
    subscriptionTiers: Array<{
      tier: 'gold' | 'diamond' | 'chrome';
      price: number;
      description: string;
      benefits: string[];
      isActive: boolean;
    }>;
  };
}

export interface UserSettings {
  account: {
    emailNotifications: boolean;
    pushNotifications: boolean;
    smsNotifications: boolean;
    marketingEmails: boolean;
  };
  privacy: {
    profileVisibility: 'public' | 'friends' | 'private';
    showOnlineStatus: boolean;
    allowMessagesFrom: 'everyone' | 'friends' | 'none';
    showLastSeen: boolean;
    allowProfileViews: boolean;
  };
  notifications: {
    newMatches: boolean;
    messages: boolean;
    likes: boolean;
    superLikes: boolean;
    subscriptionUpdates: boolean;
    streamNotifications: boolean;
  };
  app: {
    theme: 'light' | 'dark' | 'system';
    language: string;
    timezone: string;
    autoPlayVideos: boolean;
    soundEffects: boolean;
  };
}

export interface SubscriptionTier {
  id: string;
  tier: 'gold' | 'diamond' | 'chrome';
  price: number;
  description: string;
  benefits: string[];
  isActive: boolean;
  customEmotes?: string[];
  exclusiveContent?: string[];
}

export interface Subscription {
  id: string;
  streamerId: string;
  streamerName: string;
  tier: 'gold' | 'diamond' | 'chrome';
  price: number;
  startDate: string;
  endDate: string;
  status: 'active' | 'expired' | 'cancelled';
  autoRenew: boolean;
}

export interface UserPreference {
  basic: {
    ageRange: [number, number];
    distance: number;
    gender: string[];
  };
  appearance: {
    height: [number, number];
    bodyType: string[];
    ethnicity: string[];
  };
  lifestyle: {
    smoking: string[];
    drinking: string[];
    exercise: string[];
    diet: string[];
  };
  personality: {
    introvert: boolean;
    extrovert: boolean;
    adventurous: boolean;
    homebody: boolean;
  };
  interests: string[];
  values: string[];
  dealbreakers: string[];
  mustHaves: string[];
}

export interface Match {
  id: string;
  userId: string;
  matchedUserId: string;
  matchedUserName: string;
  matchedUserAvatar?: string;
  matchDate: string;
  lastMessage?: string;
  lastMessageDate?: string;
  unreadCount: number;
}

export interface ChatMessage {
  id: string;
  chatId: string;
  senderId: string;
  content: string;
  timestamp: string;
  isPinned: boolean;
}

export interface Chat {
  id: string;
  matchId: string;
  participants: string[];
  lastMessage?: ChatMessage;
  unreadCount: number;
  chatPin: string;
  createdAt: string;
}

// Demo data
const DEMO_USERS: UserProfile[] = [
  {
    id: '1',
    username: 'demo_user',
    email: 'demo@example.com',
    name: 'Demo User',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
    bio: 'This is a demo user for frontend development',
    location: 'Demo City, DC',
    website: 'https://example.com',
    isStreamer: false,
  },
  {
    id: '2',
    username: 'demo_streamer',
    email: 'streamer@example.com',
    name: 'Demo Streamer',
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
    bio: 'Professional streamer and content creator',
    location: 'Stream City, SC',
    website: 'https://streamer.example.com',
    isStreamer: true,
    streamerProfile: {
      category: 'Gaming',
      totalViews: 150000,
      totalStreams: 45,
      subscriptionTiers: [
        {
          tier: 'gold',
          price: 4.99,
          description: 'Gold Tier',
          benefits: ['Custom emotes', 'Priority chat', 'Exclusive content'],
          isActive: true,
        },
        {
          tier: 'diamond',
          price: 9.99,
          description: 'Diamond Tier',
          benefits: ['All Gold benefits', 'Private streams', 'Direct messaging'],
          isActive: true,
        },
        {
          tier: 'chrome',
          price: 19.99,
          description: 'Chrome Tier',
          benefits: ['All Diamond benefits', 'Personal coaching', 'Merchandise'],
          isActive: true,
        },
      ],
    },
  },
];

const DEMO_SETTINGS: UserSettings = {
  account: {
    emailNotifications: true,
    pushNotifications: true,
    smsNotifications: false,
    marketingEmails: false,
  },
  privacy: {
    profileVisibility: 'public',
    showOnlineStatus: true,
    allowMessagesFrom: 'everyone',
    showLastSeen: true,
    allowProfileViews: true,
  },
  notifications: {
    newMatches: true,
    messages: true,
    likes: true,
    superLikes: true,
    subscriptionUpdates: true,
    streamNotifications: true,
  },
  app: {
    theme: 'system',
    language: 'en',
    timezone: 'UTC',
    autoPlayVideos: true,
    soundEffects: true,
  },
};

const DEMO_PREFERENCES: UserPreference = {
  basic: {
    ageRange: [25, 35],
    distance: 50,
    gender: ['female', 'male'],
  },
  appearance: {
    height: [160, 180],
    bodyType: ['athletic', 'average', 'curvy'],
    ethnicity: ['any'],
  },
  lifestyle: {
    smoking: ['never', 'socially'],
    drinking: ['never', 'socially'],
    exercise: ['regularly', 'sometimes'],
    diet: ['balanced', 'vegetarian', 'vegan'],
  },
  personality: {
    introvert: true,
    extrovert: false,
    adventurous: true,
    homebody: false,
  },
  interests: ['travel', 'music', 'cooking', 'reading', 'fitness'],
  values: ['honesty', 'kindness', 'ambition', 'family'],
  dealbreakers: ['dishonesty', 'rudeness'],
  mustHaves: ['good communication', 'shared values'],
};

const DEMO_POTENTIAL_MATCHES = [
  {
    id: '101',
    name: 'Sarah Johnson',
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
    age: 28,
    location: 'New York, NY',
    bio: 'Adventure seeker and coffee enthusiast ☕',
    interests: ['travel', 'photography', 'hiking', 'coffee'],
    matchScore: 95,
  },
  {
    id: '102',
    name: 'Emma Davis',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
    age: 26,
    location: 'Los Angeles, CA',
    bio: 'Artist and yoga instructor 🎨🧘‍♀️',
    interests: ['art', 'yoga', 'meditation', 'nature'],
    matchScore: 88,
  },
];

const DEMO_MATCHES: Match[] = [
  {
    id: 'match1',
    userId: '1',
    matchedUserId: '106',
    matchedUserName: 'Sophia Anderson',
    matchedUserAvatar: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=150&h=150&fit=crop&crop=face',
    matchDate: '2024-01-15T10:30:00Z',
    lastMessage: 'Hey! How was your weekend?',
    lastMessageDate: '2024-01-20T14:20:00Z',
    unreadCount: 2,
  },
];

const DEMO_STATS = {
  totalLikes: 45,
  totalDislikes: 12,
  totalSuperLikes: 8,
  totalMatches: 7,
  averageMatchScore: 87.5,
};

const DEMO_SUBSCRIPTIONS: Subscription[] = [
  {
    id: 'sub1',
    streamerId: '2',
    streamerName: 'Demo Streamer',
    tier: 'gold',
    price: 4.99,
    startDate: '2024-01-01T00:00:00Z',
    endDate: '2024-02-01T00:00:00Z',
    status: 'active',
    autoRenew: true,
  },
];

const DEMO_STREAMER_DISCOVERY = [
  {
    id: '2',
    name: 'Demo Streamer',
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
    category: 'Gaming',
    totalViews: 150000,
    subscriptionTiers: [
      {
        id: 'tier1',
        tier: 'gold',
        price: 4.99,
        description: 'Gold Tier',
        benefits: ['Custom emotes', 'Priority chat', 'Exclusive content'],
        isActive: true,
      },
      {
        id: 'tier2',
        tier: 'diamond',
        price: 9.99,
        description: 'Diamond Tier',
        benefits: ['All Gold benefits', 'Private streams', 'Direct messaging'],
        isActive: true,
      },
    ],
  },
];

const DEMO_CHATS: Chat[] = [
  {
    id: 'chat1',
    matchId: 'match1',
    participants: ['1', '106'],
    lastMessage: {
      id: 'msg1',
      chatId: 'chat1',
      senderId: '106',
      content: 'Hey! How was your weekend?',
      timestamp: '2024-01-20T14:20:00Z',
      isPinned: false,
    },
    unreadCount: 2,
    chatPin: '1234',
    createdAt: '2024-01-15T10:30:00Z',
  },
];

const DEMO_MESSAGES: ChatMessage[] = [
  {
    id: 'msg1',
    chatId: 'chat1',
    senderId: '106',
    content: 'Hey! How was your weekend?',
    timestamp: '2024-01-20T14:20:00Z',
    isPinned: false,
  },
  {
    id: 'msg2',
    chatId: 'chat1',
    senderId: '1',
    content: 'It was great! I went hiking and tried a new restaurant. How about you?',
    timestamp: '2024-01-20T15:30:00Z',
    isPinned: false,
  },
];

const DEMO_REPORTS = [
  {
    id: 'report1',
    reportedUserName: 'John Doe',
    reportType: 'inappropriate',
    reason: 'Inappropriate behavior in chat',
    status: 'pending' as const,
    createdAt: '2024-01-15T10:30:00Z',
  },
];

// Simulate API delay
const simulateApiDelay = (ms?: number) => {
  const delay = ms || (Math.random() > 0.5 ? getDefaultApiDelay() : getRandomApiDelay());
  return new Promise(resolve => setTimeout(resolve, delay));
};

// Demo API functions
export const demoAuthAPI = {
  async login(credentials: { identifier: string; password: string }): Promise<{ token: string; user: UserProfile }> {
    await simulateApiDelay();
    
    if (credentials.identifier === 'demo@example.com' && credentials.password === 'demo123') {
      const token = 'demo_token_' + Date.now();
      localStorage.setItem('authToken', token);
      return { token, user: DEMO_USERS[0] };
    }
    
    throw new Error('Invalid credentials');
  },

  async register(userData: { username: string; email: string; password: string; confirmPassword: string }): Promise<{ token: string; user: UserProfile }> {
    await simulateApiDelay();
    
    const newUser: UserProfile = {
      id: Date.now().toString(),
      username: userData.username,
      email: userData.email,
      name: userData.username,
      isStreamer: false,
    };
    
    const token = 'demo_token_' + Date.now();
    localStorage.setItem('authToken', token);
    
    return { token, user: newUser };
  },

  async checkUsername(username: string): Promise<{ available: boolean }> {
    await simulateApiDelay();
    const isAvailable = !['demo_user', 'demo_streamer', 'admin', 'test'].includes(username.toLowerCase());
    return { available: isAvailable };
  },

  async getUsernameSuggestions(baseUsername: string): Promise<{ suggestions: string[] }> {
    await simulateApiDelay();
    const suggestions = [
      `${baseUsername}_${Math.floor(Math.random() * 1000)}`,
      `${baseUsername}${Math.floor(Math.random() * 100)}`,
      `${baseUsername}_user`,
    ];
    return { suggestions };
  },

  async logout(): Promise<void> {
    await simulateApiDelay();
    localStorage.removeItem('authToken');
  },

  async getCurrentUser(): Promise<UserProfile> {
    await simulateApiDelay();
    const token = localStorage.getItem('authToken');
    if (!token) throw new Error('Not authenticated');
    return DEMO_USERS[0];
  },
};

export const demoSettingsAPI = {
  async getSettings(): Promise<UserSettings> {
    await simulateApiDelay();
    return DEMO_SETTINGS;
  },

  async updateAccountSettings(settings: Partial<UserSettings['account']>): Promise<UserSettings> {
    await simulateApiDelay();
    const updatedSettings = { ...DEMO_SETTINGS, account: { ...DEMO_SETTINGS.account, ...settings } };
    return updatedSettings;
  },

  async updatePrivacySettings(settings: Partial<UserSettings['privacy']>): Promise<UserSettings> {
    await simulateApiDelay();
    const updatedSettings = { ...DEMO_SETTINGS, privacy: { ...DEMO_SETTINGS.privacy, ...settings } };
    return updatedSettings;
  },

  async updateNotificationSettings(settings: Partial<UserSettings['notifications']>): Promise<UserSettings> {
    await simulateApiDelay();
    const updatedSettings = { ...DEMO_SETTINGS, notifications: { ...DEMO_SETTINGS.notifications, ...settings } };
    return updatedSettings;
  },

  async updateAppSettings(settings: Partial<UserSettings['app']>): Promise<UserSettings> {
    await simulateApiDelay();
    const updatedSettings = { ...DEMO_SETTINGS, app: { ...DEMO_SETTINGS.app, ...settings } };
    return updatedSettings;
  },

  async exportSettings(): Promise<{ data: string; filename: string }> {
    await simulateApiDelay();
    const data = JSON.stringify(DEMO_SETTINGS, null, 2);
    const filename = `settings_${new Date().toISOString().split('T')[0]}.json`;
    return { data, filename };
  },

  async resetSettings(): Promise<UserSettings> {
    await simulateApiDelay();
    return DEMO_SETTINGS;
  },
};

export const demoSubscriptionAPI = {
  async getStreamerTiers(streamerId: string): Promise<SubscriptionTier[]> {
    await simulateApiDelay();
    const streamer = DEMO_STREAMER_DISCOVERY.find(s => s.id === streamerId);
    return streamer?.subscriptionTiers || [];
  },

  async createSubscription(subscriptionData: {
    streamerId: string;
    tier: 'gold' | 'diamond' | 'chrome';
    paymentMethod: string;
  }): Promise<Subscription> {
    await simulateApiDelay();
    
    const streamer = DEMO_STREAMER_DISCOVERY.find(s => s.id === subscriptionData.streamerId);
    if (!streamer) throw new Error('Streamer not found');
    
    const tier = streamer.subscriptionTiers.find(t => t.tier === subscriptionData.tier);
    if (!tier) throw new Error('Tier not found');
    
    const newSubscription: Subscription = {
      id: 'sub_' + Date.now(),
      streamerId: subscriptionData.streamerId,
      streamerName: streamer.name,
      tier: subscriptionData.tier,
      price: tier.price,
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'active',
      autoRenew: true,
    };
    
    return newSubscription;
  },

  async getUserSubscriptions(): Promise<Subscription[]> {
    await simulateApiDelay();
    return DEMO_SUBSCRIPTIONS;
  },

  async cancelSubscription(subscriptionId: string): Promise<{ message: string }> {
    await simulateApiDelay();
    return { message: 'Subscription cancelled successfully' };
  },

  async updateAutoRenew(subscriptionId: string, autoRenew: boolean): Promise<Subscription> {
    await simulateApiDelay();
    const subscription = DEMO_SUBSCRIPTIONS.find(s => s.id === subscriptionId);
    if (!subscription) throw new Error('Subscription not found');
    return { ...subscription, autoRenew };
  },

  async getSubscriptionHistory(): Promise<Subscription[]> {
    await simulateApiDelay();
    return DEMO_SUBSCRIPTIONS;
  },

  async getStreamerDiscovery(): Promise<Array<{
    id: string;
    name: string;
    avatar?: string;
    category: string;
    totalViews: number;
    subscriptionTiers: SubscriptionTier[];
  }>> {
    await simulateApiDelay();
    return DEMO_STREAMER_DISCOVERY;
  },
};

export const demoArcadeAPI = {
  async getPreferences(): Promise<UserPreference> {
    await simulateApiDelay();
    return DEMO_PREFERENCES;
  },

  async updatePreferences(preferences: Partial<UserPreference>): Promise<UserPreference> {
    await simulateApiDelay();
    const updatedPreferences = { ...DEMO_PREFERENCES, ...preferences };
    return updatedPreferences;
  },

  async getPotentialMatches(): Promise<Array<{
    id: string;
    name: string;
    avatar?: string;
    age: number;
    location: string;
    bio?: string;
    interests: string[];
    matchScore: number;
  }>> {
    await simulateApiDelay();
    return DEMO_POTENTIAL_MATCHES;
  },

  async likeUser(userId: string): Promise<{ matched: boolean; matchId?: string }> {
    await simulateApiDelay();
    const matched = Math.random() < 0.2;
    if (matched) {
      return { matched: true, matchId: 'match_' + Date.now() };
    }
    return { matched: false };
  },

  async superLikeUser(userId: string): Promise<{ matched: boolean; matchId?: string }> {
    await simulateApiDelay();
    const matched = Math.random() < 0.4;
    if (matched) {
      return { matched: true, matchId: 'match_' + Date.now() };
    }
    return { matched: false };
  },

  async dislikeUser(userId: string): Promise<{ message: string }> {
    await simulateApiDelay();
    return { message: 'User passed' };
  },

  async passUser(userId: string): Promise<{ message: string }> {
    await simulateApiDelay();
    return { message: 'User passed' };
  },

  async getMatches(): Promise<Match[]> {
    await simulateApiDelay();
    return DEMO_MATCHES;
  },

  async getInteractions(): Promise<Array<{
    userId: string;
    userName: string;
    userAvatar?: string;
    action: 'like' | 'dislike' | 'super_like' | 'pass';
    timestamp: string;
  }>> {
    await simulateApiDelay();
    return [];
  },

  async getStats(): Promise<{
    totalLikes: number;
    totalDislikes: number;
    totalSuperLikes: number;
    totalMatches: number;
    averageMatchScore: number;
  }> {
    await simulateApiDelay();
    return DEMO_STATS;
  },

  async blockUser(userId: string): Promise<{ message: string }> {
    await simulateApiDelay();
    return { message: 'User blocked successfully' };
  },

  async unblockUser(userId: string): Promise<{ message: string }> {
    await simulateApiDelay();
    return { message: 'User unblocked successfully' };
  },

  async getBlockedUsers(): Promise<Array<{
    id: string;
    name: string;
    avatar?: string;
    blockedAt: string;
  }>> {
    await simulateApiDelay();
    return [];
  },
};

export const demoChatAPI = {
  async getChats(): Promise<Chat[]> {
    await simulateApiDelay();
    return DEMO_CHATS;
  },

  async getChat(chatId: string, pin: string): Promise<Chat> {
    await simulateApiDelay();
    const chat = DEMO_CHATS.find(c => c.id === chatId);
    if (!chat) throw new Error('Chat not found');
    return chat;
  },

  async createChat(matchId: string): Promise<Chat> {
    await simulateApiDelay();
    
    const newChat: Chat = {
      id: 'chat_' + Date.now(),
      matchId,
      participants: ['1', 'new_user'],
      unreadCount: 0,
      chatPin: Math.floor(1000 + Math.random() * 9000).toString(),
      createdAt: new Date().toISOString(),
    };
    
    return newChat;
  },

  async sendMessage(chatId: string, content: string, pin: string): Promise<ChatMessage> {
    await simulateApiDelay();
    
    const newMessage: ChatMessage = {
      id: 'msg_' + Date.now(),
      chatId,
      senderId: '1',
      content,
      timestamp: new Date().toISOString(),
      isPinned: false,
    };
    
    return newMessage;
  },

  async getMessages(chatId: string, pin: string): Promise<ChatMessage[]> {
    await simulateApiDelay();
    if (chatId === 'chat1') {
      return DEMO_MESSAGES;
    }
    return [];
  },

  async pinMessage(chatId: string, messageId: string, pin: string): Promise<{ message: string }> {
    await simulateApiDelay();
    return { message: 'Message pinned successfully' };
  },

  async markAsRead(chatId: string, pin: string): Promise<{ message: string }> {
    await simulateApiDelay();
    return { message: 'Chat marked as read' };
  },

  async leaveChat(chatId: string, pin: string): Promise<{ message: string }> {
    await simulateApiDelay();
    return { message: 'Left chat successfully' };
  },

  async getChatPin(chatId: string): Promise<{ chatPin: string }> {
    await simulateApiDelay();
    const chat = DEMO_CHATS.find(c => c.id === chatId);
    if (!chat) throw new Error('Chat not found');
    return { chatPin: chat.chatPin };
  },

  async resetChatPin(chatId: string): Promise<{ chatPin: string }> {
    await simulateApiDelay();
    const newPin = Math.floor(1000 + Math.random() * 9000).toString();
    return { chatPin: newPin };
  },
};

export const demoReportsAPI = {
  async reportUser(reportData: {
    reportedUserId: string;
    reportType: 'inappropriate' | 'spam' | 'harassment' | 'fake_profile' | 'other';
    reason: string;
    evidence?: string;
  }): Promise<{ message: string; reportId: string }> {
    await simulateApiDelay();
    const reportId = 'report_' + Date.now();
    return { message: 'User reported successfully', reportId };
  },

  async getMyReports(): Promise<Array<{
    id: string;
    reportedUserName: string;
    reportType: string;
    reason: string;
    status: 'pending' | 'investigating' | 'resolved' | 'dismissed';
    createdAt: string;
  }>> {
    await simulateApiDelay();
    return DEMO_REPORTS;
  },

  async getReport(reportId: string): Promise<{
    id: string;
    reportedUserName: string;
    reportType: string;
    reason: string;
    evidence?: string;
    status: string;
    adminNotes?: string;
    actionsTaken?: string[];
    createdAt: string;
    updatedAt: string;
  }> {
    await simulateApiDelay();
    
    const report = DEMO_REPORTS.find(r => r.id === reportId);
    if (!report) throw new Error('Report not found');
    
    return {
      ...report,
      evidence: undefined,
      adminNotes: 'Demo admin notes',
      actionsTaken: ['Warning sent'],
      updatedAt: report.createdAt,
    };
  },
};

// Demo utility functions
export const handleDemoError = (error: any, fallbackMessage = 'Something went wrong') => {
  console.error('Demo Error:', error);
  const message = error.message || fallbackMessage;
  toast({
    title: 'Error',
    description: message,
    variant: 'destructive',
  });
};

export const handleDemoSuccess = (message: string) => {
  toast({
    title: 'Success',
    description: message,
  });
};
