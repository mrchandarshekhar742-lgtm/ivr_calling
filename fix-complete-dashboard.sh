#!/bin/bash

echo "🚀 Complete Dashboard Fix Script"
echo "================================"
echo "This script will fix both backend and frontend issues"
echo ""

# Step 1: Fix Backend Analytics Syntax Error
echo "🔧 STEP 1: Fixing Backend Analytics Syntax Error"
echo "================================================"
cd backend
node fix-analytics-syntax.js

echo ""
echo "🔄 Restarting backend..."
pm2 restart ivr-backend-8090
sleep 3

echo ""
echo "📋 Backend status:"
pm2 status | grep ivr-backend-8090

echo ""
echo "🧪 Testing backend..."
curl -s http://localhost:8090/health | jq '.' || curl -s http://localhost:8090/health
curl -s http://localhost:8090/api/analytics/test | jq '.' || curl -s http://localhost:8090/api/analytics/test

# Step 2: Fix Frontend Build Issues
echo ""
echo "🔧 STEP 2: Fixing Frontend Build Issues"
echo "======================================="
cd ../frontend

echo "🧹 Cleaning frontend dependencies..."
rm -rf node_modules package-lock.json

echo "📦 Reinstalling dependencies..."
npm install

echo "🔍 Verifying critical dependencies..."
if [ -d "node_modules/@tanstack/react-query" ]; then
    echo "✅ @tanstack/react-query is available"
else
    echo "❌ Installing @tanstack/react-query..."
    npm install @tanstack/react-query@^4.36.1
fi

echo ""
echo "🏗️ Building frontend..."
GENERATE_SOURCEMAP=false npm run build

if [ $? -eq 0 ]; then
    echo "✅ Frontend build successful!"
else
    echo "❌ Frontend build failed - checking for import issues..."
    
    # Check for problematic imports
    echo "Checking for old react-query imports..."
    find src/ -name "*.js" -o -name "*.jsx" -o -name "*.ts" -o -name "*.tsx" | xargs grep -l "from 'react-query'" || echo "No old imports found"
    
    echo "Checking @tanstack/react-query imports..."
    find src/ -name "*.js" -o -name "*.jsx" -o -name "*.ts" -o -name "*.tsx" | xargs grep -l "from '@tanstack/react-query'" || echo "No @tanstack imports found"
    
    exit 1
fi

# Step 3: Final Verification
echo ""
echo "🔧 STEP 3: Final Verification"
echo "============================="

echo "🧪 Testing complete system..."
cd ../backend
node test-dashboard-fix.js

echo ""
echo "🎉 COMPLETE DASHBOARD FIX FINISHED!"
echo "==================================="
echo ""
echo "✅ What was fixed:"
echo "  - Backend analytics.js syntax error (duplicate catch blocks)"
echo "  - Frontend build dependencies (@tanstack/react-query)"
echo "  - Backend service restarted"
echo "  - Frontend rebuilt with clean dependencies"
echo ""
echo "🌐 Next steps:"
echo "  1. Clear browser cache (Ctrl+Shift+R or Cmd+Shift+R)"
echo "  2. Try logging in again at https://ivr.wxon.in"
echo "  3. Dashboard should now load properly"
echo ""
echo "🔍 If issues persist:"
echo "  - Check browser console for errors"
echo "  - Verify nginx is serving the new frontend build"
echo "  - Check pm2 logs: pm2 logs ivr-backend-8090"