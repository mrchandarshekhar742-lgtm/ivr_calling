# IVR Call Management System - उपयोग गाइड

## 🚀 वेबसाइट कैसे काम करती है?

यह एक **IVR (Interactive Voice Response) Call Management System** है जो आपको bulk calls करने और manage करने की सुविधा देता है।

### मुख्य विशेषताएं:
- **Automated Calling**: हजारों contacts को एक साथ call करें
- **IVR System**: Pre-recorded messages play करें
- **DTMF Response**: Customers के key press responses track करें
- **Real-time Monitoring**: Live call status देखें
- **Analytics**: Detailed reports और statistics
- **Android Integration**: अपने phone से calls करें

## 📱 System कैसे Start करें?

### Step 1: Servers Start करें
```bash
# Backend Server (Terminal 1)
cd backend
npm start

# Frontend Server (Terminal 2) 
cd frontend
npm run dev
```

### Step 2: Website Access करें
- **URL**: http://localhost:3000
- **Browser**: Chrome, Firefox, Safari कोई भी

## 🔐 Account बनाना और Login

### पहली बार Registration:
1. Website खोलें: http://localhost:3000
2. **"Create Account"** पर click करें
3. Details भरें:
   - **First Name**: आपका नाम
   - **Last Name**: surname
   - **Email**: valid email address
   - **Phone**: mobile number (optional)
   - **Password**: strong password (minimum 6 characters)
4. **"Create Account"** button दबाएं
5. Success message के बाद login page पर redirect होंगे

### Login Process:
1. **Email** और **Password** enter करें
2. **"Sign In"** button दबाएं
3. Dashboard पर पहुंच जाएंगे

## 🏠 Dashboard - Main Control Panel

Dashboard आपका main control center है:

### Quick Stats देख सकते हैं:
- **Total Campaigns**: कितने campaigns बनाए हैं
- **Total Contacts**: कितने contacts हैं
- **Active Calls**: currently कितने calls चल रहे हैं
- **Success Rate**: calls की success percentage

### Quick Actions:
- **Create Campaign**: नया campaign बनाएं
- **Manage Contacts**: contacts add/edit करें
- **Upload Audio**: IVR audio files upload करें
- **View Analytics**: detailed reports देखें

## 📞 Step-by-Step Campaign बनाना

### Step 1: Audio Files Upload करें
1. **"Audio Files"** menu पर जाएं
2. **"Upload Audio"** button दबाएं
3. Audio file select करें (.mp3, .wav, .m4a)
4. File name और description add करें
5. **"Upload"** करें

**Audio File Requirements:**
- Format: MP3, WAV, M4A
- Size: Maximum 50MB
- Duration: 30 seconds से 5 minutes तक ideal
- Quality: Clear voice, no background noise

### Step 2: Contacts Add करें

#### Individual Contact Add करना:
1. **"Contacts"** menu पर जाएं
2. **"Add Contact"** button दबाएं
3. Details भरें:
   - **Name**: contact का नाम
   - **Phone**: mobile number (automatically +91 add होगा)
   - **Email**: email address (optional)
4. **"Add Contact"** दबाएं

#### Bulk Contacts Import करना:
1. **"Bulk Add"** button दबाएं
2. CSV file format में contacts prepare करें:
   ```
   Name,Phone,Email
   Rahul Kumar,9876543210,rahul@email.com
   Priya Sharma,9876543211,priya@email.com
   ```
3. File upload करें
4. **"Import Contacts"** दबाएं

### Step 3: Call Template बनाएं
1. **"Call Templates"** menu पर जाएं
2. **"Create Template"** दबाएं
3. Template details भरें:
   - **Name**: template का नाम
   - **Category**: Survey, Marketing, Reminder, etc.
   - **Audio File**: uploaded audio select करें
   - **Script**: call script (optional)
   - **DTMF Options**: key press responses define करें
     - Press 1: Interested
     - Press 2: Not Interested
     - Press 0: Repeat Message
4. **"Create Template"** दबाएं

