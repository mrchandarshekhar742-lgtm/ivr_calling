const express = require('express');
const { body, validationResult, query } = require('express-validator');
const { Op } = require('sequelize');
const { CallTemplate, AudioFile, User } = require('../models');
const auth = require('../middleware/auth');
const logger = require('../config/logger');

const router = express.Router();

// @route   GET /api/templates
// @desc    Get all call templates
// @access  Private
router.get('/', auth, [
  query('category').optional().isIn(['survey', 'reminder', 'notification', 'marketing', 'emergency', 'custom']),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid query parameters',
        errors: errors.array()
      });
    }

    const { category, page = 1, limit = 10, search } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = { isActive: true };
    if (category) whereClause.category = category;
    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } }
      ];
    }

    const templates = await CallTemplate.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: AudioFile,
          as: 'audioFile',
          attributes: ['id', 'name', 'originalName', 'size'],
          required: false
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'firstName', 'lastName', 'email']
        }
      ],
      limit: parseInt(limit),
      offset,
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: {
        templates: templates.rows,
        pagination: {
          total: templates.count,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(templates.count / limit)
        }
      }
    });
  } catch (error) {
    logger.error('Get templates error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/templates/:id
// @desc    Get single template
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const template = await CallTemplate.findByPk(req.params.id, {
      include: [
        {
          model: AudioFile,
          as: 'audioFile',
          attributes: ['id', 'name', 'originalName', 'size'],
          required: false
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'firstName', 'lastName', 'email']
        }
      ]
    });

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template not found'
      });
    }

    res.json({
      success: true,
      data: template
    });
  } catch (error) {
    logger.error('Get template error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/templates
// @desc    Create new template
// @access  Private
router.post('/', auth, [
  body('name').trim().isLength({ min: 3, max: 100 }),
  body('description').optional().trim().isLength({ max: 500 }),
  body('category').isIn(['survey', 'reminder', 'notification', 'marketing', 'emergency', 'custom']),
  body('audioFileId').optional().isInt(),
  body('script').optional().trim().isLength({ max: 2000 }),
  body('dtmfOptions').optional().isObject(),
  body('settings').optional().isObject()
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

    const { name, description, category, audioFileId, script, dtmfOptions, settings } = req.body;

    // Check if audio file exists
    if (audioFileId) {
      const audioFile = await AudioFile.findByPk(audioFileId);
      if (!audioFile) {
        return res.status(400).json({
          success: false,
          message: 'Audio file not found'
        });
      }
    }

    const template = await CallTemplate.create({
      name,
      description,
      category,
      audioFileId,
      script,
      dtmfOptions: dtmfOptions || undefined,
      settings: settings || undefined,
      createdBy: req.user.id
    });

    const createdTemplate = await CallTemplate.findByPk(template.id, {
      include: [
        {
          model: AudioFile,
          as: 'audioFile',
          attributes: ['id', 'name', 'originalName', 'size'],
          required: false
        }
      ]
    });

    logger.info(`Template created: ${template.name} by user ${req.user.id}`);

    res.status(201).json({
      success: true,
      message: 'Template created successfully',
      data: createdTemplate
    });
  } catch (error) {
    logger.error('Create template error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/templates/:id
// @desc    Update template
// @access  Private
router.put('/:id', auth, [
  body('name').optional().trim().isLength({ min: 3, max: 100 }),
  body('description').optional().trim().isLength({ max: 500 }),
  body('category').optional().isIn(['survey', 'reminder', 'notification', 'marketing', 'emergency', 'custom']),
  body('audioFileId').optional().isInt(),
  body('script').optional().trim().isLength({ max: 2000 }),
  body('dtmfOptions').optional().isObject(),
  body('settings').optional().isObject()
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

    const template = await CallTemplate.findByPk(req.params.id);
    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template not found'
      });
    }

    // Check if user owns the template or is admin
    if (template.createdBy !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const { name, description, category, audioFileId, script, dtmfOptions, settings } = req.body;

    // Check if audio file exists
    if (audioFileId) {
      const audioFile = await AudioFile.findByPk(audioFileId);
      if (!audioFile) {
        return res.status(400).json({
          success: false,
          message: 'Audio file not found'
        });
      }
    }

    await template.update({
      name: name || template.name,
      description: description !== undefined ? description : template.description,
      category: category || template.category,
      audioFileId: audioFileId !== undefined ? audioFileId : template.audioFileId,
      script: script !== undefined ? script : template.script,
      dtmfOptions: dtmfOptions || template.dtmfOptions,
      settings: settings || template.settings
    });

    const updatedTemplate = await CallTemplate.findByPk(template.id, {
      include: [
        {
          model: AudioFile,
          as: 'audioFile',
          attributes: ['id', 'name', 'originalName', 'size'],
          required: false
        }
      ]
    });

    logger.info(`Template updated: ${template.name} by user ${req.user.id}`);

    res.json({
      success: true,
      message: 'Template updated successfully',
      data: updatedTemplate
    });
  } catch (error) {
    logger.error('Update template error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   DELETE /api/templates/:id
// @desc    Delete template (soft delete)
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const template = await CallTemplate.findByPk(req.params.id);
    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template not found'
      });
    }

    // Check if user owns the template or is admin
    if (template.createdBy !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    await template.update({ isActive: false });

    logger.info(`Template deleted: ${template.name} by user ${req.user.id}`);

    res.json({
      success: true,
      message: 'Template deleted successfully'
    });
  } catch (error) {
    logger.error('Delete template error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/templates/:id/duplicate
// @desc    Duplicate template
// @access  Private
router.post('/:id/duplicate', auth, async (req, res) => {
  try {
    const originalTemplate = await CallTemplate.findByPk(req.params.id);
    if (!originalTemplate) {
      return res.status(404).json({
        success: false,
        message: 'Template not found'
      });
    }

    const duplicatedTemplate = await CallTemplate.create({
      name: `${originalTemplate.name} (Copy)`,
      description: originalTemplate.description,
      category: originalTemplate.category,
      audioFileId: originalTemplate.audioFileId,
      script: originalTemplate.script,
      dtmfOptions: originalTemplate.dtmfOptions,
      settings: originalTemplate.settings,
      createdBy: req.user.id
    });

    const newTemplate = await CallTemplate.findByPk(duplicatedTemplate.id, {
      include: [
        {
          model: AudioFile,
          as: 'audioFile',
          attributes: ['id', 'name', 'originalName', 'size'],
          required: false
        }
      ]
    });

    logger.info(`Template duplicated: ${originalTemplate.name} by user ${req.user.id}`);

    res.status(201).json({
      success: true,
      message: 'Template duplicated successfully',
      data: newTemplate
    });
  } catch (error) {
    logger.error('Duplicate template error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;