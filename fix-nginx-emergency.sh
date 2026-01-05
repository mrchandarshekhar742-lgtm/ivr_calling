#!/bin/bash

echo "🚨 EMERGENCY FIX - Restoring wxon.in and fixing Nginx"
echo "=================================================="

echo "1️⃣ Creating temporary HTTP-only config for ivr.wxon.in..."

# Create temporary HTTP-only config
sudo tee /etc/nginx/sites-available/ivr.wxon.in > /dev/null << 'EOF'
# Temporary HTTP-only configuration for ivr.wxon.in
# This will be updated with SSL after certificate is generated

server {
    listen 80;
    server_name ivr.wxon.in www.ivr.wxon.in;

    # Client max body size for file uploads
    client_max_body_size 50M;

    # API routes (Backend on port 8090)
    location /api/ {
        proxy_pass http://127.0.0.1:8090;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # Socket.IO for real-time updates
    location /socket.io/ {
        proxy_pass http://127.0.0.1:8090;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Health check endpoint
    location /health {
        proxy_pass http://127.0.0.1:8090;
        access_log off;
    }

    # Static files (React build)
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

echo "✅ Temporary config created!"

echo "2️⃣ Testing Nginx configuration..."
sudo nginx -t

if [ $? -eq 0 ]; then
    echo "✅ Nginx config is valid!"
    
    echo "3️⃣ Starting Nginx..."
    sudo systemctl start nginx
    
    echo "4️⃣ Checking Nginx status..."
    sudo systemctl status nginx --no-pager -l
    
    echo "5️⃣ Testing websites..."
    echo "Testing wxon.in..."
    curl -s -o /dev/null -w "wxon.in: %{http_code}\n" http://wxon.in
    
    echo "Testing ivr.wxon.in..."
    curl -s -o /dev/null -w "ivr.wxon.in: %{http_code}\n" http://ivr.wxon.in
    
    echo ""
    echo "🎉 EMERGENCY FIX COMPLETED!"
    echo "✅ wxon.in should be back online"
    echo "✅ ivr.wxon.in working on HTTP (temporary)"
    echo ""
    echo "📋 Next Steps:"
    echo "1. Verify wxon.in is working: http://wxon.in"
    echo "2. Test ivr.wxon.in: http://ivr.wxon.in"
    echo "3. Run SSL setup: ./setup-ssl-ivr.sh"
    
else
    echo "❌ Nginx config still has errors!"
    echo "Checking error details..."
    sudo nginx -t
fi