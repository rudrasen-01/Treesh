import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Footer from '@/components/Footer';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/components/theme-provider';
import { EnhancedAuthModal } from '@/components/EnhancedAuthModal';
import { usersAPI } from '@/services/api';
import {
  Flame,
  Users,
  Sparkles,
  Radio,
  Heart,
  Share2,
  MessageCircle,
  ArrowRight,
  Moon,
  Sun,
} from 'lucide-react';

interface User {
  id: string;
  _id?: string;
  name: string;
  fullName: string;
  avatar?: string;
  profileImage?: string;
  followerCount?: number;
  followingCount?: number;
}

const FeatureCard = ({
  icon: Icon,
  title,
  description,
  resolvedTheme = 'dark',
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  resolvedTheme?: 'light' | 'dark';
}) => (
  <div className={`rounded-2xl border border-primary/20 p-6 backdrop-blur-sm transition-all duration-300 hover:border-primary/40 ${
    resolvedTheme === 'dark'
      ? 'bg-gradient-to-br from-slate-900/50 to-slate-950/30 hover:bg-gradient-to-br hover:from-slate-900/70 hover:to-slate-950/50'
      : 'bg-gradient-to-br from-slate-100/50 to-slate-50/30 hover:bg-gradient-to-br hover:from-slate-100/70 hover:to-slate-50/50'
  }`}>
    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
      <div className="text-primary">{Icon}</div>
    </div>
    <h3 className={`mb-2 text-lg font-semibold ${
      resolvedTheme === 'dark' ? 'text-slate-100' : 'text-slate-900'
    }`}>{title}</h3>
    <p className={`text-sm leading-6 ${
      resolvedTheme === 'dark' ? 'text-slate-300' : 'text-slate-600'
    }`}>{description}</p>
  </div>
);

const TrendingCard = ({
  title,
  value,
  icon: Icon,
  trend,
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: number;
}) => (
  <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4 backdrop-blur-xs">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
          {title}
        </p>
        <p className="mt-1 text-2xl font-bold text-slate-100">{value}</p>
        {trend && (
          <p className="mt-1 text-xs text-green-400">
            ↑ {trend}% this week
          </p>
        )}
      </div>
      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
        {Icon}
      </div>
    </div>
  </div>
);