### Step 4: Campaign Create करें
1. **"Campaigns"** menu पर जाएं
2. **"New Campaign"** button दबाएं
3. Campaign details भरें:
   - **Campaign Name**: campaign का नाम
   - **Description**: campaign के बारे में
   - **Type**: Marketing, Survey, Notification
   - **Template**: बनाया गया template select करें
   - **Contacts**: target contacts select करें
   - **Schedule**: immediate या scheduled
4. **"Create Campaign"** दबाएं

### Step 5: Campaign Launch करें
1. Created campaign पर जाएं
2. **"Start Campaign"** button दबाएं
3. Confirmation dialog में **"Yes, Start"** दबाएं
4. Real-time progress monitor करें

## 📊 Campaign Monitoring और Management

### Real-time Monitoring:
- **Dashboard**: Live stats देखें
- **Campaign Detail**: specific campaign की progress
- **Call Logs**: individual call details
- **Analytics**: comprehensive reports

### Call Status समझना:
- **Completed**: Call successfully completed
- **Failed**: Call failed (network/technical issue)
- **No Answer**: Customer ने call नहीं उठाया
- **Busy**: Customer की line busy थी
- **DTMF Response**: Customer ने key press किया

### DTMF Responses:
- **Press 1**: Usually "Interested" या "Yes"
- **Press 2**: Usually "Not Interested" या "No"
- **Press 3**: "Call Back Later"
- **Press 9**: "Remove from List"
- **Press 0**: "Repeat Message"

## 📅 Call Scheduling System

### Scheduled Campaigns बनाना:
1. **"Call Scheduler"** menu पर जाएं
2. **"New Schedule"** दबाएं
3. Schedule details:
   - **Schedule Name**: schedule का नाम
   - **Campaign**: target campaign select करें
   - **Schedule Type**: 
     - One Time: एक बार
     - Daily: रोज
     - Weekly: हर हफ्ते
     - Monthly: हर महीने
   - **Start Date/Time**: कब start करना है
   - **Max Calls Per Hour**: hourly call limit
4. **"Create Schedule"** दबाएं

### Schedule Management:
- **Active/Pause**: schedule को on/off करें
- **Edit**: schedule modify करें
- **Delete**: schedule remove करें
- **Manual Execute**: immediately run करें

## 📋 Call Logs और Analytics

### Call Logs देखना:
1. **"Call Logs"** menu पर जाएं
2. Filters use करें:
   - **Status**: Completed, Failed, etc.
   - **Campaign**: specific campaign
   - **Date Range**: time period
   - **Search**: phone number search
3. **Export**: CSV format में download करें

### Analytics Reports:
1. **"Analytics"** menu पर जाएं
2. Different metrics देखें:
   - **Success Rate**: overall performance
   - **Campaign Performance**: campaign-wise stats
   - **DTMF Analysis**: customer responses
   - **Device Performance**: calling device stats
3. Time range select करें (24h, 7d, 30d)

## 📱 Android App Integration

### Android App Setup:
1. **IVRCallManager** app install करें
2. App में server URL set करें: `http://your-server-ip:5000`
3. Permissions allow करें:
   - Phone calls
   - Microphone
   - Storage
4. App में login करें (same credentials)

### Device Management:
1. **"Android Devices"** menu पर जाएं
2. Connected devices देखें
3. Device status monitor करें:
   - Battery level
   - Signal strength
   - Network type
   - Call capacity

## 🔧 Settings और Configuration

### Profile Settings:
1. **Profile** icon पर click करें
2. Personal details update करें
3. Password change करें
4. Notification preferences set करें

### System Settings:
1. **Settings** menu पर जाएं
2. Configure करें:
   - Call settings
   - Audio settings
   - Notification settings
   - Export preferences

## 💡 Best Practices और Tips

### Campaign Success के लिए:
1. **Quality Audio**: Clear और professional audio use करें
2. **Right Timing**: सही time पर calls करें (9 AM - 6 PM)
3. **Targeted Contacts**: relevant contacts को target करें
4. **Short Messages**: 30-60 seconds का audio ideal है
5. **Clear DTMF Options**: simple key press options दें

