# Quick Reference Commands

## Local Development

### Start Backend (Local)
```bash
cd "trees backend"
npm run dev
```

### Start Frontend (Local)
```bash
npm run dev
```

Access at: http://localhost:5173
API will point to: https://api.inventurcubes.com/api

## EC2 Server Management

### Connect to Server
```bash
ssh -i /Users/anujmishra/Documents/trees-backend-key.pem ubuntu@51.20.41.208
```

### Check Backend Status
```bash
# If using PM2
pm2 list
pm2 logs
pm2 restart all

# If using screen/tmux
screen -ls
screen -r [session-name]

# Check process
ps aux | grep node
netstat -tlnp | grep :3000
```

### Nginx Commands
```bash
# Status
sudo systemctl status nginx

# Restart
sudo systemctl restart nginx

# Reload config (no downtime)
sudo systemctl reload nginx

# Test config
sudo nginx -t

# View logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### SSL Certificate Management
```bash
# Test renewal
sudo certbot renew --dry-run

# Force renew (if needed)
sudo certbot renew --force-renewal

# List certificates
sudo certbot certificates

# Check auto-renewal timer
sudo systemctl status certbot.timer
```

### View Backend Logs (if using PM2)
```bash
pm2 logs --lines 100
pm2 logs [app-name] --lines 50
```

## Testing Endpoints

### API Health Check
```bash
curl https://api.inventurcubes.com/health
```

### Test Auth
```bash
curl -X POST https://api.inventurcubes.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"identifier":"test@example.com","password":"testpass"}'
```

### Test with Headers
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://api.inventurcubes.com/api/users/profile
```

## Vercel Deployment

### Deploy from Git
Just push to main:
```bash
git add .
git commit -m "Update message"
git push origin main
```

### Manual Deploy (with Vercel CLI)
```bash
# Install Vercel CLI (if not installed)
npm i -g vercel

# Deploy
vercel --prod
```

### Check Deployment Status
Visit: https://vercel.com/[your-username]/[project-name]

## Environment Variables

### Local (.env)
```env
VITE_API_BASE_URL=https://api.inventurcubes.com/api
VITE_SOCKET_URL=wss://api.inventurcubes.com
```

### Vercel (add in dashboard)
- VITE_API_BASE_URL = https://api.inventurcubes.com/api
- VITE_SOCKET_URL = wss://api.inventurcubes.com

## DNS Check

```bash
# Check A record
dig +short api.inventurcubes.com

# Check CNAME
dig +short www.inventurcubes.com

# Full DNS info
dig api.inventurcubes.com

# Check from specific DNS server
dig @8.8.8.8 api.inventurcubes.com
```

## Firewall (EC2 Security Group)

Required inbound rules:
- SSH (22) from your IP
- HTTP (80) from 0.0.0.0/0
- HTTPS (443) from 0.0.0.0/0
- Custom TCP (3000) - ONLY from localhost (optional, if needed)

## Quick Troubleshooting

### API not responding
```bash
# Check if Node is running
ps aux | grep node

# Check if port 3000 is listening
sudo netstat -tlnp | grep :3000

# Check Nginx is forwarding
curl -I http://localhost:3000/health
curl -I https://api.inventurcubes.com/health
```

### SSL Issues
```bash
# Check certificate
echo | openssl s_client -servername api.inventurcubes.com -connect api.inventurcubes.com:443 2>/dev/null | openssl x509 -noout -dates

# Test SSL handshake
openssl s_client -connect api.inventurcubes.com:443
```

### CORS Issues
Check browser console for errors. If CORS error appears:
1. Verify backend CORS config includes your frontend domain
2. Check Nginx is passing headers correctly
3. Ensure credentials: 'include' in fetch requests (if using cookies)

### WebSocket not connecting
```bash
# Test WebSocket (install wscat first: npm i -g wscat)
wscat -c wss://api.inventurcubes.com

# Check Nginx WebSocket config
sudo nginx -t
sudo cat /etc/nginx/sites-available/api.inventurcubes.com | grep -A 5 "proxy_set_header Upgrade"
```

## File Locations

### Frontend
- Source: `src/`
- API Config: `src/services/api.ts`
- Socket Config: `src/lib/socket.ts`
- Environment: `.env` and `.env.production`

### Backend (EC2)
- Code: `~/trees-backend/` (or wherever you deployed)
- Nginx Config: `/etc/nginx/sites-available/api.inventurcubes.com`
- Nginx Logs: `/var/log/nginx/`
- SSL Certs: `/etc/letsencrypt/live/api.inventurcubes.com/`
- Environment: `~/trees-backend/.env`

## Important URLs

- **Frontend (Production)**: https://www.inventurcubes.com (pending DNS)
- **API (Production)**: https://api.inventurcubes.com
- **WebSocket**: wss://api.inventurcubes.com
- **Health Check**: https://api.inventurcubes.com/health
- **Local Frontend**: http://localhost:5173
- **Local Backend**: http://localhost:3000

## Git Workflow

```bash
# Check status
git status

# Stage changes
git add .

# Commit
git commit -m "Description of changes"

# Push to deploy (triggers Vercel build)
git push origin main

# Pull latest
git pull origin main
```

## Monitoring

### Check API Response Time
```bash
curl -w "@-" -o /dev/null -s https://api.inventurcubes.com/health <<'EOF'
    time_namelookup:  %{time_namelookup}\n
       time_connect:  %{time_connect}\n
    time_appconnect:  %{time_appconnect}\n
   time_pretransfer:  %{time_pretransfer}\n
      time_redirect:  %{time_redirect}\n
 time_starttransfer:  %{time_starttransfer}\n
                    ----------\n
         time_total:  %{time_total}\n
EOF
```

### Check Server Resources (EC2)
```bash
# CPU and memory
htop

# Disk usage
df -h

# Check port usage
sudo netstat -tuln

# Active connections
sudo netstat -an | grep :3000 | wc -l
```
