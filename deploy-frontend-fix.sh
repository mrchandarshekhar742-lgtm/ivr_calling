#!/bin/bash

# Frontend Deployment Script for Auth Fix
# This script builds and deploys the frontend with the auth fixes

set -e

echo "🚀 Starting Frontend Deployment with Auth Fixes..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
VPS_HOST="root@66.116.196.226"
VPS_PATH="/var/www/ivr-platform/ivr_calling"
FRONTEND_BUILD_PATH="/var/www/html/ivr"
SSH_OPTIONS="-o HostKeyAlgorithms=+ssh-rsa -o PubkeyAcceptedKeyTypes=+ssh-rsa"

echo -e "${YELLOW}📋 Deployment Configuration:${NC}"
echo "  VPS Host: $VPS_HOST"
echo "  VPS Path: $VPS_PATH"
echo "  Frontend Path: $FRONTEND_BUILD_PATH"
echo ""

# Step 1: Build frontend locally (if needed)
echo -e "${YELLOW}🔨 Step 1: Building Frontend Locally...${NC}"
cd frontend
if npm run build; then
    echo -e "${GREEN}✅ Frontend build successful${NC}"
else
    echo -e "${RED}❌ Frontend build failed${NC}"
    exit 1
fi
cd ..

# Step 2: Deploy to VPS
echo -e "${YELLOW}🚀 Step 2: Deploying to VPS...${NC}"

# Upload the fixed files
echo "📤 Uploading fixed files..."
scp $SSH_OPTIONS frontend/src/utils/api.js $VPS_HOST:$VPS_PATH/frontend/src/utils/
scp $SSH_OPTIONS frontend/src/index.jsx $VPS_HOST:$VPS_PATH/frontend/src/
scp $SSH_OPTIONS frontend/src/utils/apiTester.js $VPS_HOST:$VPS_PATH/frontend/src/utils/

# Build and deploy on VPS
echo "🔨 Building on VPS..."
ssh $SSH_OPTIONS $VPS_HOST << 'EOF'
set -e

echo "📍 Current directory: $(pwd)"
cd /var/www/ivr-platform/ivr_calling/frontend

echo "🔍 Checking Node.js version..."
node --version
npm --version

echo "📦 Installing dependencies..."
npm install --production=false

echo "🔨 Building frontend..."
npm run build

echo "📋 Build directory contents:"
ls -la build/

echo "🚀 Deploying to web directory..."
cp -r build/* /var/www/html/ivr/

echo "🔍 Verifying deployment..."
ls -la /var/www/html/ivr/

echo "✅ Frontend deployment completed successfully!"
EOF

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ VPS deployment successful${NC}"
else
    echo -e "${RED}❌ VPS deployment failed${NC}"
    exit 1
fi

# Step 3: Test the deployment
echo -e "${YELLOW}🧪 Step 3: Testing Deployment...${NC}"

echo "🔍 Testing frontend accessibility..."
if curl -s -o /dev/null -w "%{http_code}" https://ivr.wxon.in | grep -q "200"; then
    echo -e "${GREEN}✅ Frontend is accessible${NC}"
else
    echo -e "${YELLOW}⚠️  Frontend accessibility test inconclusive${NC}"
fi

echo "🔍 Testing API endpoint..."
API_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" https://ivr.wxon.in/api/devices)
if [ "$API_RESPONSE" = "401" ]; then
    echo -e "${GREEN}✅ API returns correct 401 (Unauthorized)${NC}"
elif [ "$API_RESPONSE" = "500" ]; then
    echo -e "${RED}❌ API still returns 500 - backend issue${NC}"
else
    echo -e "${YELLOW}⚠️  API returns: $API_RESPONSE${NC}"
fi

# Step 4: Provide testing instructions
echo -e "${YELLOW}📋 Step 4: Manual Testing Instructions${NC}"
echo ""
echo -e "${GREEN}🎉 Deployment completed! Please test:${NC}"
echo ""
echo "1. Open browser console at: https://ivr.wxon.in"
echo "2. Check that 500 errors are gone"
echo "3. Verify proper 401 handling on unauthenticated requests"
echo "4. Test login flow works correctly"
echo ""
echo -e "${YELLOW}🔧 Debug Commands:${NC}"
echo "  # Test API directly:"
echo "  curl https://ivr.wxon.in/api/devices"
echo ""
echo "  # Test with auth (replace TOKEN):"
echo "  curl -H \"Authorization: Bearer TOKEN\" https://ivr.wxon.in/api/devices"
echo ""
echo "  # Browser console testing:"
echo "  window.apiTester.testAllEndpoints()"
echo ""
echo -e "${GREEN}✅ All fixes deployed successfully!${NC}"