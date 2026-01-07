const fs = require('fs').promises;
const path = require('path');
const { AudioFile } = require('./src/models');
const { sequelize } = require('./src/config/database');

async function migrateFilesToBlob() {
  console.log('🔄 Starting migration from file storage to BLOB storage...');
  
  try {
    // Connect to database
    await sequelize.authenticate();
    console.log('✅ Database connected');

    // Update database schema first
    await sequelize.sync({ alter: true });
    console.log('✅ Database schema updated');

    // Find all audio files that have filePath but no data
    const audioFiles = await AudioFile.findAll({
      where: {
        filePath: { [require('sequelize').Op.ne]: null }
      }
    });

    console.log(`📁 Found ${audioFiles.length} files to migrate`);

    let migrated = 0;
    let failed = 0;

    for (const audioFile of audioFiles) {
      try {
        console.log(`📄 Processing: ${audioFile.name}`);
        
        // Check if file exists
        const fileExists = await fs.access(audioFile.filePath).then(() => true).catch(() => false);
        
        if (!fileExists) {
          console.log(`❌ File not found: ${audioFile.filePath}`);
          failed++;
          continue;
        }

        // Read file data
        const fileData = await fs.readFile(audioFile.filePath);
        
        // Update database record with BLOB data
        await audioFile.update({
          data: fileData,
          // Remove file-based fields
          filename: null,
          filePath: null
        });

        console.log(`✅ Migrated: ${audioFile.name} (${fileData.length} bytes)`);
        migrated++;

        // Optional: Delete the physical file after successful migration
        // await fs.unlink(audioFile.filePath);
        // console.log(`🗑️ Deleted file: ${audioFile.filePath}`);

      } catch (error) {
        console.error(`❌ Failed to migrate ${audioFile.name}:`, error.message);
        failed++;
      }
    }

    console.log('\n📊 Migration Summary:');
    console.log(`✅ Successfully migrated: ${migrated} files`);
    console.log(`❌ Failed: ${failed} files`);
    console.log(`📁 Total processed: ${audioFiles.length} files`);

    if (migrated > 0) {
      console.log('\n🎉 Migration completed successfully!');
      console.log('💡 Audio files are now stored as BLOB in database');
      console.log('💡 You can safely delete the uploads/audio folder if all files migrated successfully');
    }

  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await sequelize.close();
  }
}

// Run migration
migrateFilesToBlob();