import { useState } from 'react';
import PostCard from './PostCard';
import { Button } from '@/components/ui/button';
import { RefreshCw, Filter } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface MainContentProps {
  activeTab: string;
}

const MainContent = ({ activeTab }: MainContentProps) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const samplePosts = [
    {
      id: '1',
      author: 'Sarah Johnson',
      avatar: '/placeholder.svg',
      content: 'Just launched our new product! So excited to share this journey with everyone. The team has worked incredibly hard to make this happen. 🚀',
      image: '/placeholder.svg',
      likes: 142,
      comments: 23,
      timestamp: '2 hours ago',
      platform: 'twitter' as const
    },
    {
      id: '2',
      author: 'Mike Chen',
      avatar: '/placeholder.svg',
      content: 'Beautiful sunset from my office window today. Sometimes you need to pause and appreciate the simple things in life. Nature never fails to amaze me.',
      likes: 89,
      comments: 12,
      timestamp: '4 hours ago',
      platform: 'instagram' as const
    },
    {
      id: '3',
      author: 'Emily Rodriguez',
      avatar: '/placeholder.svg',
      content: 'Excited to announce that our team won the hackathon! 48 hours of coding, debugging, and lots of coffee. Grateful for my amazing teammates.',
      image: '/placeholder.svg',
      likes: 256,
      comments: 45,
      timestamp: '6 hours ago',
      platform: 'facebook' as const
    },
    {
      id: '4',
      author: 'David Kim',
      avatar: '/placeholder.svg',
      content: 'Pro tip: Always backup your code before making major changes. Learned this the hard way today, but thankfully git saved the day! 💻',
      likes: 78,
      comments: 18,
      timestamp: '8 hours ago',
      platform: 'twitter' as const
    },
    {
      id: '5',
      author: 'Lisa Wang',
      avatar: '/placeholder.svg',
      content: 'Morning workout complete! Starting the day with some endorphins always sets the right tone. What\'s your favorite way to start the morning?',
      likes: 134,
      comments: 31,
      timestamp: '10 hours ago',
      platform: 'instagram' as const
    }
  ];

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const getTabTitle = (tab: string) => {
    switch (tab) {
      case 'home': return 'Home Feed';
      case 'trending': return 'Trending Posts';
      case 'following': return 'Following';
      case 'hashtags': return 'Popular Hashtags';
      case 'saved': return 'Saved Posts';
      default: return 'Social Stream';
    }
  };

  return (
    <div className="flex-1 bg-background min-h-screen w-full overflow-x-hidden">
      <div className="w-full px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6">
        <div className="max-w-2xl mx-auto w-full">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 sm:mb-8">
            <div className="w-full min-w-0">
              <h2 className="text-responsive-2xl font-bold text-gray-900 font-treesh">{getTabTitle(activeTab)}</h2>
              <p className="text-text-responsive-base text-gray-600 mt-1 sm:mt-2 font-inter">Stay connected with the latest updates</p>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto flex-shrink-0">
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-1 sm:gap-2 font-inter text-xs sm:text-sm flex-1 sm:flex-none"
              >
                <Filter className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Filter</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="flex items-center gap-1 sm:gap-2 font-inter text-xs sm:text-sm flex-1 sm:flex-none"
              >
                <RefreshCw className={`h-3 w-3 sm:h-4 sm:w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Refresh</span>
              </Button>
            </div>
          </div>

          {/* Posts */}
          <div className="space-y-4 sm:space-y-6">
            {samplePosts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>

          {/* Load More */}
          <div className="mt-8 sm:mt-12 text-center">
            <Button variant="outline" className="px-6 sm:px-8 font-inter text-sm sm:text-base">
              Load More Posts
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainContent;