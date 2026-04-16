#!/bin/bash

# Quick fix for SendGrid and Proxy errors
echo "🔧 Deploying fixes for SendGrid and Nginx proxy..."

KEY_PATH="$HOME/Documents/trees-backend-key.pem"
SERVER="ubuntu@51.20.41.208"
BACKEND_PATH="$HOME/Documents/trees new api updated complete/trees backend"

echo "1️⃣ Copying fixed files..."
scp -i "$KEY_PATH" "$BACKEND_PATH/services/emailService.js" "$SERVER:~/trees-backend/services/"
scp -i "$KEY_PATH" "$BACKEND_PATH/server.js" "$SERVER:~/trees-backend/"
scp -i "$KEY_PATH" "$BACKEND_PATH/.env" "$SERVER:~/trees-backend/"

echo ""
echo "2️⃣ Restarting server..."
ssh -i "$KEY_PATH" "$SERVER" << 'ENDSSH'
cd ~/trees-backend
pm2 restart all
echo ""
echo "Waiting for server to start..."
sleep 3
echo ""
echo "📋 Recent logs:"
pm2 logs --lines 30 --nostream
ENDSSH

echo ""
echo "✅ Done! Check logs above for:"
echo "   - ✅ SendGrid initialized with API key"
echo "   - No ERR_ERL_UNEXPECTED_X_FORWARDED_FOR errors"
echo ""
echo "🧪 Test OTP now: Go to signup and click Send OTP"