export const LandingPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [topCreators, setTopCreators] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch top creators/users
        const usersResponse = await usersAPI.getTopCreators?.();
        if (usersResponse?.success && usersResponse?.data) {
          const creators = Array.isArray(usersResponse.data)
            ? usersResponse.data.slice(0, 3)
            : [];
          setTopCreators(creators);
        }
      } catch (err) {
        console.error('Error fetching landing data:', err);
        setError('Failed to load some content');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const features = [
    {
      icon: <Sparkles className="h-6 w-6" />,
      title: 'Share Moments',
      description:
        'Post photos, videos, and stories to connect with your community in real-time.',
    },
    {
      icon: <Radio className="h-6 w-6" />,
      title: 'Live Streams',
      description:
        'Go live and interact with your audience with crystal-clear streaming quality.',
    },
    {
      icon: <Users className="h-6 w-6" />,
      title: 'Community First',
      description:
        'Build meaningful connections with real people who share your interests.',
    },
    {
      icon: <Heart className="h-6 w-6" />,
      title: 'Creator Tools',
      description:
        'Monetize your content and build a sustainable career as a creator.',
    },
    {
      icon: <MessageCircle className="h-6 w-6" />,
      title: 'Direct Messaging',
      description: 'Stay connected with direct messaging and group chats.',
    },
    {
      icon: <Flame className="h-6 w-6" />,
      title: 'Trending Content',
      description:
        "Discover what's trending and never miss what your community loves.",
    },
  ];

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      resolvedTheme === 'dark'
        ? 'bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900 text-slate-100'
        : 'bg-gradient-to-b from-white via-slate-50 to-slate-100 text-slate-900'
    }`}>
      {/* Hero Section */}
      <section className="relative overflow-hidden px-4 py-8 sm:px-6 lg:px-8">
        {/* Enhanced animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 right-0 h-80 w-80 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute bottom-0 left-0 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-6xl">
          {/* Theme Toggle Button */}
          <div className="absolute -top-2 right-0 z-10">
            <button
              onClick={() => {
                // Cycle through: light → dark → light
                if (theme === 'light') {
                  setTheme('dark');
                } else {
                  setTheme('light');
                }
              }}
              className={`p-2 rounded-full border transition-all duration-300 backdrop-blur-sm ${
                resolvedTheme === 'dark'
                  ? 'border-slate-600/50 bg-slate-900/50 hover:bg-slate-800/70 hover:border-slate-500'
                  : 'border-slate-300/50 bg-slate-100/50 hover:bg-slate-200/70 hover:border-slate-400'
              }`}
              title={`Current theme: ${theme} (click to cycle)`}
            >
              {resolvedTheme === 'dark' ? (
                <Sun className="h-5 w-5 text-yellow-400" />
              ) : (
                <Moon className="h-5 w-5 text-slate-400" />
              )}
            </button>
          </div>

          {/* Top Badge */}
          <div className="mb-4 flex items-center justify-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-4 py-2 text-sm font-medium text-primary backdrop-blur-sm hover:border-primary/60 hover:bg-primary/15 transition-all">
              <Flame className="h-4 w-4 animate-pulse" />
              <span>Join Creators & Communities Worldwide</span>
            </div>
          </div>

          {/* Main Headline */}
          <div className="mb-8 text-center">
            <h1 className="mb-6 text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight">
              <span className={`block bg-clip-text text-transparent bg-gradient-to-r ${
                resolvedTheme === 'dark'
                  ? 'from-slate-100 via-slate-100 to-slate-300'
                  : 'from-slate-900 via-slate-900 to-slate-700'
              }`}>
                Your Platform.
              </span>
              <span className="block bg-gradient-to-r from-primary via-primary to-primary/70 bg-clip-text text-transparent mt-2">
                Your Community.
              </span>
            </h1>
            <p className={`mx-auto mb-10 max-w-3xl text-lg leading-8 sm:text-xl ${
              resolvedTheme === 'dark' ? 'text-slate-300' : 'text-slate-600'
            }`}>
              Share, stream, connect, and grow with the platform designed for real creators. No algorithms, no gatekeeping—just authentic connections.
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="mb-12 flex flex-col items-center justify-center gap-6 sm:flex-row sm:gap-8">
            <Button
              className="px-12 py-5 text-lg rounded-full bg-gradient-to-r from-primary to-primary/90 text-white font-bold hover:from-primary/95 hover:to-primary/85 shadow-2xl shadow-primary/50 hover:shadow-3xl hover:shadow-primary/70 transition-all duration-300 transform hover:scale-105 whitespace-nowrap min-w-[250px] sm:min-w-fit"
              onClick={() => {
                if (isAuthenticated) {
                  navigate('/');
                } else {
                  setShowAuthModal(true);
                }
              }}
            >
              Get Started Free
              <ArrowRight className="ml-3 h-6 w-6" />
            </Button>
            <Button
              variant="outline"
              className={`px-12 py-5 text-lg rounded-full border-2 font-bold transition-all duration-300 transform hover:scale-105 whitespace-nowrap min-w-[250px] sm:min-w-fit ${
                resolvedTheme === 'dark'
                  ? 'border-slate-300 text-slate-100 hover:border-primary hover:bg-primary/15 hover:text-slate-50 shadow-lg shadow-slate-900/50'
                  : 'border-slate-600 text-slate-900 hover:border-primary hover:bg-primary/15 hover:text-slate-900 shadow-lg shadow-slate-900/20'
              }`}
              onClick={() => {
                document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              Learn More
            </Button>
          </div>

          {/* Hero Cards Grid */}
          <div className="relative mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {/* Card 1 - Share */}
            <div className="group relative rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/20 to-primary/5 p-6 backdrop-blur-sm transition-all duration-300 hover:border-primary/60 hover:from-primary/30 hover:to-primary/10 hover:shadow-lg hover:shadow-primary/10">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/0 to-primary/0 opacity-0 transition-opacity group-hover:opacity-10" />
              <div className="relative space-y-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20">
                  <Share2 className="h-5 w-5 text-primary" />
                </div>
                <h3 className={`text-lg font-semibold ${
                  resolvedTheme === 'dark' ? 'text-slate-100' : 'text-slate-900'
                }`}>Share Everything</h3>
                <p className={`text-sm ${
                  resolvedTheme === 'dark' ? 'text-slate-300' : 'text-slate-600'
                }`}>Posts, photos, videos, and stories all in one place</p>
              </div>
            </div>

            {/* Card 2 - Live */}
            <div className="group relative rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/20 to-primary/5 p-6 backdrop-blur-sm transition-all duration-300 hover:border-primary/60 hover:from-primary/30 hover:to-primary/10 hover:shadow-lg hover:shadow-primary/10">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/0 to-primary/0 opacity-0 transition-opacity group-hover:opacity-10" />
              <div className="relative space-y-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20">
                  <Radio className="h-5 w-5 text-primary" />
                </div>
                <h3 className={`text-lg font-semibold ${
                  resolvedTheme === 'dark' ? 'text-slate-100' : 'text-slate-900'
                }`}>Go Live Instantly</h3>
                <p className={`text-sm ${
                  resolvedTheme === 'dark' ? 'text-slate-300' : 'text-slate-600'
                }`}>Stream to your audience with crystal-clear quality</p>
              </div>
            </div>

            {/* Card 3 - Connect */}
            <div className="group relative rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/20 to-primary/5 p-6 backdrop-blur-sm transition-all duration-300 hover:border-primary/60 hover:from-primary/30 hover:to-primary/10 hover:shadow-lg hover:shadow-primary/10">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/0 to-primary/0 opacity-0 transition-opacity group-hover:opacity-10" />
              <div className="relative space-y-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <h3 className={`text-lg font-semibold ${
                  resolvedTheme === 'dark' ? 'text-slate-100' : 'text-slate-900'
                }`}>Build Community</h3>
                <p className={`text-sm ${
                  resolvedTheme === 'dark' ? 'text-slate-300' : 'text-slate-600'
                }`}>Connect with real people who share your passion</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className={`border-t px-4 py-20 sm:px-6 lg:px-8 ${
        resolvedTheme === 'dark'
          ? 'border-slate-800/50 bg-gradient-to-b from-transparent to-slate-900/20'
          : 'border-slate-200/50 bg-gradient-to-b from-transparent to-slate-100/20'
      }`}>
        <div className="mx-auto max-w-6xl">
          <div className="mb-16 text-center">
            <h2 className={`mb-4 text-4xl font-bold tracking-tight sm:text-5xl ${
              resolvedTheme === 'dark' ? 'text-slate-100' : 'text-slate-900'
            }`}>
              Powerful Features
            </h2>
            <p className={`mx-auto max-w-3xl text-lg ${
              resolvedTheme === 'dark' ? 'text-slate-400' : 'text-slate-600'
            }`}>
              Everything you need to create, connect, and grow your community
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => (
              <FeatureCard
                key={index}
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
                resolvedTheme={resolvedTheme}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Top Creators Preview */}
      <section className={`relative overflow-hidden border-t px-4 py-20 sm:px-6 lg:px-8 ${
        resolvedTheme === 'dark'
          ? 'border-slate-800/50 bg-gradient-to-b from-slate-900/40 to-slate-950'
          : 'border-slate-200/50 bg-gradient-to-b from-slate-100/40 to-slate-50'
      }`}>
        {/* Background decorative elements */}
        <div className="absolute inset-0 overflow-hidden opacity-50">
          <div className="absolute top-0 right-0 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute bottom-1/4 left-1/3 h-52 w-52 rounded-full bg-primary/5 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-6xl">
          {/* Header with better spacing */}
          <div className="mb-16 text-center">
            {/* Featured Badge */}
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-2 backdrop-blur-sm">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-primary">
                Featured Creators
              </span>
            </div>

            {/* Main Title */}
            <h2 className={`mb-4 text-4xl sm:text-5xl font-bold ${
              resolvedTheme === 'dark' ? 'text-slate-100' : 'text-slate-900'
            }`}>
              Meet Top Creators
            </h2>

            {/* Subtitle */}
            <p className={`mx-auto max-w-2xl ${
              resolvedTheme === 'dark' ? 'text-slate-300' : 'text-slate-600'
            }`}>
              Join creators building their communities on Treesh
            </p>
          </div>

          {/* Creators Grid - Enhanced */}
          {isLoading ? (
            <div className="flex justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
            </div>
          ) : topCreators.length > 0 ? (
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {topCreators.map((creator, index) => (
                <div
                  key={creator.id || creator._id}
                  className="group relative overflow-hidden rounded-3xl border border-slate-700/50 bg-gradient-to-br from-slate-800/60 to-slate-900/80 p-0 backdrop-blur-sm transition-all duration-300 hover:border-primary/60 hover:from-slate-800/80 hover:to-slate-900/100 hover:shadow-2xl hover:shadow-primary/20"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  {/* Glow effect on hover */}
                  <div className="absolute inset-0 bg-gradient-to-t from-primary/20 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                  
                  {/* Card content */}
                  <div className="relative space-y-6 p-8">
                    {/* Avatar section */}
                    <div className="flex justify-center pt-4">
                      <div className="relative inline-block">
                        {/* Animated glow background */}
                        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-primary via-primary/50 to-transparent opacity-0 blur transition-opacity duration-300 group-hover:opacity-75" />
                        
                        {/* Avatar */}
                        <img
                          src={creator.avatar || creator.profileImage || '/placeholder.svg'}
                          alt={creator.fullName || creator.name}
                          className="relative h-24 w-24 rounded-full border-4 border-slate-700 object-cover transition-transform duration-300 group-hover:scale-105 group-hover:border-primary/50"
                        />
                      </div>
                    </div>

                    {/* Creator info */}
                    <div className="space-y-2 text-center">
                      <h3 className={`text-lg font-semibold ${
                        resolvedTheme === 'dark' ? 'text-slate-100' : 'text-slate-900'
                      }`}>
                        {creator.fullName || creator.name}
                      </h3>
                      {creator.followerCount !== undefined && (
                        <p className={`text-sm ${
                          resolvedTheme === 'dark' ? 'text-slate-400' : 'text-slate-600'
                        }`}>
                          <span className="font-semibold text-primary">
                            {(creator.followerCount / 1000).toFixed(1)}K
                          </span>
                          <span> followers</span>
                        </p>
                      )}
                    </div>

                    {/* CTA Button */}
                    <Button
                      className="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-2 rounded-lg transition-all duration-300 group-hover:shadow-lg group-hover:shadow-primary/40"
                      onClick={() => navigate(`/profile/${creator.id || creator._id}`)}
                    >
                      View Profile
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </section>

      {/* Final CTA Section */}
      <section className={`px-4 py-24 sm:px-6 lg:px-8 ${
        resolvedTheme === 'dark' ? 'bg-slate-950' : 'bg-slate-100'
      }`}>
        <div className="relative mx-auto max-w-4xl">
          <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-primary/40 via-primary/20 to-primary/40 blur-3xl opacity-70" />
          <div className={`relative rounded-2xl border border-primary/50 px-8 py-16 sm:px-16 sm:py-20 text-center backdrop-blur-lg ${
            resolvedTheme === 'dark'
              ? 'bg-gradient-to-br from-slate-900/85 to-slate-950/85'
              : 'bg-gradient-to-br from-white/85 to-slate-50/85'
          }`}>
            <h2 className={`mb-6 text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight ${
              resolvedTheme === 'dark' ? 'text-slate-100' : 'text-slate-900'
            }`}>
              Ready to Create?
            </h2>
            <p className={`mx-auto mb-14 max-w-2xl text-lg sm:text-xl ${
              resolvedTheme === 'dark' ? 'text-slate-300' : 'text-slate-600'
            }`}>
              Join creators worldwide. Start free today.
            </p>
            
            {/* Button Container */}
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center sm:gap-8">
              <Button
                className="px-12 py-4 text-lg rounded-full bg-gradient-to-r from-primary to-primary/90 text-white font-bold hover:from-primary/95 hover:to-primary/85 shadow-2xl shadow-primary/50 hover:shadow-3xl hover:shadow-primary/70 transition-all duration-300 transform hover:scale-105 whitespace-nowrap min-w-[250px] sm:min-w-fit"
                onClick={() => {
                  if (isAuthenticated) {
                    navigate('/');
                  } else {
                    setShowAuthModal(true);
                  }
                }}
              >
                Get Started Free
                <ArrowRight className="ml-3 h-6 w-6" />
              </Button>
              <Button
                variant="outline"
                className={`px-12 py-4 text-lg rounded-full border-2 font-bold transition-all duration-300 transform hover:scale-105 whitespace-nowrap min-w-[250px] sm:min-w-fit ${
                  resolvedTheme === 'dark'
                    ? 'border-slate-300 text-slate-100 hover:border-primary hover:bg-primary/15 hover:text-slate-50 shadow-lg shadow-slate-900/50'
                    : 'border-slate-600 text-slate-900 hover:border-primary hover:bg-primary/15 hover:text-slate-900 shadow-lg shadow-slate-900/20'
                }`}
                onClick={() => navigate('/about')}
              >
                Learn More
              </Button>
            </div>
            
            <p className="mt-10 text-sm text-slate-400">
              No credit card required • 100% free to start
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />

      {/* Auth Modal */}
      <EnhancedAuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onLogin={() => setShowAuthModal(false)}
      />
    </div>
  );
};

export default LandingPage;
