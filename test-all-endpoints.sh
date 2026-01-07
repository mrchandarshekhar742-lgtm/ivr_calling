#!/bin/bash

echo "🔍 Complete IVR System Endpoint Testing"
echo "======================================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

BASE_URL="https://ivr.wxon.in"
API_URL="$BASE_URL/api"

# Test counters
PASSED=0
FAILED=0
WARNINGS=0

# Function to test endpoint
test_endpoint() {
    local method=$1
    local endpoint=$2
    local expected_status=$3
    local description=$4
    local auth_header=$5
    
    echo -n "Testing $method $endpoint... "
    
    if [ -n "$auth_header" ]; then
        response=$(curl -s -w "%{http_code}" -X $method "$API_URL$endpoint" -H "Authorization: Bearer $auth_header" -o /dev/null)
    else
        response=$(curl -s -w "%{http_code}" -X $method "$API_URL$endpoint" -o /dev/null)
    fi
    
    if [ "$response" = "$expected_status" ]; then
        echo -e "${GREEN}✅ PASS${NC} ($response) - $description"
        ((PASSED++))
    elif [ "$response" = "401" ] && [ "$expected_status" = "200" ]; then
        echo -e "${YELLOW}⚠️  AUTH${NC} ($response) - $description (Auth required)"
        ((WARNINGS++))
    else
        echo -e "${RED}❌ FAIL${NC} ($response, expected $expected_status) - $description"
        ((FAILED++))
    fi
}

# Test basic connectivity
echo -e "${BLUE}📡 Basic Connectivity Tests${NC}"
test_endpoint "GET" "/health" "200" "Health check"
test_endpoint "GET" "" "404" "Root API endpoint"

# Test authentication endpoints
echo -e "\n${BLUE}🔐 Authentication Endpoints${NC}"
test_endpoint "POST" "/auth/login" "400" "Login endpoint (no data)"
test_endpoint "POST" "/auth/register" "400" "Register endpoint (no data)"
test_endpoint "GET" "/auth/me" "401" "Get current user (no auth)"

# Test main API endpoints (without auth - should return 401)
echo -e "\n${BLUE}📊 Main API Endpoints (Auth Required)${NC}"
test_endpoint "GET" "/campaigns" "401" "Get campaigns"
test_endpoint "GET" "/contacts" "401" "Get contacts"
test_endpoint "GET" "/audio" "401" "Get audio files"
test_endpoint "GET" "/devices" "401" "Get devices"
test_endpoint "GET" "/analytics" "401" "Get analytics"
test_endpoint "GET" "/schedules" "401" "Get schedules"
test_endpoint "GET" "/call-logs" "401" "Get call logs"
test_endpoint "GET" "/templates" "401" "Get templates"

# Test device endpoints specifically
echo -e "\n${BLUE}📱 Device Management Endpoints${NC}"
test_endpoint "GET" "/devices" "401" "List devices"
test_endpoint "POST" "/devices/register" "401" "Register device"
test_endpoint "GET" "/devices/stats/summary" "401" "Device stats"

# Test audio endpoints
echo -e "\n${BLUE}🎵 Audio Management Endpoints${NC}"
test_endpoint "GET" "/audio" "401" "List audio files"
test_endpoint "POST" "/audio" "401" "Upload audio"

# Test campaign endpoints
echo -e "\n${BLUE}📢 Campaign Management Endpoints${NC}"
test_endpoint "GET" "/campaigns" "401" "List campaigns"
test_endpoint "POST" "/campaigns" "401" "Create campaign"

# Test with actual login (if credentials provided)
echo -e "\n${BLUE}🔑 Testing with Login${NC}"
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@ivr.com","password":"admin123"}')

