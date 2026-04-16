# Fix CORS Error - Deploy Backend to EC2

## The Problem
Your frontend at `https://www.inventurcubes.com` is trying to connect to the API, but the backend running on EC2 hasn't been updated with the latest CORS configuration yet.

## Quick Fix (Manual Deployment)

### Option 1: Quick Restart (if code is already on EC2)

```bash
# SSH into EC2
ssh -i /Users/anujmishra/Documents/trees-backend-key.pem ubuntu@51.20.41.208

# Navigate to backend directory
cd ~/trees-backend

# Pull latest changes (if using git)
git pull origin main

# Or manually edit server.js if needed
nano server.js

# Restart the server
pm2 restart all
# or if not using PM2:
pkill -f "node.*server.js"
nohup node server.js > server.log 2>&1 &

# Check if running
netstat -tuln | grep :3000
pm2 logs

# Exit SSH
exit
```

### Option 2: Deploy Fresh Code from Local

```bash
# From your Mac, in the project root
cd "/Users/anujmishra/Documents/trees new api updated complete"

# Make deploy script executable
chmod +x deploy-backend.sh

# Run deployment
./deploy-backend.sh
```

### Option 3: Manual File Sync

```bash
# Sync files from local to EC2
rsync -avz --progress \
  --exclude 'node_modules' \
  --exclude '.git' \
  --exclude 'uploads' \
  -e "ssh -i /Users/anujmishra/Documents/trees-backend-key.pem" \
  "./trees backend/" \
  ubuntu@51.20.41.208:~/trees-backend/

# SSH into EC2
ssh -i /Users/anujmishra/Documents/trees-backend-key.pem ubuntu@51.20.41.208

# Install dependencies and restart
cd ~/trees-backend
npm install
pm2 restart all

# Exit
exit
```

## Verify CORS Configuration

The backend `server.js` should already have these origins (lines 44-62):

```javascript
const io = new Server(server, {
  cors: {
    origin: [
      "https://treessocialmedia-ci5o.vercel.app",
      "https://treessocialmedia.vercel.app",
      "https://trees-admin-lh9z.vercel.app",
      "https://inventurcubes.com",
      "https://www.inventurcubes.com",  // ← This is needed!
      "http://localhost:5173",
      // ... other origins
    ],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  },
});
```

And Express CORS (lines 75-93):

```javascript
const corsOptions = {
  origin: [
    "https://treessocialmedia-ci5o.vercel.app",
    "https://trees-admin-lh9z.vercel.app",
    "https://inventurcubes.com",
    "https://www.inventurcubes.com",  // ← This too!
    "http://localhost:5173",
    // ... other origins
  ],
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
};
```

## After Deployment

Test the API from your browser console (on www.inventurcubes.com):

```javascript
// Test fetch
fetch('https://api.inventurcubes.com/api/auth/me', {
  credentials: 'include',
  headers: {
    'Content-Type': 'application/json'
  }
})
.then(r => r.json())
.then(console.log)
.catch(console.error);
```

## Troubleshooting

### Check if backend is running on EC2
```bash
ssh -i /Users/anujmishra/Documents/trees-backend-key.pem ubuntu@51.20.41.208
netstat -tuln | grep :3000
ps aux | grep node
```

### View backend logs
```bash
# If using PM2
pm2 logs

# If using nohup
tail -f ~/trees-backend/server.log
```

### Test CORS from command line
```bash
curl -H "Origin: https://www.inventurcubes.com" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" \
  -X OPTIONS \
  --verbose \
  https://api.inventurcubes.com/api/auth/login
```

Should return headers including:
- `Access-Control-Allow-Origin: https://www.inventurcubes.com`
- `Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS`
- `Access-Control-Allow-Credentials: true`

## Quick Commands Reference

```bash
# Check what's running on port 3000
ssh -i /Users/anujmishra/Documents/trees-backend-key.pem ubuntu@51.20.41.208 "netstat -tuln | grep :3000"

# Restart backend (PM2)
ssh -i /Users/anujmishra/Documents/trees-backend-key.pem ubuntu@51.20.41.208 "cd ~/trees-backend && pm2 restart all"

# View logs
ssh -i /Users/anujmishra/Documents/trees-backend-key.pem ubuntu@51.20.41.208 "pm2 logs --lines 50"

# Test API health
curl https://api.inventurcubes.com/health
```

## Expected Result

After deployment and restart:
- ✅ API responds at https://api.inventurcubes.com
- ✅ CORS headers allow www.inventurcubes.com
- ✅ WebSocket connects successfully
- ✅ No CORS errors in browser console