### Contact Management:
1. **Clean Data**: duplicate contacts remove करें
2. **Valid Numbers**: working phone numbers use करें
3. **Segmentation**: contacts को categories में divide करें
4. **Regular Updates**: contact list को regularly update करें

### Performance Optimization:
1. **Batch Processing**: large campaigns को batches में divide करें
2. **Time Scheduling**: peak hours avoid करें
3. **Device Management**: multiple devices use करें capacity के लिए
4. **Regular Monitoring**: campaigns को regularly monitor करें

## 🚨 Common Issues और Solutions

### Campaign Start नहीं हो रहा:
- Check करें कि audio file uploaded है
- Contacts properly selected हैं
- Android device connected है
- Internet connection stable है

### Calls Failed हो रहे हैं:
- Device की battery check करें
- Network signal strength देखें
- SIM card balance check करें
- Phone permissions verify करें

### Audio Play नहीं हो रहा:
- Audio file format check करें (MP3/WAV)
- File size 50MB से कम होना चाहिए
- Audio quality clear होनी चाहिए
- Device volume settings check करें

### DTMF Response नहीं आ रहे:
- Template में DTMF options properly set करें
- Audio message में clear instructions दें
- Customer को sufficient time दें key press के लिए
- Network quality check करें

## 📈 Business Use Cases

### Marketing Campaigns:
- Product launches
- Promotional offers
- Brand awareness
- Customer acquisition

### Customer Service:
- Appointment reminders
- Payment reminders
- Service updates
- Feedback collection

### Surveys और Research:
- Market research
- Customer satisfaction
- Product feedback
- Opinion polls

### Event Management:
- Event invitations
- Registration confirmations
- Reminder calls
- Follow-up calls

## 💰 Cost Benefits

### Traditional vs IVR System:
- **Manual Calling**: 1 person = 50-100 calls/day
- **IVR System**: 1000+ calls/hour automatically
- **Cost Saving**: 70-80% cost reduction
- **Time Saving**: 90% time saving
- **Accuracy**: 100% consistent messaging

### ROI Calculation:
- **Setup Cost**: One-time system setup
- **Operational Cost**: Only SIM card recharge
- **Manpower Saving**: Reduce calling staff
- **Efficiency**: 10x more calls in same time

## 🔒 Security और Privacy

### Data Protection:
- All data encrypted
- Secure login system
- Regular backups
- Access control

### Compliance:
- TRAI guidelines follow करें
- DND registry respect करें
- Customer consent लें
- Opt-out facility provide करें

## 📞 Support और Help

### Technical Support:
- System logs check करें
- Error messages note करें
- Browser console देखें
- Network connectivity verify करें

### Training और Documentation:
- यह guide regularly refer करें
- System features explore करें
- Best practices follow करें
- Regular updates check करें

---

## 🎯 Quick Start Checklist

### Initial Setup:
- [ ] Servers start करें (backend + frontend)
- [ ] Account create करें
- [ ] Login successfully करें
- [ ] Dashboard access करें

### First Campaign:
- [ ] Audio file upload करें
- [ ] Contacts add करें (individual या bulk)
- [ ] Template create करें
- [ ] Campaign बनाएं
- [ ] Campaign launch करें

### Monitoring:
- [ ] Real-time progress देखें
- [ ] Call logs monitor करें
- [ ] DTMF responses check करें
- [ ] Analytics reports देखें

### Optimization:
- [ ] Performance analyze करें
- [ ] Success rate improve करें
- [ ] Contact list optimize करें
- [ ] Schedule campaigns efficiently

---

**आपका IVR Call Management System अब पूरी तरह तैयार है!** 🚀

**Access URL**: http://localhost:3000  
**Status**: Fully Operational  
**Support**: Complete documentation available

अब आप professional IVR campaigns run कर सकते हैं और अपने business को grow कर सकते हैं!