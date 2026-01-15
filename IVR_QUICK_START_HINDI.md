# Interactive IVR System - Quick Start Guide (Hindi)

## Kya Hai Ye System?

Pehle: Ek hi audio file play hoti thi har call mein
Ab: Button press karne par alag-alag audio play hogi (Interactive IVR)

### Example:
```
📞 Call Start
🔊 "Press 1 for English, Press 2 for Hindi"
👆 User presses "1"
🔊 "Press 1 for Sales, Press 2 for Support"
👆 User presses "2"
🔊 "Connecting you to support..."
📞 Call transfer to support team
```

## Setup Kaise Karein

### Step 1: Database Setup
```bash
# MySQL mein run karein
mysql -u root -p ivr_calling < backend/create-ivr-tables.sql
```

### Step 2: Backend Start Karein
```bash
cd backend
npm install
npm start
```

### Step 3: Frontend Start Karein
```bash
cd frontend
npm install
npm start
```

### Step 4: Login Karein
- Browser mein jao: `http://localhost:3000`
- Login karein apne credentials se

## IVR Flow Kaise Banayein

### Step 1: IVR Flows Page Par Jao
- Sidebar mein "IVR Flows" par click karein

### Step 2: Naya Flow Banao
1. "Create IVR Flow" button click karein
2. Name enter karein: "Customer Support Menu"
3. Description: "Main support menu with options"
4. Language select karein: English/Hindi
5. Timeout: 10 seconds (kitni der wait karein button press ke liye)
6. "Create Flow" click karein

### Step 3: Nodes Add Karein

#### Main Menu Node
1. "Add Node" button click karein
2. **Node Key**: `main_menu` (unique identifier)
3. **Node Name**: Main Menu
4. **Audio File**: Select audio file (e.g., "welcome.mp3")
5. **Prompt Text**: "Press 1 for Sales, Press 2 for Support, Press 3 for Billing"
6. **Node Type**: Menu
7. **Timeout**: 10 seconds
8. **Add Actions**:
   - Press "Add Action"
   - DTMF Key: `1`
   - Action Type: `goto`
   - Target: `sales_menu`
   - Repeat for keys 2, 3

#### Sales Menu Node
1. "Add Node" click karein
2. **Node Key**: `sales_menu`
3. **Node Name**: Sales Department
4. **Audio File**: Select "sales.mp3"
5. **Prompt Text**: "Press 1 to speak with sales, Press * to go back"
6. **Add Actions**:
   - Key `1`: Transfer to `+1234567890`
   - Key `*`: Goto `main_menu`

#### Support Menu Node
1. **Node Key**: `support_menu`
2. **Node Name**: Technical Support
3. **Audio File**: "support.mp3"
4. **Prompt Text**: "Press 1 for tech support, Press * to go back"
5. **Add Actions**:
   - Key `1`: Transfer to `+9876543210`
   - Key `*`: Goto `main_menu`

### Step 4: Flow Activate Karein
- Flow list mein jao
- "Active/Inactive" toggle click karein
- Flow ab active ho gaya!

## Campaign Mein IVR Use Karein

### Step 1: Campaign Banao
1. "Campaigns" page par jao
2. "Create Campaign" click karein
3. Campaign details fill karein
4. **IVR Flow**: Select apna banaya hua flow
5. Contacts add karein
6. Campaign start karein

### Step 2: Device Se Call Karein
1. Android app open karein
2. "Connect" button press karein
3. Campaign start hone par automatic call jayegi
4. IVR flow execute hoga

## DTMF Actions Ke Types

### 1. Goto (Dusre Node Par Jao)
```json
{
  "type": "goto",
  "target": "sales_menu"
}
```
**Use Case**: Menu navigation

### 2. Transfer (Call Transfer Karo)
```json
{
  "type": "transfer",
  "number": "+1234567890"
}
```
**Use Case**: Agent ko connect karna

### 3. End (Call Khatam Karo)
```json
{
  "type": "end"
}
```
**Use Case**: Thank you message ke baad

## Node Types

### 1. Menu
- Interactive menu with options
- DTMF input leti hai
- Multiple actions ho sakte hain

### 2. Message
- Sirf message play karti hai
- Koi input nahi leti
- Auto-next node par jati hai

### 3. Input
- User se input collect karti hai
- DTMF digits store karti hai

### 4. Transfer
- Call transfer karti hai
- Phone number chahiye

