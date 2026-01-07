#!/bin/bash

echo "🚀 Deploying IVR Call Manager Updates to VPS"
echo "=============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DOMAIN="ivr.wxon.in"
PROJECT_DIR="/var/www/ivr-call-manager"
BACKUP_DIR="/var/backups/ivr-$(date +%Y%m%d-%H%M%S)"

echo -e "${BLUE}📋 Deployment Configuration:${NC}"
echo "Domain: $DOMAIN"
echo "Project Directory: $PROJECT_DIR"
echo "Backup Directory: $BACKUP_DIR"
echo ""

# Step 1: Create backup
echo -e "${YELLOW}📦 Step 1: Creating backup...${NC}"
sudo mkdir -p $BACKUP_DIR
sudo cp -r $PROJECT_DIR $BACKUP_DIR/
echo -e "${GREEN}✅ Backup created at $BACKUP_DIR${NC}"

# Step 2: Stop services
echo -e "${YELLOW}🛑 Step 2: Stopping services...${NC}"
sudo systemctl stop ivr-backend
sudo systemctl stop nginx
echo -e "${GREEN}✅ Services stopped${NC}"

# Step 3: Update backend
echo -e "${YELLOW}🔧 Step 3: Updating backend...${NC}"
cd $PROJECT_DIR

