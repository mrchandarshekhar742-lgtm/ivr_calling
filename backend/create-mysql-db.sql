-- Create database and user for IVR system
CREATE DATABASE IF NOT EXISTS ivr_system_prod CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create user (if not exists)
CREATE USER IF NOT EXISTS 'ivr_user'@'localhost' IDENTIFIED BY 'IVR_wxon_2024_SecurePass!';

-- Grant privileges
GRANT ALL PRIVILEGES ON ivr_system_prod.* TO 'ivr_user'@'localhost';
FLUSH PRIVILEGES;

-- Show databases to confirm
SHOW DATABASES;

-- Use the database
USE ivr_system_prod;

-- Show tables (should be empty initially)
SHOW TABLES;