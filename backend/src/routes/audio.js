const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { body, validationResult } = require('express-validator');
const { authenticateToken } = require('../middleware/auth');
const { logger } = require('../config/logger');
const { catchAsync, AppError, sendSuccess, sendPaginatedResponse } = require('../middleware/errorHandler');

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../../uploads/audio');
    try {
      await fs.mkdir(uploadPath, { recursive: true });
      cb(null, uploadPath);
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
  const allowedTypes = ['audio/wav', 'audio/mp3', 'audio/mpeg', 'audio/m4a', 'audio/x-m4a'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError('Invalid file type. Only WAV, MP3, and M4A files are allowed.', 400, 'INVALID_FILE_TYPE'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024,
    files: 5
  }
});

// Validation rules
const createAudioValidation = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Audio name must be between 1 and 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must not exceed 500 characters'),
  body('isPublic')
    .optional()
    .isBoolean()
    .withMessage('isPublic must be a boolean')
];

// In-memory audio storage
const audioStorage = new Map();

// @route   GET /api/audio
// @desc    Get all audio files for user
// @access  Private
router.get('/', [
  body('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  body('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  body('search').optional().trim().isLength({ min: 1, max: 100 })
], catchAsync(async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new AppError('Validation failed', 400, 'VALIDATION_ERROR'));
  }

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  // Get user's audio files
  const allAudioFiles = Array.from(audioStorage.values())
    .filter(audio => audio.uploadedBy === req.user.id || audio.isPublic);

  // Filter by search
  let filtered = allAudioFiles;
  if (req.query.search) {
    filtered = allAudioFiles.filter(audio =>
      audio.name.toLowerCase().includes(req.query.search.toLowerCase()) ||
      audio.description?.toLowerCase().includes(req.query.search.toLowerCase())
    );
  }

  // Paginate
  const paginated = filtered.slice(offset, offset + limit);

  sendPaginatedResponse(res, paginated, page, limit, filtered.length, 'Audio files retrieved successfully');
}));

// @route   GET /api/audio/:id
// @desc    Get single audio file
// @access  Private
router.get('/:id', catchAsync(async (req, res, next) => {
  const audioFile = audioStorage.get(req.params.id);

  if (!audioFile || (audioFile.uploadedBy !== req.user.id && !audioFile.isPublic)) {
    return next(new AppError('Audio file not found', 404, 'AUDIO_NOT_FOUND'));
  }

  sendSuccess(res, { audioFile }, 'Audio file retrieved successfully');
}));

// @route   POST /api/audio
// @desc    Upload audio file
// @access  Private
router.post('/', upload.single('audioFile'), createAudioValidation, catchAsync(async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new AppError('Validation failed', 400, 'VALIDATION_ERROR'));
  }

  if (!req.file) {
    return next(new AppError('No audio file uploaded', 400, 'NO_FILE'));
  }

  const { name, description, isPublic = false } = req.body;
  const audioId = Date.now().toString() + '-' + Math.random().toString(36).substr(2, 9);

  const audioFile = {
    id: audioId,
    name,
    description,
    uploadedBy: req.user.id,
    isPublic,
    file: {
      originalName: req.file.originalname,
      filename: req.file.filename,
      path: req.file.path,
      size: req.file.size,
      mimeType: req.file.mimetype
    },
    processing: {
      status: 'uploaded',
      convertedFormats: [],
      language: 'en'
    },
    createdAt: new Date()
  };

  audioStorage.set(audioId, audioFile);

  logger.info('Audio file uploaded', {
    audioFileId: audioFile.id,
    name: audioFile.name,
    uploadedBy: req.user.id,
    size: audioFile.file.size
  });

  sendSuccess(res, { audioFile }, 'Audio file uploaded successfully', 201);
}));