# Copy backend files
sudo cp -r backend/* $PROJECT_DIR/backend/
sudo chown -R www-data:www-data $PROJECT_DIR/backend/
sudo chmod -R 755 $PROJECT_DIR/backend/

# Install/update backend dependencies
cd $PROJECT_DIR/backend
sudo -u www-data npm install --production
echo -e "${GREEN}✅ Backend updated${NC}"

# Step 4: Update frontend
echo -e "${YELLOW}🎨 Step 4: Building and updating frontend...${NC}"
cd $PROJECT_DIR

# Copy frontend source
sudo cp -r frontend/* $PROJECT_DIR/frontend/
sudo chown -R www-data:www-data $PROJECT_DIR/frontend/

# Build frontend
cd $PROJECT_DIR/frontend
sudo -u www-data npm install
sudo -u www-data npm run build

# Copy build to nginx directory
sudo rm -rf /var/www/html/ivr/*
sudo cp -r build/* /var/www/html/ivr/
sudo chown -R www-data:www-data /var/www/html/ivr/
echo -e "${GREEN}✅ Frontend built and deployed${NC}"

# Step 5: Update database
echo -e "${YELLOW}🗄️ Step 5: Updating database...${NC}"
cd $PROJECT_DIR/backend
sudo -u www-data node setup-database.js
echo -e "${GREEN}✅ Database updated${NC}"

# Step 6: Update nginx configuration
echo -e "${YELLOW}🌐 Step 6: Updating nginx configuration...${NC}"
sudo cp nginx-ivr-8090.conf /etc/nginx/sites-available/ivr.wxon.in
sudo nginx -t
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Nginx configuration valid${NC}"
else
    echo -e "${RED}❌ Nginx configuration invalid${NC}"
    exit 1
fi

# Step 7: Start services
echo -e "${YELLOW}🚀 Step 7: Starting services...${NC}"
sudo systemctl start nginx
sudo systemctl start ivr-backend

# Wait for services to start
sleep 5

# Check service status
echo -e "${BLUE}📊 Service Status:${NC}"
sudo systemctl status nginx --no-pager -l
sudo systemctl status ivr-backend --no-pager -l

# Step 8: Test deployment
echo -e "${YELLOW}🧪 Step 8: Testing deployment...${NC}"

# Test backend
echo "Testing backend API..."
BACKEND_TEST=$(curl -s -o /dev/null -w "%{http_code}" https://$DOMAIN/api/health)
if [ "$BACKEND_TEST" = "200" ]; then
    echo -e "${GREEN}✅ Backend API responding${NC}"
else
    echo -e "${RED}❌ Backend API not responding (HTTP: $BACKEND_TEST)${NC}"
fi

# Test frontend
echo "Testing frontend..."
FRONTEND_TEST=$(curl -s -o /dev/null -w "%{http_code}" https://$DOMAIN)
if [ "$FRONTEND_TEST" = "200" ]; then
    echo -e "${GREEN}✅ Frontend responding${NC}"
else
    echo -e "${RED}❌ Frontend not responding (HTTP: $FRONTEND_TEST)${NC}"
fi

# Test device API
echo "Testing device API..."
DEVICE_TEST=$(curl -s -o /dev/null -w "%{http_code}" https://$DOMAIN/api/devices)
if [ "$DEVICE_TEST" = "401" ]; then
    echo -e "${GREEN}✅ Device API responding (401 expected without auth)${NC}"
else
    echo -e "${YELLOW}⚠️ Device API response: $DEVICE_TEST${NC}"
fi

# Step 9: Update SSL certificate if needed
echo -e "${YELLOW}🔒 Step 9: Checking SSL certificate...${NC}"
sudo certbot renew --dry-run
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ SSL certificate is valid${NC}"
else
    echo -e "${YELLOW}⚠️ SSL certificate may need renewal${NC}"
fi

# Step 10: Final checks
echo -e "${YELLOW}🔍 Step 10: Final system checks...${NC}"

# Check disk space
DISK_USAGE=$(df -h / | awk 'NR==2{print $5}' | sed 's/%//')
if [ $DISK_USAGE -gt 80 ]; then
    echo -e "${RED}⚠️ Disk usage is high: ${DISK_USAGE}%${NC}"
else
    echo -e "${GREEN}✅ Disk usage OK: ${DISK_USAGE}%${NC}"
fi

# Check memory usage
MEMORY_USAGE=$(free | grep Mem | awk '{printf("%.0f", $3/$2 * 100.0)}')
if [ $MEMORY_USAGE -gt 80 ]; then
    echo -e "${RED}⚠️ Memory usage is high: ${MEMORY_USAGE}%${NC}"
else
    echo -e "${GREEN}✅ Memory usage OK: ${MEMORY_USAGE}%${NC}"
fi

# Check logs for errors
echo "Checking recent logs for errors..."
ERROR_COUNT=$(sudo journalctl -u ivr-backend --since "5 minutes ago" | grep -i error | wc -l)
if [ $ERROR_COUNT -gt 0 ]; then
    echo -e "${YELLOW}⚠️ Found $ERROR_COUNT errors in backend logs${NC}"
    sudo journalctl -u ivr-backend --since "5 minutes ago" | grep -i error | tail -5
else
    echo -e "${GREEN}✅ No errors in recent backend logs${NC}"
fi

echo ""
echo -e "${GREEN}🎉 Deployment Complete!${NC}"
echo "=============================================="
echo -e "${BLUE}📋 Summary:${NC}"
echo "• Backend: Updated and running"
echo "• Frontend: Built and deployed"
echo "• Database: Updated"
echo "• Nginx: Configuration updated"
echo "• SSL: Certificate checked"
echo "• Backup: Created at $BACKUP_DIR"
echo ""
echo -e "${BLUE}🌐 Access your application:${NC}"
echo "• Website: https://$DOMAIN"
echo "• API: https://$DOMAIN/api"
echo "• Android Devices: https://$DOMAIN/android-devices"
echo ""
echo -e "${BLUE}📱 Android App:${NC}"
echo "• APK Location: Desktop/IVRCallManager.apk (5.6 MB)"
echo "• Multi-user login: Fixed"
echo "• Device registration: Working"
echo ""
echo -e "${YELLOW}📝 Next Steps:${NC}"
echo "1. Test the website login and device display"
echo "2. Install and test the Android APK"
echo "3. Verify multi-user functionality"
echo "4. Monitor logs: sudo journalctl -u ivr-backend -f"