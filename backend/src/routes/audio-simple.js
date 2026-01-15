const express = require('express');
const auth = require('../middleware/auth');
const logger = require('../config/logger');
const { AudioFile } = require('../models');

const router = express.Router();

// @route   GET /api/audio
// @desc    Get all audio files for user
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const audioFiles = await AudioFile.findAll({
      where: { uploadedBy: req.user.id },
      order: [['createdAt', 'DESC']],
      attributes: ['id', 'name', 'originalName', 'size', 'duration', 'mimeType', 'createdAt']
    });

    res.json({
      success: true,
      data: {
        audioFiles
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

// @route   GET /api/audio/:id
// @desc    Get single audio file
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const audioFile = await AudioFile.findOne({
      where: { 
        id: req.params.id,
        uploadedBy: req.user.id 
      }
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

module.exports = router;