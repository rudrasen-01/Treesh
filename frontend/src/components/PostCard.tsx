import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Heart, MessageCircle, Share2, MoreHorizontal } from 'lucide-react';
import { useState } from 'react';

interface Post {
  id: string;
  author: string;
  avatar: string;
  content: string;
  image?: string;
  likes: number;
  comments: number;
  timestamp: string;
  platform: 'twitter' | 'instagram' | 'facebook';
}

interface PostCardProps {
  post: Post;
}

const PostCard = ({ post }: PostCardProps) => {
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(post.likes);

  const handleLike = () => {
    setLiked(!liked);
    setLikesCount(prev => liked ? prev - 1 : prev + 1);
  };

  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case 'twitter': return 'bg-blue-400';
      case 'instagram': return 'bg-gradient-to-r from-pink-500 to-purple-600';
      case 'facebook': return 'bg-blue-600';
      default: return 'bg-gray-400';
    }
  };

  return (
    <Card className="mb-4 sm:mb-6 hover:shadow-lg transition-shadow duration-200 w-full">
      <CardHeader className="pb-2 sm:pb-3 p-3 sm:p-4">
        <div className="flex items-start sm:items-center justify-between gap-2 sm:gap-3">
          <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
            <Avatar className="h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0">
              <AvatarImage src={post.avatar} alt={post.author} />
              <AvatarFallback>{post.author.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-gray-900 font-inter text-sm sm:text-base truncate">{post.author}</p>
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full flex-shrink-0 ${getPlatformColor(post.platform)}`} />
                <span className="text-xs sm:text-sm text-gray-500 font-inter">{post.timestamp}</span>
              </div>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-9 sm:w-9 flex-shrink-0">
            <MoreHorizontal className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0 p-3 sm:p-4">
        <p className="text-gray-800 mb-3 sm:mb-4 leading-relaxed font-inter text-sm sm:text-base">{post.content}</p>
        
        {post.image && (
          <div className="mb-3 sm:mb-4 rounded-lg overflow-hidden w-full">
            <img 
              src={post.image} 
              alt="Post content" 
              className="w-full h-40 sm:h-48 md:h-64 object-cover hover:scale-105 transition-transform duration-200"
            />
          </div>
        )}
        
        <div className="flex items-center justify-between pt-3 sm:pt-4 border-t gap-2 sm:gap-4">
          <div className="flex items-center gap-4 sm:gap-6 text-xs sm:text-sm">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLike}
              className="flex items-center gap-1 sm:gap-2 h-8 px-2 hover:bg-red-50 text-gray-600 hover:text-red-500 font-inter"
            >
              <Heart className={`h-4 w-4 ${liked ? 'fill-current' : ''}`} />
              <span>{likesCount}</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center gap-1 sm:gap-2 h-8 px-2 hover:bg-blue-50 text-gray-600 hover:text-blue-500 font-inter"
            >
              <MessageCircle className="h-4 w-4" />
              <span>{post.comments}</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center gap-1 sm:gap-2 h-8 px-2 hover:bg-green-50 text-gray-600 hover:text-green-500 font-inter"
            >
              <Share2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
              size="sm"
              onClick={handleLike}
              className={`flex items-center space-x-2 font-inter ${liked ? 'text-red-500' : 'text-gray-500'} hover:text-red-500`}
            >
              <Heart className={`h-4 w-4 ${liked ? 'fill-current' : ''}`} />
              <span>{likesCount}</span>
            </Button>
            
            <Button variant="ghost" size="sm" className="flex items-center space-x-2 text-gray-500 hover:text-blue-500 font-inter">
              <MessageCircle className="h-4 w-4" />
              <span>{post.comments}</span>
            </Button>
            
            <Button variant="ghost" size="sm" className="flex items-center space-x-2 text-gray-500 hover:text-green-500 font-inter">
              <Share2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PostCard;