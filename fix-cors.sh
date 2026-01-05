#!/bin/bash

echo "🔧 Fixing CORS issue for ivr.wxon.in"
echo "=================================="

# Update backend environment
echo "📝 Updating backend environment..."
cd ~/ivr_calling/backend

# Backup current .env
cp .env .env.backup

# Update .env with production values
cat > .env << EOF
NODE_ENV=production
PORT=5000
FRONTEND_URL=https://ivr.wxon.in

# Database Configuration - MySQL Production
DB_HOST=localhost
DB_PORT=3306
DB_NAME=ivr_system_prod
DB_USER=ivr_user
DB_PASSWORD=IVR_wxon_2024_SecurePass!

# JWT Configuration - Production Secrets
JWT_SECRET=ivr_wxon_super_secure_jwt_secret_key_2024_minimum_32_characters_long
JWT_EXPIRES_IN=24h
JWT_REFRESH_SECRET=ivr_wxon_super_secure_refresh_secret_2024_minimum_32_characters_long
JWT_REFRESH_EXPIRES_IN=7d

# File Upload Configuration
MAX_FILE_SIZE=50MB
UPLOAD_PATH=./uploads

# Logging Configuration
LOG_LEVEL=warn
LOG_FILE=./logs/app.log

# Security Configuration
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
CORS_ORIGIN=https://ivr.wxon.in

# Redis Configuration (Optional - for job queue)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
EOF

echo "✅ Backend environment updated!"

# Update frontend environment
echo "📝 Updating frontend environment..."
cd ../frontend

# Backup current .env
cp .env .env.backup

# Update .env with production values
cat > .env << EOF
REACT_APP_API_URL=https://ivr.wxon.in
REACT_APP_SOCKET_URL=https://ivr.wxon.in
REACT_APP_ENVIRONMENT=production
REACT_APP_DOMAIN=ivr.wxon.in
GENERATE_SOURCEMAP=false
EOF

echo "✅ Frontend environment updated!"

# Rebuild frontend
echo "🏗️ Rebuilding frontend..."
npm run build

echo "✅ Frontend rebuilt!"

# Restart PM2 processes
echo "🔄 Restarting PM2 processes..."
pm2 restart all

echo "✅ Services restarted!"

# Wait a moment for services to start
sleep 5

# Test the fix
echo "🧪 Testing CORS fix..."
echo "Testing backend health..."
curl -s https://ivr.wxon.in/health && echo " - Backend: ✅ OK" || echo " - Backend: ❌ Failed"

echo "Testing frontend..."
curl -s -o /dev/null -w "%{http_code}" https://ivr.wxon.in && echo " - Frontend: ✅ OK" || echo " - Frontend: ❌ Failed"

echo ""
echo "🎉 CORS fix completed!"
echo "📋 Changes made:"
echo "  - Backend FRONTEND_URL: https://ivr.wxon.in"
echo "  - Frontend API_URL: https://ivr.wxon.in"
echo "  - PM2 processes restarted"
echo "  - Frontend rebuilt"
echo ""
echo "🔍 Check PM2 status:"
pm2 status

echo ""
echo "📝 If still having issues, check logs:"
echo "  - PM2 logs: pm2 logs"
echo "  - Nginx logs: sudo tail -f /var/log/nginx/error.log"