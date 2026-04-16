import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { 
  Users, 
  ArrowLeft, 
  Send, 
  Radio,
  Loader2 
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import * as videoSDKService from '@/services/videosdk';
import { getSocket } from '@/lib/socket';
import { MeetingProvider, useMeeting, useParticipant } from '@videosdk.live/react-sdk';

interface StreamViewerProps {
  streamId: string;
  onBack: () => void;
}

interface ChatMessage {
  id: string;
  user: string;
  message: string;
  timestamp: string;
}

// Inner component that uses VideoSDK hooks
const StreamViewerContent = ({ streamId, onBack, roomId, token, streamData, viewerCount, setViewerCount, socketRef, userName }: any) => {
  const { user } = useAuth();
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatMessage, setChatMessage] = useState('');
  const [joined, setJoined] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // Get meeting instance
  const { join, leave, participants, localParticipant } = useMeeting({
    onMeetingJoined: () => {
      console.log('═══════════════════════════════════════════════════════');
      console.log('✅ VIEWER SUCCESSFULLY JOINED VIDEOSDK MEETING');
      console.log('═══════════════════════════════════════════════════════');
    },
    onMeetingLeft: () => {
      console.log('👋 VIEWER: Left VideoSDK meeting');
    },
    onError: (error) => {
      console.error('═══════════════════════════════════════════════════════');
      console.error('❌ VIEWER: VIDEOSDK MEETING ERROR');
      console.error('═══════════════════════════════════════════════════════');
      console.error('Error:', error);
      console.error('Error message:', error.message);
      console.error('Error code:', (error as any).code);
      console.error('Room ID:', roomId);
      console.error('Has Token:', !!token);
      console.error('═══════════════════════════════════════════════════════');
      
      if (error.message?.includes('401') || (error as any).code === 401) {
        toast({
          title: 'Authentication Failed',
          description: 'Invalid stream token. Please refresh the page.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Connection Error',
          description: error.message || 'Failed to connect to stream',
          variant: 'destructive',
        });
      }
    },
    onParticipantJoined: (participant) => {
      console.log('═══════════════════════════════════════════════════════');
      console.log('👤 VIEWER: Participant joined');
      console.log('═══════════════════════════════════════════════════════');
      console.log('Participant ID:', participant.id);
      console.log('Participant webcam on:', participant.webcamOn);
      console.log('Participant mic on:', participant.micOn);
      console.log('Is local participant:', participant.id === localParticipant?.id);
      console.log('Participant displayName:', (participant as any).displayName);
      console.log('Total participants now:', participants.size);
      console.log('═══════════════════════════════════════════════════════');
      
      // If this is a remote participant with webcam on, it's likely the streamer
      if (participant.id !== localParticipant?.id && participant.webcamOn) {
        console.log('🎯 VIEWER: Found streamer participant with webcam on!');
      }
    },
    onParticipantLeft: (participant) => {
      console.log('👋 VIEWER: Participant left:', participant.id);
    },
  });

  // Get streamer's video stream (first remote participant with video)
  const allParticipants = Array.from(participants.values());
  const localParticipantId = localParticipant?.id;
  
  // Find streamer - get the FIRST remote participant (streamer should be the first one)
  // Don't filter by webcamOn initially - get all participants and check their streams
  const remoteParticipants = allParticipants.filter((p: any) => p.id !== localParticipantId);
  
  // Try to find streamer - prioritize participants with webcam on, but also check all participants
  let streamerParticipant = remoteParticipants.find((p: any) => p.webcamOn);
  
  // If no participant with webcam on, just get the first remote participant (might be streamer)
  if (!streamerParticipant && remoteParticipants.length > 0) {
    streamerParticipant = remoteParticipants[0];
    console.log('⚠️ No participant with webcam on, using first remote participant:', streamerParticipant.id);
  }
  
  // Use participant hook to get video stream
  const participantId = streamerParticipant?.id || '';
  
  // useParticipant hook - pass null if no participant ID to avoid errors
  const { webcamStream, webcamOn, micStream } = useParticipant(participantId || null);
  
  // Log participant info when it changes
  useEffect(() => {
    console.log('═══════════════════════════════════════════════════════');
    console.log('🔍 VIEWER: Looking for streamer...');
    console.log('═══════════════════════════════════════════════════════');
    console.log('Total participants:', allParticipants.length);
    console.log('Local participant ID:', localParticipantId);
    console.log('Remote participants:', remoteParticipants.length);
    console.log('All participants:', allParticipants.map((p: any) => ({
      id: p.id,
      webcamOn: p.webcamOn,
      micOn: p.micOn,
      isLocal: p.id === localParticipantId
    })));
    console.log('🎯 Streamer participant found:', streamerParticipant ? {
      id: streamerParticipant.id,
      webcamOn: streamerParticipant.webcamOn,
      micOn: streamerParticipant.micOn
    } : 'NONE');
    console.log('📹 Using participant ID for video:', participantId || 'NONE');
    console.log('📺 Webcam stream status:', {
      hasStream: !!webcamStream,
      webcamOn: webcamOn,
      participantId: participantId,
      hasMicStream: !!micStream
    });
    console.log('═══════════════════════════════════════════════════════');
  }, [allParticipants.length, participantId, webcamStream, webcamOn, localParticipantId, streamerParticipant, remoteParticipants.length, micStream]);

  // Track join attempt to prevent multiple joins
  const joinAttemptedRef = useRef(false);
  const currentRoomIdRef = useRef<string | null>(null);
  
  // Join meeting when roomId and token are available
  useEffect(() => {
    // Only join if we have roomId and token, haven't joined yet, and roomId hasn't changed
    if (roomId && token && !joined && !joinAttemptedRef.current && currentRoomIdRef.current !== roomId) {
      console.log('═══════════════════════════════════════════════════════');
      console.log('🔄 VIEWER JOINING VIDEOSDK MEETING');
      console.log('═══════════════════════════════════════════════════════');
      console.log('📋 Room ID:', roomId);
      console.log('🔑 Token (first 30 chars):', token.substring(0, 30) + '...');
      console.log('📋 Token length:', token.length);
      console.log('═══════════════════════════════════════════════════════');
      
      joinAttemptedRef.current = true;
      currentRoomIdRef.current = roomId;
      
      try {
        join();
        setJoined(true);
        console.log('✅ VIEWER: join() called successfully');
      } catch (error: any) {
        console.error('❌ VIEWER: Error joining meeting:', error);
        joinAttemptedRef.current = false; // Reset on error
        toast({
          title: 'Connection Error',
          description: error.message || 'Failed to join stream',
          variant: 'destructive',
        });
      }
    }
    
    // Cleanup only on unmount or roomId change
    return () => {
      // Only cleanup if component is unmounting or roomId changed
      if (joinAttemptedRef.current && (currentRoomIdRef.current !== roomId || !roomId)) {
        console.log('👋 VIEWER: Leaving meeting on cleanup');
        joinAttemptedRef.current = false;
        currentRoomIdRef.current = null;
        if (joined) {
          try {
            if (typeof leave === 'function') {
              try {
                leave();
              } catch (err: any) {
                // Ignore errors - connection might already be closed
                console.warn('⚠️ VIEWER: Error during cleanup (ignored):', err);
              }
            }
          } catch (error) {
            // Ignore errors during cleanup
            console.warn('⚠️ VIEWER: Error during cleanup (ignored):', error);
          }
          setJoined(false);
        }
      }
    };
  }, [roomId, token, joined]); // Removed join and leave from dependencies

  // Attach video stream to video element
  useEffect(() => {
    if (webcamStream && videoRef.current && participantId) {
      console.log('═══════════════════════════════════════════════════════');
      console.log('📹 VIEWER: Attaching streamer video to video element');
      console.log('═══════════════════════════════════════════════════════');
      console.log('Participant ID:', participantId);
      console.log('Webcam stream:', webcamStream);
      console.log('Track:', webcamStream.track);
      console.log('Track enabled:', webcamStream.track?.enabled);
      console.log('Track readyState:', webcamStream.track?.readyState);
      console.log('Track muted:', webcamStream.track?.muted);
      console.log('═══════════════════════════════════════════════════════');
      
      try {
        const mediaStream = new MediaStream([webcamStream.track]);
        videoRef.current.srcObject = mediaStream;
        
        // Ensure video plays
        const playPromise = videoRef.current.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              console.log('✅ VIEWER: Video stream attached and playing');
            })
            .catch(err => {
              console.error('❌ Error playing video:', err);
              // Try again after a short delay
              setTimeout(() => {
                if (videoRef.current) {
                  videoRef.current.play().catch(e => {
                    console.error('❌ Retry play failed:', e);
                  });
                }
              }, 500);
            });
        }
      } catch (error) {
        console.error('❌ VIEWER: Error attaching stream:', error);
      }
    } else if (videoRef.current && !webcamStream) {
      console.log('⚠️ VIEWER: No webcam stream available');
      console.log('Participant ID:', participantId || 'NONE');
      console.log('Webcam on:', webcamOn);
      console.log('Total participants:', allParticipants.length);
      console.log('Remote participants:', remoteParticipants.length);
      
      // Don't clear immediately - might be connecting
      // Only clear if we've been waiting for a while and have participants
      if (allParticipants.length > 1 && participantId) {
        console.log('⚠️ VIEWER: Has participants but no stream - might be loading...');
      }
    }
  }, [webcamStream, participantId, webcamOn, allParticipants.length, remoteParticipants.length]);

  const handleSendMessage = () => {
    if (!chatMessage.trim() || !user) return;

    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      user: user.username || 'You',
      message: chatMessage.trim(),
      timestamp: new Date().toLocaleTimeString(),
    };

    setChatMessages((prev) => [...prev, newMessage]);
    setChatMessage('');

    // TODO: Send message to backend API
    // await videoSDKService.sendChatMessage(streamId, chatMessage);
  };

  const formatViewerCount = (count: number) => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header */}
      <div className="bg-black/80 backdrop-blur-sm border-b border-gray-800 p-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="text-white hover:bg-white/10"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          
          <div className="flex items-center space-x-3">
            <Avatar className="w-10 h-10">
              <AvatarImage src={streamData?.streamer?.avatar || streamData?.streamerId?.avatar} />
              <AvatarFallback>
                {streamData?.streamer?.username?.[0] || streamData?.streamerId?.username?.[0] || 'U'}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-white font-semibold">
                  {streamData?.streamer?.username || streamData?.streamerId?.username || 'Unknown'}
                </h3>
                {streamData?.streamer?.isVerified && (
                  <Badge variant="outline" className="border-blue-500 text-blue-500 text-xs">
                    ✓
                  </Badge>
                )}
              </div>
              <p className="text-gray-400 text-sm">{streamData?.title}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 bg-black/60 px-4 py-2 rounded-full">
            <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse" />
            <span className="text-white font-semibold text-sm">LIVE</span>
          </div>
          <div className="flex items-center space-x-2 bg-black/60 px-4 py-2 rounded-full">
            <Users className="w-4 h-4 text-white" />
            <span className="text-white font-semibold">{formatViewerCount(viewerCount)}</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Video Area */}
        <div className="flex-1 bg-gray-900 flex items-center justify-center relative">
          {/* Video Element */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted={false}
            className="w-full h-full object-contain"
            style={{ display: webcamStream ? 'block' : 'none' }}
          />
          
          {/* Placeholder when video not loaded */}
          {!webcamStream && (
            <div className="text-center p-8">
              <Radio className="w-24 h-24 text-gray-500 mx-auto mb-4 animate-pulse" />
              <p className="text-white text-lg font-semibold mb-2">
                {roomId && token ? 'Waiting for stream...' : 'Connecting to stream...'}
              </p>
              <p className="text-gray-400 text-sm">
                {webcamOn ? 'Streamer is setting up video' : 'Video stream will appear here once streamer starts'}
              </p>
              {streamData?.thumbnail && (
                <img
                  src={streamData.thumbnail}
                  alt={streamData.title}
                  className="mt-4 max-w-md mx-auto rounded-lg opacity-50"
                />
              )}
            </div>
          )}
        </div>

        {/* Chat Sidebar */}
        <div className="w-80 bg-black/60 backdrop-blur-sm border-l border-gray-800 flex flex-col">
          <div className="p-4 border-b border-gray-800">
            <h3 className="text-white font-semibold">Live Chat</h3>
          </div>

          <ScrollArea className="flex-1 p-4">
            <div className="space-y-3">
              {chatMessages.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <p>No messages yet</p>
                  <p className="text-sm mt-2">Be the first to chat!</p>
                </div>
              ) : (
                chatMessages.map((msg) => (
                  <div key={msg.id} className="flex items-start space-x-2">
                    <Avatar className="w-6 h-6">
                      <AvatarFallback className="text-xs">
                        {msg.user[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="text-sm">
                        <span className="font-semibold text-white">{msg.user}</span>
                        <span className="ml-2 text-gray-300">{msg.message}</span>
                      </p>
                      <p className="text-xs text-gray-500 mt-1">{msg.timestamp}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>

          <div className="p-4 border-t border-gray-800">
            <div className="flex space-x-2">
              <Input
                placeholder="Type a message..."
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                className="bg-black/40 border-gray-700 text-white placeholder:text-gray-500"
              />
              <Button
                size="icon"
                onClick={handleSendMessage}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Main component with VideoSDK MeetingProvider
export const StreamViewer = ({ streamId, onBack }: StreamViewerProps) => {
  // FIX: Move useAuth to top level - hooks must be called unconditionally
  const { user } = useAuth();
  const [streamData, setStreamData] = useState<any>(null);
  const [viewerCount, setViewerCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [joined, setJoined] = useState(false);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const socketRef = useRef<any>(null);

  useEffect(() => {
    joinStream();

    return () => {
      // Leave stream on unmount
      if (joined && streamId) {
        try {
          leaveStream();
        } catch (error) {
          console.warn('⚠️ Error leaving stream on unmount (ignored):', error);
        }
      }
      if (socketRef.current) {
        try {
          socketRef.current.emit('leave_stream', streamId);
          socketRef.current.off('stream_viewer_count');
          socketRef.current.disconnect();
        } catch (error) {
          console.warn('⚠️ Error disconnecting socket (ignored):', error);
        }
      }
    };
  }, [streamId, joined]);

  const joinStream = async () => {
    try {
      setLoading(true);
      const data = await videoSDKService.joinStream(streamId);
      
      setStreamData(data.stream);
      setRoomId(data.roomId);
      setToken(data.token);
      setViewerCount(data.stream?.currentViewers || 0);
      setJoined(true);

      // Connect to Socket.IO for real-time updates
      const socket = getSocket();
      socket.connect();
      socket.emit('join_stream', streamId);
      
      socket.on('stream_viewer_count', (data: { streamId: string; viewerCount: number }) => {
        if (data.streamId === streamId) {
          setViewerCount(data.viewerCount);
        }
      });

      socketRef.current = socket;

      toast({
        title: 'Joined Stream',
        description: 'You are now watching the stream',
      });
    } catch (error: any) {
      console.error('Error joining stream:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to join stream',
        variant: 'destructive',
      });
      onBack();
    } finally {
      setLoading(false);
    }
  };

  const leaveStream = async () => {
    try {
      await videoSDKService.leaveStream(streamId);
      if (socketRef.current) {
        socketRef.current.emit('leave_stream', streamId);
        socketRef.current.disconnect();
      }
      toast({
        title: 'Left Stream',
        description: 'You left the stream',
      });
    } catch (error: any) {
      console.error('Error leaving stream:', error);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-white animate-spin mx-auto mb-4" />
          <p className="text-white text-lg">Joining stream...</p>
        </div>
      </div>
    );
  }

  if (!streamData || !roomId || !token) {
    return (
      <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-white text-lg mb-4">Stream not found or connection failed</p>
          <Button onClick={onBack}>Go Back</Button>
        </div>
      </div>
    );
  }

  // Wrap with MeetingProvider for VideoSDK
  console.log('═══════════════════════════════════════════════════════');
  console.log('📺 STREAMVIEWER: Setting up MeetingProvider');
  console.log('═══════════════════════════════════════════════════════');
  console.log('Room ID:', roomId);
  console.log('Token exists:', !!token);
  console.log('Token length:', token?.length || 0);
  console.log('Stream Data:', streamData ? { id: streamData.id, title: streamData.title } : 'NONE');
  console.log('═══════════════════════════════════════════════════════');
  
  return (
    <MeetingProvider
      config={{
        meetingId: roomId,
        micEnabled: false,
        webcamEnabled: false,
        name: user?.username || 'Viewer',
        debugMode: false,
        autoConsume: true,
      }}
      token={token}
    >
      <StreamViewerContent
        streamId={streamId}
        onBack={onBack}
        roomId={roomId}
        token={token}
        streamData={streamData}
        viewerCount={viewerCount}
        setViewerCount={setViewerCount}
        socketRef={socketRef}
        userName={user?.username}
      />
    </MeetingProvider>
  );
};

