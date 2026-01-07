const express = require('express');
const multer = require('multer');
const { body, validationResult } = require('express-validator');
const { AudioFile, User } = require('../models');
const auth = require('../middleware/auth');
const logger = require('../config/logger');
const { Op } = require('sequelize');

const router = express.Router();

// Configure multer for memory storage (BLOB)
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  // Accept audio files only
  const allowedMimes = [
    'audio/mpeg',
    'audio/mp3',
    'audio/wav',
    'audio/wave',
    'audio/x-wav',
    'audio/mp4',
    'audio/aac',
    'audio/ogg',
    'audio/webm',
    'audio/flac'
  ];
  
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only audio files are allowed'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  }
});

// @route   GET /api/audio
// @desc    Get all audio files
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, category, search } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = {};
    
    // Filter by category
    if (category) {
      whereClause.category = category;
    }
    
    // Search in name and description
    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } }
      ];
    }

    const { count, rows } = await AudioFile.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']],
      attributes: { exclude: ['data'] }, // Exclude BLOB data from list view
      include: [{
        model: User,
        as: 'uploader',
        attributes: ['id', 'firstName', 'lastName', 'email']
      }]
    });

    res.json({
      success: true,
      data: {
        audioFiles: rows,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(count / limit)
        }
      }
    });
  } catch (error) {
    logger.error('Get audio files error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   POST /api/audio
// @desc    Upload audio file
// @access  Private
router.post('/', auth, upload.single('audio'), [
  body('name').trim().isLength({ min: 1, max: 255 }),
  body('description').optional().trim().isLength({ max: 1000 }),
  body('category').optional().trim().isLength({ max: 50 }),
  body('tags').optional().isArray()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid input',
        errors: errors.array()
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Audio file is required'
      });
    }

    const { name, description, category = 'general', tags = [], isPublic = false } = req.body;

    // Create audio file record with BLOB data
    const audioFile = await AudioFile.create({
      name,
      originalName: req.file.originalname,
      data: req.file.buffer, // Store file as BLOB
      mimeType: req.file.mimetype,
      size: req.file.size,
      category,
      description,
      tags: Array.isArray(tags) ? tags : [],
      uploadedBy: req.user.id,
      isPublic: Boolean(isPublic)
    });

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
        createdAt: audioFile.createdAt
      }
    });
  } catch (error) {
    logger.error('Upload audio error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   GET /api/audio/:id
// @desc    Get audio file by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const audioFile = await AudioFile.findByPk(req.params.id, {
      include: [{
        model: User,
        as: 'uploader',
        attributes: ['id', 'firstName', 'lastName', 'email']
      }]
    });

    if (!audioFile) {
      return res.status(404).json({
        success: false,
        message: 'Audio file not found'
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

// @route   PUT /api/audio/:id
// @desc    Update audio file
// @access  Private
router.put('/:id', auth, [
  body('name').optional().trim().isLength({ min: 1, max: 255 }),
  body('description').optional().trim().isLength({ max: 1000 }),
  body('category').optional().trim().isLength({ max: 50 }),
  body('tags').optional().isArray()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid input',
        errors: errors.array()
      });
    }

    const audioFile = await AudioFile.findByPk(req.params.id);
    if (!audioFile) {
      return res.status(404).json({
        success: false,
        message: 'Audio file not found'
      });
    }

    // Check if user owns the file or is admin
    if (audioFile.uploadedBy !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const { name, description, category, tags, isPublic } = req.body;

    await audioFile.update({
      name: name || audioFile.name,
      description: description !== undefined ? description : audioFile.description,
      category: category || audioFile.category,
      tags: tags || audioFile.tags,
      isPublic: isPublic !== undefined ? Boolean(isPublic) : audioFile.isPublic
    });

    logger.info(`Audio file updated: ${audioFile.name} by ${req.user.email}`);

    res.json({
      success: true,
      message: 'Audio file updated successfully',
      data: audioFile
    });
  } catch (error) {
    logger.error('Update audio file error:', error);
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

    // Check if user owns the file or is admin
    if (audioFile.uploadedBy !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Check if file is being used in any campaigns
    const { Campaign } = require('../models');
    const campaignCount = await Campaign.count({
      where: { audioFileId: audioFile.id }
    });

    if (campaignCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete audio file that is being used in campaigns'
      });
    }

    // Delete database record (BLOB data will be automatically deleted)
    await audioFile.destroy();

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

    // Increment usage count
    await audioFile.increment('usageCount');

    // Set headers for download
    res.setHeader('Content-Disposition', `attachment; filename="${audioFile.originalName}"`);
    res.setHeader('Content-Type', audioFile.mimeType);
    res.setHeader('Content-Length', audioFile.size);

    // Send BLOB data
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

// @route   GET /api/audio/:id/stream
// @desc    Stream audio file for playback
// @access  Private
router.get('/:id/stream', auth, async (req, res) => {
  try {
    const audioFile = await AudioFile.findByPk(req.params.id);
    if (!audioFile) {
      return res.status(404).json({
        success: false,
        message: 'Audio file not found'
      });
    }

    // Set CORS headers for audio streaming
    res.setHeader('Access-Control-Allow-Origin', process.env.FRONTEND_URL || 'https://ivr.wxon.in');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Range, Content-Range, Accept-Ranges, Authorization');
    res.setHeader('Access-Control-Expose-Headers', 'Content-Range, Accept-Ranges, Content-Length');
    
    // Set headers for audio streaming
    res.setHeader('Content-Type', audioFile.mimeType);
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Cache-Control', 'public, max-age=3600');

    // Handle range requests for audio seeking
    const range = req.headers.range;
    const audioData = audioFile.data;
    const audioSize = audioData.length;
    
    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : audioSize - 1;
      const chunksize = (end - start) + 1;
      
      res.status(206);
      res.setHeader('Content-Range', `bytes ${start}-${end}/${audioSize}`);
      res.setHeader('Content-Length', chunksize);
      
      // Send partial content
      res.send(audioData.slice(start, end + 1));
    } else {
      // Send full file
      res.setHeader('Content-Length', audioSize);
      res.send(audioData);
    }

    logger.info(`Audio file streamed: ${audioFile.name} by ${req.user.email}`);
  } catch (error) {
    logger.error('Stream audio file error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/audio/:id/token
// @desc    Generate temporary access token for audio streaming
// @access  Private
router.get('/:id/token', auth, async (req, res) => {
  try {
    const audioFile = await AudioFile.findByPk(req.params.id);
    if (!audioFile) {
      return res.status(404).json({
        success: false,
        message: 'Audio file not found'
      });
    }

    // Generate temporary token (valid for 1 hour)
    const crypto = require('crypto');
    const tempToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Store temp token in memory (in production, use Redis)
    if (!global.audioTokens) {
      global.audioTokens = new Map();
    }
    
    global.audioTokens.set(tempToken, {
      audioId: audioFile.id,
      userId: req.user.id,
      expiresAt
    });

    // Clean up expired tokens
    for (const [token, data] of global.audioTokens.entries()) {
      if (data.expiresAt < new Date()) {
        global.audioTokens.delete(token);
      }
    }

    res.json({
      success: true,
      data: {
        token: tempToken,
        streamUrl: `${process.env.API_URL || 'https://ivr.wxon.in/api'}/audio/stream/${tempToken}`,
        expiresAt: expiresAt.toISOString()
      }
    });
  } catch (error) {
    logger.error('Generate audio token error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/audio/stream/:token
// @desc    Stream audio file using temporary token (no auth required)
// @access  Public
router.get('/stream/:token', async (req, res) => {
  try {
    const { token } = req.params;
    
    // Check if token exists and is valid
    if (!global.audioTokens || !global.audioTokens.has(token)) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }

    const tokenData = global.audioTokens.get(token);
    
    // Check if token is expired
    if (tokenData.expiresAt < new Date()) {
      global.audioTokens.delete(token);
      return res.status(401).json({
        success: false,
        message: 'Token expired'
      });
    }

    // Get audio file
    const audioFile = await AudioFile.findByPk(tokenData.audioId);
    if (!audioFile) {
      return res.status(404).json({
        success: false,
        message: 'Audio file not found'
      });
    }

    // Set CORS headers for audio streaming
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Range, Content-Range, Accept-Ranges');
    res.setHeader('Access-Control-Expose-Headers', 'Content-Range, Accept-Ranges, Content-Length');
    
    // Set headers for audio streaming
    res.setHeader('Content-Type', audioFile.mimeType);
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Cache-Control', 'public, max-age=3600');

    // Handle range requests for audio seeking
    const range = req.headers.range;
    const audioData = audioFile.data;
    const audioSize = audioData.length;
    
    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : audioSize - 1;
      const chunksize = (end - start) + 1;
      
      res.status(206);
      res.setHeader('Content-Range', `bytes ${start}-${end}/${audioSize}`);
      res.setHeader('Content-Length', chunksize);
      
      // Send partial content
      res.send(audioData.slice(start, end + 1));
    } else {
      // Send full file
      res.setHeader('Content-Length', audioSize);
      res.send(audioData);
    }

    logger.info(`Audio file streamed via token: ${audioFile.name}`);
  } catch (error) {
    logger.error('Stream audio via token error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;