#!/bin/bash

# ============================================================================
# IVR PROJECT - VPS DEPLOYMENT SCRIPT
# ============================================================================
# Run this script on your VPS to deploy the project
# ============================================================================

echo "=========================================="
echo "IVR Project - VPS Deployment"
echo "=========================================="
echo ""

# Step 1: Navigate to project
echo "[1/11] Navigating to project directory..."
cd /var/www/ivr-platform/ivr_calling || exit 1

# Step 2: Pull latest code
echo "[2/11] Pulling latest code..."
git fetch origin
git reset --hard origin/main
git pull origin main

# Step 3: Stop existing backend
echo "[3/11] Stopping existing backend..."
pm2 stop ivr-backend-5000 2>/dev/null || true
pm2 delete ivr-backend-5000 2>/dev/null || true

# Step 4: Install backend dependencies
echo "[4/11] Installing backend dependencies..."
cd backend
npm install

# Step 5: Verify syntax
echo "[5/11] Verifying syntax..."
node -c server.js || exit 1
echo "✅ server.js OK"

node -c src/routes/auth.js || exit 1
node -c src/routes/campaigns.js || exit 1
node -c src/routes/contacts.js || exit 1
node -c src/routes/audio.js || exit 1
node -c src/routes/analytics.js || exit 1
echo "✅ All routes OK"

# Step 6: Start backend
echo "[6/11] Starting backend with PM2..."
pm2 start server.js --name "ivr-backend-5000"
pm2 save

# Step 7: Wait for startup
echo "[7/11] Waiting for backend to start..."
sleep 5

# Step 8: Test backend
echo "[8/11] Testing backend..."
if curl -s http://localhost:5000/health > /dev/null; then
    echo "✅ Backend responding"
else
    echo "❌ Backend not responding - checking logs..."
    pm2 logs ivr-backend-5000 --lines 20
    exit 1
fi

# Step 9: Build frontend
echo "[9/11] Building frontend..."
cd ../frontend
npm install
npm run build || exit 1

# Step 10: Deploy frontend
echo "[10/11] Deploying frontend..."
mkdir -p /var/www/html/ivr
cp -r build/* /var/www/html/ivr/

# Step 11: Final verification
echo "[11/11] Final verification..."
pm2 status
echo ""
echo "=========================================="
echo "✅ DEPLOYMENT COMPLETE"
echo "=========================================="
echo ""
echo "Backend Health: http://localhost:5000/health"
echo "Frontend: http://your-domain.com"
echo ""
echo "View logs: pm2 logs ivr-backend-5000"
echo "Monitor: pm2 monit"
