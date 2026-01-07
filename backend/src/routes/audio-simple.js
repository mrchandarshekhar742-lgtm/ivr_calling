const express = require('express');
const multer = require('multer');
const auth = require('../middleware/auth');
const logger = require('../config/logger');

const router = express.Router();

// In-memory storage for audio files (in production, use database)
const audioFiles = new Map();

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
    const userAudioFiles = Array.from(audioFiles.values())
      .filter(file => file.uploadedBy === req.user.id)
      .map(file => ({
        ...file,
        // Don't send the actual file data in list view
        data: undefined
      }));

    res.json({
      success: true,
      data: {
        audioFiles: userAudioFiles,
        pagination: {
          total: userAudioFiles.length,
          page: 1,
          limit: 10,
          pages: Math.ceil(userAudioFiles.length / 10)
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

    // Create audio file record
    const audioFile = {
      id: Date.now(),
      name: name.trim(),
      originalName: req.file.originalname,
      data: req.file.buffer, // Store file data
      mimeType: req.file.mimetype,
      size: req.file.size,
      category,
      description: description || '',
      tags: [],
      isPublic: Boolean(isPublic),
      uploadedBy: req.user.id,
      userEmail: req.user.email,
      usageCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Store in memory
    audioFiles.set(audioFile.id, audioFile);

    logger.info(`Audio file uploaded: ${audioFile.name} by ${req.user.email}`);

    res.status(201).json({
      success: true,
      message: 'Audio file uploaded successfully',
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
    const audioFile = audioFiles.get(parseInt(req.params.id));
    
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
      data: {
        ...audioFile,
        data: undefined // Don't send file data in info request
      }
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
    const audioFile = audioFiles.get(parseInt(req.params.id));
    
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
    audioFile.usageCount = (audioFile.usageCount || 0) + 1;
    audioFiles.set(audioFile.id, audioFile);

    // Set headers for download
    res.setHeader('Content-Disposition', `attachment; filename="${audioFile.originalName}"`);
    res.setHeader('Content-Type', audioFile.mimeType);
    res.setHeader('Content-Length', audioFile.size);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Range, Content-Range, Accept-Ranges, Authorization');

    // Send file data
    res.send(audioFile.data);

    logger.info(`Audio file downloaded: ${audioFile.name} by ${req.user.email}`);
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
    const audioFile = audioFiles.get(parseInt(req.params.id));
    
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

    // Delete from memory
    audioFiles.delete(parseInt(req.params.id));

    logger.info(`Audio file deleted: ${audioFile.name} by ${req.user.email}`);

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