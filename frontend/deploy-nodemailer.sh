#!/bin/bash

echo "🚀 Deploying Nodemailer OTP Email Service..."
echo ""

# SSH key path
SSH_KEY="$HOME/Documents/trees-backend-key.pem"
SERVER="ubuntu@51.20.41.208"
BACKEND_DIR="$HOME/Documents/trees new api updated complete/trees backend"

# Color codes
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Install nodemailer on server
echo -e "${BLUE}Step 1/5:${NC} Installing nodemailer package on server..."
ssh -i "$SSH_KEY" "$SERVER" "cd ~/trees-backend && npm install nodemailer" || {
    echo "❌ Failed to install nodemailer"
    exit 1
}
echo -e "${GREEN}✅ nodemailer installed${NC}"
echo ""

# Step 2: Copy emailService.js
echo -e "${BLUE}Step 2/5:${NC} Copying emailService.js..."
scp -i "$SSH_KEY" "$BACKEND_DIR/services/emailService.js" "$SERVER:~/trees-backend/services/" || {
    echo "❌ Failed to copy emailService.js"
    exit 1
}
echo -e "${GREEN}✅ emailService.js copied${NC}"
echo ""

# Step 3: Copy server.js
echo -e "${BLUE}Step 3/5:${NC} Copying server.js..."
scp -i "$SSH_KEY" "$BACKEND_DIR/server.js" "$SERVER:~/trees-backend/" || {
    echo "❌ Failed to copy server.js"
    exit 1
}
echo -e "${GREEN}✅ server.js copied${NC}"
echo ""

# Step 4: Copy .env
echo -e "${BLUE}Step 4/5:${NC} Copying .env with Gmail credentials..."
scp -i "$SSH_KEY" "$BACKEND_DIR/.env" "$SERVER:~/trees-backend/" || {
    echo "❌ Failed to copy .env"
    exit 1
}
echo -e "${GREEN}✅ .env copied${NC}"
echo ""

# Step 5: Copy package.json
echo -e "${BLUE}Step 5/5:${NC} Copying package.json..."
scp -i "$SSH_KEY" "$BACKEND_DIR/package.json" "$SERVER:~/trees-backend/" || {
    echo "❌ Failed to copy package.json"
    exit 1
}
echo -e "${GREEN}✅ package.json copied${NC}"
echo ""

# Restart PM2
echo -e "${YELLOW}🔄 Restarting server...${NC}"
ssh -i "$SSH_KEY" "$SERVER" "cd ~/trees-backend && pm2 restart all" || {
    echo "❌ Failed to restart PM2"
    exit 1
}
echo -e "${GREEN}✅ Server restarted${NC}"
echo ""

# Show logs
echo -e "${YELLOW}📋 Server logs (last 30 lines):${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
ssh -i "$SSH_KEY" "$SERVER" "pm2 logs --lines 30 --nostream"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo -e "${GREEN}✅ Deployment Complete!${NC}"
echo ""
echo "🎯 Next Steps:"
echo "1. Go to: https://treessocialmedia.vercel.app"
echo "2. Click 'Sign Up'"
echo "3. Enter your email and click 'Send OTP'"
echo "4. Check your email inbox (anujmishra9893@gmail.com)"
echo "5. Enter the 6-digit OTP code"
echo ""
echo "📊 Monitor logs: ssh -i \"$SSH_KEY\" \"$SERVER\" \"pm2 logs\""
echo ""
echo "✅ Look for: '✅ Email server is ready to send messages'"
echo "✅ Look for: '✅ OTP email sent to...'"
echo ""
