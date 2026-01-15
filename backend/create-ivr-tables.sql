-- IVR Flow Tables Migration
-- Run this SQL to add Interactive IVR functionality

-- Create IVR Flows table
CREATE TABLE IF NOT EXISTS ivr_flows (
  id INT PRIMARY KEY AUTO_INCREMENT,
  userId INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  isActive BOOLEAN DEFAULT true,
  flowConfig JSON DEFAULT '{}',
  defaultLanguage VARCHAR(10) DEFAULT 'en',
  maxRetries INT DEFAULT 3,
  timeout INT DEFAULT 10 COMMENT 'Timeout in seconds for DTMF input',
  stats JSON DEFAULT '{"totalCalls":0,"completedCalls":0,"averageDuration":0,"popularChoices":{}}',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (userId),
  INDEX idx_is_active (isActive)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create IVR Nodes table
CREATE TABLE IF NOT EXISTS ivr_nodes (
  id INT PRIMARY KEY AUTO_INCREMENT,
  flowId INT NOT NULL,
  nodeKey VARCHAR(50) NOT NULL COMMENT 'Unique identifier within flow',
  nodeName VARCHAR(255) NOT NULL,
  audioFileId INT NULL,
  promptText TEXT COMMENT 'Text description of the prompt',
  nodeType ENUM('menu', 'message', 'input', 'transfer', 'end') DEFAULT 'menu',
  timeout INT DEFAULT 10 COMMENT 'Seconds to wait for DTMF input',
  retryCount INT DEFAULT 3,
  retryAudioFileId INT NULL COMMENT 'Audio to play on invalid/no input',
  parentNodeId INT NULL COMMENT 'Parent node for hierarchical structure',
  actions JSON DEFAULT '{}' COMMENT 'DTMF key to action mapping',
  metadata JSON DEFAULT '{}',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (flowId) REFERENCES ivr_flows(id) ON DELETE CASCADE,
  FOREIGN KEY (audioFileId) REFERENCES audio_files(id) ON DELETE SET NULL,
  FOREIGN KEY (retryAudioFileId) REFERENCES audio_files(id) ON DELETE SET NULL,
  UNIQUE KEY unique_node_key (flowId, nodeKey),
  INDEX idx_flow_id (flowId),
  INDEX idx_node_key (nodeKey)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add IVR columns to call_logs table
ALTER TABLE call_logs 
ADD COLUMN IF NOT EXISTS ivrFlowId INT NULL AFTER audioFileId,
ADD COLUMN IF NOT EXISTS ivrPath JSON DEFAULT '[]' COMMENT 'Array of nodes visited',
ADD COLUMN IF NOT EXISTS dtmfResponses JSON DEFAULT '[]' COMMENT 'All DTMF inputs with timestamps',
ADD COLUMN IF NOT EXISTS currentNodeKey VARCHAR(50) NULL COMMENT 'Current IVR node',
ADD FOREIGN KEY (ivrFlowId) REFERENCES ivr_flows(id) ON DELETE SET NULL;

-- Add index for IVR flow queries
ALTER TABLE call_logs ADD INDEX IF NOT EXISTS idx_ivr_flow_id (ivrFlowId);

-- Sample IVR Flow (Optional - for testing)
INSERT INTO ivr_flows (userId, name, description, defaultLanguage, maxRetries, timeout, isActive)
SELECT 
  id as userId,
  'Sample Customer Support IVR' as name,
  'Interactive menu for customer support with multiple options' as description,
  'en' as defaultLanguage,
  3 as maxRetries,
  10 as timeout,
  false as isActive
FROM users 
LIMIT 1;

-- Get the flow ID for sample nodes
SET @flowId = LAST_INSERT_ID();

-- Sample IVR Nodes (Optional - for testing)
INSERT INTO ivr_nodes (flowId, nodeKey, nodeName, promptText, nodeType, timeout, retryCount, actions)
VALUES 
  (@flowId, 'main_menu', 'Main Menu', 'Press 1 for Sales, Press 2 for Support, Press 3 for Billing, Press 0 for Operator', 'menu', 10, 3, 
   '{"1":{"type":"goto","target":"sales_menu"},"2":{"type":"goto","target":"support_menu"},"3":{"type":"goto","target":"billing_menu"},"0":{"type":"transfer","number":"+1234567890"}}'),
  
  (@flowId, 'sales_menu', 'Sales Department', 'Press 1 to speak with sales representative, Press 2 for product information, Press * to return to main menu', 'menu', 10, 3,
   '{"1":{"type":"transfer","number":"+1234567891"},"2":{"type":"goto","target":"product_info"},"*":{"type":"goto","target":"main_menu"}}'),
  
  (@flowId, 'support_menu', 'Technical Support', 'Press 1 for technical support, Press 2 for account issues, Press * to return to main menu', 'menu', 10, 3,
   '{"1":{"type":"transfer","number":"+1234567892"},"2":{"type":"goto","target":"account_support"},"*":{"type":"goto","target":"main_menu"}}'),
  
  (@flowId, 'billing_menu', 'Billing Department', 'Press 1 for billing inquiries, Press 2 for payment options, Press * to return to main menu', 'menu', 10, 3,
   '{"1":{"type":"transfer","number":"+1234567893"},"2":{"type":"goto","target":"payment_info"},"*":{"type":"goto","target":"main_menu"}}'),
  
  (@flowId, 'product_info', 'Product Information', 'Thank you for your interest in our products. A representative will contact you shortly.', 'message', 5, 1,
   '{}'),
  
  (@flowId, 'account_support', 'Account Support', 'Please hold while we connect you to account support.', 'transfer', 5, 1,
   '{"1":{"type":"transfer","number":"+1234567894"}}'),
  
  (@flowId, 'payment_info', 'Payment Information', 'You can make payments online at our website or call our automated payment line.', 'message', 5, 1,
   '{}');

-- Verification queries
SELECT 'IVR Flows created:' as Status, COUNT(*) as Count FROM ivr_flows;
SELECT 'IVR Nodes created:' as Status, COUNT(*) as Count FROM ivr_nodes;
SELECT 'Call logs table updated:' as Status, 'ivrFlowId, ivrPath, dtmfResponses columns added' as Details;

COMMIT;
