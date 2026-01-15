# Android APK Installation Guide

## 📱 **Current APK File**

### **`ivr-manager-audio-fixed.apk`** ← **Latest Version**
- Size: 8.86 MB
- **Audio Routing Fixed**: Audio plays to target number, not caller phone
- Enhanced permissions for proper call audio
- **Use this version!**

## Installation Steps

### 1. Enable Unknown Sources
```
Android Settings → Security → Unknown Sources → Enable
या
Settings → Apps → Special Access → Install Unknown Apps → Allow
```

### 2. Install APK
```
1. Copy `ivr-manager-audio-fixed.apk` to Android device
2. Tap on APK file
3. Click "Install"
4. Allow all permissions when asked (especially audio permissions)
```

### 3. Configure App
```
1. Open IVR Call Manager app
2. Go to Settings (⚙️ icon)
3. Set Server URL: http://YOUR_IP:8090
4. Find your IP: Run `ipconfig` on computer
5. Example: http://192.168.1.100:8090
```

### 4. Login & Test
```
1. Login with same credentials as web interface
2. Device should show as "Online" in web interface
3. Test by creating a campaign with audio file
4. Make test call - audio should play to TARGET NUMBER
```

## 🎯 **Audio Routing Feature**

### **What's Fixed:**
- ✅ Audio plays to target number (receiver)
- ✅ Caller phone remains silent during audio playback
- ✅ Professional IVR experience
- ✅ Clear voice communication quality

### **How It Works:**
1. App makes call to target number
2. After 3 seconds, audio starts playing
3. Target number hears the audio message
4. Call continues normally after audio ends

## Troubleshooting

### APK Won't Install
- ✅ Enable Unknown Sources
- ✅ Uninstall old version first
- ✅ Check storage space (need ~20 MB free)
- ✅ Grant all permissions

### App Crashes
- Check all permissions are granted
- Ensure correct server URL format
- Restart app after installation

### Audio Issues
- ❌ **If audio plays on caller phone**: Reinstall app and grant all permissions
- ✅ **Audio should play to target number only**
- Check phone's audio settings
- Ensure call connects properly before audio starts

### Can't Connect to Server
- Use computer's IP address, not localhost
- Format: `http://192.168.1.XXX:8090`
- Ensure both devices on same WiFi
- Check Windows Firewall (allow port 8090)

## Quick Start
1. Install: `ivr-manager-audio-fixed.apk`
2. Configure: Server URL with your IP
3. Login: Same credentials as web
4. Test: Create campaign with audio and make test call
5. Verify: Audio plays to target number, not caller

**Latest version with fixed audio routing!** 📱✅