#!/bin/bash

# Email OTP Deployment Script
# This script deploys the updated backend with SendGrid configuration

echo "📧 Deploying Email OTP Configuration..."
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
KEY_PATH="$HOME/Documents/trees-backend-key.pem"
SERVER="ubuntu@51.20.41.208"
BACKEND_PATH="$HOME/Documents/trees new api updated complete/trees backend"

echo "${YELLOW}Step 1: Copying .env file to server...${NC}"
scp -i "$KEY_PATH" "$BACKEND_PATH/.env" "$SERVER:~/trees-backend/"

if [ $? -eq 0 ]; then
    echo "${GREEN}✅ .env file copied successfully${NC}"
else
    echo "${RED}❌ Failed to copy .env file${NC}"
    exit 1
fi

echo ""
echo "${YELLOW}Step 2: Restarting backend server...${NC}"
ssh -i "$KEY_PATH" "$SERVER" << 'ENDSSH'
cd ~/trees-backend
echo "Restarting PM2 processes..."
pm2 restart all
echo ""
echo "Checking PM2 status..."
pm2 list
echo ""
echo "Recent logs:"
pm2 logs --lines 20 --nostream
ENDSSH

if [ $? -eq 0 ]; then
    echo ""
    echo "${GREEN}✅ Backend restarted successfully!${NC}"
    echo ""
    echo "${GREEN}🎉 Email OTP is now active!${NC}"
    echo ""
    echo "📋 Next Steps:"
    echo "1. Open your app: https://treessocialmedia.vercel.app"
    echo "2. Go to Sign Up page"
    echo "3. Fill in your details"
    echo "4. Click 'Send OTP' button"
    echo "5. Check your email for OTP code"
    echo "6. Enter code and register"
    echo ""
    echo "💡 Tip: Check spam folder if email doesn't arrive"
    echo "📊 Monitor: https://app.sendgrid.com"
else
    echo "${RED}❌ Failed to restart backend${NC}"
    exit 1
fi
