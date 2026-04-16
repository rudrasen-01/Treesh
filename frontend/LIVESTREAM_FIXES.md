# LiveStream Fixes

## Issues Fixed

### 1. Backend Route Order Issue ✅ 
**Problem**: The `/streams/my-active` endpoint was returning 500 error with "Cast to ObjectId failed for value 'my-active'"

**Root Cause**: In `trees backend/routes/streams.js`, the parameterized route `router.get('/:id', ...)` was defined BEFORE the specific routes like `/my-active` and `/token`. This caused Express to match `/my-active` against `/:id`, treating "my-active" as an ObjectId parameter.

**Solution**: Reordered routes in `streams.js` so specific routes come before parameterized routes:
```javascript
// Order matters! Specific routes BEFORE parameterized routes
router.get('/token', ...)      // ✅ Before /:id
router.get('/my-active', ...)  // ✅ Before /:id
router.get('/:id', ...)        // ✅ Must be last
```

### 2. Follower Notification System
**Issue**: When you go live, followers don't receive notifications and can't see your live stream.

**What Needs to Be Implemented**:

1. **Backend - Notify Followers on Stream Start**
   - Location: `trees backend/routes/streams.js` in the `/start` route
   - After creating a stream, fetch the streamer's followers
   - Create notifications for each follower
   - Optionally: Emit Socket.IO event for real-time notification

2. **Frontend - Live Streams in Feed**
   - Add a "Live Now" section at the top of the home feed
   - Show live streams from people you follow
   - Display live indicator (red dot/badge)

3. **Frontend - Notification Click Handler**
   - When user clicks on livestream notification, navigate to the stream
   - Use the `/streams/:id/join` endpoint to join the stream

## Deployment Steps

### Step 1: Deploy Backend Fix
```bash
# From local machine
cd "/Users/anujmishra/Documents/trees new api updated complete/trees backend"

# Copy fixed file to server
scp -i ~/Documents/trees-backend-key.pem routes/streams.js ubuntu@51.20.41.208:~/trees-backend/routes/

# SSH into server
ssh -i ~/Documents/trees-backend-key.pem ubuntu@51.20.41.208

# On server - restart backend
cd ~/trees-backend
pm2 restart all

# Check logs
pm2 logs
```

### Step 2: Test Backend Fix
```bash
# Should return 404 (no active stream) instead of 500
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://api.inventurcubes.com/api/streams/my-active
```

### Step 3: Frontend Profile Video Fixes (Already Done ✅)
The following have been fixed in the frontend code:

1. **Video display in profile Posts tab** - Videos now render instead of broken images
2. **Video posts appear in Reels tab** - Posts with videos are automatically categorized as reels
3. **Comment button in PostDetail** - Modal layout improved for better comment interaction

## Additional Implementation Needed

### Backend: Add Follower Notifications

Add to `trees backend/routes/streams.js` after stream creation (around line 240):

```javascript
// After: await stream.save();

// Notify followers that streamer went live
try {
  const user = await User.findById(userId);
  const followers = user.followers || [];
  
  if (followers.length > 0) {
    // Create notification for each follower
    const notifications = followers.map(followerId => ({
      userId: followerId,
      type: 'livestream',
      message: `${user.username} is now live!`,
      relatedUser: userId,
      relatedStream: stream._id,
      createdAt: new Date()
    }));
    
    await Notification.insertMany(notifications);
    
    // Optional: Emit Socket.IO event for real-time notification
    // io.to('user-${followerId}').emit('new-livestream', {...})
  }
} catch (error) {
  console.log('Could not notify followers:', error.message);
  // Don't fail stream creation if notification fails
}
```

### Frontend: Add Live Streams Section

Create a new component `LiveStreamsBar.tsx`:

```typescript
import { useState, useEffect } from 'react';
import { getLiveStreams } from '@/services/videosdk';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Radio } from 'lucide-react';

export const LiveStreamsBar = () => {
  const [liveStreams, setLiveStreams] = useState([]);
  
  useEffect(() => {
    loadLiveStreams();
    const interval = setInterval(loadLiveStreams, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);
  
  const loadLiveStreams = async () => {
    try {
      const streams = await getLiveStreams();
      setLiveStreams(streams);
    } catch (error) {
      console.error('Error loading live streams:', error);
    }
  };
  
  if (liveStreams.length === 0) return null;
  
  return (
    <div className="bg-white rounded-lg p-4 mb-4 shadow-sm">
      <div className="flex items-center space-x-2 mb-3">
        <Radio className="w-5 h-5 text-red-500" />
        <h3 className="font-semibold text-gray-900">Live Now</h3>
      </div>
      <div className="flex space-x-3 overflow-x-auto">
        {liveStreams.map((stream) => (
          <div 
            key={stream.id}
            className="flex-shrink-0 cursor-pointer"
            onClick={() => navigateToStream(stream.id)}
          >
            <div className="relative">
              <Avatar className="w-16 h-16 ring-2 ring-red-500">
                <img src={stream.streamer.avatar} />
              </Avatar>
              <Badge className="absolute bottom-0 right-0 bg-red-500 text-xs">
                LIVE
              </Badge>
            </div>
            <p className="text-xs text-center mt-1 w-16 truncate">
              {stream.streamer.username}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};
```

Then add this component to `InfiniteScrollFeed.tsx` at the top of the feed.

## Testing Checklist

- [ ] Go live - no 500 error
- [ ] My active stream detected correctly
- [ ] Stream appears in /streams/live endpoint
- [ ] Followers receive notification
- [ ] Followers can see live stream in their feed
- [ ] Clicking on live stream notification navigates to stream
- [ ] Video posts display correctly in profile
- [ ] Video posts appear in Reels tab
- [ ] Comments work in PostDetail modal

## Notes

- The backend route fix is critical and should be deployed first
- Follower notification system requires additional backend code
- Frontend LiveStreamsBar component needs to be added
- Socket.IO integration would provide real-time updates (optional but recommended)