### 5. End
- Call end karti hai
- Thank you message play karti hai

## Real Example: Restaurant IVR

### Flow Structure:
```
Main Menu
├─ Press 1: Order Food
│  ├─ Press 1: Veg Menu
│  ├─ Press 2: Non-Veg Menu
│  └─ Press *: Back
├─ Press 2: Table Booking
│  ├─ Press 1: Today
│  ├─ Press 2: Tomorrow
│  └─ Press *: Back
├─ Press 3: Talk to Manager
│  └─ Transfer: +91-9876543210
└─ Press 0: Repeat Menu
```

### Implementation:

#### Node 1: Main Menu
```javascript
{
  "nodeKey": "main_menu",
  "nodeName": "Main Menu",
  "promptText": "Press 1 for Order, Press 2 for Booking, Press 3 for Manager",
  "actions": {
    "1": { "type": "goto", "target": "order_menu" },
    "2": { "type": "goto", "target": "booking_menu" },
    "3": { "type": "transfer", "number": "+919876543210" },
    "0": { "type": "goto", "target": "main_menu" }
  }
}
```

#### Node 2: Order Menu
```javascript
{
  "nodeKey": "order_menu",
  "nodeName": "Order Food",
  "promptText": "Press 1 for Veg, Press 2 for Non-Veg, Press * to go back",
  "actions": {
    "1": { "type": "goto", "target": "veg_menu" },
    "2": { "type": "goto", "target": "nonveg_menu" },
    "*": { "type": "goto", "target": "main_menu" }
  }
}
```

## Analytics Dekhein

### Call Logs Mein
1. "Call Logs" page par jao
2. Call select karein
3. **IVR Path** dekhein:
   ```json
   [
     { "nodeKey": "main_menu", "dtmfPressed": "1", "timestamp": "..." },
     { "nodeKey": "order_menu", "dtmfPressed": "1", "timestamp": "..." },
     { "nodeKey": "veg_menu", "dtmfPressed": null, "timestamp": "..." }
   ]
   ```

### Popular Choices
- IVR Flow stats mein dekho
- Sabse zyada kaunsa option press hota hai
- Kis node par zyada time lagta hai

## Troubleshooting

### Problem: DTMF Detect Nahi Ho Raha
**Solution**: 
- Android app mein DTMF detection implement karein
- TelephonyManager use karein
- Backend ko DTMF send karein

### Problem: Audio Play Nahi Ho Rahi
**Solution**:
- Audio file upload check karein
- Node mein audio file link check karein
- Device mein audio download check karein

### Problem: Flow Execute Nahi Ho Raha
**Solution**:
- Flow active hai ya nahi check karein
- Nodes properly configured hain check karein
- Actions correctly defined hain check karein

## Advanced Features (Coming Soon)

### 1. Voice Input
- Speech-to-text
- Natural language processing
- Voice commands

### 2. Smart Routing
- AI-based routing
- Customer history
- Priority handling

### 3. Call Recording
- Complete conversation recording
- Playback in dashboard
- Download option

### 4. Multi-language
- Language selection via DTMF
- Dynamic audio switching
- Regional language support

## Best Practices

### 1. Audio Files
- Clear voice
- Professional recording
- Proper volume
- No background noise

### 2. Menu Structure
- Maximum 4-5 options per menu
- Clear instructions
- Repeat option available
- Back option available

### 3. Timeout Settings
- Main menu: 10 seconds
- Sub-menu: 8 seconds
- Input collection: 15 seconds

### 4. Error Handling
- Invalid input message
- Retry 3 times
- Transfer to operator after retries

## Testing Checklist

- [ ] IVR flow banaya
- [ ] Nodes add kiye
- [ ] Audio files link kiye
- [ ] DTMF actions configure kiye
- [ ] Flow activate kiya
- [ ] Test call kiya
- [ ] Navigation check kiya
- [ ] Analytics dekha
- [ ] Error handling test kiya

## Support

**Questions?**
- Documentation: `IVR_IMPLEMENTATION_COMPLETE.md`
- API Docs: `http://localhost:8090/api/ivr-flows`
- Logs: `backend/logs/`

**Common Issues:**
1. Database connection error → Check MySQL running
2. Audio not playing → Check file upload
3. DTMF not working → Implement in Android app
4. Flow not executing → Check flow is active

---

**Happy IVR Building! 🎉**

Koi problem ho to documentation check karein ya logs dekhein.
