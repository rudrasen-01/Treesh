# API Domain Setup Complete ✅

## What We Did

### 1. DNS Configuration (Hostinger)
- ✅ Added A record: `api` → `51.20.41.208`
- ✅ DNS propagated successfully

### 2. EC2 Server Setup
- ✅ Connected via SSH to ubuntu@51.20.41.208
- ✅ Installed Nginx
- ✅ Created server block for api.inventurcubes.com
- ✅ Configured reverse proxy to localhost:3000
- ✅ Opened ports 80 & 443 in EC2 security group

### 3. SSL Certificate
- ✅ Installed Certbot with Nginx plugin
- ✅ Obtained Let's Encrypt certificate for api.inventurcubes.com
- ✅ Auto-renewal configured
- ✅ HTTPS working: https://api.inventurcubes.com/health

### 4. Frontend Configuration
Updated the following files to use the new API domain:

- ✅ `src/services/api.ts` - Changed default from IP to api.inventurcubes.com
- ✅ `src/services/videosdk.ts` - Updated VideoSDK API base
- ✅ `src/lib/apiConfig.ts` - Updated BASE_URL and SOCKET_URL
- ✅ `src/lib/socket.ts` - Updated WebSocket fallback URL
- ✅ `.env` - Added VITE_API_BASE_URL and VITE_SOCKET_URL
- ✅ `.env.production` - Created for production builds

## Current Configuration

### Backend (EC2)
- **URL**: https://api.inventurcubes.com
- **Server**: 51.20.41.208:3000 (Node.js + Express)
- **Reverse Proxy**: Nginx
- **SSL**: Let's Encrypt (auto-renewing)
- **CORS**: Already configured for inventurcubes.com and www

### Frontend (Vercel)
- **Domain**: www.inventurcubes.com (pending DNS)
- **API URL**: https://api.inventurcubes.com/api
- **WebSocket**: wss://api.inventurcubes.com

## Next Steps

### 1. Add Environment Variables in Vercel

Go to your Vercel project → Settings → Environment Variables and add:

| Name | Value | Environment |
|------|-------|-------------|
| `VITE_API_BASE_URL` | `https://api.inventurcubes.com/api` | Production, Preview |
| `VITE_SOCKET_URL` | `wss://api.inventurcubes.com` | Production, Preview |

### 2. Redeploy Frontend

After adding environment variables:

```bash
# From your local machine
git add .
git commit -m "Configure API domain"
git push origin main
```

Or manually trigger a redeploy in Vercel dashboard.

### 3. Complete Frontend Domain Setup

In Hostinger DNS, add/update:
- A record: `@` → `76.76.21.21`
- CNAME: `www` → `cname.vercel-dns.com`

In Vercel:
- Add domains: inventurcubes.com and www.inventurcubes.com
- Set both to Production
- Wait for DNS validation
- Set redirect (308) from secondary to primary

## Testing Checklist

Once deployed, test these flows:

### API Connectivity
```bash
# Health check
curl https://api.inventurcubes.com/health

# Should return 200 OK
```

### From Frontend (Browser Console)
```javascript
// Check API base URL
console.log(import.meta.env.VITE_API_BASE_URL);
// Should show: https://api.inventurcubes.com/api

// Check Socket URL
console.log(import.meta.env.VITE_SOCKET_URL);
// Should show: wss://api.inventurcubes.com
```

### Full User Flow
- [ ] Register/Login
- [ ] Create post
- [ ] Upload media
- [ ] Start live stream
- [ ] Send message
- [ ] Real-time notifications via WebSocket

## Nginx Configuration

Located at: `/etc/nginx/sites-available/api.inventurcubes.com`

Key features:
- Proxies to localhost:3000
- WebSocket support for Socket.IO
- Extended timeouts (600s)
- Standard proxy headers
- SSL/TLS enabled
- HTTP → HTTPS redirect

## SSL Certificate Info

- Provider: Let's Encrypt
- Domain: api.inventurcubes.com
- Auto-renewal: Enabled via certbot systemd timer
- Test renewal: `sudo certbot renew --dry-run`

## Troubleshooting

### API not responding
```bash
# SSH into EC2
ssh -i /Users/anujmishra/Documents/trees-backend-key.pem ubuntu@51.20.41.208

# Check Node.js process
pm2 list
# or
ps aux | grep node

# Check Nginx
sudo systemctl status nginx

# View logs
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log
```

### CORS errors
Ensure backend `server.js` includes:
```javascript
const allowedOrigins = [
  'https://inventurcubes.com',
  'https://www.inventurcubes.com',
  // ... other origins
];
```

### WebSocket connection fails
- Check firewall allows port 443
- Verify Nginx config has WebSocket headers
- Check browser console for connection errors

## Backend CORS Already Configured ✅

Your backend already has the correct CORS configuration in:
- `trees backend/server.js` - Express CORS + Socket.IO CORS
- `trees backend/.env` - FRONTEND_URL and SOCKET_CORS_ORIGIN

No backend changes needed!

---

**Status**: API domain fully configured and SSL secured ✅
**Next**: Configure Vercel environment variables and complete frontend domain setup
