#!/bin/bash

echo "🚀 Quick Fix for 500 Internal Server Error"
echo "=========================================="

cd ~/ivr_calling

echo "1️⃣ Stopping PM2 processes..."
pm2 delete all

echo "2️⃣ Checking and creating database..."
mysql -u root -p << 'EOF'
CREATE DATABASE IF NOT EXISTS ivr_system_prod CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'ivr_user'@'localhost' IDENTIFIED BY 'IVR_wxon_2024_SecurePass!';
GRANT ALL PRIVILEGES ON ivr_system_prod.* TO 'ivr_user'@'localhost';
FLUSH PRIVILEGES;
EOF

echo "3️⃣ Installing backend dependencies..."
cd backend
npm install

echo "4️⃣ Testing database connection..."
node -e "
const { connectDB } = require('./src/config/database');
connectDB().then(() => {
  console.log('✅ Database connected');
  process.exit(0);
}).catch(err => {
  console.log('❌ Database failed:', err.message);
  process.exit(1);
});
"

echo "5️⃣ Testing User model..."
node -e "
try {
  const { User } = require('./src/models');
  console.log('✅ User model loaded');
} catch (err) {
  console.log('❌ User model error:', err.message);
}
"

echo "6️⃣ Starting backend..."
pm2 start server.js --name "ivr-backend" --env production

echo "7️⃣ Waiting for backend to start..."
sleep 10

echo "8️⃣ Testing backend health..."
curl -f http://localhost:5000/health && echo "✅ Backend healthy" || echo "❌ Backend unhealthy"

echo "9️⃣ Testing registration endpoint..."
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Test",
    "lastName": "User",
    "email": "test@example.com",
    "password": "password123",
    "phone": "1234567890"
  }' && echo "✅ Registration working" || echo "❌ Registration failed"

echo "🔟 Starting frontend..."
cd ../frontend
npm run build
pm2 serve build 3000 --name "ivr-frontend" --spa

pm2 save

echo ""
echo "✅ Quick fix completed!"
echo "Check status: pm2 status"
echo "Check logs: pm2 logs"
echo "Test site: https://ivr.wxon.in"