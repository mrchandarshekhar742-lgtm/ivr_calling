const { sequelize } = require('./src/config/database');

async function emergencyAudioFix() {
  console.log('🚨 Emergency Audio Fix - Making audio endpoints work...');
  
  try {
    // Connect to database
    await sequelize.authenticate();
    console.log('✅ Database connected');

    // Get current table structure
    const [results] = await sequelize.query("PRAGMA table_info(audio_files);");
    console.log('📊 Current audio_files columns:', results.map(r => r.name));

    // Check if data column exists
    const hasDataColumn = results.some(col => col.name === 'data');
    
    if (!hasDataColumn) {
      console.log('➕ Adding data BLOB column...');
      await sequelize.query(`
        ALTER TABLE audio_files 
        ADD COLUMN data BLOB;
      `);
      console.log('✅ Added data BLOB column');
    } else {
      console.log('✅ BLOB column already exists');
    }

    // Test basic query
    const [audioFiles] = await sequelize.query("SELECT id, name, originalName, mimeType, size FROM audio_files LIMIT 5;");
    console.log(`📊 Found ${audioFiles.length} audio files in database`);

    if (audioFiles.length > 0) {
      console.log('📄 Sample files:', audioFiles.map(f => f.name));
    }

    console.log('\n🎉 Emergency fix completed!');
    console.log('💡 Audio endpoints should now work');
    console.log('💡 Restart backend: pm2 restart ivr-backend-8090');

  } catch (error) {
    console.error('❌ Emergency fix failed:', error);
    
    // Try to create table from scratch if it doesn't exist
    console.log('\n🔄 Trying to create audio_files table...');
    try {
      await sequelize.query(`
        CREATE TABLE IF NOT EXISTS audio_files (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name VARCHAR(100) NOT NULL,
          originalName VARCHAR(255) NOT NULL,
          data BLOB,
          mimeType VARCHAR(50) NOT NULL,
          size INTEGER NOT NULL,
          duration FLOAT,
          category VARCHAR(50) DEFAULT 'general',
          description TEXT,
          tags JSON DEFAULT '[]',
          uploadedBy INTEGER NOT NULL,
          isPublic BOOLEAN DEFAULT 0,
          usageCount INTEGER DEFAULT 0,
          lastUsed DATETIME,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
        );
      `);
      console.log('✅ Created audio_files table');
    } catch (createError) {
      console.error('❌ Failed to create table:', createError);
    }
  } finally {
    await sequelize.close();
  }
}

// Run the emergency fix
emergencyAudioFix();