# Vercel Deployment Guide

## Deploy to Vercel

1. **Install Vercel CLI** (if not already installed):
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Deploy from project directory**:
   ```bash
   cd /Users/anujmishra/Desktop/Treesadmin-main
   vercel
   ```

4. **Follow the prompts**:
   - Link to existing project? `N`
   - What's your project's name? `trees-admin`
   - In which directory is your code located? `./`
   - Want to override the settings? `N`

## Environment Variables

The deployment will automatically use:
- `VITE_API_BASE_URL=https://api.inventurcubes.com/api`

## Backend Configuration Notes

Since you've updated your backend to `https://api.inventurcubes.com/api`, make sure your backend server:

1. **Has CORS enabled** for your Vercel domain
2. **Accepts HTTPS requests**
3. **Has proper SSL certificate**

### Backend CORS Configuration

Add these domains to your backend CORS configuration:
```javascript
const cors = require('cors');

app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:5174',
    'https://your-vercel-domain.vercel.app',
    'https://trees-admin.vercel.app'
  ],
  credentials: true
}));
```

### SSL/HTTPS Configuration

Ensure your backend at `api.inventurcubes.com` has:
- Valid SSL certificate
- HTTPS enabled
- Proper firewall rules for port 443

## Post-Deployment

After deployment, test:
1. Admin login functionality
2. PSA creation and management
3. User analytics and reports
4. All API endpoints connectivity