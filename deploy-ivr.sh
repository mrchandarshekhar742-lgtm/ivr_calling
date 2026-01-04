#!/bin/bash

# IVR Call Management System - Production Deployment for ivr.wxon.in
# Usage: ./deploy-ivr.sh

set -e

echo "🚀 Deploying IVR System to ivr.wxon.in"
echo "======================================"

DOMAIN="ivr.wxon.in"
PROJECT_DIR="/home/ubuntu/ivr_calling"

echo "📋 Configuration:"
echo "Domain: $DOMAIN"
echo "Project Directory: $PROJECT_DIR"
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p logs uploads/audio

# Set permissions
chmod 755 logs uploads
chmod -R 755 uploads/audio

# Database setup
echo "🗄️ Setting up database..."
mysql -u root -p << EOF
CREATE DATABASE IF NOT EXISTS ivr_system_prod CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'ivr_user'@'localhost' IDENTIFIED BY 'IVR_wxon_2024_SecurePass!';
GRANT ALL PRIVILEGES ON ivr_system_prod.* TO 'ivr_user'@'localhost';
FLUSH PRIVILEGES;
EOF

echo "✅ Database setup completed!"

# Backend setup
echo "🔧 Setting up backend..."
cd backend

# Install dependencies
npm install --production

# Copy production environment
cp .env.production .env

# Update database password in .env
sed -i 's/your_secure_database_password_here/IVR_wxon_2024_SecurePass!/g' .env

echo "✅ Backend setup completed!"

# Frontend setup
echo "🎨 Setting up frontend..."
cd ../frontend

# Install dependencies
npm install

# Copy production environment
cp .env.production .env

# Build for production
npm run build

echo "✅ Frontend build completed!"

# Nginx configuration
echo "🌐 Setting up Nginx..."
cd ..

# Copy nginx configuration
sudo cp nginx-ivr.conf /etc/nginx/sites-available/ivr.wxon.in

# Enable site
sudo ln -sf /etc/nginx/sites-available/ivr.wxon.in /etc/nginx/sites-enabled/

# Test nginx configuration
sudo nginx -t

echo "✅ Nginx configuration completed!"

# SSL Certificate setup
echo "🔒 Setting up SSL certificate..."
sudo certbot certonly --nginx -d ivr.wxon.in --non-interactive --agree-tos --email admin@wxon.in

echo "✅ SSL certificate obtained!"

# PM2 setup
echo "⚡ Setting up PM2 processes..."

# Stop existing processes
pm2 delete all || true

# Start backend
cd backend
pm2 start server.js --name "ivr-backend" --env production

# Start frontend (serve static files)
cd ../frontend
pm2 serve build 3000 --name "ivr-frontend" --spa

# Save PM2 configuration
pm2 save

echo "✅ PM2 processes started!"

# Restart Nginx
echo "🔄 Restarting Nginx..."
sudo systemctl restart nginx

# Firewall setup
echo "🔥 Configuring firewall..."
sudo ufw allow 'Nginx Full'
sudo ufw allow 22/tcp
sudo ufw --force enable

echo "✅ Firewall configured!"

# Final checks
echo "🔍 Running final checks..."

# Check PM2 status
echo "PM2 Status:"
pm2 status

# Check Nginx status
echo "Nginx Status:"
sudo systemctl status nginx --no-pager -l

# Test endpoints
echo "Testing endpoints..."
curl -s -o /dev/null -w "%{http_code}" http://localhost:5000/health && echo " - Backend health check: OK"
curl -s -o /dev/null -w "%{http_code}" https://ivr.wxon.in && echo " - Frontend: OK"

echo ""
echo "🎉 Deployment Summary:"
echo "===================="
echo "✅ Domain: https://ivr.wxon.in"
echo "✅ Backend API: https://ivr.wxon.in/api"
echo "✅ Database: MySQL (ivr_system_prod)"
echo "✅ SSL Certificate: Let's Encrypt"
echo "✅ Process Manager: PM2"
echo "✅ Web Server: Nginx"
echo ""
echo "📋 Management Commands:"
echo "- View logs: pm2 logs"
echo "- Restart services: pm2 restart all"
echo "- Check status: pm2 status"
echo "- Nginx logs: sudo tail -f /var/log/nginx/access.log"
echo ""
echo "🎯 Your IVR system is live at: https://ivr.wxon.in"

# Save deployment info
cat > DEPLOYMENT_INFO.txt << EOF
# IVR System Deployment Information

## Server Details
- Domain: ivr.wxon.in
- Deployment Date: $(date)
- Environment: Production
- Database: MySQL (ivr_system_prod)

## Access URLs
- Website: https://ivr.wxon.in
- API: https://ivr.wxon.in/api
- Health Check: https://ivr.wxon.in/health

## File Locations
- Project: /home/ubuntu/ivr_calling
- Nginx Config: /etc/nginx/sites-available/ivr.wxon.in
- SSL Certificates: /etc/letsencrypt/live/ivr.wxon.in/
- Logs: /home/ubuntu/ivr_calling/logs/

## Management Commands
- PM2 Status: pm2 status
- PM2 Logs: pm2 logs
- PM2 Restart: pm2 restart all
- Nginx Restart: sudo systemctl restart nginx
- SSL Renewal: sudo certbot renew

## Database Access
- Host: localhost
- Database: ivr_system_prod
- User: ivr_user
- Password: IVR_wxon_2024_SecurePass!

## Backup Commands
- Database: mysqldump -u ivr_user -p ivr_system_prod > backup.sql
- Files: tar -czf backup.tar.gz /home/ubuntu/ivr_calling
EOF

echo "📄 Deployment information saved to DEPLOYMENT_INFO.txt"