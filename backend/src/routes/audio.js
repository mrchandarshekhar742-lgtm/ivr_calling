const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { Op } = require('sequelize');
const { body, validationResult } = require('express-validator');
const { AudioFile } = require('../models');
const auth = require('../middleware/auth');
const logger = require('../config/logger');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/audio');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `audio-${uniqueSuffix}${ext}`);
  }
});

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
    'audio/ogg'
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
      include: [{
        model: require('../models').User,
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
      message: 'Server error'
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

    // Create audio file record
    const audioFile = await AudioFile.create({
      name,
      originalName: req.file.originalname,
      filename: req.file.filename,
      mimeType: req.file.mimetype,
      size: req.file.size,
      path: req.file.path,
      url: `/uploads/audio/${req.file.filename}`,
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
      data: audioFile
    });
  } catch (error) {
    logger.error('Upload audio error:', error);
    
    // Clean up uploaded file if database save failed
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch (unlinkError) {
        logger.error('Failed to clean up uploaded file:', unlinkError);
      }
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error'
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
        model: require('../models').User,
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

    // Delete physical file
    try {
      await fs.unlink(audioFile.path);
    } catch (unlinkError) {
      logger.warn('Failed to delete physical file:', unlinkError);
    }

    // Delete database record
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

    // Check if file exists
    try {
      await fs.access(audioFile.path);
    } catch (error) {
      return res.status(404).json({
        success: false,
        message: 'Physical file not found'
      });
    }

    // Increment usage count
    await audioFile.increment('usageCount');

    // Set headers for download
    res.setHeader('Content-Disposition', `attachment; filename="${audioFile.originalName}"`);
    res.setHeader('Content-Type', audioFile.mimeType);

    // Send file
    res.sendFile(path.resolve(audioFile.path));

    logger.info(`Audio file downloaded: ${audioFile.name} by ${req.user.email}`);
  } catch (error) {
    logger.error('Download audio file error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;