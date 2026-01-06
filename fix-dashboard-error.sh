#!/bin/bash

echo "🔧 Fixing Dashboard Error - Analytics Syntax Issue"
echo "=================================================="

# Navigate to backend directory
cd backend

echo "📁 Current directory: $(pwd)"

# Run the fix script
echo "🔧 Running analytics syntax fix..."
node fix-analytics-syntax.js

echo ""
echo "🔄 Restarting backend service..."
pm2 restart ivr-backend-8090

echo ""
echo "⏳ Waiting 3 seconds for restart..."
sleep 3

echo ""
echo "📋 Checking backend status..."
pm2 status

echo ""
echo "📝 Checking recent logs..."
pm2 logs ivr-backend-8090 --lines 5

echo ""
echo "🧪 Testing analytics endpoint..."
curl -s http://localhost:8090/api/analytics/test | jq '.' || curl -s http://localhost:8090/api/analytics/test

echo ""
echo "✅ Fix completed! Dashboard should now work properly."
echo ""
echo "If dashboard still doesn't work:"
echo "1. Check frontend build: cd frontend && npm run build"
echo "2. Clear browser cache and refresh"
echo "3. Check browser console for any remaining errors"