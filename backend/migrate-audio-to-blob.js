const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

const { connectDB } = require('./src/config/database');
const { AudioFile } = require('./src/models');
const logger = require('./src/config/logger');

async function migrateAudioToBlob() {
  try {
    logger.info('🔄 Starting audio file migration to BLOB storage...');
    
    // Connect to database
    await connectDB();
    
    // Find all audio files that still have file paths
    const audioFiles = await AudioFile.findAll({
      where: {
        audioData: null // Files that haven't been migrated yet
      }
    });
    
    logger.info(`📁 Found ${audioFiles.length} audio files to migrate`);
    
    let migrated = 0;
    let failed = 0;
    
    for (const audioFile of audioFiles) {
      try {
        // Check if the old file path exists
        const oldPath = audioFile.path || path.join(__dirname, 'uploads/audio', audioFile.filename);
        
        try {
          // Read the file data
          const audioData = await fs.readFile(oldPath);
          
          // Update the database record with BLOB data
          await audioFile.update({
            audioData: audioData
          });
          
          // Optionally remove the old file
          try {
            await fs.unlink(oldPath);
            logger.info(`✅ Migrated and cleaned up: ${audioFile.name}`);
          } catch (unlinkError) {
            logger.warn(`⚠️ Migrated but couldn't delete old file: ${audioFile.name}`);
          }
          
          migrated++;
        } catch (fileError) {
          logger.warn(`⚠️ File not found, skipping: ${audioFile.name} (${oldPath})`);
          failed++;
        }
      } catch (error) {
        logger.error(`❌ Failed to migrate ${audioFile.name}:`, error);
        failed++;
      }
    }
    
    logger.info(`🎉 Migration completed! Migrated: ${migrated}, Failed: ${failed}`);
    
    if (migrated > 0) {
      logger.info('✨ All audio files are now stored in the database as BLOB data');
    }
    
    process.exit(0);
  } catch (error) {
    logger.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration if called directly
if (require.main === module) {
  migrateAudioToBlob();
}

module.exports = { migrateAudioToBlob };