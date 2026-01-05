#!/bin/bash

echo "🔍 Debugging 502 Bad Gateway Error"
echo "=================================="

echo "1️⃣ Checking PM2 Status..."
pm2 status

echo ""
echo "2️⃣ Checking Backend Logs..."
pm2 logs ivr-backend --lines 20

echo ""
echo "3️⃣ Checking Port 5000..."
sudo netstat -tulpn | grep :5000

echo ""
echo "4️⃣ Testing Backend Direct Connection..."
curl -v http://localhost:5000/health

echo ""
echo "5️⃣ Checking Backend Environment..."
cd ~/ivr_calling/backend
echo "NODE_ENV: $(grep NODE_ENV .env)"
echo "PORT: $(grep PORT .env)"
echo "DB_HOST: $(grep DB_HOST .env)"

echo ""
echo "6️⃣ Testing Database Connection..."
mysql -u ivr_user -p'IVR_wxon_2024_SecurePass!' -e "SELECT 1;" ivr_system_prod 2>/dev/null && echo "✅ Database: Connected" || echo "❌ Database: Failed"

echo ""
echo "7️⃣ Checking Nginx Configuration..."
sudo nginx -t

echo ""
echo "8️⃣ Checking Nginx Logs..."
sudo tail -n 10 /var/log/nginx/error.log

echo ""
echo "9️⃣ System Resources..."
echo "Memory Usage:"
free -h
echo "Disk Usage:"
df -h

echo ""
echo "🔟 Process Information..."
ps aux | grep node