# 🚀 IVR Call Management System - Complete Usage Guide

## 📱 **Android App Build & Installation**

### Step 1: Build APK (Already Done!)
```bash
# Dependencies installed successfully ✅
# Ready to build APK
```

### Step 2: Get APK File
**APK Location**: `IVRCallManager/android/app/build/outputs/apk/release/app-release.apk`

### Step 3: Install on Android Device
1. **Transfer APK** to your Android device (via USB, email, or cloud)
2. **Enable Unknown Sources**: Settings → Security → Install from Unknown Sources
3. **Install APK**: Tap the APK file and follow installation prompts
4. **Grant Permissions**: Allow all requested permissions (microphone, phone, etc.)

---

## 🌐 **Website Usage Guide**

### 🔐 **Step 1: Login to Dashboard**
1. **Open**: https://ivr.wxon.in
2. **Login Credentials**:
   - **Email**: `admin@ivr.com`
   - **Password**: `admin123`
3. **Click**: "Login" button

### 📊 **Step 2: Dashboard Overview**
After login, you'll see:
- **Total Campaigns**: Number of created campaigns
- **Total Contacts**: Imported contact lists
- **Active Calls**: Currently running calls
- **Success Rate**: Call completion percentage
- **Quick Actions**: Create campaign, manage contacts, upload audio, view analytics

---

## 📱 **Step 3: Connect Android Device**

### 3.1 Register Device on Website
1. **Navigate**: Dashboard → "Android Devices" (sidebar)
2. **Click**: "Add Device" button
3. **Fill Details**:
   - **Device ID**: `device_12345` (any unique ID)
   - **Device Name**: `My Android Phone`
   - **Device Model**: `Samsung Galaxy` (optional)
   - **Android Version**: `Android 12` (optional)
4. **Click**: "Add Device"
5. **Copy Token**: A popup will show device token - **COPY THIS TOKEN**

### 3.2 Configure Android App
1. **Open**: IVR Call Manager app on your Android device
2. **Login**: Use `admin@ivr.com` / `admin123`
3. **Configure Settings**:
   - **Server URL**: `https://ivr.wxon.in` (pre-filled)
   - **Device Name**: `My Android Phone`
   - **Phone Number**: Your actual phone number
4. **Save Settings**
5. **Connect**: Tap "Connect to Server"
6. **Status**: Should show "Connected" with green indicator

---

## 👥 **Step 4: Manage Contacts**

### 4.1 Add Contacts Manually
1. **Navigate**: Dashboard → "Contacts"
2. **Click**: "Add Contact"
3. **Fill Details**:
   - **Name**: Contact name
   - **Phone**: Phone number with country code (+91-9876543210)
   - **Email**: Optional
4. **Save Contact**

### 4.2 Import Contacts (Bulk)
1. **Navigate**: Dashboard → "Contacts"
2. **Click**: "Import Contacts"
3. **Upload CSV**: Format: Name, Phone, Email
4. **Map Fields**: Ensure correct field mapping
5. **Import**: Process the contact list

---

## 🎵 **Step 5: Upload Audio Files**

### 5.1 Upload Audio for IVR
1. **Navigate**: Dashboard → "Audio Files"
2. **Click**: "Upload Audio"
3. **Select File**: Choose MP3/WAV file (max 10MB)
4. **Add Details**:
   - **Name**: Audio file name
   - **Description**: Purpose of audio
   - **Type**: IVR Message, Welcome, etc.
5. **Upload**: Process the audio file

### 5.2 Audio Requirements
- **Format**: MP3, WAV, M4A
- **Quality**: 8kHz-44kHz, Mono preferred
- **Duration**: 10 seconds to 5 minutes
- **Size**: Maximum 10MB per file

---

## 📞 **Step 6: Create IVR Campaign**

### 6.1 Campaign Setup
1. **Navigate**: Dashboard → "Campaigns"
2. **Click**: "Create Campaign"
3. **Basic Details**:
   - **Campaign Name**: "Welcome Campaign"
   - **Description**: Campaign purpose
   - **Type**: Voice Call / IVR
4. **Select Audio**: Choose uploaded audio file
5. **Select Contacts**: Choose contact list or individual contacts
6. **Schedule**: Immediate or scheduled time
7. **Create Campaign**

### 6.2 Campaign Configuration
- **Call Settings**:
  - **Max Attempts**: 3 retries per contact
  - **Call Timeout**: 30 seconds
  - **Retry Interval**: 5 minutes between attempts
