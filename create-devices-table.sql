-- Create devices table for IVR system
CREATE TABLE IF NOT EXISTS `devices` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `device_id` varchar(100) NOT NULL,
  `device_name` varchar(100) NOT NULL,
  `android_version` varchar(50) DEFAULT 'Unknown',
  `device_model` varchar(100) DEFAULT 'Android Device',
  `app_version` varchar(20) DEFAULT '1.0.0',
  `user_id` int(11) NOT NULL,
  `user_email` varchar(255) NOT NULL,
  `status` enum('online','offline','busy') DEFAULT 'offline',
  `token` varchar(255) DEFAULT NULL,
  `last_seen` datetime DEFAULT CURRENT_TIMESTAMP,
  `capabilities` json DEFAULT NULL,
  `stats` json DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `device_id` (`device_id`),
  KEY `user_id` (`user_id`),
  KEY `status` (`status`),
  CONSTRAINT `devices_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Set default values for JSON fields
UPDATE `devices` SET 
  `capabilities` = JSON_ARRAY('voice_call', 'dtmf_input'),
  `stats` = JSON_OBJECT('totalCalls', 0, 'successfulCalls', 0, 'failedCalls', 0, 'lastCallAt', NULL)
WHERE `capabilities` IS NULL OR `stats` IS NULL;