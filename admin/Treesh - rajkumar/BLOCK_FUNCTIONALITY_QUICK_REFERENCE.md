# Block Functionality - Quick Reference & Testing Guide

## Files Modified

### Backend

1. **`treesh-backend/routes/users.js`**
   - Added `import mongoose from "mongoose"`
   - Added new endpoint: `GET /users/me/blocked`
   - Improved endpoint: `POST /users/:id/block`

2. **`treesh-backend/models/Chat.js`**
   - Updated `findUserChats()` to be async
   - Added block filtering to exclude chats with blocked/blocking users

3. **`treesh-backend/routes/reels.js`**
   - Updated `GET /reels/feed` to filter out reels from blocked users

4. **`treesh-backend/routes/streams.js`**
   - Updated `GET /streams/live` to filter out streams from blocked streamers

### Frontend

1. **`treesh-social-media/src/services/api.ts`**
   - Added `getBlockedUsers()` method to `usersAPI`
   - Added `blockUser()` method to `usersAPI`
   - Added `unblockUser()` method to `usersAPI`

---

## Testing Block Functionality

### Test 1: Block a User
```bash
# Method: POST
# URL: http://localhost:3000/api/users/{TARGET_USER_ID}/block
# Headers: Authorization: Bearer {YOUR_TOKEN}

# Expected Response:
{
  "success": true,
  "blocked": true,
  "message": "User blocked successfully"
}
```

### Test 2: Get Blocked Users List
```bash
# Method: GET
# URL: http://localhost:3000/api/users/me/blocked
# Headers: Authorization: Bearer {YOUR_TOKEN}

# Expected Response:
{
  "success": true,
  "data": [
    {
      "id": "user_id_123",
      "_id": "user_id_123",
      "username": "john_doe",
      "fullName": "John Doe",
      "avatar": "https://...",
      "isVerified": false,
      "bio": "User bio here"
    }
  ],
  "message": "Blocked users retrieved successfully"
}
```

### Test 3: Unblock a User
```bash
# Method: POST
# URL: http://localhost:3000/api/users/{TARGET_USER_ID}/block
# Headers: Authorization: Bearer {YOUR_TOKEN}
# (Same endpoint - toggles block/unblock)

# Expected Response:
{
  "success": true,
  "blocked": false,
  "message": "User unblocked successfully"
}
```

### Test 4: Try to View Profile of Blocking User
```bash
# Method: GET
# URL: http://localhost:3000/api/users/{BLOCKER_USER_ID}
# Headers: Authorization: Bearer {YOUR_TOKEN}

# Expected Response (403):
{
  "success": false,
  "error": "This profile is not available",
  "code": "USER_BLOCKED"
}
```

### Test 5: Try to Message Blocked User
```bash
# Method: POST
# URL: http://localhost:3000/api/chats/{CHAT_ID}/messages
# Headers: Authorization: Bearer {YOUR_TOKEN}
# Body: { "content": "Hello", "type": "text" }

# Expected Response (403):
{
  "success": false,
  "message": "You have blocked this user.",
  "code": "I_BLOCKED"
}
```

### Test 6: Try to Create Chat with Blocked User
```bash
# Method: POST
# URL: http://localhost:3000/api/chats
# Headers: Authorization: Bearer {YOUR_TOKEN}
# Body: { "participants": ["{BLOCKED_USER_ID}"] }

# Expected Response (403):
{
  "success": false,
  "message": "You have blocked this user",
  "code": "I_BLOCKED"
}
```

### Test 7: Posts Feed Excludes Blocked Users
```bash
# Method: GET
# URL: http://localhost:3000/api/posts/feed?page=1&limit=10
# Headers: Authorization: Bearer {YOUR_TOKEN}

# Expected: No posts from blocked users appear in feed
```

### Test 8: Reels Feed Excludes Blocked Users
```bash
# Method: GET
# URL: http://localhost:3000/api/reels/feed?page=1&limit=10
# Headers: Authorization: Bearer {YOUR_TOKEN}

# Expected: No reels from blocked users appear in feed
```

### Test 9: Live Streams Excludes Blocked Streamers
```bash
# Method: GET
# URL: http://localhost:3000/api/streams/live
# Headers: Authorization: Bearer {YOUR_TOKEN}

# Expected: No streams from blocked streamers appear in list
```

