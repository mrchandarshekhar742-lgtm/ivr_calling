#!/bin/bash

echo "🔍 Checking Backend Error for 500 Internal Server Error"
echo "====================================================="

echo "1️⃣ Checking PM2 Status..."
pm2 status

echo ""
echo "2️⃣ Checking Backend Logs (Last 30 lines)..."
pm2 logs ivr-backend --lines 30

echo ""
echo "3️⃣ Testing Backend Direct Connection..."
echo "Health Check:"
curl -v http://localhost:5000/health 2>&1

echo ""
echo "4️⃣ Testing Registration Endpoint Directly..."
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Test",
    "lastName": "User", 
    "email": "test@example.com",
    "password": "password123",
    "phone": "1234567890"
  }' \
  -v 2>&1

echo ""
echo "5️⃣ Checking Database Connection..."
cd ~/ivr_calling/backend
node -e "
const { connectDB } = require('./src/config/database');
connectDB().then(() => {
  console.log('✅ Database connection successful');
  process.exit(0);
}).catch(err => {
  console.log('❌ Database connection failed:', err.message);
  console.log('Error details:', err);
  process.exit(1);
});
"

echo ""
echo "6️⃣ Checking Environment Variables..."
echo "NODE_ENV: $(grep NODE_ENV .env)"
echo "DB_HOST: $(grep DB_HOST .env)"
echo "DB_NAME: $(grep DB_NAME .env)"
echo "DB_USER: $(grep DB_USER .env)"
echo "JWT_SECRET exists: $(grep -q JWT_SECRET .env && echo 'Yes' || echo 'No')"

echo ""
echo "7️⃣ Checking if Database Exists..."
mysql -u ivr_user -p'IVR_wxon_2024_SecurePass!' -e "SHOW DATABASES;" 2>/dev/null | grep ivr_system_prod && echo "✅ Database exists" || echo "❌ Database missing"

echo ""
echo "8️⃣ Checking Node Modules..."
ls -la node_modules/bcryptjs > /dev/null 2>&1 && echo "✅ bcryptjs installed" || echo "❌ bcryptjs missing"
ls -la node_modules/sequelize > /dev/null 2>&1 && echo "✅ sequelize installed" || echo "❌ sequelize missing"
ls -la node_modules/mysql2 > /dev/null 2>&1 && echo "✅ mysql2 installed" || echo "❌ mysql2 missing"

echo ""
echo "9️⃣ Checking File Permissions..."
ls -la src/models/User.js
ls -la src/routes/auth.js

echo ""
echo "🔟 Testing User Model Import..."
node -e "
try {
  const { User } = require('./src/models');
  console.log('✅ User model imported successfully');
  console.log('User model fields:', Object.keys(User.rawAttributes));
} catch (err) {
  console.log('❌ User model import failed:', err.message);
  console.log('Error details:', err);
}
"