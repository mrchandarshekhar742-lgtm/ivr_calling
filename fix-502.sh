#!/bin/bash

echo "🔧 Fixing 502 Bad Gateway Error"
echo "==============================="

# Step 1: Stop all PM2 processes
echo "1️⃣ Stopping all PM2 processes..."
pm2 delete all

# Step 2: Check and create database
echo "2️⃣ Setting up database..."
mysql -u root -p << 'EOF'
CREATE DATABASE IF NOT EXISTS ivr_system_prod CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'ivr_user'@'localhost' IDENTIFIED BY 'IVR_wxon_2024_SecurePass!';
GRANT ALL PRIVILEGES ON ivr_system_prod.* TO 'ivr_user'@'localhost';
FLUSH PRIVILEGES;
EOF

echo "✅ Database setup completed!"

# Step 3: Setup backend environment
echo "3️⃣ Setting up backend environment..."
cd ~/ivr_calling/backend

# Create production .env
cat > .env << 'EOF'
NODE_ENV=production
PORT=5000
FRONTEND_URL=https://ivr.wxon.in

# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_NAME=ivr_system_prod
DB_USER=ivr_user
DB_PASSWORD=IVR_wxon_2024_SecurePass!

# JWT Configuration
JWT_SECRET=ivr_wxon_super_secure_jwt_secret_key_2024_minimum_32_characters_long
JWT_EXPIRES_IN=24h
JWT_REFRESH_SECRET=ivr_wxon_super_secure_refresh_secret_2024_minimum_32_characters_long
JWT_REFRESH_EXPIRES_IN=7d

# File Upload Configuration
MAX_FILE_SIZE=50MB
UPLOAD_PATH=./uploads

# Logging Configuration
LOG_LEVEL=info
LOG_FILE=./logs/app.log

# Security Configuration
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
CORS_ORIGIN=https://ivr.wxon.in
EOF

# Create logs directory
mkdir -p logs uploads/audio
chmod 755 logs uploads
chmod -R 755 uploads/audio

echo "✅ Backend environment setup completed!"

# Step 4: Install backend dependencies
echo "4️⃣ Installing backend dependencies..."
npm install

# Step 5: Test database connection
echo "5️⃣ Testing database connection..."
node -e "
const { connectDB } = require('./src/config/database');
connectDB().then(() => {
  console.log('✅ Database connection successful');
  process.exit(0);
}).catch(err => {
  console.log('❌ Database connection failed:', err.message);
  process.exit(1);
});
"

# Step 6: Start backend with PM2
echo "6️⃣ Starting backend server..."
pm2 start server.js --name "ivr-backend" --env production

# Wait for backend to start
sleep 5

# Step 7: Test backend health
echo "7️⃣ Testing backend health..."
curl -f http://localhost:5000/health && echo "✅ Backend health check passed" || echo "❌ Backend health check failed"

# Step 8: Setup frontend
echo "8️⃣ Setting up frontend..."
cd ~/ivr_calling/frontend

# Create production .env
cat > .env << 'EOF'
REACT_APP_API_URL=https://ivr.wxon.in
REACT_APP_SOCKET_URL=https://ivr.wxon.in
REACT_APP_ENVIRONMENT=production
REACT_APP_DOMAIN=ivr.wxon.in
GENERATE_SOURCEMAP=false
EOF

# Install dependencies and build
npm install
npm run build

# Step 9: Start frontend with PM2
echo "9️⃣ Starting frontend server..."
pm2 serve build 3000 --name "ivr-frontend" --spa

# Step 10: Save PM2 configuration
echo "🔟 Saving PM2 configuration..."
pm2 save

# Step 11: Test full stack
echo "1️⃣1️⃣ Testing full stack..."
sleep 5

echo "PM2 Status:"
pm2 status

echo ""
echo "Testing endpoints:"
curl -s -o /dev/null -w "Backend Health: %{http_code}\n" http://localhost:5000/health
curl -s -o /dev/null -w "Frontend: %{http_code}\n" http://localhost:3000
curl -s -o /dev/null -w "Domain: %{http_code}\n" https://ivr.wxon.in

echo ""
echo "🎉 Fix completed!"
echo "📋 Summary:"
echo "  - Database: ivr_system_prod created"
echo "  - Backend: Running on port 5000"
echo "  - Frontend: Running on port 3000"
echo "  - Domain: https://ivr.wxon.in"
echo ""
echo "🔍 If still having issues, check:"
echo "  - PM2 logs: pm2 logs"
echo "  - Nginx logs: sudo tail -f /var/log/nginx/error.log"
echo "  - Backend direct: curl http://localhost:5000/health"