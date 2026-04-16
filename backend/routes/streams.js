import express from 'express';
import { auth } from '../middleware/auth.js';
import Stream from '../models/Stream.js';
import User from '../models/User.js';
import { io } from '../server.js';
import jwt from 'jsonwebtoken';
import {
  generateVideoSDKToken,
  createMeeting,
  validateMeeting,
  endMeeting,
  getMeetingDetails,
  startRecording,
  stopRecording,
} from '../config/videosdk.js';

const router = express.Router();

// Get all live streams
router.get('/live', auth, async (req, res) => {
  try {
    const { category } = req.query;

    // Get current user's blocked users and users who blocked them
    const currentUser = await User.findById(req.user.id).select('blockedUsers');
    const usersWhoBlockedMe = await User.find({ blockedUsers: req.user.id }).distinct('_id');
    const allExclusions = [
      ...(currentUser?.blockedUsers || []),
      ...usersWhoBlockedMe
    ];

    const filter = { 
      status: 'live',
      streamerId: { $nin: allExclusions } // Exclude blocked and blocking streamers
    };
    
    if (category && category !== 'all') {
      filter.category = category;
    }
    
    const streams = await Stream.find(filter)
      .populate('streamerId', 'username name avatar isVerified')
      .sort({ currentViewers: -1, startedAt: -1 })
      .select('title description category thumbnail streamerId videoSdkRoomId startedAt currentViewers totalViews status');
    
    // Transform streams to include streamer info
    const transformedStreams = streams.map(stream => {
      const streamObj = stream.toObject();
      return {
        _id: streamObj._id,
        title: streamObj.title,
        description: streamObj.description,
        category: streamObj.category,
        thumbnail: streamObj.thumbnail,
        videoSdkRoomId: streamObj.videoSdkRoomId,
        startedAt: streamObj.startedAt,
        currentViewers: streamObj.currentViewers || 0,
        totalViews: streamObj.totalViews || 0,
        status: streamObj.status,
        streamer: streamObj.streamerId ? {
          _id: streamObj.streamerId._id,
          username: streamObj.streamerId.username,
          name: streamObj.streamerId.name,
          avatar: streamObj.streamerId.avatar,
          isVerified: streamObj.streamerId.isVerified
        } : null
      };
    });
    
    res.json(transformedStreams);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get top streamers leaderboard
router.get('/leaderboard', auth, async (req, res) => {
  try {
    const topStreamers = await Stream.aggregate([
      { $match: { isLive: true } },
      { $group: {
        _id: '$streamer',
        totalViewers: { $sum: { $size: '$viewers' } },
        streamCount: { $sum: 1 }
      }},
      { $sort: { totalViewers: -1 } },
      { $limit: 30 },
      { $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'streamer'
      }},
      { $unwind: '$streamer' },
      { $project: {
        streamer: {
          _id: '$streamer._id',
          username: '$streamer.username',
          profileImage: '$streamer.profileImage',
          isVerified: '$streamer.isVerified'
        },
        totalViewers: 1,
        streamCount: 1
      }}
    ]);
    
    res.json(topStreamers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Generate VideoSDK token
router.get('/token', auth, async (req, res) => {
  try {
    // Check if credentials are available
    if (!process.env.VIDEOSDK_API_KEY || !process.env.VIDEOSDK_SECRET_KEY) {
      return res.status(500).json({ 
        success: false,
        error: 'VideoSDK credentials are not configured. Please set VIDEOSDK_API_KEY and VIDEOSDK_SECRET_KEY in .env file'
      });
    }

    const token = generateVideoSDKToken({
      permissions: ['allow_join', 'allow_mod'],
      useV2API: true, // This is for V2 API backend call
      roles: ['crawler'], // V2 API only accepts 'crawler' role
    });
    
    res.json({
      success: true,
      token,
    });
  } catch (error) {
    console.error('Error generating VideoSDK token:', error);
    res.status(500).json({ 
      success: false,
      error: error.message || 'Failed to generate VideoSDK token'
    });
  }
});

// Get my active stream
router.get('/my-active', auth, async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    
    const activeStream = await Stream.findOne({
      streamerId: userId,
      status: 'live'
    });
    
    if (!activeStream) {
      return res.status(200).json({
        success: false,
        stream: null,
        message: 'No active stream found'
      });
    }
    
    // Convert to plain object to avoid ObjectId serialization issues
    const streamObj = activeStream.toObject();
    
    // CRITICAL FIX: Always recreate VideoSDK room for active streams
    // V2 API validation might pass, but React SDK uses infra API which fails with 404
    // Recreating ensures the room is fresh and accessible via React SDK's infra API
    if (streamObj.videoSdkRoomId) {
      const oldRoomId = streamObj.videoSdkRoomId;
      const streamAgeMinutes = Math.floor((Date.now() - new Date(streamObj.startedAt).getTime()) / 1000 / 60);
      
      console.log('═══════════════════════════════════════════════════════');
      console.log('🔄 RECREATING VIDEOSDK ROOM FOR ACTIVE STREAM');
      console.log('═══════════════════════════════════════════════════════');
      console.log('📋 Old Room ID:', oldRoomId);
      console.log('📊 Stream Age:', streamAgeMinutes, 'minutes');
      console.log('📋 Stream ID:', streamObj._id);
      console.log('═══════════════════════════════════════════════════════');
      
      // Always recreate to ensure React SDK compatibility
      console.log('🔄 Creating new VideoSDK room...');
      const meetingResult = await createMeeting();
      
      if (meetingResult.success) {
        console.log('✅ New VideoSDK room created:', meetingResult.roomId);
        console.log('📝 Updating stream with new room ID...');
        
        // Update stream with new room ID
        activeStream.videoSdkRoomId = meetingResult.roomId;
        activeStream.streamUrl = meetingResult.roomId;
        await activeStream.save();
        streamObj.videoSdkRoomId = meetingResult.roomId;
        
        console.log('✅ Stream updated successfully');
        console.log('📋 Old Room:', oldRoomId);
        console.log('📋 New Room:', meetingResult.roomId);
        console.log('═══════════════════════════════════════════════════════');
      } else {
        console.error('═══════════════════════════════════════════════════════');
        console.error('❌ FAILED TO RECREATE VIDEOSDK ROOM');
        console.error('═══════════════════════════════════════════════════════');
        console.error('Error:', meetingResult.error);
        console.error('═══════════════════════════════════════════════════════');
        
        // Room recreation failed - mark stream as ended
        activeStream.status = 'ended';
        activeStream.endedAt = new Date();
        await activeStream.save();
        
        // Update user profile
        await User.findByIdAndUpdate(userId, {
          'streamerProfile.isLive': false,
          'streamerProfile.currentStreamId': null,
        });
        
        return res.status(200).json({
          success: false,
          stream: null,
          message: 'Stream room could not be recreated. Please start a new stream.'
        });
      }
    } else {
      console.warn('⚠️ Stream has no videoSdkRoomId - this should not happen');
    }
    
    // Generate token for streamer to join VideoSDK room
    let token;
    try {
      // Generate token for React SDK (infra API)
      // CRITICAL: Token MUST include roomId for proper authorization (fixes 401 UNAUTHORIZED_MEETING_ID error)
      token = generateVideoSDKToken({
        roomId: streamObj.videoSdkRoomId, // Include roomId for proper authorization
        permissions: ['allow_join', 'allow_mod'],
        roles: ['rtc'], // React SDK infra API needs 'rtc' role
        // Don't use useV2API - React SDK uses infra API
      });
      console.log(`✅ Generated VideoSDK token for stream ${streamObj._id}, room: ${streamObj.videoSdkRoomId}`);
      
      // Decode token to verify payload (for debugging)
      try {
        // Manual decode - split JWT and decode base64 payload
        const parts = token.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
          console.log('═══════════════════════════════════════════════════════');
          console.log('🔍 STREAMER TOKEN PAYLOAD VERIFICATION');
          console.log('═══════════════════════════════════════════════════════');
          console.log('API Key:', payload?.apikey?.substring(0, 15) + '...');
          console.log('Permissions:', payload?.permissions);
          console.log('Roles:', payload?.roles);
          console.log('Room ID in token:', payload?.roomId || '❌ MISSING!');
          console.log('Has Room ID:', !!payload?.roomId);
          console.log('Expected Room ID:', streamObj.videoSdkRoomId);
          console.log('Room ID Match:', payload?.roomId === streamObj.videoSdkRoomId);
          if (!payload.roomId) {
            console.error('❌ CRITICAL ERROR: Token missing roomId! This WILL cause 401 error.');
          } else if (payload.roomId !== streamObj.videoSdkRoomId) {
            console.error('❌ CRITICAL ERROR: Token roomId does not match stream roomId!');
          } else {
            console.log('✅ Token payload is correct - roomId included and matches');
          }
          console.log('═══════════════════════════════════════════════════════');
        } else {
          console.error('❌ Invalid token format');
        }
      } catch (e) {
        console.error('❌ Error decoding token:', e.message);
      }
    } catch (error) {
      console.error('Error generating VideoSDK token for active stream:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to generate VideoSDK token. Please check your VideoSDK credentials in .env file',
        details: error.message
      });
    }
    
    res.json({
      success: true,
      stream: {
        _id: streamObj._id.toString(),
        title: streamObj.title,
        description: streamObj.description,
        category: streamObj.category,
        thumbnail: streamObj.thumbnail,
        videoSdkRoomId: streamObj.videoSdkRoomId,
        startedAt: streamObj.startedAt,
        status: streamObj.status,
        currentViewers: streamObj.currentViewers || 0
      },
      roomId: streamObj.videoSdkRoomId,
      token: token
    });
  } catch (error) {
    console.error('Error getting active stream:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get stream by ID - MUST come after specific routes like /my-active, /token
router.get('/:id', auth, async (req, res) => {
  try {
    const stream = await Stream.findById(req.params.id)
      .populate('streamerId', 'username name avatar isVerified');
    
    if (!stream) {
      return res.status(404).json({ error: 'Stream not found' });
    }
    
    // Convert to plain object
    const streamObj = stream.toObject();
    
    // Return stream with current viewers count
    res.json({
      _id: streamObj._id,
      title: streamObj.title,
      description: streamObj.description,
      category: streamObj.category,
      thumbnail: streamObj.thumbnail,
      videoSdkRoomId: streamObj.videoSdkRoomId,
      startedAt: streamObj.startedAt,
      currentViewers: streamObj.currentViewers || 0,
      totalViews: streamObj.totalViews || 0,
      status: streamObj.status,
      streamerId: streamObj.streamerId,
      streamer: streamObj.streamerId ? {
        _id: streamObj.streamerId._id,
        username: streamObj.streamerId.username,
        name: streamObj.streamerId.name,
        avatar: streamObj.streamerId.avatar,
        isVerified: streamObj.streamerId.isVerified
      } : null
    });
  } catch (error) {
    console.error('Error getting stream by ID:', error);
    res.status(500).json({ error: error.message });
  }
});

// Start stream
router.post('/start', auth, async (req, res) => {
  try {
    const { title, description, category, thumbnail } = req.body;
    
    console.log('=== START STREAM DEBUG ===');
    console.log('req.user:', req.user);
    console.log('req.body:', req.body);
    
    // Validate required fields
    if (!title) {
      return res.status(400).json({ 
        success: false,
        error: 'Stream title is required' 
      });
    }

    // Get user ID - handle both _id and id
    const userId = req.user._id || req.user.id;
    console.log('userId:', userId);
    
    // Check if user already has an active stream
    const existingStream = await Stream.findOne({
      streamerId: userId,
      status: 'live'
    });
    
    console.log('Existing stream check:', existingStream);
    
    if (existingStream) {
      console.log('Found existing stream:', existingStream._id);
      return res.status(400).json({ 
        success: false,
        error: 'You already have an active stream',
        streamId: existingStream._id
      });
    }
    
    // Create VideoSDK meeting room
    console.log('🔄 Creating VideoSDK meeting room...');
    const meetingResult = await createMeeting();
    
    if (!meetingResult.success) {
      console.error('❌ Failed to create VideoSDK meeting:', meetingResult.error);
      return res.status(500).json({
        success: false,
        error: meetingResult.error || 'Failed to create stream room',
        details: meetingResult.error
      });
    }
    
    console.log('✅ VideoSDK meeting room created:', meetingResult.roomId);
    
    // Generate unique stream key
    const streamKey = `stream_${userId}_${Date.now()}`;
    
    const stream = new Stream({
      streamerId: userId,
      title: title,
      description: description || '',
      category: category || 'other',
      thumbnail: thumbnail || '',
      status: 'live',
      startedAt: new Date(),
      streamKey: streamKey,
      streamUrl: meetingResult.roomId,
      // Store VideoSDK room ID
      videoSdkRoomId: meetingResult.roomId,
    });
    
    await stream.save();
    
    // Update user's streamer profile (only if user exists in DB)
    try {
      await User.findByIdAndUpdate(userId, {
        'streamerProfile.isLive': true,
        'streamerProfile.currentStreamId': stream._id,
        $inc: { 'streamerProfile.totalStreams': 1 },
      });
    } catch (error) {
      console.log('Could not update user profile (user may not exist in DB):', error.message);
    }
    
    const populatedStream = await Stream.findById(stream._id)
      .populate('streamerId', 'username name avatar isVerified');
    
    // Generate token for React SDK (infra API)
    // CRITICAL: Token MUST include roomId for proper authorization (UNAUTHORIZED_MEETING_ID error fix)
    const reactSDKToken = generateVideoSDKToken({
      roomId: meetingResult.roomId, // Include roomId for proper authorization
      permissions: ['allow_join', 'allow_mod'],
      roles: ['rtc'], // React SDK infra API needs 'rtc' role (not 'crawler')
      // Don't use useV2API - React SDK uses infra API
    });
    
    res.status(201).json({
      success: true,
      stream: populatedStream,
      roomId: meetingResult.roomId,
      token: reactSDKToken,
    });
  } catch (error) {
    console.error('Start stream error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// End stream
router.post('/:id/end', auth, async (req, res) => {
  try {
    const stream = await Stream.findById(req.params.id);
    
    if (!stream) {
      return res.status(404).json({ 
        success: false,
        error: 'Stream not found' 
      });
    }
    
    // Check authorization - support both _id and id fields
    const userId = req.user.id || req.user._id?.toString();
    const streamerId = stream.streamerId.toString();
    
    console.log('End stream authorization check:', { 
      userId, 
      streamerId,
      reqUserId: req.user.id,
      reqUser_id: req.user._id,
      match: userId === streamerId
    });
    
    if (streamerId !== userId) {
      return res.status(403).json({ 
        success: false,
        error: 'Not authorized' 
      });
    }
    
    // End VideoSDK meeting
    if (stream.videoSdkRoomId) {
      await endMeeting(stream.videoSdkRoomId);
    }
    
    stream.status = 'ended';
    stream.endedAt = new Date();
    stream.duration = Math.floor((stream.endedAt - stream.startedAt) / 1000);
    
    await stream.save();
    
    // Update user's streamer profile
    await User.findByIdAndUpdate(req.user.id, {
      'streamerProfile.isLive': false,
      'streamerProfile.currentStreamId': null,
      $inc: {
        'streamerProfile.totalViews': stream.totalViews,
      },
    });
    
    res.json({ 
      success: true,
      message: 'Stream ended successfully',
      duration: stream.duration,
      totalViews: stream.totalViews,
    });
  } catch (error) {
    console.error('End stream error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// Add chat message
router.post('/:id/chat', auth, async (req, res) => {
  try {
    const { message } = req.body;
    const stream = await Stream.findById(req.params.id);
    
    if (!stream || !stream.isLive) {
      return res.status(404).json({ error: 'Stream not found or not live' });
    }
    
    stream.chat.push({
      user: req.user.id,
      message,
      timestamp: new Date()
    });
    
    // Keep only last 100 messages
    if (stream.chat.length > 100) {
      stream.chat = stream.chat.slice(-100);
    }
    
    await stream.save();
    
    const populatedStream = await Stream.findById(stream._id)
      .populate('chat.user', 'username profileImage');
    
    const newMessage = populatedStream.chat[populatedStream.chat.length - 1];
    
    res.json(newMessage);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add reaction
router.post('/:id/react', auth, async (req, res) => {
  try {
    const { type } = req.body;
    const stream = await Stream.findById(req.params.id);
    
    if (!stream || !stream.isLive) {
      return res.status(404).json({ error: 'Stream not found or not live' });
    }
    
    stream.reactions.push({
      user: req.user.id,
      type,
      timestamp: new Date()
    });
    
    await stream.save();
    
    res.json({ message: 'Reaction added successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Join stream - Get stream details and token
router.get('/:id/join', auth, async (req, res) => {
  try {
    console.log('═══════════════════════════════════════════════════════');
    console.log('👤 VIEWER JOINING STREAM');
    console.log('═══════════════════════════════════════════════════════');
    console.log('Stream ID:', req.params.id);
    console.log('User ID:', req.user.id);
    
    const stream = await Stream.findById(req.params.id)
      .populate('streamerId', 'username name avatar isVerified');
    
    if (!stream) {
      console.log('❌ Stream not found');
      return res.status(404).json({ 
        success: false,
        error: 'Stream not found' 
      });
    }
    
    console.log('Stream found:', {
      id: stream._id,
      status: stream.status,
      roomId: stream.videoSdkRoomId,
      streamerId: stream.streamerId?._id
    });
    
    if (stream.status !== 'live') {
      console.log('❌ Stream is not live, status:', stream.status);
      return res.status(400).json({ 
        success: false,
        error: 'Stream is not live' 
      });
    }
    
    if (!stream.videoSdkRoomId) {
      console.log('❌ Stream has no videoSdkRoomId');
      return res.status(400).json({ 
        success: false,
        error: 'Stream room not available' 
      });
    }
    
    // Validate that the VideoSDK room exists before allowing viewer to join
    try {
      const validationResult = await validateMeeting(stream.videoSdkRoomId);
      if (!validationResult.success) {
        console.log('⚠️ VideoSDK room validation failed for viewer join');
        console.log('Room ID:', stream.videoSdkRoomId);
        console.log('Error:', validationResult.error);
        return res.status(404).json({ 
          success: false,
          error: 'Stream room no longer exists. Please refresh and try again.' 
        });
      }
      console.log('✅ VideoSDK room validated for viewer');
    } catch (validationError) {
      console.error('❌ Error validating room for viewer:', validationError);
      // Continue anyway - might be temporary
    }
    
    console.log('✅ Stream is valid, generating token...');
    
    // Generate token for viewer (React SDK - infra API)
    // CRITICAL: For React SDK, token MUST include roomId in payload for authorization
    // Even though React SDK uses meetingId in config, the token needs roomId for authorization
    const token = generateVideoSDKToken({
      roomId: stream.videoSdkRoomId, // Include roomId for proper authorization
      permissions: ['allow_join'],
      roles: ['rtc'], // React SDK infra API needs 'rtc' role
      // Don't use useV2API - React SDK uses infra API
    });
    
    console.log('✅ Token generated for viewer');
    console.log('Room ID:', stream.videoSdkRoomId);
    console.log('Token length:', token.length);
    console.log('Token (first 30 chars):', token.substring(0, 30) + '...');
    
    // Decode token to verify payload (for debugging)
    try {
      // Manual decode - split JWT and decode base64 payload
      const parts = token.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
        console.log('═══════════════════════════════════════════════════════');
        console.log('🔍 TOKEN PAYLOAD VERIFICATION');
        console.log('═══════════════════════════════════════════════════════');
        console.log('API Key:', payload?.apikey?.substring(0, 15) + '...');
        console.log('Permissions:', payload?.permissions);
        console.log('Roles:', payload?.roles);
        console.log('Room ID in token:', payload?.roomId || '❌ MISSING!');
        console.log('Has Room ID:', !!payload?.roomId);
        console.log('Expected Room ID:', stream.videoSdkRoomId);
        console.log('Room ID Match:', payload?.roomId === stream.videoSdkRoomId);
        if (!payload.roomId) {
          console.error('❌ CRITICAL ERROR: Token missing roomId! This WILL cause 401 error.');
        } else if (payload.roomId !== stream.videoSdkRoomId) {
          console.error('❌ CRITICAL ERROR: Token roomId does not match stream roomId!');
        } else {
          console.log('✅ Token payload is correct - roomId included and matches');
        }
        console.log('═══════════════════════════════════════════════════════');
      } else {
        console.error('❌ Invalid token format');
      }
    } catch (e) {
      console.error('❌ Error decoding token:', e.message);
      console.error('Token (first 50 chars):', token.substring(0, 50));
    }
    console.log('═══════════════════════════════════════════════════════');
    
    // Add viewer if not already viewing
    const viewerIndex = stream.viewers.findIndex(
      v => v.userId && v.userId.toString() === req.user.id
    );
    
    if (viewerIndex === -1) {
      stream.viewers.push({
        userId: req.user.id,
        joinedAt: new Date(),
      });
      stream.totalViews += 1;
      stream.currentViewers = stream.viewers.filter(v => !v.leftAt).length;
      
      if (stream.currentViewers > stream.peakViewers) {
        stream.peakViewers = stream.currentViewers;
      }
      
      await stream.save();
      
      // Emit real-time viewer count update
      if (io) {
        io.to(`stream_${stream._id}`).emit("stream_viewer_count", {
          streamId: stream._id.toString(),
          viewerCount: stream.currentViewers,
        });
      }
    }
    
    res.json({
      success: true,
      stream,
      roomId: stream.videoSdkRoomId,
      token,
    });
  } catch (error) {
    console.error('Join stream error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// Leave stream
router.post('/:id/leave', auth, async (req, res) => {
  try {
    const stream = await Stream.findById(req.params.id);
    
    if (!stream) {
      return res.status(404).json({ 
        success: false,
        error: 'Stream not found' 
      });
    }
    
    // Update viewer's left time
    const viewer = stream.viewers.find(
      v => v.userId && v.userId.toString() === req.user.id && !v.leftAt
    );
    
    if (viewer) {
      viewer.leftAt = new Date();
      viewer.watchTime = Math.floor((viewer.leftAt - viewer.joinedAt) / 1000);
      stream.currentViewers = stream.viewers.filter(v => !v.leftAt).length;
      await stream.save();
      
      // Emit real-time viewer count update
      if (io) {
        io.to(`stream_${stream._id}`).emit("stream_viewer_count", {
          streamId: stream._id.toString(),
          viewerCount: stream.currentViewers,
        });
      }
    }
    
    res.json({
      success: true,
      message: 'Left stream successfully',
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// Start recording
router.post('/:id/recording/start', auth, async (req, res) => {
  try {
    const stream = await Stream.findById(req.params.id);
    
    if (!stream) {
      return res.status(404).json({ 
        success: false,
        error: 'Stream not found' 
      });
    }
    
    if (stream.streamerId.toString() !== req.user.id) {
      return res.status(403).json({ 
        success: false,
        error: 'Not authorized' 
      });
    }
    
    if (!stream.videoSdkRoomId) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid stream room' 
      });
    }
    
    const result = await startRecording(stream.videoSdkRoomId, req.body);
    
    if (result.success) {
      stream.isRecording = true;
      await stream.save();
    }
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// Stop recording
router.post('/:id/recording/stop', auth, async (req, res) => {
  try {
    const stream = await Stream.findById(req.params.id);
    
    if (!stream) {
      return res.status(404).json({ 
        success: false,
        error: 'Stream not found' 
      });
    }
    
    if (stream.streamerId.toString() !== req.user.id) {
      return res.status(403).json({ 
        success: false,
        error: 'Not authorized' 
      });
    }
    
    if (!stream.videoSdkRoomId) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid stream room' 
      });
    }
    
    const result = await stopRecording(stream.videoSdkRoomId);
    
    if (result.success) {
      stream.isRecording = false;
      await stream.save();
    }
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

export default router;