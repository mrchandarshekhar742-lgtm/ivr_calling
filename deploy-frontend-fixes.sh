#!/bin/bash

echo "🚀 Deploying Frontend Fixes..."

# Build the frontend
echo "📦 Building frontend..."
cd frontend
npm run build

# Copy build to server
echo "📤 Uploading to server..."
scp -r -o HostKeyAlgorithms=+ssh-rsa -o PubkeyAcceptedKeyTypes=+ssh-rsa build/* root@66.116.196.226:/var/www/html/ivr/

echo "✅ Frontend deployed successfully!"
echo "🌐 Visit: https://ivr.wxon.in"