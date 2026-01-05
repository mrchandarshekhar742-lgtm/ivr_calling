require('dotenv').config();
const { sequelize } = require('./src/config/database');
const logger = require('./src/config/logger');

// Import all models to ensure they're registered
const User = require('./src/models/User');
const Campaign = require('./src/models/Campaign');
const Contact = require('./src/models/Contact');
const AudioFile = require('./src/models/AudioFile');
const CallLog = require('./src/models/CallLog');

const setupDatabase = async () => {
  try {
    console.log('🔄 Setting up database...');
    
    // Test connection
    await sequelize.authenticate();
    console.log('✅ Database connection successful');
    
    // Create/sync all tables
    await sequelize.sync({ force: false, alter: true });
    console.log('✅ Database tables created/updated');
    
    // Test User model
    const testUser = await User.findOne();
    console.log('✅ User model working');
    
    console.log('🎉 Database setup completed successfully!');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    
    if (error.original?.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('🔐 Fix: Check database credentials in .env file');
    } else if (error.original?.code === 'ECONNREFUSED') {
      console.error('🔌 Fix: Start MySQL service: sudo systemctl start mysql');
    } else if (error.original?.code === 'ER_BAD_DB_ERROR') {
      console.error('🗄️ Fix: Create database: CREATE DATABASE ivr_system_prod;');
    }
    
    process.exit(1);
  }
};

setupDatabase();