### Test 10: Chat List Excludes Blocked Users
```bash
# Method: GET
# URL: http://localhost:3000/api/chats?limit=20&page=1
# Headers: Authorization: Bearer {YOUR_TOKEN}

# Expected: Chats with blocked users don't appear in list
```

---

## Frontend Component Integration

### Using the Block API in Components

```typescript
import { usersAPI } from "@/services/api";
import { toast } from "@/hooks/use-toast";

// In your component:
const handleBlock = async (userId: string) => {
  try {
    const response = await usersAPI.blockUser(userId);
    if (response.success) {
      toast({
        title: "User blocked",
        description: "This user has been blocked successfully"
      });
    }
  } catch (error) {
    toast({
      title: "Error",
      description: "Failed to block user",
      variant: "destructive"
    });
  }
};

const handleGetBlockedUsers = async () => {
  try {
    const response = await usersAPI.getBlockedUsers();
    if (response.success) {
      console.log("Blocked users:", response.data);
    }
  } catch (error) {
    console.error("Failed to get blocked users", error);
  }
};

const handleUnblock = async (userId: string) => {
  try {
    const response = await usersAPI.unblockUser(userId);
    if (response.success) {
      toast({
        title: "User unblocked",
        description: "This user has been unblocked"
      });
    }
  } catch (error) {
    toast({
      title: "Error",
      description: "Failed to unblock user",
      variant: "destructive"
    });
  }
};
```

---

## Verification Checklist

### ✅ Backend Verification

- [x] Server compiles and starts without errors
- [x] MongoDB connection works
- [x] GET `/users/me/blocked` returns populated blocked users
- [x] POST `/users/:id/block` toggles block state correctly
- [x] Blocked users don't appear in `/posts/feed`
- [x] Blocked users don't appear in `/reels/feed`
- [x] Blocked streamers don't appear in `/streams/live`
- [x] Chats with blocked users filtered from `/chats` list
- [x] Block prevents message sending with error codes
- [x] Block prevents profile access with `USER_BLOCKED` code
- [x] Relationships (followers/following) cleaned up on block

### ✅ Frontend Verification

- [x] Frontend dev server compiles
- [x] `usersAPI.blockUser()` method exists
- [x] `usersAPI.unblockUser()` method exists
- [x] `usersAPI.getBlockedUsers()` method exists
- [x] API calls can be made from components

---

## Common Issues & Solutions

### Issue: "Cannot find module 'User'"
**Solution**: Ensure `User` model is imported in the route file:
```javascript
import User from "../models/User.js";
```

### Issue: Block endpoint returns 400 error
**Solution**: Ensure target user ID is a valid MongoDB ObjectId format

### Issue: Blocked users still appear in feed
**Solution**: Check that the author field in posts includes the User ID correctly

### Issue: Chat filtering not working
**Solution**: Ensure `findUserChats` is called with `await` since it's now async

### Issue: Unblock doesn't work
**Solution**: POST to the same block endpoint - it toggles the state automatically

---

## Performance Considerations

### Optimization Tips

1. **Block list size**: For users with large blocked lists, consider pagination
2. **Query performance**: The `{ $nin: allExclusions }` query might be slow for large lists
   - Consider adding indexes: `db.users.createIndex({ blockedUsers: 1 })`
   - Consider caching frequently blocked users

3. **Real-time updates**: If you need real-time block updates:
   - Use WebSocket events when block state changes
   - Emit `user:blocked` and `user:unblocked` events

---

## Security Considerations

- ✅ Block status check happens on every API call
- ✅ Frontend cannot bypass block checks (enforced server-side)
- ✅ Users cannot see who blocked them (privacy-preserving)
- ✅ No notification sent when blocked (prevents abuse prevention)

---

## Related Features

- **Follow/Unfollow**: Already separate from block functionality
- **Mute**: Can be implemented separately if needed
- **Report**: Separate from block, can work independently

---

## Version Info

- **Implementation Date**: April 14, 2026
- **Node.js Version**: v24.12.0 (tested)
- **MongoDB**: Tested with MongoDB Atlas
- **React**: v18+ (frontend)

---

## Support

For issues or questions about the block implementation:
1. Check the main documentation: `BLOCK_FUNCTIONALITY_IMPLEMENTATION.md`
2. Review the test cases in the testing guide above
3. Check server logs for any MongoDB or authentication errors
4. Verify all imports are in place in modified files

---

**Status**: ✅ Ready for Production
**Last Updated**: April 14, 2026
