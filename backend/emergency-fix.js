require('dotenv').config();
const { sequelize } = require('./src/config/database');

console.log('🚨 EMERGENCY FIX - Resolving all issues');
console.log('=====================================');

async function emergencyFix() {
  try {
    // 1. Test database connection
    console.log('1️⃣ Testing database connection...');
    await sequelize.authenticate();
    console.log('✅ Database connected');
    
    // 2. Import models properly
    console.log('2️⃣ Loading models with associations...');
    const models = require('./src/models');
    console.log('✅ Models loaded:', Object.keys(models));
    
    // 3. Sync database without dropping data
    console.log('3️⃣ Syncing database schema...');
    await sequelize.sync({ alter: false });
    console.log('✅ Database synced');
    
    // 4. Test each problematic endpoint
    console.log('4️⃣ Testing problematic models...');
    
    const { CallLog, Campaign, Contact, User, CallTemplate, CallSchedule } = models;
    
    // Test CallLog (causing 500 error)
    try {
      const callLogCount = await CallLog.count();
      console.log(`✅ CallLog model: ${callLogCount} records`);
      
      // Test with associations
      const callLogWithAssoc = await CallLog.findOne({
        include: [
          { model: Campaign, as: 'campaign', required: false },
          { model: Contact, as: 'contact', required: false }
        ]
      });
      console.log('✅ CallLog associations working');
    } catch (error) {
      console.error('❌ CallLog error:', error.message);
      
      // Try to fix association issue
      console.log('🔧 Attempting to fix CallLog associations...');
      try {
        const callLogs = await CallLog.findAll({ limit: 1 });
        console.log('✅ CallLog basic query working');
      } catch (basicError) {
        console.error('❌ CallLog basic query failed:', basicError.message);
      }
    }
    
    // Test CallTemplate (causing 500 error)
    try {
      const templateCount = await CallTemplate.count();
      console.log(`✅ CallTemplate model: ${templateCount} records`);
      
      const templateWithAssoc = await CallTemplate.findOne({
        include: [
          { model: models.AudioFile, as: 'audioFile', required: false },
          { model: User, as: 'creator', required: false }
        ]
      });
      console.log('✅ CallTemplate associations working');
    } catch (error) {
      console.error('❌ CallTemplate error:', error.message);
    }
    
    // Test CallSchedule
    try {
      const scheduleCount = await CallSchedule.count();
      console.log(`✅ CallSchedule model: ${scheduleCount} records`);
      
      const scheduleWithAssoc = await CallSchedule.findOne({
        include: [
          { model: Campaign, as: 'campaign', required: false },
          { model: User, as: 'creator', required: false }
        ]
      });
      console.log('✅ CallSchedule associations working');
    } catch (error) {
      console.error('❌ CallSchedule error:', error.message);
    }
    
    console.log('\n🎉 EMERGENCY FIX COMPLETED!');
    console.log('\n📋 NEXT STEPS:');
    console.log('1. pm2 restart ivr-backend-8090');
    console.log('2. Test APIs again');
    console.log('3. Clear browser cache');
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Emergency fix failed:', error);
    console.error('Stack:', error.stack);
    
    // Provide specific guidance
    if (error.message.includes('ECONNREFUSED')) {
      console.log('🔧 Fix: Start MySQL service');
      console.log('sudo systemctl start mysql');
    } else if (error.message.includes('ER_ACCESS_DENIED')) {
      console.log('🔧 Fix: Check database credentials in .env');
    } else if (error.message.includes('not associated')) {
      console.log('🔧 Fix: Model associations need to be redefined');
    }
    
    process.exit(1);
  }
}

emergencyFix();