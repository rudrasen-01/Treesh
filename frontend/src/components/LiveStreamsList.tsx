import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Users, Radio, Loader2, Camera } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import * as videoSDKService from '@/services/videosdk';

interface LiveStream {
  _id: string;
  title: string;
  description?: string;
  category: string;
  thumbnail?: string;
  videoSdkRoomId?: string;
  startedAt: string;
  currentViewers: number;
  totalViews: number;
  status: string;
  streamer?: {
    _id: string;
    username: string;
    name?: string;
    avatar?: string;
    isVerified?: boolean;
  };
}

interface LiveStreamsListProps {
  onJoinStream: (streamId: string) => void;
  onStreamStarted?: (streamData: any) => void;
}

export const LiveStreamsList = ({ onJoinStream, onStreamStarted }: LiveStreamsListProps) => {
  const [streams, setStreams] = useState<LiveStream[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showGoLiveForm, setShowGoLiveForm] = useState(false);
  const [streamTitle, setStreamTitle] = useState('');
  const [startingStream, setStartingStream] = useState(false);

  const fetchLiveStreams = async () => {
    try {
      const data = await videoSDKService.getLiveStreams();
      setStreams(data || []);
    } catch (error) {
      console.error('Error fetching live streams:', error);
      toast({
        title: 'Error',
        description: 'Failed to load live streams',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLiveStreams();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      setRefreshing(true);
      fetchLiveStreams();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const handleJoin = (streamId: string) => {
    onJoinStream(streamId);
  };

  const handleGoLive = async () => {
    if (!streamTitle.trim()) {
      toast({
        title: 'Title Required',
        description: 'Please enter a stream title',
        variant: 'destructive',
      });
      return;
    }

    setStartingStream(true);
    try {
      // Always call startStream directly
      const streamData = await videoSDKService.startStream({
        title: streamTitle.trim(),
        description: '',
        category: 'other',
      });
      
      toast({
        title: '🔴 Live!',
        description: 'Your stream is now live',
      });
      
      // Notify parent component about stream start
      if (onStreamStarted) {
        onStreamStarted(streamData);
      } else {
        // Fallback: reload if no callback provided
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      }
    } catch (error: any) {
      console.error('Error starting stream:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to start stream',
        variant: 'destructive',
      });
    } finally {
      setStartingStream(false);
    }
  };

  const formatViewerCount = (count: number) => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      gaming: 'bg-blue-500',
      music: 'bg-purple-500',
      art: 'bg-pink-500',
      education: 'bg-green-500',
      lifestyle: 'bg-orange-500',
      other: 'bg-gray-500',
    };
    return colors[category] || colors.other;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-pink-800 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-white animate-spin mx-auto mb-4" />
          <p className="text-white text-lg">Loading live streams...</p>
        </div>
      </div>
    );
  }

  if (streams.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-pink-800 flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-4">
          <Card className="bg-white/10 backdrop-blur-lg border-white/20">
            <CardContent className="p-8 text-center">
              <Radio className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2">No Live Streams</h2>
              <p className="text-purple-200 mb-6">
                There are no live streams at the moment. Start your own stream!
              </p>
              
              {/* Go Live Form */}
              {showGoLiveForm ? (
                <div className="space-y-4">
                  <Input
                    placeholder="What's your stream about?"
                    value={streamTitle}
                    onChange={(e) => setStreamTitle(e.target.value)}
                    className="bg-white/20 border-white/30 text-white placeholder:text-purple-200"
                    onKeyPress={(e) => e.key === 'Enter' && !startingStream && handleGoLive()}
                  />
                  <div className="flex space-x-2">
                    <Button
                      onClick={handleGoLive}
                      disabled={!streamTitle.trim() || startingStream}
                      className="flex-1 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white"
                    >
                      {startingStream ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Starting...
                        </>
                      ) : (
                        <>
                          <Camera className="w-4 h-4 mr-2" />
                          Start Stream
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowGoLiveForm(false);
                        setStreamTitle('');
                      }}
                      className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col space-y-3">
                  <Button
                    onClick={() => setShowGoLiveForm(true)}
                    className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white py-6 text-lg font-semibold"
                  >
                    <Camera className="w-5 h-5 mr-2" />
                    Go Live
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setRefreshing(true);
                      fetchLiveStreams();
                    }}
                    disabled={refreshing}
                    className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                  >
                    {refreshing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Refreshing...
                      </>
                    ) : (
                      'Refresh'
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-pink-800 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Live Streams</h1>
              <p className="text-purple-200">
                {streams.length} {streams.length === 1 ? 'stream' : 'streams'} live now
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                onClick={() => setShowGoLiveForm(!showGoLiveForm)}
                className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white"
              >
                <Camera className="w-4 h-4 mr-2" />
                Go Live
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setRefreshing(true);
                  fetchLiveStreams();
                }}
                disabled={refreshing}
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                {refreshing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Refreshing...
                  </>
                ) : (
                  'Refresh'
                )}
              </Button>
            </div>
          </div>

          {/* Go Live Form */}
          {showGoLiveForm && (
            <Card className="mb-6 bg-white/10 backdrop-blur-lg border-white/20">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="flex-1">
                    <Input
                      placeholder="What's your stream about?"
                      value={streamTitle}
                      onChange={(e) => setStreamTitle(e.target.value)}
                      className="bg-white/20 border-white/30 text-white placeholder:text-purple-200"
                      onKeyPress={(e) => e.key === 'Enter' && !startingStream && handleGoLive()}
                    />
                  </div>
                  <Button
                    onClick={handleGoLive}
                    disabled={!streamTitle.trim() || startingStream}
                    className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white"
                  >
                    {startingStream ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Starting...
                      </>
                    ) : (
                      <>
                        <Camera className="w-4 h-4 mr-2" />
                        Start Stream
                      </>
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setShowGoLiveForm(false);
                      setStreamTitle('');
                    }}
                    className="text-white hover:bg-white/10"
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Streams Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {streams.map((stream) => (
            <Card
              key={stream._id}
              className="bg-white/10 backdrop-blur-lg border-white/20 hover:bg-white/15 transition-all cursor-pointer overflow-hidden"
              onClick={() => handleJoin(stream._id)}
            >
              <CardContent className="p-0">
                {/* Thumbnail/Video Preview */}
                <div className="relative aspect-video bg-black">
                  {stream.thumbnail ? (
                    <img
                      src={stream.thumbnail}
                      alt={stream.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-600 to-pink-600">
                      <Radio className="w-16 h-16 text-white/50" />
                    </div>
                  )}
                  
                  {/* Live Badge */}
                  <div className="absolute top-3 left-3">
                    <Badge className="bg-red-600 text-white animate-pulse">
                      <div className="w-2 h-2 bg-white rounded-full mr-2" />
                      LIVE
                    </Badge>
                  </div>

                  {/* Viewer Count */}
                  <div className="absolute top-3 right-3">
                    <div className="bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-full flex items-center space-x-2">
                      <Users className="w-4 h-4 text-white" />
                      <span className="text-white font-semibold text-sm">
                        {formatViewerCount(stream.currentViewers || 0)}
                      </span>
                    </div>
                  </div>

                  {/* Category Badge */}
                  <div className="absolute bottom-3 left-3">
                    <Badge
                      className={`${getCategoryColor(stream.category)} text-white capitalize`}
                    >
                      {stream.category}
                    </Badge>
                  </div>
                </div>

                {/* Stream Info */}
                <div className="p-4">
                  <div className="flex items-start space-x-3 mb-3">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={stream.streamer?.avatar} />
                      <AvatarFallback>
                        {stream.streamer?.username?.[0]?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-semibold text-white truncate">
                          {stream.streamer?.username || 'Unknown'}
                        </h3>
                        {stream.streamer?.isVerified && (
                          <Badge variant="outline" className="border-blue-500 text-blue-500 text-xs">
                            ✓
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-purple-200 truncate">
                        {stream.title}
                      </p>
                    </div>
                  </div>

                  {stream.description && (
                    <p className="text-sm text-purple-300 mb-3 line-clamp-2">
                      {stream.description}
                    </p>
                  )}

                  <Button
                    className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleJoin(stream._id);
                    }}
                  >
                    <Radio className="w-4 h-4 mr-2" />
                    Join Stream
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

