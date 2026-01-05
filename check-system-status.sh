#!/bin/bash

echo "📊 IVR System Status Check"
echo "========================="

echo ""
echo "🌐 WEBSITE STATUS:"
echo "-------------------"
echo -n "wxon.in: "
curl -s -o /dev/null -w "%{http_code}" http://wxon.in
echo ""

echo -n "ivr.wxon.in (HTTP): "
curl -s -o /dev/null -w "%{http_code}" http://ivr.wxon.in
echo ""

echo -n "ivr.wxon.in (HTTPS): "
curl -s -o /dev/null -w "%{http_code}" https://ivr.wxon.in 2>/dev/null || echo "Not available"
echo ""

echo ""
echo "🔧 SERVICES STATUS:"
echo "-------------------"
echo "Nginx:"
sudo systemctl is-active nginx
echo ""

echo "PM2 Processes:"
pm2 status
echo ""

echo ""
echo "🔌 PORT STATUS:"
echo "---------------"
echo "Port 8090 (Backend):"
netstat -tlnp | grep :8090 || echo "Not listening"

echo "Port 3000 (Frontend):"
netstat -tlnp | grep :3000 || echo "Not listening"

echo "Port 80 (HTTP):"
netstat -tlnp | grep :80 || echo "Not listening"

echo "Port 443 (HTTPS):"
netstat -tlnp | grep :443 || echo "Not listening"

echo ""
echo "📁 SSL CERTIFICATES:"
echo "--------------------"
if [ -d "/etc/letsencrypt/live/ivr.wxon.in" ]; then
    echo "✅ SSL certificate exists for ivr.wxon.in"
    sudo certbot certificates | grep ivr.wxon.in
else
    echo "❌ No SSL certificate found for ivr.wxon.in"
fi

echo ""
echo "📋 NGINX CONFIGURATION:"
echo "-----------------------"
echo "Available sites:"
ls -la /etc/nginx/sites-available/ | grep ivr

echo "Enabled sites:"
ls -la /etc/nginx/sites-enabled/ | grep ivr

echo ""
echo "🔍 RECENT LOGS:"
echo "---------------"
echo "Nginx error log (last 5 lines):"
sudo tail -5 /var/log/nginx/error.log

echo ""
echo "Backend logs (last 5 lines):"
pm2 logs ivr-backend --lines 5 --nostream

echo ""
echo "✅ Status check completed!"