// @route   PUT /api/audio/:id
// @desc    Update audio file metadata
// @access  Private
router.put('/:id', [
  body('name').optional().trim().isLength({ min: 1, max: 100 }),
  body('description').optional().trim().isLength({ max: 500 }),
  body('isPublic').optional().isBoolean()
], catchAsync(async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new AppError('Validation failed', 400, 'VALIDATION_ERROR'));
  }

  const audioFile = audioStorage.get(req.params.id);

  if (!audioFile || audioFile.uploadedBy !== req.user.id) {
    return next(new AppError('Audio file not found', 404, 'AUDIO_NOT_FOUND'));
  }

  // Update fields
  if (req.body.name) audioFile.name = req.body.name;
  if (req.body.description !== undefined) audioFile.description = req.body.description;
  if (req.body.isPublic !== undefined) audioFile.isPublic = req.body.isPublic;

  audioStorage.set(req.params.id, audioFile);

  logger.info('Audio file updated', {
    audioFileId: audioFile.id,
    uploadedBy: req.user.id
  });

  sendSuccess(res, { audioFile }, 'Audio file updated successfully');
}));

// @route   DELETE /api/audio/:id
// @desc    Delete audio file
// @access  Private
router.delete('/:id', catchAsync(async (req, res, next) => {
  const audioFile = audioStorage.get(req.params.id);

  if (!audioFile || audioFile.uploadedBy !== req.user.id) {
    return next(new AppError('Audio file not found', 404, 'AUDIO_NOT_FOUND'));
  }

  // Delete physical file
  try {
    await fs.unlink(audioFile.file.path);
  } catch (error) {
    logger.warn('Failed to delete audio file from disk:', error.message);
  }

  audioStorage.delete(req.params.id);

  logger.info('Audio file deleted', {
    audioFileId: audioFile.id,
    uploadedBy: req.user.id
  });

  sendSuccess(res, null, 'Audio file deleted successfully');
}));

// @route   GET /api/audio/:id/stream
// @desc    Stream audio file for playback
// @access  Private
router.get('/:id/stream', catchAsync(async (req, res, next) => {
  const audioFile = audioStorage.get(req.params.id);

  if (!audioFile || (audioFile.uploadedBy !== req.user.id && !audioFile.isPublic)) {
    return next(new AppError('Audio file not found', 404, 'AUDIO_NOT_FOUND'));
  }

  try {
    // Check if file exists
    await fs.access(audioFile.file.path);

    // Set headers
    res.setHeader('Content-Type', audioFile.file.mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${audioFile.file.originalName}"`);
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Access-Control-Allow-Headers', 'Range, Content-Range');
    res.setHeader('Access-Control-Expose-Headers', 'Content-Range');

    // Stream the file
    const stream = require('fs').createReadStream(audioFile.file.path);
    stream.pipe(res);

    stream.on('error', (error) => {
      logger.error('Stream error:', error);
      res.status(500).json({ success: false, message: 'Stream error' });
    });
  } catch (error) {
    logger.error('Audio stream error:', error);
    return next(new AppError('Failed to stream audio', 500, 'STREAM_ERROR'));
  }
}));

// @route   GET /api/audio/:id/download
// @desc    Download audio file
// @access  Private
router.get('/:id/download', catchAsync(async (req, res, next) => {
  const audioFile = audioStorage.get(req.params.id);

  if (!audioFile || (audioFile.uploadedBy !== req.user.id && !audioFile.isPublic)) {
    return next(new AppError('Audio file not found', 404, 'AUDIO_NOT_FOUND'));
  }

  try {
    // Check if file exists
    await fs.access(audioFile.file.path);

    // Set headers
    res.setHeader('Content-Type', audioFile.file.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${audioFile.file.originalName}"`);
    res.setHeader('Content-Length', audioFile.file.size);

    // Stream the file
    const stream = require('fs').createReadStream(audioFile.file.path);
    stream.pipe(res);

    stream.on('error', (error) => {
      logger.error('Download error:', error);
      res.status(500).json({ success: false, message: 'Download error' });
    });
  } catch (error) {
    logger.error('Audio download error:', error);
    return next(new AppError('Failed to download audio', 500, 'DOWNLOAD_ERROR'));
  }
}));

module.exports = router;
