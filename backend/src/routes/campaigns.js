const express = require('express');
const { body, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const logger = require('../config/logger');
const { Campaign, AudioFile } = require('../models');

const router = express.Router();

// @route   GET /api/campaigns
// @desc    Get all campaigns for user
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = { createdBy: req.user.id };
    if (status) whereClause.status = status;

    const campaigns = await Campaign.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: AudioFile,
          as: 'audioFile',
          attributes: ['id', 'name', 'originalName', 'size']
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: {
        campaigns: campaigns.rows,
        pagination: {
          total: campaigns.count,
          page: parseInt(page),
          pages: Math.ceil(campaigns.count / limit)
        }
      }
    });
  } catch (error) {
    logger.error('Get campaigns error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/campaigns
// @desc    Create new campaign
// @access  Private
router.post('/', auth, [
  body('name').trim().isLength({ min: 3, max: 100 }),
  body('description').optional().trim(),
  body('type').isIn(['broadcast', 'survey', 'notification', 'reminder', 'bulk', 'scheduled', 'triggered']),
  body('audioFileId').optional().isInt()
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

    const { name, description, type, audioFileId, settings } = req.body;

    // Verify audio file exists if provided
    if (audioFileId) {
      const audioFile = await AudioFile.findOne({
        where: { 
          id: audioFileId,
          uploadedBy: req.user.id
        }
      });
      if (!audioFile) {
        return res.status(400).json({
          success: false,
          message: 'Audio file not found'
        });
      }
    }

    const campaign = await Campaign.create({
      name,
      description: description || '',
      type,
      audioFileId: audioFileId || null,
      settings: settings || {
        maxRetries: 3,
        retryDelay: 300,
        callTimeout: 30,
        dtmfTimeout: 10
      },
      status: 'draft',
      createdBy: req.user.id
    });

    logger.info(`Campaign created: ${campaign.name} by ${req.user.email}`);

    res.status(201).json({
      success: true,
      message: 'Campaign created successfully',
      data: campaign
    });
  } catch (error) {
    logger.error('Create campaign error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/campaigns/:id
// @desc    Update campaign
// @access  Private
router.put('/:id', auth, [
  body('name').optional().trim().isLength({ min: 3, max: 100 }),
  body('description').optional().trim(),
  body('type').optional().isIn(['broadcast', 'survey', 'notification', 'reminder', 'bulk', 'scheduled', 'triggered']),
  body('audioFileId').optional().isInt()
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

    const campaign = await Campaign.findOne({
      where: { 
        id: req.params.id,
        createdBy: req.user.id 
      }
    });

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found'
      });
    }

    // Verify audio file exists if provided
    if (req.body.audioFileId) {
      const audioFile = await AudioFile.findOne({
        where: { 
          id: req.body.audioFileId,
          uploadedBy: req.user.id
        }
      });
      if (!audioFile) {
        return res.status(400).json({
          success: false,
          message: 'Audio file not found'
        });
      }
    }

    await campaign.update(req.body);

    logger.info(`Campaign updated: ${campaign.name} by ${req.user.email}`);

    res.json({
      success: true,
      message: 'Campaign updated successfully',
      data: campaign
    });
  } catch (error) {
    logger.error('Update campaign error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/campaigns/:id/start
// @desc    Start campaign
// @access  Private
router.post('/:id/start', auth, async (req, res) => {
  try {
    const campaign = await Campaign.findOne({
      where: { 
        id: req.params.id,
        createdBy: req.user.id 
      }
    });

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found'
      });
    }

    if (!campaign.canStart()) {
      return res.status(400).json({
        success: false,
        message: 'Campaign cannot be started in current state'
      });
    }

    await campaign.update({
      status: 'running',
      startedAt: new Date()
    });

    logger.info(`Campaign started: ${campaign.name} by ${req.user.email}`);

    res.json({
      success: true,
      message: 'Campaign started successfully',
      data: campaign
    });
  } catch (error) {
    logger.error('Start campaign error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/campaigns/:id/pause
// @desc    Pause campaign
// @access  Private
router.post('/:id/pause', auth, async (req, res) => {
  try {
    const campaign = await Campaign.findOne({
      where: { 
        id: req.params.id,
        createdBy: req.user.id 
      }
    });

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found'
      });
    }

    if (!campaign.canPause()) {
      return res.status(400).json({
        success: false,
        message: 'Campaign cannot be paused in current state'
      });
    }

    await campaign.update({
      status: 'paused'
    });

    logger.info(`Campaign paused: ${campaign.name} by ${req.user.email}`);

    res.json({
      success: true,
      message: 'Campaign paused successfully',
      data: campaign
    });
  } catch (error) {
    logger.error('Pause campaign error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/campaigns/:id/stop
// @desc    Stop campaign
// @access  Private
router.post('/:id/stop', auth, async (req, res) => {
  try {
    const campaign = await Campaign.findOne({
      where: { 
        id: req.params.id,
        createdBy: req.user.id 
      }
    });

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found'
      });
    }

    if (!campaign.canStop()) {
      return res.status(400).json({
        success: false,
        message: 'Campaign cannot be stopped in current state'
      });
    }

    await campaign.update({
      status: 'completed',
      completedAt: new Date()
    });

    logger.info(`Campaign stopped: ${campaign.name} by ${req.user.email}`);

    res.json({
      success: true,
      message: 'Campaign stopped successfully',
      data: campaign
    });
  } catch (error) {
    logger.error('Stop campaign error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/campaigns/:id/resume
// @desc    Resume paused campaign
// @access  Private
router.post('/:id/resume', auth, async (req, res) => {
  try {
    const campaign = await Campaign.findOne({
      where: { 
        id: req.params.id,
        createdBy: req.user.id 
      }
    });

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found'
      });
    }

    if (campaign.status !== 'paused') {
      return res.status(400).json({
        success: false,
        message: 'Only paused campaigns can be resumed'
      });
    }

    await campaign.update({
      status: 'running'
    });

    logger.info(`Campaign resumed: ${campaign.name} by ${req.user.email}`);

    res.json({
      success: true,
      message: 'Campaign resumed successfully',
      data: campaign
    });
  } catch (error) {
    logger.error('Resume campaign error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   DELETE /api/campaigns/:id
// @desc    Delete campaign
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const campaign = await Campaign.findOne({
      where: { 
        id: req.params.id,
        createdBy: req.user.id 
      }
    });

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found'
      });
    }

    if (!['draft', 'completed', 'cancelled'].includes(campaign.status)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete active or running campaigns'
      });
    }

    const campaignName = campaign.name;
    await campaign.destroy();

    logger.info(`Campaign deleted: ${campaignName} by ${req.user.email}`);

    res.json({
      success: true,
      message: 'Campaign deleted successfully'
    });
  } catch (error) {
    logger.error('Delete campaign error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/campaigns/:id
// @desc    Get single campaign
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const campaign = await Campaign.findOne({
      where: { 
        id: req.params.id,
        createdBy: req.user.id 
      },
      include: [
        {
          model: AudioFile,
          as: 'audioFile',
          attributes: ['id', 'name', 'originalName', 'size', 'mimeType']
        }
      ]
    });

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found'
      });
    }

    res.json({
      success: true,
      data: campaign
    });
  } catch (error) {
    logger.error('Get campaign error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;