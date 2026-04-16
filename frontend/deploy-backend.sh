#!/bin/bash

# Deploy Backend to EC2 Script
# This script syncs your local backend code to EC2 and restarts the server

set -e

echo "🚀 Deploying backend to EC2..."

# Configuration
EC2_USER="ubuntu"
EC2_HOST="51.20.41.208"
PEM_KEY="/Users/anujmishra/Documents/trees-backend-key.pem"
REMOTE_PATH="~/trees-backend"
LOCAL_PATH="./trees backend"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Step 1: Syncing files to EC2...${NC}"

# Sync files (exclude node_modules and other unnecessary files)
rsync -avz --progress \
  --exclude 'node_modules' \
  --exclude '.git' \
  --exclude 'uploads' \
  --exclude '.env' \
  -e "ssh -i $PEM_KEY" \
  "$LOCAL_PATH/" \
  "$EC2_USER@$EC2_HOST:$REMOTE_PATH/"

echo -e "${GREEN}✅ Files synced${NC}"

echo -e "${YELLOW}Step 2: Installing dependencies on EC2...${NC}"

ssh -i "$PEM_KEY" "$EC2_USER@$EC2_HOST" << 'EOF'
  cd ~/trees-backend
  npm install --production
EOF

echo -e "${GREEN}✅ Dependencies installed${NC}"

echo -e "${YELLOW}Step 3: Restarting Node.js server...${NC}"

ssh -i "$PEM_KEY" "$EC2_USER@$EC2_HOST" << 'EOF'
  cd ~/trees-backend
  
  # Check if PM2 is installed
  if command -v pm2 &> /dev/null; then
    echo "Using PM2 to restart..."
    pm2 restart all || pm2 start server.js --name "trees-backend"
  else
    echo "PM2 not found. Attempting to restart using other methods..."
    
    # Try to find and kill existing node processes
    pkill -f "node.*server.js" || true
    
    # Start with nohup in background
    nohup node server.js > server.log 2>&1 &
    echo "Server started with nohup. PID: $!"
  fi
  
  # Wait a moment for server to start
  sleep 3
  
  # Check if server is running
  if netstat -tuln | grep -q ':3000'; then
    echo "✅ Server is running on port 3000"
  else
    echo "⚠️  Warning: Port 3000 is not listening. Check server logs."
  fi
EOF

echo -e "${GREEN}✅ Server restarted${NC}"

echo -e "${YELLOW}Step 4: Testing API endpoint...${NC}"

sleep 2
if curl -f -s https://api.inventurcubes.com/health > /dev/null; then
  echo -e "${GREEN}✅ API is responding${NC}"
else
  echo -e "${YELLOW}⚠️  API health check failed. Check server logs.${NC}"
fi

echo -e "${GREEN}🎉 Deployment complete!${NC}"
echo ""
echo "To view logs, run:"
echo "  ssh -i $PEM_KEY $EC2_USER@$EC2_HOST"
echo "  pm2 logs"
echo "  # or"
echo "  tail -f ~/trees-backend/server.log"
