-- Add missing user_id column to call_logs table
ALTER TABLE `call_logs` 
ADD COLUMN `user_id` int(11) NOT NULL AFTER `contact_id`,
ADD KEY `user_id` (`user_id`),
ADD CONSTRAINT `call_logs_ibfk_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

-- Update existing call logs to have a user_id (set to first user for existing data)
UPDATE `call_logs` SET `user_id` = (SELECT MIN(id) FROM users LIMIT 1) WHERE `user_id` IS NULL OR `user_id` = 0;