import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Camera, Users, X, Mic, MicOff, Video as VideoIcon, VideoOff } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import * as videoSDKService from '@/services/videosdk';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { LiveStreamsList } from './LiveStreamsList';
import { StreamViewer } from './StreamViewer';
import { getSocket } from '@/lib/socket';
import { MeetingProvider, useMeeting, useParticipant } from '@videosdk.live/react-sdk';

interface JoinMessage {
  id: string;
  name: string;
  time: number;
}

// Inner component that uses VideoSDK hooks for streamer
const StreamerContentInner = ({ streamData, viewerCount, onEndStream, isLoading, socketRef, roomId, token }: any) => {
  const { user } = useAuth();
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [meetingJoined, setMeetingJoined] = useState(false);
  const [webcamEnabled, setWebcamEnabled] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const leaveCalledRef = useRef(false);
  const joinAttemptedRef = useRef(false); // Track if we've attempted to join
  const webcamEnableAttemptedRef = useRef(false); // Track if we've attempted to enable webcam

  // Get meeting instance
  const { join, leave, toggleMic, toggleWebcam, localParticipant } = useMeeting({
    onMeetingJoined: () => {
      console.log('═══════════════════════════════════════════════════════');
      console.log('✅ STREAMER SUCCESSFULLY JOINED VIDEOSDK MEETING');
      console.log('═══════════════════════════════════════════════════════');
      setMeetingJoined(true);
    },
    onMeetingLeft: () => {
      console.log('═══════════════════════════════════════════════════════');
      console.log('👋 STREAMER LEFT VIDEOSDK MEETING');
      console.log('═══════════════════════════════════════════════════════');
      setMeetingJoined(false);
      joinAttemptedRef.current = false; // Reset on leave
    },
    onParticipantJoined: (participant) => {
      console.log('👤 Viewer joined:', participant.id);
      console.log('Viewer webcam on:', participant.webcamOn);
      console.log('Viewer mic on:', participant.micOn);
    },
    onParticipantLeft: (participant) => {
      console.log('👋 Viewer left:', participant.id);
    },
    onError: (error) => {
      console.error('═══════════════════════════════════════════════════════');
      console.error('❌ VIDEOSDK MEETING ERROR');
      console.error('═══════════════════════════════════════════════════════');
      console.error('Error object:', error);
      console.error('Error message:', error.message);
      console.error('Error code:', (error as any).code);
      console.error('Error name:', (error as any).name);
      console.error('Room ID:', roomId);
      console.error('Has Token:', !!token);
      console.error('Token preview:', token ? token.substring(0, 50) + '...' : 'NO TOKEN');
      console.error('═══════════════════════════════════════════════════════');
      
      // Check for specific error types
      if (error.message?.includes('404') || error.message?.includes('Not Found') || (error as any).code === 404) {
        console.error('🔴 404 ERROR: Room not found in VideoSDK infra API');
        toast({
          title: 'Stream Room Not Found',
          description: 'The stream room no longer exists. The system will recreate it automatically. Please refresh.',
          variant: 'destructive',
        });
        // Don't end stream - let backend recreate the room on next request
        // Just reset join attempt so it can retry
        joinAttemptedRef.current = false;
      } else if (error.message?.includes('401') || error.message?.includes('Unauthorized') || (error as any).code === 401) {
        console.error('🔴 401 ERROR: Authentication failed');
        toast({
          title: 'Authentication Failed',
          description: 'Invalid stream token. Please refresh the page.',
          variant: 'destructive',
        });
        joinAttemptedRef.current = false;
      } else {
        console.error('🔴 UNKNOWN ERROR:', error);
        toast({
          title: 'Stream Error',
          description: error.message || 'Failed to connect to stream. Please try refreshing.',
          variant: 'destructive',
        });
        joinAttemptedRef.current = false;
      }
    },
  });

  // Get local participant's webcam stream
  const participantId = localParticipant?.id || '';
  const { webcamStream, webcamOn, micOn } = useParticipant(participantId);

  // Join meeting when roomId and token are available (ONLY ONCE)
  useEffect(() => {
    // Only join if we have roomId, token, haven't joined, and haven't attempted yet
    if (roomId && token && !meetingJoined && !joinAttemptedRef.current && !leaveCalledRef.current) {
      joinAttemptedRef.current = true; // Mark as attempted immediately to prevent re-runs
      console.log('═══════════════════════════════════════════════════════');
      console.log('🔄 STREAMER JOINING VIDEOSDK MEETING');
      console.log('═══════════════════════════════════════════════════════');
      console.log('📋 Room ID:', roomId);
      console.log('🔑 Token (first 30 chars):', token.substring(0, 30) + '...');
      console.log('📋 Token length:', token.length);
      console.log('📋 Stream Data:', {
        id: streamData?.id,
        title: streamData?.title,
        status: streamData?.status
      });
      console.log('═══════════════════════════════════════════════════════');
      
      // Use setTimeout to ensure this runs after render
      const joinTimer = setTimeout(() => {
        try {
          if (typeof join === 'function') {
            console.log('✅ Calling join() function...');
            join();
            console.log('✅ join() called successfully');
          } else {
            console.error('❌ Join function not available');
            joinAttemptedRef.current = false;
            toast({
              title: 'Connection Error',
              description: 'Failed to initialize stream connection',
              variant: 'destructive',
            });
          }
        } catch (error: any) {
          console.error('❌ Error joining meeting:', error);
          console.error('Error details:', {
            message: error.message,
            name: error.name,
            stack: error.stack
          });
          joinAttemptedRef.current = false; // Reset on error
          toast({
            title: 'Connection Error',
            description: error.message || 'Failed to join stream',
            variant: 'destructive',
          });
        }
      }, 100);
      
      return () => clearTimeout(joinTimer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, token]); // Only depend on roomId and token, NOT on join or meetingJoined

  // Enable webcam and mic automatically when meeting is joined (ONCE)
  useEffect(() => {
    if (meetingJoined && localParticipant && !webcamEnableAttemptedRef.current) {
      webcamEnableAttemptedRef.current = true; // Mark as attempted immediately
      
      console.log('═══════════════════════════════════════════════════════');
      console.log('🎥 ENABLING WEBCAM AND MIC');
      console.log('═══════════════════════════════════════════════════════');
      console.log('Local participant:', localParticipant.id);
      console.log('Current webcam state:', webcamOn);
      console.log('Current mic state:', micOn);
      console.log('═══════════════════════════════════════════════════════');
      
      // Mark as enabled immediately to prevent re-runs
      setWebcamEnabled(true);
      
      // Small delay to ensure meeting is fully connected
      const enableTimer = setTimeout(() => {
        try {
          console.log('🔄 Calling toggleWebcam()...');
          toggleWebcam();
          
          // Small delay between toggles
          setTimeout(() => {
            console.log('🔄 Calling toggleMic()...');
            toggleMic();
            console.log('✅ Webcam and mic toggle commands sent');
          }, 300);
        } catch (error) {
          console.error('❌ Error enabling webcam/mic:', error);
          toast({
            title: 'Camera Error',
            description: 'Failed to enable camera. Please check permissions.',
            variant: 'destructive',
          });
        }
      }, 2000); // Increased delay to ensure meeting is ready
      
      return () => clearTimeout(enableTimer);
    }
  }, [meetingJoined, localParticipant]); // Only depend on meetingJoined and localParticipant

  // Cleanup: Leave meeting on unmount
  useEffect(() => {
    return () => {
      if (meetingJoined && !leaveCalledRef.current && leave) {
        leaveCalledRef.current = true;
        console.log('🧹 Cleaning up: Leaving VideoSDK meeting');
        try {
          // Only leave if meeting was successfully joined
          if (typeof leave === 'function') {
            leave();
          }
        } catch (error) {
          // Ignore errors during cleanup
          console.warn('Warning during cleanup:', error);
        }
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meetingJoined]);

  // Attach local webcam stream to video element
  useEffect(() => {
    if (webcamStream && videoRef.current) {
      console.log('📹 Attaching webcam stream to video element');
      console.log('Webcam stream track:', webcamStream.track);
      console.log('Track enabled:', webcamStream.track.enabled);
      console.log('Track readyState:', webcamStream.track.readyState);
      try {
        const mediaStream = new MediaStream([webcamStream.track]);
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play().catch(err => {
          console.error('Error playing video:', err);
        });
        console.log('✅ Video stream attached and playing');
      } catch (error) {
        console.error('❌ Error attaching stream:', error);
      }
    } else if (videoRef.current && !webcamStream) {
      // Don't clear immediately - wait a bit in case stream is reconnecting
      console.log('⚠️ No webcam stream available');
      console.log('Webcam enabled:', webcamEnabled);
      console.log('Webcam on:', webcamOn);
      console.log('Meeting joined:', meetingJoined);
      
      // Only clear if webcam was enabled and meeting is joined (stream should be there)
      if (webcamEnabled && meetingJoined) {
        console.log('⚠️ Webcam should be on but no stream - might be reconnecting');
        // Don't clear - let it reconnect
      }
    }
  }, [webcamStream, webcamEnabled, webcamOn, meetingJoined]);

  // Update mute/video state based on VideoSDK state
  useEffect(() => {
    setIsMuted(!micOn);
    setIsVideoOff(!webcamOn);
    
    // Log state changes
    if (meetingJoined) {
      console.log('📊 State update - Webcam:', webcamOn, 'Mic:', micOn);
    }
  }, [micOn, webcamOn, meetingJoined]);
  
  // Monitor and re-enable webcam/mic if they turn off (with proper debouncing)
  const reenableWebcamRef = useRef(false);
  const reenableMicRef = useRef(false);
  const reenableWebcamTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reenableMicTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastWebcamStateRef = useRef(webcamOn);
  const lastMicStateRef = useRef(micOn);
  
  useEffect(() => {
    if (meetingJoined && webcamEnabled) {
      // Only act on state changes, not every render
      const webcamChanged = lastWebcamStateRef.current !== webcamOn;
      const micChanged = lastMicStateRef.current !== micOn;
      
      lastWebcamStateRef.current = webcamOn;
      lastMicStateRef.current = micOn;
      
      // Handle webcam - only re-enable if it was intentionally turned off by user
      // Don't auto re-enable if it's a temporary state change
      if (webcamChanged && !webcamOn && !reenableWebcamRef.current && webcamEnabled) {
        // Clear any existing timeout
        if (reenableWebcamTimeoutRef.current) {
          clearTimeout(reenableWebcamTimeoutRef.current);
        }
        
        reenableWebcamRef.current = true;
        console.log('⚠️ Webcam turned off unexpectedly, will re-enable in 5 seconds...');
        reenableWebcamTimeoutRef.current = setTimeout(() => {
          if (!webcamOn && meetingJoined && webcamEnabled) {
            console.log('🔄 Re-enabling webcam...');
            try {
              toggleWebcam();
            } catch (error) {
              console.error('❌ Error re-enabling webcam:', error);
            }
          }
          // Reset after 10 seconds to allow another attempt if needed
          setTimeout(() => {
            reenableWebcamRef.current = false;
          }, 10000);
        }, 5000); // Increased delay to 5 seconds
      } else if (webcamOn) {
        // Reset flag if webcam is on
        if (reenableWebcamRef.current) {
          reenableWebcamRef.current = false;
          if (reenableWebcamTimeoutRef.current) {
            clearTimeout(reenableWebcamTimeoutRef.current);
            reenableWebcamTimeoutRef.current = null;
          }
        }
      }
      
      // Handle mic
      if (micChanged && !micOn && !reenableMicRef.current) {
        // Clear any existing timeout
        if (reenableMicTimeoutRef.current) {
          clearTimeout(reenableMicTimeoutRef.current);
        }
        
        reenableMicRef.current = true;
        console.log('⚠️ Mic turned off, will re-enable in 3 seconds...');
        reenableMicTimeoutRef.current = setTimeout(() => {
          if (!micOn && meetingJoined) {
            console.log('🔄 Re-enabling mic...');
            toggleMic();
          }
          // Reset after 5 seconds to allow another attempt if needed
          setTimeout(() => {
            reenableMicRef.current = false;
          }, 5000);
        }, 3000);
      } else if (micOn) {
        // Reset flag if mic is on
        if (reenableMicRef.current) {
          reenableMicRef.current = false;
          if (reenableMicTimeoutRef.current) {
            clearTimeout(reenableMicTimeoutRef.current);
            reenableMicTimeoutRef.current = null;
          }
        }
      }
      
      return () => {
        if (reenableWebcamTimeoutRef.current) {
          clearTimeout(reenableWebcamTimeoutRef.current);
        }
        if (reenableMicTimeoutRef.current) {
          clearTimeout(reenableMicTimeoutRef.current);
        }
      };
    } else {
      // Reset flags when meeting is not joined
      reenableWebcamRef.current = false;
      reenableMicRef.current = false;
      lastWebcamStateRef.current = false;
      lastMicStateRef.current = false;
    }
  }, [webcamOn, micOn, meetingJoined, webcamEnabled, toggleWebcam, toggleMic]);

  const handleToggleMute = () => {
    toggleMic();
  };

  const handleToggleVideo = () => {
    toggleWebcam();
  };

  return (
    <div className="fixed inset-0 bg-black z-50">
      {/* Video Stream */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="absolute inset-0 w-full h-full object-cover"
      />
      
      {/* Placeholder when video not loaded */}
      {(!webcamStream || isVideoOff) && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 z-20">
          <div className="text-center text-white">
            <div className="w-24 h-24 border-4 border-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Camera className="w-12 h-12 text-white/50" />
            </div>
            {!meetingJoined ? (
              <>
                <p className="text-lg font-semibold mb-2">Connecting to stream...</p>
                <p className="text-sm text-gray-400">Please wait</p>
              </>
            ) : !webcamEnabled ? (
              <>
                <p className="text-lg font-semibold mb-2">Enabling camera...</p>
                <p className="text-sm text-gray-400">Please allow camera access</p>
              </>
            ) : (
              <>
                <p className="text-lg font-semibold mb-2">Camera is off</p>
                <p className="text-sm text-gray-400">Click the camera button to enable</p>
              </>
            )}
          </div>
        </div>
      )}

      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-black/20" />

      {/* Top Bar */}
      <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/60 to-transparent z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="px-4 py-2 bg-red-600 rounded-full flex items-center space-x-2 animate-pulse">
              <div className="w-3 h-3 bg-white rounded-full" />
              <span className="text-white font-bold text-sm">LIVE</span>
            </div>
            <div className="px-4 py-2 bg-black/40 backdrop-blur-sm rounded-full flex items-center space-x-2">
              <Users className="w-4 h-4 text-white" />
              <span className="text-white font-semibold">{viewerCount}</span>
            </div>
          </div>

          <Button
            onClick={onEndStream}
            disabled={isLoading}
            variant="ghost"
            size="icon"
            className="bg-black/40 backdrop-blur-sm hover:bg-black/60 text-white rounded-full"
          >
            <X className="w-6 h-6" />
          </Button>
        </div>

        {streamData?.title && (
          <div className="mt-3 px-4">
            <p className="text-white text-lg font-medium">{streamData.title}</p>
          </div>
        )}
      </div>

      {/* Bottom Controls */}
      <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/60 to-transparent z-10">
        <div className="flex items-center justify-center space-x-4">
          <Button
            onClick={handleToggleMute}
            size="icon"
            className={`w-14 h-14 rounded-full ${
              isMuted ? 'bg-red-600 hover:bg-red-700' : 'bg-white/20 hover:bg-white/30'
            } backdrop-blur-sm transition-all`}
          >
            {isMuted ? <MicOff className="w-6 h-6 text-white" /> : <Mic className="w-6 h-6 text-white" />}
          </Button>

          <Button
            onClick={handleToggleVideo}
            size="icon"
            className={`w-14 h-14 rounded-full ${
              isVideoOff ? 'bg-red-600 hover:bg-red-700' : 'bg-white/20 hover:bg-white/30'
            } backdrop-blur-sm transition-all`}
          >
            {isVideoOff ? <VideoOff className="w-6 h-6 text-white" /> : <VideoIcon className="w-6 h-6 text-white" />}
          </Button>

          <Button
            onClick={onEndStream}
            disabled={isLoading}
            className="px-8 py-6 bg-red-600 hover:bg-red-700 text-white rounded-full font-semibold text-lg shadow-lg transition-all disabled:opacity-50"
          >
            {isLoading ? 'Ending...' : 'End Stream'}
          </Button>
        </div>
      </div>
    </div>
  );
};

// Wrapper component with MeetingProvider
const StreamerContent = ({ streamData, viewerCount, onEndStream, isLoading, socketRef, roomId, token }: any) => {
  const { user } = useAuth();

  if (!roomId || !token) {
    return (
      <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
        <div className="text-center text-white">
          <p className="text-lg mb-4">Connecting to stream...</p>
        </div>
      </div>
    );
  }

  return (
    <MeetingProvider
      config={{
        meetingId: roomId,
        micEnabled: false, // We'll enable manually after join
        webcamEnabled: false, // We'll enable manually after join
        name: user?.username || 'Streamer',
        debugMode: false,
        autoConsume: true,
      }}
      token={token}
    >
      <StreamerContentInner
        streamData={streamData}
        viewerCount={viewerCount}
        onEndStream={onEndStream}
        isLoading={isLoading}
        socketRef={socketRef}
        roomId={roomId}
        token={token}
      />
    </MeetingProvider>
  );
};

export const LiveStream = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamData, setStreamData] = useState<any>(null);
  const [viewers, setViewers] = useState<string[]>([]);
  const [viewerCount, setViewerCount] = useState(0);
  const [joinMessages, setJoinMessages] = useState<JoinMessage[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [streamTitle, setStreamTitle] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [checkingStream, setCheckingStream] = useState(true);
  const [viewingStreamId, setViewingStreamId] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const socketRef = useRef<any>(null);

  // Check for active stream on mount
  useEffect(() => {
    checkForActiveStream();
  }, []);

  // Setup socket when streaming starts
  useEffect(() => {
    if (isStreaming && streamData?.id) {
      setupSocketForStreamer();
    }
    return () => {
      cleanupSocket();
    };
  }, [isStreaming, streamData?.id]);

  // Setup Socket.IO for real-time viewer count updates (for streamer)
  const setupSocketForStreamer = () => {
    if (!streamData?.id) return;

    const socket = getSocket();
    socket.connect();
    socket.emit('join_stream', streamData.id);
    
    socket.on('stream_viewer_count', (data: { streamId: string; viewerCount: number }) => {
      if (data.streamId === streamData.id) {
        setViewerCount(data.viewerCount);
      }
    });

    socketRef.current = socket;
  };

  // Cleanup socket connection
  const cleanupSocket = () => {
    if (socketRef.current) {
      if (streamData?.id) {
        socketRef.current.emit('leave_stream', streamData.id);
      }
      socketRef.current.off('stream_viewer_count');
      socketRef.current.disconnect();
      socketRef.current = null;
    }
  };

  // Auto-hide join messages after 3 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now();
      setJoinMessages(prev => prev.filter(msg => now - msg.time < 3000));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const checkForActiveStream = async (retryCount = 0) => {
    setCheckingStream(true);
    try {
      console.log(`🔍 Checking for active stream (attempt ${retryCount + 1})...`);
      const stream = await videoSDKService.getMyActiveStream();
      if (stream) {
        // Validate that we have both roomId and token
        if (!stream.roomId || !stream.token) {
          console.error('❌ Active stream missing roomId or token:', { roomId: stream.roomId, hasToken: !!stream.token });
          toast({
            title: 'Invalid Stream',
            description: 'Stream data is incomplete. Please end this stream and start a new one.',
            variant: 'destructive',
          });
          // Try to end the invalid stream
          try {
            await videoSDKService.endStream(stream.id);
          } catch (err) {
            console.error('Error ending invalid stream:', err);
          }
          setCheckingStream(false);
          return;
        }
        
        console.log('═══════════════════════════════════════════════════════');
        console.log('✅ FOUND ACTIVE STREAM');
        console.log('═══════════════════════════════════════════════════════');
        console.log('Stream ID:', stream.id);
        console.log('Room ID:', stream.roomId);
        console.log('Title:', stream.title);
        console.log('Has Token:', !!stream.token);
        console.log('Token length:', stream.token?.length || 0);
        console.log('═══════════════════════════════════════════════════════');
        
        // User has active stream - set up streaming view immediately
        setStreamData({
          id: stream.id,
          title: stream.title,
          description: stream.description,
          category: stream.category,
          thumbnail: stream.thumbnail,
          roomId: stream.roomId,
          token: stream.token,
        });
        setIsStreaming(true);
        setViewerCount(0);
      } else {
        console.log('ℹ️ No active stream found');
      }
    } catch (error: any) {
      // 404 or no stream is normal - user just doesn't have active stream
      if (error.message?.includes('404') || error.message?.includes('No active stream')) {
        console.log('ℹ️ No active stream - user can start new stream');
      } else {
        console.error('❌ Error checking active stream:', error);
        // Retry once if it's a network error
        if (retryCount < 1 && (error.message?.includes('fetch') || error.message?.includes('network'))) {
          console.log('🔄 Retrying in 2 seconds...');
          setTimeout(() => checkForActiveStream(retryCount + 1), 2000);
          return;
        }
        toast({
          title: 'Error',
          description: 'Failed to check for active stream. Please refresh the page.',
          variant: 'destructive',
        });
      }
    } finally {
      setCheckingStream(false);
    }
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

    setIsLoading(true);
    try {
      const data = await videoSDKService.startStream({
        title: streamTitle.trim(),
        description: '',
        category: 'other',
      });

      // Update state to show streamer view immediately
      setStreamData(data);
      setIsStreaming(true);
      setViewerCount(0); // Initialize viewer count
      
      // Setup socket for real-time updates
      if (data.id) {
        setTimeout(() => {
          setupSocketForStreamer();
        }, 500);
      }
      
      toast({
        title: '🔴 Live!',
        description: 'Your stream is now live',
      });
    } catch (error: any) {
      console.error('Error starting stream:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to start stream',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle stream started from LiveStreamsList
  const handleStreamStarted = (streamData: any) => {
    setStreamData(streamData);
    setIsStreaming(true);
    setViewerCount(0);
    
    // Setup socket for real-time updates
    if (streamData.id) {
      setTimeout(() => {
        setupSocketForStreamer();
      }, 500);
    }
  };

  const handleEndStream = async () => {
    if (!streamData?.id) return;

    setIsLoading(true);
    try {
      await videoSDKService.endStream(streamData.id);
      
      cleanupSocket();
      setIsStreaming(false);
      setStreamData(null);
      setViewers([]);
      setViewerCount(0);
      setJoinMessages([]);
      setStreamTitle('');
      
      toast({
        title: 'Stream Ended',
        description: 'Your stream has been ended successfully',
      });
    } catch (error: any) {
      console.error('Error ending stream:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to end stream',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinStream = (streamId: string) => {
    setViewingStreamId(streamId);
  };

  const handleBackFromViewer = () => {
    setViewingStreamId(null);
  };

  if (checkingStream) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-pink-800 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  // If viewing a stream as viewer
  if (viewingStreamId) {
    return <StreamViewer streamId={viewingStreamId} onBack={handleBackFromViewer} />;
  }

    // If user is streaming (streamer view)
    if (isStreaming && streamData) {
      return (
        <StreamerContent
          streamData={streamData}
          viewerCount={viewerCount}
          onEndStream={handleEndStream}
          isLoading={isLoading}
          socketRef={socketRef}
          roomId={streamData.roomId}
          token={streamData.token}
        />
      );
    }

  // Show live streams list for viewers with Go Live option
  return <LiveStreamsList onJoinStream={handleJoinStream} onStreamStarted={handleStreamStarted} />;
};

