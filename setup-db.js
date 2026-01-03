const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

const DB_CONFIG = {
  host: 'localhost',
  user: 'root',
  password: '', // Update this with your MySQL root password
  port: 3306
};

const setupDatabase = async () => {
  let connection;
  
  try {
    console.log('🔌 Connecting to MySQL...');
    connection = await mysql.createConnection(DB_CONFIG);
    
    console.log('🗄️  Creating database...');
    await connection.execute('CREATE DATABASE IF NOT EXISTS ivr_system');
    await connection.execute('USE ivr_system');
    
    console.log('👤 Creating Users table...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS Users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        firstName VARCHAR(50) NOT NULL,
        lastName VARCHAR(50) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        phone VARCHAR(20),
        role ENUM('admin', 'user') DEFAULT 'user',
        status ENUM('active', 'inactive') DEFAULT 'active',
        refreshToken TEXT,
        lastLogin DATETIME,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    
    console.log('📞 Creating Campaigns table...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS Campaigns (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        status ENUM('draft', 'active', 'paused', 'completed') DEFAULT 'draft',
        type ENUM('broadcast', 'survey', 'notification', 'reminder') DEFAULT 'broadcast',
        audioFileId INT,
        createdBy INT NOT NULL,
        scheduledAt DATETIME,
        settings JSON,
        stats JSON,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (createdBy) REFERENCES Users(id) ON DELETE CASCADE
      )
    `);
    
    console.log('👥 Creating Contacts table...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS Contacts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        phone VARCHAR(20) NOT NULL,
        email VARCHAR(255),
        status ENUM('active', 'inactive') DEFAULT 'active',
        campaignId INT,
        createdBy INT NOT NULL,
        callAttempts INT DEFAULT 0,
        lastCallDate DATETIME,
        lastResponse VARCHAR(10),
        notes TEXT,
        customFields JSON,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (createdBy) REFERENCES Users(id) ON DELETE CASCADE,
        FOREIGN KEY (campaignId) REFERENCES Campaigns(id) ON DELETE SET NULL
      )
    `);
    
    console.log('🎵 Creating AudioFiles table...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS AudioFiles (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        originalName VARCHAR(255) NOT NULL,
        filename VARCHAR(255) NOT NULL,
        mimeType VARCHAR(100) NOT NULL,
        size INT NOT NULL,
        duration INT,
        path VARCHAR(500) NOT NULL,
        url VARCHAR(500) NOT NULL,
        category VARCHAR(50) DEFAULT 'general',
        description TEXT,
        tags JSON,
        uploadedBy INT NOT NULL,
        isPublic BOOLEAN DEFAULT FALSE,
        usageCount INT DEFAULT 0,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (uploadedBy) REFERENCES Users(id) ON DELETE CASCADE
      )
    `);
    
    console.log('📊 Creating CallLogs table...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS CallLogs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        campaignId INT,
        contactId INT,
        deviceId VARCHAR(100),
        callId VARCHAR(100),
        status ENUM('initiated', 'answered', 'completed', 'failed', 'no-answer', 'busy') NOT NULL,
        startTime DATETIME,
        endTime DATETIME,
        duration INT DEFAULT 0,
        dtmfResponse VARCHAR(10),
        responseTime INT,
        errorMessage TEXT,
        metadata JSON,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (campaignId) REFERENCES Campaigns(id) ON DELETE CASCADE,
        FOREIGN KEY (contactId) REFERENCES Contacts(id) ON DELETE CASCADE
      )
    `);
    
    console.log('👨‍💼 Creating demo admin user...');
    const hashedPassword = await bcrypt.hash('password123', 12);
    
    // Check if demo user already exists
    const [existingUsers] = await connection.execute(
      'SELECT id FROM Users WHERE email = ?',
      ['demo@example.com']
    );
    
    if (existingUsers.length === 0) {
      await connection.execute(`
        INSERT INTO Users (firstName, lastName, email, password, role, status)
        VALUES (?, ?, ?, ?, ?, ?)
      `, ['Demo', 'Admin', 'demo@example.com', hashedPassword, 'admin', 'active']);
      
      console.log('✅ Demo admin user created');
      console.log('   Email: demo@example.com');
      console.log('   Password: password123');
    } else {
      console.log('ℹ️  Demo user already exists');
    }
    
    console.log('🎉 Database setup completed successfully!');
    console.log('\n📝 Next steps:');
    console.log('1. Update backend/.env with your database credentials');
    console.log('2. Restart the backend server');
    console.log('3. Access the frontend at http://localhost:3000');
    console.log('4. Login with demo@example.com / password123');
    
  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('🔐 Access denied - Update the DB_CONFIG with correct MySQL credentials');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('🔌 Connection refused - Make sure MySQL is running');
    }
  } finally {
    if (connection) {
      await connection.end();
    }
  }
};

// Run setup
setupDatabase();