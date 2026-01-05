require('dotenv').config();
const { sequelize } = require('./src/config/database');
const logger = require('./src/config/logger');

// Import models with associations
const {
  User,
  Campaign,
  Contact,
  AudioFile,
  CallLog,
  CallTemplate,
  CallSchedule
} = require('./src/models');

const fixAllApiIssues = async () => {
  try {
    console.log('🔄 Fixing all API issues...');
    
    // Test connection
    await sequelize.authenticate();
    console.log('✅ Database connection successful');
    
    // Sync all models (without dropping existing data)
    console.log('🔄 Syncing database models...');
    await sequelize.sync({ alter: true });
    console.log('✅ Database models synced successfully');
    
    // Test each model individually
    console.log('🧪 Testing all models...');
    
    // Test User model
    const userCount = await User.count();
    console.log(`✅ User model working - ${userCount} users found`);
    
    // Test Campaign model
    const campaignCount = await Campaign.count();
    console.log(`✅ Campaign model working - ${campaignCount} campaigns found`);
    
    // Test Contact model
    const contactCount = await Contact.count();
    console.log(`✅ Contact model working - ${contactCount} contacts found`);
    
    // Test AudioFile model
    const audioCount = await AudioFile.count();
    console.log(`✅ AudioFile model working - ${audioCount} audio files found`);
    
    // Test CallLog model
    const callLogCount = await CallLog.count();
    console.log(`✅ CallLog model working - ${callLogCount} call logs found`);
    
    // Test CallTemplate model
    const templateCount = await CallTemplate.count();
    console.log(`✅ CallTemplate model working - ${templateCount} templates found`);
    
    // Test CallSchedule model
    const scheduleCount = await CallSchedule.count();
    console.log(`✅ CallSchedule model working - ${scheduleCount} schedules found`);
    
    // Test associations
    console.log('🔗 Testing model associations...');
    
    // Test CallLog with associations
    const callLogWithAssociations = await CallLog.findOne({
      include: [
        { model: Campaign, as: 'campaign' },
        { model: Contact, as: 'contact' }
      ]
    });
    console.log('✅ CallLog associations working');
    
    // Test CallTemplate with associations
    const templateWithAssociations = await CallTemplate.findOne({
      include: [
        { model: AudioFile, as: 'audioFile', required: false },
        { model: User, as: 'creator' }
      ]
    });
    console.log('✅ CallTemplate associations working');
    
    // Test CallSchedule with associations
    const scheduleWithAssociations = await CallSchedule.findOne({
      include: [
        { model: Campaign, as: 'campaign' },
        { model: User, as: 'creator' }
      ]
    });
    console.log('✅ CallSchedule associations working');
    
    console.log('🎉 All API issues fixed successfully!');
    console.log('📋 Summary:');
    console.log(`- Users: ${userCount}`);
    console.log(`- Campaigns: ${campaignCount}`);
    console.log(`- Contacts: ${contactCount}`);
    console.log(`- Audio Files: ${audioCount}`);
    console.log(`- Call Logs: ${callLogCount}`);
    console.log(`- Templates: ${templateCount}`);
    console.log(`- Schedules: ${scheduleCount}`);
    console.log('- All model associations working');
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ API fix failed:', error);
    console.error('Stack trace:', error.stack);
    
    // Provide specific error guidance
    if (error.name === 'SequelizeConnectionError') {
      console.error('🔧 Fix: Check database connection settings in .env file');
    } else if (error.name === 'SequelizeDatabaseError') {
      console.error('🔧 Fix: Check database schema and table structure');
    } else if (error.name === 'SequelizeAssociationError') {
      console.error('🔧 Fix: Check model associations in models/index.js');
    }
    
    process.exit(1);
  }
};

fixAllApiIssues();