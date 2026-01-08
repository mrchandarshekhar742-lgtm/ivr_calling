#!/bin/bash

# IVR Backend Deployment Script - Fixed Version
# This script deploys the fixed backend to VPS

echo "🚀 Starting IVR Backend Deployment (Fixed Version)..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
VPS_HOST="66.116.196.226"
VPS_USER="root"
VPS_PATH="/var/www/ivr-platform/ivr_calling"
BACKEND_SERVICE="ivr-backend-8090"

echo -e "${YELLOW}Configuration:${NC}"
echo "VPS Host: $VPS_HOST"
echo "VPS User: $VPS_USER"
echo "VPS Path: $VPS_PATH"
echo "Service: $BACKEND_SERVICE"
echo ""

# Function to run command on VPS
run_vps_command() {
    echo -e "${YELLOW}Running on VPS:${NC} $1"
    ssh $VPS_USER@$VPS_HOST "$1"
}

# Function to copy files to VPS
copy_to_vps() {
    echo -e "${YELLOW}Copying:${NC} $1 -> $2"
    scp -r "$1" "$VPS_USER@$VPS_HOST:$2"
}

echo "📋 Step 1: Stopping backend service..."
run_vps_command "pm2 delete $BACKEND_SERVICE 2>/dev/null || true"

echo ""
echo "📋 Step 2: Backing up current backend..."
run_vps_command "cd $VPS_PATH && cp -r backend backend_backup_$(date +%Y%m%d_%H%M%S) 2>/dev/null || true"

echo ""
echo "📋 Step 3: Copying fixed backend files..."
copy_to_vps "backend/" "$VPS_PATH/"

echo ""
echo "📋 Step 4: Installing dependencies..."
run_vps_command "cd $VPS_PATH/backend && npm install --production"

echo ""
echo "📋 Step 5: Starting backend service..."
run_vps_command "cd $VPS_PATH/backend && pm2 start server.js --name '$BACKEND_SERVICE' --env production"

echo ""
echo "📋 Step 6: Saving PM2 configuration..."
run_vps_command "pm2 save"

echo ""
echo "📋 Step 7: Checking service status..."
run_vps_command "pm2 status"

echo ""
echo "📋 Step 8: Testing backend health..."
sleep 5
run_vps_command "curl -s https://ivr.wxon.in/health || echo 'Health check failed'"

echo ""
echo "📋 Step 9: Checking for errors..."
run_vps_command "pm2 logs $BACKEND_SERVICE --lines 10 --nostream"

echo ""
echo -e "${GREEN}✅ Deployment completed!${NC}"
echo ""
echo "🔍 To monitor the service:"
echo "   ssh $VPS_USER@$VPS_HOST"
echo "   pm2 logs $BACKEND_SERVICE"
echo ""
echo "🌐 Test the API:"
echo "   curl https://ivr.wxon.in/health"
echo "   curl https://ivr.wxon.in/api/analytics/test"
echo ""