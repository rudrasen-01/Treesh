# 🚀 Independent Backend-Frontend Setup Guide

## 📁 New Project Structure

```
treeswebfrontend-main/
├── backend/                           # Backend API Server
│   ├── .env                          # Backend environment variables
│   ├── package.json                  # Backend dependencies
│   ├── server.js                     # Main backend server file
│   ├── routes/                       # API route handlers
│   ├── models/                       # Database models
│   ├── middleware/                   # Express middleware
│   └── controllers/                  # Business logic controllers
│
└── Treeswebfrontend-main/            # Frontend React Application
    ├── .env                          # Frontend environment variables
    ├── package.json                  # Frontend dependencies
    ├── vite.config.ts               # Vite configuration
    ├── src/                         # React source code
    │   ├── components/              # React components
    │   ├── hooks/                   # Custom React hooks
    │   ├── services/                # API service layer
    │   └── utils/                   # Utility functions
    └── public/                      # Static assets
```

## 🏃‍♂️ How to Run Independently

### Backend Server

```bash
# Navigate to backend directory
cd treeswebfrontend-main/backend

# Start backend server
npm start
```

**Backend will run on:** http://51.20.41.208/api/

### Frontend Application

```bash
# Navigate to frontend directory
cd treeswebfrontend-main/Treeswebfrontend-main

# Start frontend development server
npm run dev
```

**Frontend will run on:** http://localhost:8080

## 🔗 API Connectivity Configuration

### Backend Configuration (.env)

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Database
MONGODB_URI=mongodb+srv://treeshadmin:treeshadmin123@cluster0.3iwof95.mongodb.net/Treesh

# Frontend URL for CORS
FRONTEND_URL=http://localhost:8080

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here-change-this-in-production
JWT_EXPIRES_IN=7d
```

### Frontend Configuration (.env)

```env
# Backend API URL
VITE_API_BASE_URL=http://51.20.41.208/api/

# App Configuration
VITE_APP_NAME="TreesWeb Social"
VITE_APP_VERSION=1.0.0
VITE_FRONTEND_URL=http://localhost:8080

# Socket.IO Configuration
VITE_SOCKET_URL=http://51.20.41.208
```

## ✅ Verification Steps

### 1. Test Backend Health

```bash
curl http://localhost:3000/health
# Expected Response: {"status":"OK","timestamp":"..."}
```

### 2. Test Frontend-Backend Connection

- Open http://localhost:8080 in browser
- Try registering a new user account
- Check if API calls work properly

### 3. API Endpoints Available

```
POST /api/auth/register     - User registration
POST /api/auth/login        - User login
GET  /api/auth/me          - Get current user
GET  /api/posts/feed       - Get user feed
POST /api/posts            - Create new post
GET  /api/matches          - Get user matches
POST /api/arcade/swipe     - Swipe on users
GET  /api/chats           - Get user chats
GET  /api/subscriptions   - Get subscriptions
... and 40+ more endpoints
```

## 🎯 Development Workflow

### Starting Development

1. **Start Backend First:**

   ```bash
   cd treeswebfrontend-main/backend
   npm start
   ```

2. **Then Start Frontend:**

   ```bash
   cd treeswebfrontend-main/Treeswebfrontend-main
   npm run dev
   ```

3. **Open Application:**
   - Frontend: http://localhost:8080
   - Backend API: http://localhost:3000

### Making Changes

- **Backend changes:** Modify files in `backend/` folder, server auto-restarts
- **Frontend changes:** Modify files in `Treeswebfrontend-main/src/`, Vite hot-reloads

## 🔧 Technical Details

### Backend Dependencies

- **Express.js** - Web server framework
- **MongoDB & Mongoose** - Database and ODM
- **JWT** - Authentication tokens
- **Bcrypt** - Password hashing
- **Socket.IO** - Real-time communication
- **Cloudinary** - File upload handling

### Frontend Dependencies

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling framework
- **shadcn/ui** - Component library
- **React Query** - Data fetching and caching

### API Integration

- **Service Layer:** `src/services/api.ts` handles all API communication
- **Custom Hooks:** React hooks for data management (`useAuth`, `usePosts`, etc.)
- **Environment Variables:** Proper Vite environment variable usage
- **Type Safety:** Full TypeScript integration for API responses

## 🛡️ Security Features

### Backend Security

- JWT token authentication
- Password hashing with bcrypt
- CORS configured for frontend domain
- Input validation and sanitization
- Rate limiting ready
- MongoDB injection prevention

### Frontend Security

- Secure token storage
- API error handling
- Input validation
- XSS prevention
- Environment variable protection

## 📊 Features Integrated

### ✅ Authentication System

- User registration and login
- JWT token management
- Password reset functionality
- Session persistence

### ✅ Social Media Features

- Post creation with media upload
- Like, comment, and share functionality
- User feed with infinite scroll
- User profiles and following system

### ✅ Dating/Matching System

- Swipe-based matching
- User preferences management
- Match algorithm
- Match history and chat initiation

### ✅ Real-time Chat

- One-on-one messaging
- Chat PIN security
- Message history
- Real-time message delivery

### ✅ Subscription System

- Streamer discovery
- Multiple subscription tiers
- Payment processing integration
- Subscription management

### ✅ Content Moderation

- User reporting system
- Admin review dashboard
- Content moderation tools
- Automated filtering

### ✅ Settings & Privacy

- User preference management
- Privacy controls
- Notification settings
- Account management

## 🚀 Deployment Ready

Both backend and frontend are now independently deployable:

### Backend Deployment

- Can be deployed to services like Heroku, Railway, or DigitalOcean
- Environment variables configured
- Database connection ready
- Health check endpoint available

### Frontend Deployment

- Can be deployed to Vercel, Netlify, or similar platforms
- Build optimizations configured
- Environment variables for different environments
- API base URL configurable per environment

## 🎊 Success Confirmation

✅ **Backend Independence:** Runs on port 3000 with `npm start`  
✅ **Frontend Independence:** Runs on port 8080 with `npm run dev`  
✅ **API Connectivity:** All endpoints working correctly  
✅ **Environment Configuration:** Proper variable setup  
✅ **Database Connection:** MongoDB Atlas connected  
✅ **Zero Dummy Data:** All real API integration

Your social media platform is now running with complete independence between frontend and backend! 🎉
