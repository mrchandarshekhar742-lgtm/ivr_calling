#!/bin/bash

echo "🔧 Fixing IVR Website - Safe Mode"
echo "================================="

# 1. Deploy frontend
echo "📦 Deploying frontend..."
cd /var/www/ivr-platform/ivr_calling/frontend
cp -r build/* /var/www/html/ivr/
echo "✅ Frontend deployed"

# 2. Fix nginx config for API routing
echo "🌐 Fixing nginx API routing..."
if ! grep -q "location /api/" /etc/nginx/sites-available/ivr.wxon.in; then
    sed -i '/location \/ {/i\    # API routes\n    location /api/ {\n        proxy_pass http://localhost:8090;\n        proxy_set_header Host $host;\n        proxy_set_header X-Real-IP $remote_addr;\n        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;\n        proxy_set_header X-Forwarded-Proto $scheme;\n    }\n' /etc/nginx/sites-available/ivr.wxon.in
    echo "✅ API routing added to nginx"
else
    echo "✅ API routing already exists"
fi

# 3. Test and reload nginx
echo "🔄 Testing nginx config..."
if nginx -t; then
    systemctl reload nginx
    echo "✅ Nginx reloaded"
else
    echo "❌ Nginx config error"
    exit 1
fi

# 4. Check backend status
echo "🔍 Checking backend status..."
if pm2 list | grep -q "ivr-backend-8090.*online"; then
    echo "✅ Backend is running"
else
    echo "⚠️ Starting backend..."
    cd /var/www/ivr-platform/ivr_calling/backend
    pm2 restart ivr-backend-8090 || pm2 start server.js --name "ivr-backend-8090"
fi

# 5. Test everything
echo "🧪 Testing website..."
echo "Frontend: $(curl -s -o /dev/null -w "%{http_code}" https://ivr.wxon.in)"
echo "API Health: $(curl -s -o /dev/null -w "%{http_code}" https://ivr.wxon.in/api/health)"
echo "API Devices: $(curl -s -o /dev/null -w "%{http_code}" https://ivr.wxon.in/api/devices)"

echo ""
echo "🎉 IVR Website Fix Complete!"
echo "Visit: https://ivr.wxon.in"
echo "Login: admin@ivr.com / admin123"