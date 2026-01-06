#!/bin/bash

echo "🔧 Fixing Frontend Build Issues"
echo "==============================="

# Navigate to frontend directory
cd frontend

echo "📁 Current directory: $(pwd)"

echo ""
echo "🧹 Cleaning node_modules and package-lock..."
rm -rf node_modules package-lock.json

echo ""
echo "📦 Installing dependencies..."
npm install

echo ""
echo "🔍 Verifying @tanstack/react-query installation..."
if [ -d "node_modules/@tanstack/react-query" ]; then
    echo "✅ @tanstack/react-query is installed"
else
    echo "❌ @tanstack/react-query not found, installing manually..."
    npm install @tanstack/react-query@^4.36.1
fi

echo ""
echo "🏗️ Building frontend..."
GENERATE_SOURCEMAP=false npm run build

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Frontend build successful!"
    echo ""
    echo "📋 Build summary:"
    ls -la build/
    echo ""
    echo "🌐 Frontend is ready for deployment"
else
    echo ""
    echo "❌ Frontend build failed!"
    echo ""
    echo "🔍 Checking for common issues..."
    
    # Check if react-query imports are correct
    echo "Checking for old react-query imports..."
    grep -r "from 'react-query'" src/ || echo "No old react-query imports found"
    
    # Check if @tanstack/react-query imports are correct
    echo "Checking @tanstack/react-query imports..."
    grep -r "from '@tanstack/react-query'" src/ || echo "No @tanstack/react-query imports found"
    
    exit 1
fi