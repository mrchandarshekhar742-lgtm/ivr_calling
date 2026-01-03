# 📱 Android APK Build & Deployment Guide

## 🚀 Build APK for WhatsApp Sharing

### Quick Build Commands:

```bash
# Navigate to Android app directory
cd IVRCallManager

# Install dependencies (if not done)
npm install

# Build Debug APK (for testing/sharing)
npm run build-apk

# Build Release APK (for production)
npm run build-apk-release
```

### 📁 APK Location:
After building, APK files will be located at:
- **Debug APK**: `IVRCallManager/android/app/build/outputs/apk/debug/app-debug.apk`
- **Release APK**: `IVRCallManager/android/app/build/outputs/apk/release/app-release.apk`

## 📲 Share APK via WhatsApp:

### Method 1: Direct File Share
1. Build APK using above commands
2. Navigate to APK location
3. Right-click on `app-debug.apk`
4. Select "Share" → "WhatsApp"
5. Choose contact/group to share

### Method 2: Upload to Cloud
1. Upload APK to Google Drive/Dropbox
2. Share download link via WhatsApp
3. Recipients can download and install

## 🔧 App Configuration for Users:

### Default Server Settings:
- **Server URL**: `http://192.168.1.45:5000` (update with your IP)
- **Default Login**: `demo@example.com` / `password123`

### User Setup Instructions:
1. **Install APK** on Android device
2. **Grant Permissions** when prompted:
   - Phone calls
   - Microphone
   - Storage
   - Contacts
3. **Update Server URL**:
   - Replace `192.168.1.45` with your computer's IP
   - Use format: `http://YOUR_IP:5000`
4. **Login** with credentials
5. **Connect to Server**

## 🌐 Server IP Configuration:

### Find Your Computer's IP:
```bash
# Windows
ipconfig

# Look for "IPv4 Address" under your network adapter
# Example: 192.168.1.100
```

### Update App Configuration:
1. Open app
2. Go to "Server Settings"
3. Update "Server URL" to: `http://YOUR_IP:5000`
4. Save settings
5. Test connection

## 🔒 App Security & Permissions:

### Required Permissions:
- **CALL_PHONE**: Make outgoing calls
- **RECORD_AUDIO**: Record call audio
- **READ_PHONE_STATE**: Monitor call status
- **READ_CONTACTS**: Access contact list
- **READ_CALL_LOG**: Track call history
- **INTERNET**: Connect to server
- **ACCESS_NETWORK_STATE**: Check network status

### Security Features:
- JWT token authentication
- Encrypted communication with server
- Device registration and verification
- Secure Socket.IO connection

## 📊 App Features:

### Core Functionality:
- **Server Connection**: Connect to IVR management server
- **Authentication**: Login with user credentials
- **Device Registration**: Register device with server
- **Campaign Assignment**: Receive campaign assignments
- **Real-time Communication**: Socket.IO for live updates
- **Call Management**: Handle IVR calls automatically
- **Status Monitoring**: Track connection and call status

### User Interface:
- **Login Screen**: Secure authentication
- **Settings Panel**: Configure server and device details
- **Status Dashboard**: View connection and device status
- **Controls**: Connect/disconnect, test connection
- **Instructions**: Built-in setup guide

## 🚀 Production Deployment:

### For VPS Deployment:
1. **Update Server URL** in app to VPS IP/domain
2. **Build Release APK** with production settings
3. **Test thoroughly** before distribution
4. **Sign APK** for Play Store (optional)

### Environment-specific Builds:
```bash
# Development (local testing)
npm run build-apk

# Production (VPS deployment)
# Update server URL in App.tsx first, then:
npm run build-apk-release
```

## 📱 Installation Instructions for Users:

### Step 1: Enable Unknown Sources
1. Go to **Settings** → **Security**
2. Enable **"Unknown Sources"** or **"Install from Unknown Sources"**
3. Allow installation from browser/file manager

### Step 2: Install APK
1. Download APK file
2. Tap on APK file
3. Tap **"Install"**
4. Wait for installation to complete

### Step 3: Setup App
1. Open **"IVR Call Manager"** app
2. Grant all requested permissions
3. Login with provided credentials
4. Update server URL to your server's IP
5. Save settings and connect

### Step 4: Test Connection
1. Tap **"Test Server Connection"**
2. Should show "Server is reachable"
3. Tap **"Connect to Server"**
4. Should show "Connected" status

## 🔧 Troubleshooting:

### Common Issues:

#### "Cannot reach server"
- Check if backend server is running
- Verify IP address is correct
- Ensure phone and computer are on same network
- Check firewall settings

#### "Authentication Failed"
- Verify login credentials
- Check if user account exists in system
- Ensure server is accepting connections

#### "Connection Lost"
- Check network stability
- Verify server is still running
- Try reconnecting

#### "Permissions Denied"
- Go to App Settings → Permissions
- Enable all required permissions
- Restart app

### Debug Steps:
1. **Check Server Status**: Visit `http://YOUR_IP:5000/health`
2. **Verify Network**: Ping server from phone's browser
3. **Check Logs**: Monitor server logs for connection attempts
4. **Test API**: Try login from browser: `http://YOUR_IP:5000/api/auth/login`

## 📋 Pre-built APK Checklist:

Before sharing APK, ensure:
- [ ] Server URL is correctly configured
- [ ] App builds without errors
- [ ] All permissions are properly declared
- [ ] Login credentials are set
- [ ] Connection testing works
- [ ] UI is responsive and user-friendly
- [ ] Error handling is implemented
- [ ] Instructions are clear and complete

## 🎯 Distribution Strategy:

### For Team/Internal Use:
1. Build debug APK
2. Share via WhatsApp/Telegram
3. Provide setup instructions
4. Offer support for installation

### For Client Deployment:
1. Build release APK
2. Test thoroughly
3. Create installation guide
4. Provide technical support
5. Consider Play Store publishing

---

## 🚀 Quick Start Commands:

```bash
# Build APK for sharing
cd IVRCallManager
npm run build-apk

# APK will be at:
# IVRCallManager/android/app/build/outputs/apk/debug/app-debug.apk

# Share this file via WhatsApp or upload to cloud storage
```

**Your Android APK is ready for distribution!** 📱✅