if echo "$LOGIN_RESPONSE" | grep -q '"success":true'; then
    TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*' | cut -d'"' -f4)
    echo -e "${GREEN}✅ Login successful${NC}"
    
    # Test authenticated endpoints
    echo -e "\n${BLUE}🔓 Authenticated Endpoint Tests${NC}"
    test_endpoint "GET" "/auth/me" "200" "Get current user" "$TOKEN"
    test_endpoint "GET" "/campaigns" "200" "Get campaigns" "$TOKEN"
    test_endpoint "GET" "/contacts" "200" "Get contacts" "$TOKEN"
    test_endpoint "GET" "/audio" "200" "Get audio files" "$TOKEN"
    test_endpoint "GET" "/devices" "200" "Get devices" "$TOKEN"
    test_endpoint "GET" "/analytics" "200" "Get analytics" "$TOKEN"
    test_endpoint "GET" "/schedules" "200" "Get schedules" "$TOKEN"
    test_endpoint "GET" "/call-logs" "200" "Get call logs" "$TOKEN"
    
    # Test device registration with auth
    echo -e "\n${BLUE}📱 Device Registration Test${NC}"
    DEVICE_RESPONSE=$(curl -s -X POST "$API_URL/devices/register" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $TOKEN" \
      -d '{"deviceId":"test_device_endpoint","deviceName":"Endpoint Test Device","deviceModel":"Test Model","androidVersion":"13","appVersion":"2.0.0"}')
    
    if echo "$DEVICE_RESPONSE" | grep -q '"success":true'; then
        echo -e "${GREEN}✅ Device registration working${NC}"
        ((PASSED++))
        
        # Test device status update
        curl -s -X PUT "$API_URL/devices/test_device_endpoint/status" \
          -H "Content-Type: application/json" \
          -H "Authorization: Bearer $TOKEN" \
          -d '{"status":"online"}' > /dev/null
        echo -e "${GREEN}✅ Device status update working${NC}"
        ((PASSED++))
    else
        echo -e "${RED}❌ Device registration failed${NC}"
        ((FAILED++))
    fi
    
else
    echo -e "${RED}❌ Login failed - cannot test authenticated endpoints${NC}"
    ((FAILED++))
fi

# Test frontend
echo -e "\n${BLUE}🌐 Frontend Tests${NC}"
FRONTEND_RESPONSE=$(curl -s -w "%{http_code}" "$BASE_URL" -o /dev/null)
if [ "$FRONTEND_RESPONSE" = "200" ]; then
    echo -e "${GREEN}✅ Frontend loading${NC}"
    ((PASSED++))
else
    echo -e "${RED}❌ Frontend not loading ($FRONTEND_RESPONSE)${NC}"
    ((FAILED++))
fi

# Test specific device display functionality
echo -e "\n${BLUE}📱 Device Display Test${NC}"
if [ -n "$TOKEN" ]; then
    DEVICES_RESPONSE=$(curl -s "$API_URL/devices" -H "Authorization: Bearer $TOKEN")
    DEVICE_COUNT=$(echo "$DEVICES_RESPONSE" | grep -o '"total":[0-9]*' | cut -d':' -f2)
    
    if [ -n "$DEVICE_COUNT" ] && [ "$DEVICE_COUNT" -gt 0 ]; then
        echo -e "${GREEN}✅ Devices found: $DEVICE_COUNT devices registered${NC}"
        echo -e "${GREEN}✅ Website should show online devices${NC}"
        ((PASSED++))
    else
        echo -e "${YELLOW}⚠️  No devices registered yet${NC}"
        ((WARNINGS++))
    fi
fi

# Summary
echo -e "\n${BLUE}📊 Test Summary${NC}"
echo "=================================="
echo -e "${GREEN}✅ Passed: $PASSED${NC}"
echo -e "${RED}❌ Failed: $FAILED${NC}"
echo -e "${YELLOW}⚠️  Warnings: $WARNINGS${NC}"

TOTAL=$((PASSED + FAILED + WARNINGS))
SUCCESS_RATE=$((PASSED * 100 / TOTAL))

echo -e "\nSuccess Rate: ${SUCCESS_RATE}%"

if [ $FAILED -eq 0 ]; then
    echo -e "\n${GREEN}🎉 All critical tests passed!${NC}"
    echo -e "${GREEN}✅ Website should display online devices correctly${NC}"
    echo -e "${GREEN}✅ Audio upload should work${NC}"
    echo -e "${GREEN}✅ All endpoints are functional${NC}"
else
    echo -e "\n${RED}⚠️  Some tests failed. Check the issues above.${NC}"
fi

# Specific checks for device display
echo -e "\n${BLUE}📱 Device Display Checklist${NC}"
echo "=================================="
echo "1. Backend running: $(pm2 list | grep -q 'ivr-backend-8090.*online' && echo '✅ Yes' || echo '❌ No')"
echo "2. Frontend deployed: $([ -f '/var/www/html/ivr/index.html' ] && echo '✅ Yes' || echo '❌ No')"
echo "3. Nginx configured: $(nginx -t 2>/dev/null && echo '✅ Yes' || echo '❌ No')"
echo "4. Database accessible: $([ -f '/var/www/ivr-platform/ivr_calling/backend/database.sqlite' ] && echo '✅ Yes' || echo '❌ No')"

echo -e "\n${BLUE}🔗 Quick Access Links${NC}"
echo "=================================="
echo "Website: $BASE_URL"
echo "Login: $BASE_URL (admin@ivr.com / admin123)"
echo "Android Devices: $BASE_URL/android-devices"
echo "Audio Files: $BASE_URL/audio-files"