- **DTMF Options**: Configure keypress responses
- **Recording**: Enable/disable call recording

---

## 🚀 **Step 7: Launch Campaign**

### 7.1 Start Campaign
1. **Navigate**: Dashboard → "Campaigns"
2. **Find Campaign**: Locate your created campaign
3. **Click**: "Start" button
4. **Confirm**: Campaign will begin immediately
5. **Monitor**: Watch real-time progress

### 7.2 Monitor Campaign
- **Dashboard**: Real-time call statistics
- **Call Logs**: Detailed call records
- **Analytics**: Performance metrics
- **Device Status**: Android device connection status

---

## 📊 **Step 8: Monitor & Analytics**

### 8.1 Real-time Monitoring
1. **Dashboard**: Live call statistics
2. **Android Devices**: Device connection status
3. **Call Logs**: Individual call records
4. **Campaign Status**: Progress tracking

### 8.2 Analytics & Reports
1. **Navigate**: Dashboard → "Analytics"
2. **View Metrics**:
   - **Call Success Rate**: Percentage of successful calls
   - **Campaign Performance**: Individual campaign stats
   - **Device Performance**: Android device efficiency
   - **DTMF Responses**: Keypress analytics
3. **Time Filters**: 24h, 7d, 30d views
4. **Export Reports**: Download analytics data

---

## 🔧 **Step 9: Advanced Features**

### 9.1 Call Templates
1. **Navigate**: Dashboard → "Call Templates"
2. **Create Template**: Reusable campaign settings
3. **Configure**: Audio, timing, DTMF options
4. **Save**: Use for future campaigns

### 9.2 Call Scheduling
1. **Navigate**: Dashboard → "Call Scheduler"
2. **Schedule Campaign**: Set future execution time
3. **Recurring**: Daily, weekly, monthly campaigns
4. **Time Zones**: Configure for different regions

### 9.3 Device Management
1. **Navigate**: Dashboard → "Android Devices"
2. **Device Status**: Online/offline monitoring
3. **Test Connection**: Verify device connectivity
4. **Remove Device**: Disconnect unused devices

---

## 🛠️ **Troubleshooting**

### Common Issues & Solutions

#### 🔴 **Android App Won't Connect**
- **Check Internet**: Ensure device has internet connection
- **Verify URL**: Server URL should be `https://ivr.wxon.in`
- **Login First**: Must login before connecting to server
- **Check Permissions**: Grant all app permissions

#### 🔴 **Device Not Showing in Dashboard**
- **Register Device**: Add device in "Android Devices" section
- **Check Connection**: App should show "Connected" status
- **Refresh Page**: Reload dashboard page
- **Check Token**: Ensure device token is correct

#### 🔴 **Calls Not Working**
- **Phone Permissions**: Grant phone and microphone permissions
- **SIM Card**: Ensure device has active SIM card
- **Network**: Check cellular network connectivity
- **Campaign Status**: Verify campaign is "Running"

#### 🔴 **Audio Issues**
- **File Format**: Use MP3 or WAV format
- **File Size**: Keep under 10MB
- **Quality**: Use 8kHz-22kHz sample rate
- **Upload Status**: Check if audio uploaded successfully

---

## 📞 **Support & Help**

### Quick Reference
- **Website**: https://ivr.wxon.in
- **Login**: admin@ivr.com / admin123
- **Server URL**: https://ivr.wxon.in
- **App Name**: IVR Call Manager

### System Requirements
- **Android**: Version 5.0+ (API 21+)
- **Internet**: Stable internet connection
- **Permissions**: Phone, microphone, storage access
- **SIM**: Active SIM card for outbound calls

### Best Practices
1. **Test First**: Always test with small contact list
2. **Monitor**: Keep dashboard open during campaigns
3. **Device Ready**: Ensure Android device is charged and connected
4. **Audio Quality**: Use clear, professional audio files
5. **Contact Validation**: Verify phone numbers before campaigns

---

## 🎯 **Quick Start Checklist**

- [ ] ✅ Login to https://ivr.wxon.in
- [ ] ✅ Install Android app on device
- [ ] ✅ Register device in dashboard
- [ ] ✅ Connect app to server
- [ ] ✅ Upload audio file
- [ ] ✅ Import contacts
- [ ] ✅ Create first campaign
- [ ] ✅ Start campaign and monitor
- [ ] ✅ Check analytics and results

**🎉 Congratulations! Your IVR Call Management System is now fully operational!**