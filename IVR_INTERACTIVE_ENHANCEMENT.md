# Interactive IVR System Enhancement Plan

## Current Limitation
- Ek hi audio file play hoti hai per call
- Koi button press detection nahi hai
- No interactive menu system

## New Features to Add

### 1. Interactive IVR Flow System
- **Main Menu Audio**: "Press 1 for English, Press 2 for Hindi"
- **DTMF Detection**: Real-time button press detection
- **Dynamic Audio Routing**: Button ke according different audio play
- **Multi-level Menus**: Nested menu support

### 2. IVR Template System
- Pre-defined IVR flows
- Custom menu creation from web dashboard
- Audio file mapping to DTMF keys
- Conditional branching

### 3. Real-time DTMF Tracking
- Live button press monitoring
- Response analytics
- Call flow visualization

### 4. Enhanced Features
- **Call Recording**: Record complete conversation
- **Voice Input**: Speech-to-text for responses
- **Smart Routing**: Based on caller response
- **Callback System**: Automatic callback scheduling
- **Multi-language Support**: Language selection via DTMF

## Implementation Components

### Backend Changes
1. New Model: `IVRFlow` - Define interactive menus
2. New Model: `IVRNode` - Individual menu nodes
3. Enhanced `CallLog` - Track DTMF responses per node
4. New API: `/api/ivr-flows` - Manage IVR flows
5. Real-time DTMF processing endpoint

### Frontend Changes
1. IVR Flow Builder (Visual drag-drop)
2. DTMF Response Analytics Dashboard
3. Live Call Flow Monitoring
4. Audio File Management per menu node

### Android App Changes
1. Real DTMF Detection using TelephonyManager
2. Dynamic audio playback based on DTMF
3. Call state monitoring
4. Audio queue management

## Database Schema

```sql
-- IVR Flow Definition
CREATE TABLE ivr_flows (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- IVR Menu Nodes
CREATE TABLE ivr_nodes (
  id INT PRIMARY KEY AUTO_INCREMENT,
  flow_id INT NOT NULL,
  node_key VARCHAR(50) NOT NULL, -- 'main_menu', 'option_1', etc.
  audio_file_id INT,
  prompt_text TEXT,
  timeout_seconds INT DEFAULT 10,
  retry_count INT DEFAULT 3,
  parent_node_id INT NULL,
  FOREIGN KEY (flow_id) REFERENCES ivr_flows(id),
  FOREIGN KEY (audio_file_id) REFERENCES audio_files(id)
);

-- DTMF Actions
CREATE TABLE ivr_actions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  node_id INT NOT NULL,
  dtmf_key VARCHAR(1) NOT NULL, -- '1', '2', '*', '#'
  action_type ENUM('goto_node', 'end_call', 'transfer', 'callback'),
  target_node_id INT NULL,
  transfer_number VARCHAR(20) NULL,
  FOREIGN KEY (node_id) REFERENCES ivr_nodes(id)
);

-- Enhanced Call Logs
ALTER TABLE call_logs ADD COLUMN ivr_flow_id INT NULL;
ALTER TABLE call_logs ADD COLUMN ivr_path JSON NULL; -- Track complete navigation path
ALTER TABLE call_logs ADD COLUMN dtmf_responses JSON NULL; -- All DTMF inputs
```

## Example IVR Flow

```json
{
  "flowName": "Customer Support",
  "nodes": {
    "main_menu": {
      "audioFile": "welcome.mp3",
      "prompt": "Press 1 for Sales, Press 2 for Support, Press 3 for Billing",
      "actions": {
        "1": { "goto": "sales_menu" },
        "2": { "goto": "support_menu" },
        "3": { "goto": "billing_menu" },
        "*": { "goto": "main_menu" }
      }
    },
    "sales_menu": {
      "audioFile": "sales_info.mp3",
      "prompt": "Press 1 to speak with sales, Press 2 for product info",
      "actions": {
        "1": { "action": "transfer", "number": "+1234567890" },
        "2": { "goto": "product_info" },
        "*": { "goto": "main_menu" }
      }
    }
  }
}
```

## Priority Implementation Order

1. ✅ **Phase 1**: Basic DTMF detection in Android app
2. ✅ **Phase 2**: IVR Flow database models
3. ✅ **Phase 3**: Backend API for IVR flows
4. ✅ **Phase 4**: Dynamic audio routing based on DTMF
5. ✅ **Phase 5**: Frontend IVR Flow Builder
6. ⏳ **Phase 6**: Advanced features (recording, speech-to-text)

## Benefits

- **Better User Experience**: Interactive menus
- **Higher Engagement**: Personalized responses
- **Better Analytics**: Track user choices
- **Scalability**: Easy to add new menu options
- **Professional**: Industry-standard IVR system
