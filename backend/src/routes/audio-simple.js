const express = require('express');
const multer = require('multer');
const auth = require('../middleware/auth');
const logger = require('../config/logger');
const AudioFile = require('../models/AudioFile');

const router = express.Router();

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/wave',
      'audio/x-wav', 'audio/mp4', 'audio/aac', 'audio/ogg'
    ];
    
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only audio files are allowed'), false);
    }
  }
});

// @route   GET /api/audio
// @desc    Get all audio files
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const audioFiles = await AudioFile.findAll({
      where: { uploadedBy: req.user.id },
      attributes: { exclude: ['data'] }, // Don't send file data in list
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: {
        audioFiles: audioFiles,
        pagination: {
          total: audioFiles.length,
          page: 1,
          limit: 10,
          pages: Math.ceil(audioFiles.length / 10)
        }
      }
    });
  } catch (error) {
    logger.error('Get audio files error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/audio
// @desc    Upload audio file
// @access  Private
router.post('/', auth, upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Audio file is required'
      });
    }

    const { name, description, category = 'general', isPublic = false } = req.body;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Name is required'
      });
    }

    // Create audio file record in database
    const audioFile = await AudioFile.create({
      name: name.trim(),
      originalName: req.file.originalname,
      data: req.file.buffer, // Store file data as BLOB
      mimeType: req.file.mimetype,
      size: req.file.size,
      category,
      description: description || '',
      tags: [],
      isPublic: Boolean(isPublic),
      uploadedBy: req.user.id,
      usageCount: 0
    });

    logger.info(`Audio file uploaded to database: ${audioFile.name} by ${req.user.email}`);

    res.status(201).json({
      success: true,
      message: 'Audio file uploaded and saved to database successfully',
      data: {
        id: audioFile.id,
        name: audioFile.name,
        originalName: audioFile.originalName,
        mimeType: audioFile.mimeType,
        size: audioFile.size,
        category: audioFile.category,
        description: audioFile.description,
        tags: audioFile.tags,
        isPublic: audioFile.isPublic,
        usageCount: audioFile.usageCount,
        createdAt: audioFile.createdAt
      }
    });
  } catch (error) {
    logger.error('Upload audio error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
});

// @route   GET /api/audio/:id
// @desc    Get audio file by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const audioFile = await AudioFile.findByPk(req.params.id, {
      attributes: { exclude: ['data'] } // Don't send file data in info request
    });
    
    if (!audioFile) {
      return res.status(404).json({
        success: false,
        message: 'Audio file not found'
      });
    }

    // Check if user owns the file or it's public
    if (audioFile.uploadedBy !== req.user.id && !audioFile.isPublic) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.json({
      success: true,
      data: audioFile
    });
  } catch (error) {
    logger.error('Get audio file error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/audio/:id/download
// @desc    Download audio file
// @access  Private
router.get('/:id/download', auth, async (req, res) => {
  try {
    const audioFile = await AudioFile.findByPk(req.params.id);
    
    if (!audioFile) {
      return res.status(404).json({
        success: false,
        message: 'Audio file not found'
      });
    }

    // Check if user owns the file or it's public
    if (audioFile.uploadedBy !== req.user.id && !audioFile.isPublic) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Increment usage count
    await audioFile.incrementUsage();

    // Set headers for download
    res.setHeader('Content-Disposition', `attachment; filename="${audioFile.originalName}"`);
    res.setHeader('Content-Type', audioFile.mimeType);
    res.setHeader('Content-Length', audioFile.size);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Range, Content-Range, Accept-Ranges, Authorization');

    // Send file data from database
    res.send(audioFile.data);

    logger.info(`Audio file downloaded from database: ${audioFile.name} by ${req.user.email}`);
  } catch (error) {
    logger.error('Download audio file error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   DELETE /api/audio/:id
// @desc    Delete audio file
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const audioFile = await AudioFile.findByPk(req.params.id);
    
    if (!audioFile) {
      return res.status(404).json({
        success: false,
        message: 'Audio file not found'
      });
    }

    // Check if user owns the file
    if (audioFile.uploadedBy !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Delete from database
    await audioFile.destroy();

    logger.info(`Audio file deleted from database: ${audioFile.name} by ${req.user.email}`);

    res.json({
      success: true,
      message: 'Audio file deleted successfully'
    });
  } catch (error) {
    logger.error('Delete audio file error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;