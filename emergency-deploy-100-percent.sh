#!/bin/bash

echo "🚀 EMERGENCY DEPLOYMENT - 100% API SUCCESS RATE"
echo "=============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Step 1: Pulling latest changes...${NC}"
cd /var/www/ivr-platform/ivr_calling
git pull origin main

echo -e "${YELLOW}Step 2: Building frontend...${NC}"
cd frontend
npm run build
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Frontend build successful${NC}"
else
    echo -e "${RED}❌ Frontend build failed${NC}"
    exit 1
fi

echo -e "${YELLOW}Step 3: Deploying frontend...${NC}"
cp -r build/* /var/www/html/ivr/
echo -e "${GREEN}✅ Frontend deployed${NC}"

echo -e "${YELLOW}Step 4: Restarting backend...${NC}"
cd ../backend
pm2 restart ivr-backend-8090
sleep 3
echo -e "${GREEN}✅ Backend restarted${NC}"

echo -e "${YELLOW}Step 5: Checking backend status...${NC}"
pm2 status ivr-backend-8090

echo -e "${YELLOW}Step 6: Testing health endpoint...${NC}"
curl -s http://localhost:8090/health | jq '.' || echo "Health check failed"

echo -e "${YELLOW}Step 7: Running comprehensive API tests...${NC}"
node test-all-apis-final.js

echo ""
echo -e "${GREEN}🎉 DEPLOYMENT COMPLETE!${NC}"
echo -e "${YELLOW}Expected result: 13/13 APIs passing (100% success rate)${NC}"
echo ""
echo "If APIs are still failing, check PM2 logs:"
echo "pm2 logs ivr-backend-8090 --lines 50"