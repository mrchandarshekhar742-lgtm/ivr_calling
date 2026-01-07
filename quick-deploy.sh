#!/bin/bash

# Quick deployment script for VPS updates
echo "🚀 Quick Deploy to VPS"
echo "======================"

# Upload and deploy in one command
rsync -avz --exclude 'node_modules' --exclude '.git' --exclude 'IVRCallManagerNative' . root@your-vps-ip:/tmp/ivr-update/

ssh root@your-vps-ip << 'EOF'
cd /tmp/ivr-update

# Stop services
systemctl stop ivr-backend
systemctl stop nginx

# Update backend
cp -r backend/* /var/www/ivr-call-manager/backend/
cd /var/www/ivr-call-manager/backend
npm install --production

# Update frontend
cp -r frontend/* /var/www/ivr-call-manager/frontend/
cd /var/www/ivr-call-manager/frontend
npm install
npm run build
cp -r build/* /var/www/html/ivr/

# Update nginx config
cp /tmp/ivr-update/nginx-ivr-8090.conf /etc/nginx/sites-available/ivr.wxon.in
nginx -t

# Start services
systemctl start nginx
systemctl start ivr-backend

# Test
curl -s https://ivr.wxon.in/api/health
echo "Deployment complete!"
EOF