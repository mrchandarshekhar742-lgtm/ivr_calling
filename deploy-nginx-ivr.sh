#!/bin/bash

# Deploy Nginx Configuration for IVR System
# This script safely deploys nginx config without affecting other websites

set -e

echo "🚀 Deploying Nginx Configuration for IVR System..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
NGINX_SITES_AVAILABLE="/etc/nginx/sites-available"
NGINX_SITES_ENABLED="/etc/nginx/sites-enabled"
CONFIG_NAME="ivr.wxon.in"
BACKUP_DIR="/root/nginx-backups"

echo -e "${YELLOW}📋 Configuration Details:${NC}"
echo "  Domain: ivr.wxon.in"
echo "  Backend Port: 8090"
echo "  Frontend Path: /var/www/html/ivr/"
echo "  Config File: $CONFIG_NAME"
echo ""

# Step 1: Create backup directory
echo -e "${YELLOW}📁 Step 1: Creating backup directory...${NC}"
mkdir -p $BACKUP_DIR
echo "✅ Backup directory created: $BACKUP_DIR"

# Step 2: Backup existing config if it exists
echo -e "${YELLOW}💾 Step 2: Backing up existing configuration...${NC}"
if [ -f "$NGINX_SITES_AVAILABLE/$CONFIG_NAME" ]; then
    cp "$NGINX_SITES_AVAILABLE/$CONFIG_NAME" "$BACKUP_DIR/${CONFIG_NAME}.backup.$(date +%Y%m%d_%H%M%S)"
    echo "✅ Existing config backed up"
else
    echo "ℹ️  No existing config found"
fi

# Step 3: Copy new configuration
echo -e "${YELLOW}📝 Step 3: Installing new configuration...${NC}"
cp nginx-ivr-complete.conf "$NGINX_SITES_AVAILABLE/$CONFIG_NAME"
echo "✅ New configuration installed"

# Step 4: Test nginx configuration
echo -e "${YELLOW}🧪 Step 4: Testing nginx configuration...${NC}"
if nginx -t; then
    echo -e "${GREEN}✅ Nginx configuration test passed${NC}"
else
    echo -e "${RED}❌ Nginx configuration test failed${NC}"
    echo "Restoring backup..."
    if [ -f "$BACKUP_DIR/${CONFIG_NAME}.backup.*" ]; then
        cp "$BACKUP_DIR/${CONFIG_NAME}.backup.*" "$NGINX_SITES_AVAILABLE/$CONFIG_NAME"
        echo "Backup restored"
    fi
    exit 1
fi

# Step 5: Enable site
echo -e "${YELLOW}🔗 Step 5: Enabling site...${NC}"
if [ ! -L "$NGINX_SITES_ENABLED/$CONFIG_NAME" ]; then
    ln -s "$NGINX_SITES_AVAILABLE/$CONFIG_NAME" "$NGINX_SITES_ENABLED/$CONFIG_NAME"
    echo "✅ Site enabled"
else
    echo "ℹ️  Site already enabled"
fi

# Step 6: Check if SSL certificates exist
echo -e "${YELLOW}🔒 Step 6: Checking SSL certificates...${NC}"
if [ -f "/etc/letsencrypt/live/ivr.wxon.in/fullchain.pem" ]; then
    echo "✅ SSL certificates found"
else
    echo -e "${YELLOW}⚠️  SSL certificates not found${NC}"
    echo "You may need to run: certbot --nginx -d ivr.wxon.in -d www.ivr.wxon.in"
fi

# Step 7: Reload nginx
echo -e "${YELLOW}🔄 Step 7: Reloading nginx...${NC}"
if systemctl reload nginx; then
    echo -e "${GREEN}✅ Nginx reloaded successfully${NC}"
else
    echo -e "${RED}❌ Failed to reload nginx${NC}"
    exit 1
fi

# Step 8: Test the deployment
echo -e "${YELLOW}🧪 Step 8: Testing deployment...${NC}"

echo "Testing frontend..."
FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://ivr.wxon.in || echo "000")
if [ "$FRONTEND_STATUS" = "200" ]; then
    echo "✅ Frontend accessible (200)"
else
    echo "⚠️  Frontend status: $FRONTEND_STATUS"
fi

echo "Testing API..."
API_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://ivr.wxon.in/api/health || echo "000")
if [ "$API_STATUS" = "200" ]; then
    echo "✅ API accessible (200)"
else
    echo "⚠️  API status: $API_STATUS"
fi

echo "Testing devices endpoint (should be 401)..."
DEVICES_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://ivr.wxon.in/api/devices || echo "000")
if [ "$DEVICES_STATUS" = "401" ]; then
    echo "✅ Devices API working correctly (401 - Unauthorized)"
elif [ "$DEVICES_STATUS" = "200" ]; then
    echo "⚠️  Devices API accessible without auth (200)"
else
    echo "❌ Devices API status: $DEVICES_STATUS"
fi

# Step 9: Show status
echo ""
echo -e "${GREEN}🎉 Nginx deployment completed!${NC}"
echo ""
echo -e "${YELLOW}📊 Status Summary:${NC}"
echo "  Frontend: https://ivr.wxon.in → $FRONTEND_STATUS"
echo "  API Health: https://ivr.wxon.in/api/health → $API_STATUS"
echo "  API Devices: https://ivr.wxon.in/api/devices → $DEVICES_STATUS"
echo ""
echo -e "${YELLOW}📋 Next Steps:${NC}"
echo "1. Clear browser cache and test: https://ivr.wxon.in"
echo "2. Check browser console for errors"
echo "3. Test login functionality"
echo "4. Monitor nginx logs: tail -f /var/log/nginx/ivr.wxon.in.error.log"
echo ""
echo -e "${YELLOW}🔧 Useful Commands:${NC}"
echo "  Check nginx status: systemctl status nginx"
echo "  View nginx logs: tail -f /var/log/nginx/ivr.wxon.in.access.log"
echo "  Test nginx config: nginx -t"
echo "  Reload nginx: systemctl reload nginx"
echo ""
echo -e "${GREEN}✅ Deployment successful!${NC}"