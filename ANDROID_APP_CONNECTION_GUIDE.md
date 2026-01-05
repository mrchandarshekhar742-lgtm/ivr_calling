# 📱 Android App Connection Guide

## 🔐 How Authentication Works

### Step 1: User Registration/Login
1. **Website Registration**: User registers on `https://ivr.wxon.in`
2. **Login Credentials**: User gets email/password credentials
3. **JWT Token**: Website generates JWT token for authenticated user

### Step 2: Android App Setup
1. **Install APK**: Install IVR Call Manager app on Android device
2. **Server URL**: App pre-configured with `https://ivr.wxon.in`
3. **Login**: Use same email/password from website
4. **Token Storage**: App stores JWT token locally

### Step 3: Device Registration
1. **Device ID**: App generates unique device ID
2. **API Call**: App calls `/api/devices/register` with JWT token
3. **Device Info**: Sends device name, Android version, capabilities
4. **Server Storage**: Backend stores device info in database

### Step 4: Real-time Connection
1. **Socket.IO**: App connects to server using Socket.IO
2. **Authentication**: Sends JWT token for Socket authentication
3. **Device Status**: Server marks device as "online"
4. **Campaign Assignment**: Server can now assign campaigns to device

## 🔄 Connection Flow

```
Website (ivr.wxon.in)
    ↓ (User registers/login)
JWT Token Generated
    ↓ (User downloads APK)
Android App
    ↓ (Login with same credentials)
JWT Token Stored
    ↓ (Device registration API call)
Backend Database
    ↓ (Socket.IO connection)
Real-time Communication
    ↓ (Campaign assignment)
IVR Calls Execution
```

## 📋 Technical Details

### Authentication Token
- **Type**: JWT (JSON Web Token)
- **Storage**: Android app localStorage
- **Expiry**: 24 hours (configurable)
- **Refresh**: Automatic refresh mechanism

### Device Registration API
```
POST /api/devices/register
Headers: {
  "Authorization": "Bearer <JWT_TOKEN>",
  "Content-Type": "application/json"
}
Body: {
  "deviceId": "device_abc123",
  "deviceName": "Samsung Galaxy S21",
  "androidVersion": "Android 12",
  "capabilities": ["voice_call", "dtmf_input"]
}
```

### Socket.IO Connection
```javascript
const socket = io('https://ivr.wxon.in', {
  auth: { token: JWT_TOKEN },
  transports: ['websocket']
});
```

## 🎯 What Happens After Connection

### 1. Device Appears in Dashboard
- Website shows device in "Android Devices" page
- Status: Online/Offline
- Device info: Name, Android version, last seen

### 2. Campaign Assignment
- Admin creates campaign on website
- System assigns campaign to available devices
- Device receives campaign via Socket.IO

### 3. Call Execution
- Device receives call instructions
- Makes IVR calls using Android telephony
- Reports call status back to server
- Updates call logs in real-time

## 🔧 Troubleshooting

### Common Issues:
1. **405 Method Not Allowed**: Check API URL has `/api/` prefix
2. **401 Unauthorized**: JWT token expired, re-login required
3. **500 Internal Server Error**: Backend database issue
4. **Connection Failed**: Check internet and server status

### Debug Steps:
1. Check server URL: `https://ivr.wxon.in`
2. Test API endpoint: `https://ivr.wxon.in/api/health`
3. Verify JWT token in app storage
4. Check device permissions (Phone, Contacts, etc.)

## 📱 App Features After Connection

### Real-time Features:
- ✅ Campaign notifications
- ✅ Call status updates  
- ✅ Device status monitoring
- ✅ Remote campaign control

### Call Management:
- ✅ Automatic call execution
- ✅ DTMF input handling
- ✅ Call recording (if enabled)
- ✅ Call logs synchronization

### Device Control:
- ✅ Remote start/stop campaigns
- ✅ Device status reporting
- ✅ Battery and network monitoring
- ✅ Error reporting and logging

## 🚀 Next Steps

1. **Fix Backend Issues**: Run database setup script
2. **Test API Endpoints**: Verify all routes working
3. **Build Fresh APK**: With updated server URL
4. **Test Connection**: Complete end-to-end testing
5. **Deploy**: Ready for production use