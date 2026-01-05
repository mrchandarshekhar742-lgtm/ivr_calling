#!/bin/bash

echo "🔒 Setting up SSL Certificate for ivr.wxon.in"
echo "============================================="

echo "1️⃣ Installing Certbot (if not already installed)..."
sudo apt update
sudo apt install -y certbot python3-certbot-nginx

echo "2️⃣ Generating SSL certificate for ivr.wxon.in..."
sudo certbot --nginx -d ivr.wxon.in -d www.ivr.wxon.in --non-interactive --agree-tos --email admin@wxon.in

if [ $? -eq 0 ]; then
    echo "✅ SSL certificate generated successfully!"
    
    echo "3️⃣ Updating Nginx configuration with full HTTPS setup..."
    sudo cp nginx-ivr-8090.conf /etc/nginx/sites-available/ivr.wxon.in
    
    echo "4️⃣ Testing Nginx configuration..."
    sudo nginx -t
    
    if [ $? -eq 0 ]; then
        echo "✅ Nginx config is valid!"
        
        echo "5️⃣ Reloading Nginx..."
        sudo systemctl reload nginx
        
        echo "6️⃣ Testing HTTPS..."
        curl -I https://ivr.wxon.in
        
        echo ""
        echo "🎉 SSL SETUP COMPLETED!"
        echo "✅ ivr.wxon.in now has HTTPS"
        echo "✅ HTTP traffic redirects to HTTPS"
        echo "✅ All security headers enabled"
        echo ""
        echo "🔗 Test your site: https://ivr.wxon.in"
        
    else
        echo "❌ Nginx config has errors!"
        sudo nginx -t
    fi
    
else
    echo "❌ SSL certificate generation failed!"
    echo "Please check:"
    echo "1. Domain DNS is pointing to this server"
    echo "2. Port 80 and 443 are open"
    echo "3. No other service is using port 80/443"
fi

echo ""
echo "📋 Certificate auto-renewal is enabled by default"
echo "Test renewal: sudo certbot renew --dry-run"