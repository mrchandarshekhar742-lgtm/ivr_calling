require('dotenv').config();
const { sequelize } = require('./src/config/database');
const logger = require('./src/config/logger');

// Import all models to ensure they're registered
const User = require('./src/models/User');
const Campaign = require('./src/models/Campaign');
const Contact = require('./src/models/Contact');
const AudioFile = require('./src/models/AudioFile');
const CallLog = require('./src/models/CallLog');
const CallTemplate = require('./src/models/CallTemplate');
const CallSchedule = require('./src/models/CallSchedule');

const fixDatabaseIssues = async () => {
  try {
    console.log('🔄 Fixing database issues...');
    
    // Test connection
    await sequelize.authenticate();
    console.log('✅ Database connection successful');
    
    // Drop and recreate all tables (CAUTION: This will delete all data)
    console.log('⚠️  Dropping and recreating all tables...');
    await sequelize.sync({ force: true });
    console.log('✅ All tables recreated successfully');
    
    // Create a test user
    console.log('👤 Creating test user...');
    const testUser = await User.create({
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      password: 'password123',
      phone: '+91-9876543210',
      role: 'user'
    });
    console.log('✅ Test user created:', testUser.email);
    
    // Test CallTemplate model
    console.log('📋 Testing CallTemplate model...');
    const testTemplate = await CallTemplate.create({
      name: 'Test Template',
      description: 'Test template for verification',
      category: 'custom',
      script: 'Hello, this is a test call.',
      createdBy: testUser.id
    });
    console.log('✅ Test template created:', testTemplate.name);
    
    // Test CallSchedule model
    console.log('📅 Testing CallSchedule model...');
    const testCampaign = await Campaign.create({
      name: 'Test Campaign',
      description: 'Test campaign for schedule',
      type: 'bulk',
      createdBy: testUser.id
    });
    
    const testSchedule = await CallSchedule.create({
      name: 'Test Schedule',
      campaignId: testCampaign.id,
      scheduleType: 'once',
      startDate: new Date(),
      createdBy: testUser.id
    });
    console.log('✅ Test schedule created:', testSchedule.name);
    
    console.log('🎉 Database issues fixed successfully!');
    console.log('📋 Summary:');
    console.log('- All tables recreated');
    console.log('- Test user created: test@example.com / password123');
    console.log('- CallTemplate model working');
    console.log('- CallSchedule model working');
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Database fix failed:', error);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
};

fixDatabaseIssues();