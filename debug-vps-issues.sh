#!/bin/bash

echo "🔍 Debugging VPS API Issues"
echo "=========================="

echo ""
echo "1. Checking PM2 logs..."
pm2 logs ivr-backend-8090 --lines 50

echo ""
echo "2. Checking if backend is responding..."
curl -s http://localhost:8090/health || echo "Backend not responding on port 8090"

echo ""
echo "3. Checking process status..."
pm2 status

echo ""
echo "4. Testing individual API endpoints..."
echo "Testing campaigns endpoint:"
curl -s -H "Authorization: Bearer test" http://localhost:8090/api/campaigns || echo "Campaigns API failed"

echo ""
echo "Testing devices endpoint:"
curl -s -H "Authorization: Bearer test" http://localhost:8090/api/devices || echo "Devices API failed"

echo ""
echo "5. Checking for syntax errors in routes..."
node -c /var/www/ivr-platform/ivr_calling/backend/src/routes/campaigns.js
node -c /var/www/ivr-platform/ivr_calling/backend/src/routes/devices.js
node -c /var/www/ivr-platform/ivr_calling/backend/src/routes/analytics.js

echo ""
echo "Debug complete!"