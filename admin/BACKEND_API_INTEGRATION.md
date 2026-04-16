# Admin Panel Backend API Integration Guide

This document outlines the API endpoints that need to be implemented in your Trees backend to support the admin panel functionality.

## Required API Endpoints

### 1. Dashboard Statistics

#### GET /admin/dashboard/stats
Returns overall dashboard statistics.

**Response:**
```json
{
  "totalUsers": 45231,
  "activeUsers": 12543,
  "totalPosts": 89432,
  "liveStreams": 156
}
```

### 2. User Statistics

#### GET /admin/users/count
Returns total count of registered users.

**Response:**
```json
{
  "total": 45231
}
```

#### GET /admin/users/active
Returns count of users active in the last 30 days.

**Query Parameters:**
- `days` (optional): Number of days to consider for "active" (default: 30)

**Response:**
```json
{
  "count": 12543,
  "period": "30 days"
}
```

### 3. Posts Statistics

#### GET /admin/posts/count
Returns total count of posts created.

**Response:**
```json
{
  "total": 89432
}
```

### 4. Live Streams Statistics

#### GET /admin/streams/live/count
Returns count of currently active live streams.

**Response:**
```json
{
  "count": 156
}
```

### 5. Recent Activities

#### GET /admin/activities/recent
Returns recent user activities and system events.

**Query Parameters:**
- `limit` (optional): Number of activities to return (default: 10, max: 50)

**Response:**
```json
{
  "activities": [
    {
      "id": "activity_1",
      "type": "user_registration",
      "user": {
        "id": "user_123",
        "username": "johndoe",
        "displayName": "John Doe"
      },
      "message": "New user registration: John Doe",
      "timestamp": "2025-09-13T10:30:00Z",
      "details": "User registered via email"
    },
    {
      "id": "activity_2",
      "type": "content_reported",
      "user": {
        "id": "user_456",
        "username": "reporter",
        "displayName": "Reporter User"
      },
      "message": "Content reported for review",
      "timestamp": "2025-09-13T10:25:00Z",
      "details": "Post reported for inappropriate content"
    }
  ]
}
```

## Activity Types

The following activity types should be supported:

- `user_registration`: New user signs up
- `user_login`: User logs in (for tracking active users)
- `post_created`: User creates a new post
- `content_reported`: Content gets reported
- `user_banned`: User gets banned
- `user_unbanned`: User gets unbanned
- `stream_started`: User starts a live stream
- `stream_ended`: Live stream ends

## Implementation Notes

### 1. Active Users Calculation
Active users should be calculated as users who have performed any of these actions in the last 30 days:
- Logged in
- Created a post
- Liked/commented on content
- Started a live stream
- Any other significant user activity

You can track this with a `last_activity` timestamp on user records or by checking activity logs.

### 2. Database Queries Examples

Here are some example database queries you might use:

**Total Users:**
```sql
SELECT COUNT(*) as total FROM users WHERE deleted_at IS NULL;
```

**Active Users (last 30 days):**
```sql
SELECT COUNT(DISTINCT user_id) as count 
FROM user_activities 
WHERE created_at >= NOW() - INTERVAL '30 days';
```

**Total Posts:**
```sql
SELECT COUNT(*) as total FROM posts WHERE deleted_at IS NULL;
```

**Recent Activities:**
```sql
SELECT 
  a.id,
  a.type,
  a.created_at as timestamp,
  a.details,
  u.id as user_id,
  u.username,
  u.display_name
FROM activities a
JOIN users u ON a.user_id = u.id
ORDER BY a.created_at DESC
LIMIT ?;
```

### 3. Authentication & Authorization

All admin endpoints should be protected and require admin authentication:

```javascript
// Middleware example
const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// Apply to all admin routes
app.use('/admin', requireAdmin);
```

### 4. Rate Limiting

Consider implementing rate limiting for admin endpoints to prevent abuse:

```javascript
const rateLimit = require('express-rate-limit');

const adminRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP'
});

app.use('/admin', adminRateLimit);
```

## Frontend Configuration

Update your `.env` file to point to your backend:

```env
VITE_API_BASE_URL=https://api.inventurcubes.com
# or your production URL
VITE_API_BASE_URL=https://your-trees-backend.com
```

## Testing the Integration

1. Start your Trees backend server
2. Start the admin panel: `npm run dev`
3. Navigate to the dashboard
4. Check the browser network tab to see API calls
5. Verify real data is displayed instead of fallback mock data

## Error Handling

The admin panel includes fallback mock data if API calls fail. You can see the actual API calls in the browser's Network tab to debug any connectivity issues.

All API calls are wrapped in try-catch blocks and will display toast notifications on error.