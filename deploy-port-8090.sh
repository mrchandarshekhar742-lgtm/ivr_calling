#!/bin/bash

echo "🚀 Deploying IVR System on Port 8090 - ivr.wxon.in"
echo "================================================="

DOMAIN="ivr.wxon.in"
BACKEND_PORT="8090"
FRONTEND_PORT="3000"
PROJECT_DIR="/home/ubuntu/ivr_calling"

echo "📋 Configuration:"
echo "Domain: $DOMAIN"
echo "Backend Port: $BACKEND_PORT"
echo "Frontend Port: $FRONTEND_PORT"
echo "Project Directory: $PROJECT_DIR"
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Stop existing PM2 processes
echo "1️⃣ Stopping existing PM2 processes..."
pm2 delete all || true

# Create necessary directories
echo "2️⃣ Creating directories..."
mkdir -p logs uploads/audio

# Set permissions
chmod 755 logs uploads
chmod -R 755 uploads/audio

# Database setup
echo "3️⃣ Setting up database..."
mysql -u root -p << 'EOF'
CREATE DATABASE IF NOT EXISTS ivr_system_prod CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'ivr_user'@'localhost' IDENTIFIED BY 'IVR_wxon_2024_SecurePass!';
GRANT ALL PRIVILEGES ON ivr_system_prod.* TO 'ivr_user'@'localhost';
FLUSH PRIVILEGES;
EOF

echo "✅ Database setup completed!"

# Backend setup
echo "4️⃣ Setting up backend..."
cd backend

# Install dependencies
npm install --production

# Backend environment is already updated to port 8090
echo "Backend will run on port: $BACKEND_PORT"

echo "✅ Backend setup completed!"

# Frontend setup
echo "5️⃣ Setting up frontend..."
cd ../frontend

# Install dependencies
npm install

# Build for production
npm run build

echo "✅ Frontend build completed!"

# Nginx configuration
echo "6️⃣ Setting up Nginx..."
cd ..

# Copy nginx configuration for port 8090
sudo cp nginx-ivr-8090.conf /etc/nginx/sites-available/ivr.wxon.in

# Enable site
sudo ln -sf /etc/nginx/sites-available/ivr.wxon.in /etc/nginx/sites-enabled/

# Test nginx configuration
sudo nginx -t

echo "✅ Nginx configuration completed!"

# SSL Certificate setup (if not exists)
echo "7️⃣ Checking SSL certificate..."
if [ ! -f "/etc/letsencrypt/live/ivr.wxon.in/fullchain.pem" ]; then
    echo "Getting SSL certificate..."
    sudo certbot certonly --nginx -d ivr.wxon.in --non-interactive --agree-tos --email admin@wxon.in
else
    echo "SSL certificate already exists"
fi

echo "✅ SSL certificate ready!"

# PM2 setup
echo "8️⃣ Setting up PM2 processes..."

# Start backend on port 8090
cd backend
pm2 start server.js --name "ivr-backend-8090" --env production

# Start frontend on port 3000
cd ../frontend
pm2 serve build $FRONTEND_PORT --name "ivr-frontend" --spa

# Save PM2 configuration
pm2 save

echo "✅ PM2 processes started!"

# Restart Nginx
echo "9️⃣ Restarting Nginx..."
sudo systemctl restart nginx

# Firewall setup
echo "🔟 Configuring firewall..."
sudo ufw allow 'Nginx Full'
sudo ufw allow 22/tcp
sudo ufw allow $BACKEND_PORT/tcp
sudo ufw allow $FRONTEND_PORT/tcp
sudo ufw --force enable

echo "✅ Firewall configured!"

# Final checks
echo "1️⃣1️⃣ Running final checks..."

# Check PM2 status
echo "PM2 Status:"
pm2 status

# Check Nginx status
echo "Nginx Status:"
sudo systemctl status nginx --no-pager -l

# Test endpoints
echo "Testing endpoints..."
curl -s -o /dev/null -w "Backend Health (Port $BACKEND_PORT): %{http_code}\n" http://localhost:$BACKEND_PORT/health
curl -s -o /dev/null -w "Frontend (Port $FRONTEND_PORT): %{http_code}\n" http://localhost:$FRONTEND_PORT
curl -s -o /dev/null -w "Domain: %{http_code}\n" https://ivr.wxon.in

echo ""
echo "🎉 Deployment Summary:"
echo "===================="
echo "✅ Domain: https://ivr.wxon.in"
echo "✅ Backend API: https://ivr.wxon.in/api (Port $BACKEND_PORT)"
echo "✅ Frontend: Port $FRONTEND_PORT"
echo "✅ Database: MySQL (ivr_system_prod)"
echo "✅ SSL Certificate: Let's Encrypt"
echo "✅ Process Manager: PM2"
echo "✅ Web Server: Nginx"
echo ""
echo "📋 Management Commands:"
echo "- View logs: pm2 logs"
echo "- Restart backend: pm2 restart ivr-backend-8090"
echo "- Restart frontend: pm2 restart ivr-frontend"
echo "- Check status: pm2 status"
echo "- Nginx logs: sudo tail -f /var/log/nginx/access.log"
echo ""
echo "🎯 Your IVR system is live at: https://ivr.wxon.in"
echo "🔧 Backend running on port: $BACKEND_PORT"

# Save deployment info
cat > DEPLOYMENT_INFO_8090.txt << EOF
# IVR System Deployment Information - Port 8090

## Server Details
- Domain: ivr.wxon.in
- Backend Port: $BACKEND_PORT
- Frontend Port: $FRONTEND_PORT
- Deployment Date: $(date)
- Environment: Production
- Database: MySQL (ivr_system_prod)

## Access URLs
- Website: https://ivr.wxon.in
- API: https://ivr.wxon.in/api
- Health Check: https://ivr.wxon.in/health
- Backend Direct: http://localhost:$BACKEND_PORT
- Frontend Direct: http://localhost:$FRONTEND_PORT

## File Locations
- Project: /home/ubuntu/ivr_calling
- Nginx Config: /etc/nginx/sites-available/ivr.wxon.in
- SSL Certificates: /etc/letsencrypt/live/ivr.wxon.in/
- Logs: /home/ubuntu/ivr_calling/logs/

## Management Commands
- PM2 Status: pm2 status
- PM2 Logs: pm2 logs
- Backend Restart: pm2 restart ivr-backend-8090
- Frontend Restart: pm2 restart ivr-frontend
- Nginx Restart: sudo systemctl restart nginx
- SSL Renewal: sudo certbot renew

## Database Access
- Host: localhost
- Database: ivr_system_prod
- User: ivr_user
- Password: IVR_wxon_2024_SecurePass!

## Port Configuration
- Backend: $BACKEND_PORT
- Frontend: $FRONTEND_PORT
- Nginx: 80, 443
- MySQL: 3306

## Backup Commands
- Database: mysqldump -u ivr_user -p ivr_system_prod > backup.sql
- Files: tar -czf backup.tar.gz /home/ubuntu/ivr_calling
EOF

echo "📄 Deployment information saved to DEPLOYMENT_INFO_8090.txt"