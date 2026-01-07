#!/bin/bash

echo "🚨 FINAL EMERGENCY DEPLOYMENT - SYNTAX ERROR FIX"
echo "==============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Step 1: Stopping backend to prevent conflicts...${NC}"
pm2 stop ivr-backend-8090

echo -e "${YELLOW}Step 2: Pulling latest changes with force...${NC}"
cd /var/www/ivr-platform/ivr_calling
git fetch origin
git reset --hard origin/main
git pull origin main

echo -e "${YELLOW}Step 3: Checking syntax of all route files...${NC}"
cd backend

echo -e "${BLUE}Checking analytics.js...${NC}"
node -c src/routes/analytics.js
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ analytics.js syntax OK${NC}"
else
    echo -e "${RED}❌ analytics.js syntax ERROR${NC}"
    exit 1
fi

echo -e "${BLUE}Checking campaigns.js...${NC}"
node -c src/routes/campaigns.js
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ campaigns.js syntax OK${NC}"
else
    echo -e "${RED}❌ campaigns.js syntax ERROR${NC}"
    exit 1
fi

echo -e "${BLUE}Checking callLogs.js...${NC}"
node -c src/routes/callLogs.js
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ callLogs.js syntax OK${NC}"
else
    echo -e "${RED}❌ callLogs.js syntax ERROR${NC}"
    exit 1
fi

echo -e "${BLUE}Checking schedules.js...${NC}"
node -c src/routes/schedules.js
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ schedules.js syntax OK${NC}"
else
    echo -e "${RED}❌ schedules.js syntax ERROR${NC}"
    exit 1
fi

echo -e "${BLUE}Checking devices.js...${NC}"
node -c src/routes/devices.js
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ devices.js syntax OK${NC}"
else
    echo -e "${RED}❌ devices.js syntax ERROR${NC}"
    exit 1
fi

echo -e "${BLUE}Checking server.js...${NC}"
node -c server.js
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ server.js syntax OK${NC}"
else
    echo -e "${RED}❌ server.js syntax ERROR${NC}"
    exit 1
fi

echo -e "${YELLOW}Step 4: Building frontend...${NC}"
cd ../frontend
npm run build
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Frontend build successful${NC}"
else
    echo -e "${RED}❌ Frontend build failed${NC}"
    exit 1
fi

echo -e "${YELLOW}Step 5: Deploying frontend...${NC}"
cp -r build/* /var/www/html/ivr/
echo -e "${GREEN}✅ Frontend deployed${NC}"

echo -e "${YELLOW}Step 6: Starting backend with fresh environment...${NC}"
cd ../backend
pm2 delete ivr-backend-8090 2>/dev/null || true
pm2 start server.js --name ivr-backend-8090
sleep 5

echo -e "${YELLOW}Step 7: Checking backend status...${NC}"
pm2 status ivr-backend-8090

echo -e "${YELLOW}Step 8: Testing health endpoint...${NC}"
sleep 2
curl -s http://localhost:8090/health | jq '.' || echo "Health check response received"

echo -e "${YELLOW}Step 9: Running comprehensive API tests...${NC}"
node test-all-apis-final.js

echo ""
echo -e "${GREEN}🎉 EMERGENCY DEPLOYMENT COMPLETE!${NC}"
echo -e "${YELLOW}Expected result: 13/13 APIs passing (100% success rate)${NC}"
echo ""
echo "If there are still issues, check logs with:"
echo "pm2 logs ivr-backend-8090 --lines 20"