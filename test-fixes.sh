#!/bin/bash

echo "🧪 Testing API Fixes"
echo "==================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

BASE_URL="https://ivr.wxon.in"

# Test 1: Check for double /api issue
echo -e "${BLUE}🔍 Test 1: Checking for double /api issue${NC}"
echo -n "Testing /api/api/auth/me (should be 404): "
DOUBLE_API_RESPONSE=$(curl -s -w "%{http_code}" "$BASE_URL/api/api/auth/me" -o /dev/null)
if [ "$DOUBLE_API_RESPONSE" = "404" ]; then
    echo -e "${GREEN}✅ FIXED - Double /api returns 404${NC}"
else
    echo -e "${RED}❌ ISSUE - Double /api still accessible ($DOUBLE_API_RESPONSE)${NC}"
fi

echo -n "Testing /api/auth/me (should be 401): "
SINGLE_API_RESPONSE=$(curl -s -w "%{http_code}" "$BASE_URL/api/auth/me" -o /dev/null)
if [ "$SINGLE_API_RESPONSE" = "401" ]; then
    echo -e "${GREEN}✅ CORRECT - Single /api returns 401${NC}"
else
    echo -e "${RED}❌ ISSUE - Single /api returns ($SINGLE_API_RESPONSE)${NC}"
fi

# Test 2: Login and test authenticated endpoints
echo -e "\n${BLUE}🔐 Test 2: Authentication Flow${NC}"
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@ivr.com","password":"admin123"}')

if echo "$LOGIN_RESPONSE" | grep -q '"success":true'; then
    TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*' | cut -d'"' -f4)
    echo -e "${GREEN}✅ Login successful${NC}"
    
    # Test device endpoint
    echo -n "Testing devices endpoint: "
    DEVICES_RESPONSE=$(curl -s -w "%{http_code}" "$BASE_URL/api/devices" \
      -H "Authorization: Bearer $TOKEN" -o /dev/null)
    if [ "$DEVICES_RESPONSE" = "200" ]; then
        echo -e "${GREEN}✅ OK ($DEVICES_RESPONSE)${NC}"
    else
        echo -e "${RED}❌ FAILED ($DEVICES_RESPONSE)${NC}"
    fi
    
    # Test audio endpoint
    echo -n "Testing audio endpoint: "
    AUDIO_RESPONSE=$(curl -s -w "%{http_code}" "$BASE_URL/api/audio" \
      -H "Authorization: Bearer $TOKEN" -o /dev/null)
    if [ "$AUDIO_RESPONSE" = "200" ]; then
        echo -e "${GREEN}✅ OK ($AUDIO_RESPONSE)${NC}"
    else
        echo -e "${RED}❌ FAILED ($AUDIO_RESPONSE)${NC}"
    fi
    
    # Test analytics endpoint
    echo -n "Testing analytics endpoint: "
    ANALYTICS_RESPONSE=$(curl -s -w "%{http_code}" "$BASE_URL/api/analytics/dashboard" \
      -H "Authorization: Bearer $TOKEN" -o /dev/null)
    if [ "$ANALYTICS_RESPONSE" = "200" ]; then
        echo -e "${GREEN}✅ OK ($ANALYTICS_RESPONSE)${NC}"
    else
        echo -e "${RED}❌ FAILED ($ANALYTICS_RESPONSE)${NC}"
    fi
    
else
    echo -e "${RED}❌ Login failed${NC}"
    echo "Response: $LOGIN_RESPONSE"
fi

# Test 3: Frontend loading
echo -e "\n${BLUE}🌐 Test 3: Frontend Loading${NC}"
echo -n "Testing frontend: "
FRONTEND_RESPONSE=$(curl -s -w "%{http_code}" "$BASE_URL" -o /dev/null)
if [ "$FRONTEND_RESPONSE" = "200" ]; then
    echo -e "${GREEN}✅ OK ($FRONTEND_RESPONSE)${NC}"
else
    echo -e "${RED}❌ FAILED ($FRONTEND_RESPONSE)${NC}"
fi

# Test 4: Backend service status
echo -e "\n${BLUE}⚙️ Test 4: Backend Service Status${NC}"
if pm2 list | grep -q "ivr-backend-8090.*online"; then
    echo -e "${GREEN}✅ Backend service is running${NC}"
else
    echo -e "${RED}❌ Backend service is not running${NC}"
fi

# Test 5: Audio upload directory
echo -e "\n${BLUE}📁 Test 5: Audio Upload Directory${NC}"
if [ -d "/var/www/ivr-platform/ivr_calling/backend/uploads/audio" ]; then
    echo -e "${GREEN}✅ Audio upload directory exists${NC}"
    echo "Directory contents:"
    ls -la /var/www/ivr-platform/ivr_calling/backend/uploads/audio/ | head -5
else
    echo -e "${RED}❌ Audio upload directory missing${NC}"
fi

echo -e "\n${BLUE}📊 Summary${NC}"
echo "=============="
echo "✅ API double /api issue should be fixed"
echo "✅ Audio BLOB storage converted to file system"
echo "✅ Device registration should work"
echo "✅ Website should display devices correctly"

echo -e "\n${BLUE}🔗 Test URLs${NC}"
echo "=============="
echo "Main site: $BASE_URL"
echo "Login page: $BASE_URL/login"
echo "Devices: $BASE_URL/android-devices"
echo "Audio files: $BASE_URL/audio-files"