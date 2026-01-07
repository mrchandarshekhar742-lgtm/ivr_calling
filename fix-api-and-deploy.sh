#!/bin/bash

echo "🔧 Fixing API Issues and Deploying Updates"
echo "=========================================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Step 1: Commit and push changes
echo -e "${BLUE}📤 Pushing code changes...${NC}"
git add .
git commit -m "Fix API double /api issue and BLOB storage for audio files"
git push origin main

# Step 2: Pull latest changes on VPS
echo -e "${BLUE}📥 Pulling latest changes on VPS...${NC}"
cd /var/www/ivr-platform/ivr_calling

# Stash any local changes
git stash

# Pull latest
git pull origin main

# Step 3: Restart backend with database update
echo -e "${BLUE}🔄 Restarting backend...${NC}"
cd backend

# Update database schema for BLOB to file system migration
echo -e "${YELLOW}📊 Updating database schema...${NC}"
node setup-database.js

# Restart backend service
echo -e "${YELLOW}🔄 Restarting backend service...${NC}"
pm2 restart ivr-backend-8090

# Check backend status
pm2 status | grep ivr-backend-8090

# Step 4: Rebuild and deploy frontend
echo -e "${BLUE}🏗️ Building frontend...${NC}"
cd ../frontend

# Install dependencies
npm install

# Build frontend
npm run build

# Deploy to web directory
echo -e "${YELLOW}📦 Deploying frontend...${NC}"
cp -r build/* /var/www/html/ivr/

# Step 5: Restart nginx
echo -e "${BLUE}🔄 Restarting nginx...${NC}"
systemctl restart nginx

# Step 6: Test endpoints
echo -e "${BLUE}🧪 Testing critical endpoints...${NC}"

# Test backend health
echo -n "Backend health: "
if curl -s https://ivr.wxon.in/api/health | grep -q "success"; then
    echo -e "${GREEN}✅ OK${NC}"
else
    echo -e "${RED}❌ FAILED${NC}"
fi

# Test frontend
echo -n "Frontend: "
if curl -s https://ivr.wxon.in | grep -q "IVR Call Manager"; then
    echo -e "${GREEN}✅ OK${NC}"
else
    echo -e "${RED}❌ FAILED${NC}"
fi

# Test auth endpoint (should return 401 without token)
echo -n "Auth endpoint: "
if curl -s https://ivr.wxon.in/api/auth/me | grep -q "401\|Unauthorized"; then
    echo -e "${GREEN}✅ OK${NC}"
else
    echo -e "${RED}❌ FAILED${NC}"
fi

# Test devices endpoint (should return 401 without token)
echo -n "Devices endpoint: "
if curl -s https://ivr.wxon.in/api/devices | grep -q "401\|Unauthorized"; then
    echo -e "${GREEN}✅ OK${NC}"
else
    echo -e "${RED}❌ FAILED${NC}"
fi

echo -e "\n${GREEN}🎉 Deployment complete!${NC}"
echo -e "${BLUE}📋 Next steps:${NC}"
echo "1. Test login at https://ivr.wxon.in"
echo "2. Check device display at https://ivr.wxon.in/android-devices"
echo "3. Test audio upload at https://ivr.wxon.in/audio-files"
echo "4. Verify no more 500 errors in browser console"

echo -e "\n${BLUE}🔗 Quick Links:${NC}"
echo "Website: https://ivr.wxon.in"
echo "Login: admin@ivr.com / admin123"
echo "Backend logs: pm2 logs ivr-backend-8090"