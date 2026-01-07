const { sequelize } = require('./src/config/database');
const { AudioFile } = require('./src/models');

async function fixAudioSchema() {
  console.log('🔧 Fixing Audio Schema for BLOB Storage...');
  
  try {
    // Connect to database
    await sequelize.authenticate();
    console.log('✅ Database connected');

    // Check current schema
    const tableInfo = await sequelize.getQueryInterface().describeTable('audio_files');
    console.log('📊 Current audio_files schema:', Object.keys(tableInfo));

    // Check if we need to add BLOB field
    if (!tableInfo.data) {
      console.log('➕ Adding data BLOB field...');
      await sequelize.getQueryInterface().addColumn('audio_files', 'data', {
        type: sequelize.Sequelize.BLOB('long'),
        allowNull: true, // Allow null initially for migration
        comment: 'Audio file binary data stored as BLOB'
      });
      console.log('✅ Added data BLOB field');
    } else {
      console.log('✅ BLOB field already exists');
    }

    // Sync the model to ensure all fields are correct
    await AudioFile.sync({ alter: true });
    console.log('✅ AudioFile model synced');

    // Test the model
    const count = await AudioFile.count();
    console.log(`📊 Total audio files in database: ${count}`);

    console.log('\n🎉 Audio schema fix completed!');
    console.log('💡 Backend should now work without 500 errors');

  } catch (error) {
    console.error('❌ Schema fix failed:', error);
    
    // If there's an issue, let's try a more basic approach
    console.log('\n🔄 Trying basic schema sync...');
    try {
      await sequelize.sync({ alter: true });
      console.log('✅ Basic schema sync completed');
    } catch (syncError) {
      console.error('❌ Basic sync also failed:', syncError);
    }
  } finally {
    await sequelize.close();
  }
}

// Run the fix
fixAudioSchema();