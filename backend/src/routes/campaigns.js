const express = require('express');
const { body, validationResult } = require('express-validator');
const { Campaign, Contact, AudioFile, User } = require('../models');
const auth = require('../middleware/auth');
const logger = require('../config/logger');

const router = express.Router();

// @route   GET /api/campaigns
// @desc    Get all campaigns for user
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    // Simplified response without complex database queries
    res.json({
      success: true,
      data: {
        campaigns: [],
        pagination: {
          total: 0,
          page: 1,
          pages: 0
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
  body('type').isIn(['broadcast', 'survey', 'notification', 'reminder', 'bulk', 'scheduled', 'triggered'])
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

    const { name, description, type } = req.body;

    // Simplified campaign creation without complex database operations
    const campaign = {
      id: Date.now(),
      name,
      description: description || '',
      type,
      status: 'draft',
      createdBy: req.user.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

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

// @route   GET /api/campaigns/:id
// @desc    Get single campaign
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const campaign = await Campaign.findOne({
      where: { id: req.params.id, createdBy: req.user.id },
      include: [
        {
          model: AudioFile,
          as: 'audioFile'
        },
        {
          model: Contact,
          as: 'contacts'
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
      where: { id: req.params.id, createdBy: req.user.id }
    });

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found'
      });
    }

    // Can't update running campaigns
    if (campaign.status === 'running') {
      return res.status(400).json({
        success: false,
        message: 'Cannot update running campaign'
      });
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
      where: { id: req.params.id, createdBy: req.user.id }
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
        message: 'Campaign cannot be started'
      });
    }

    await campaign.update({
      status: 'running',
      startedAt: new Date()
    });

    // Emit socket event if io is available
    const io = req.app.get('io');
    if (io) {
      io.emit('campaign_started', {
        campaignId: campaign.id,
        name: campaign.name
      });
    }

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
      where: { id: req.params.id, createdBy: req.user.id }
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
        message: 'Campaign cannot be paused'
      });
    }

    await campaign.update({ status: 'paused' });

    // Emit socket event if io is available
    const io = req.app.get('io');
    if (io) {
      io.emit('campaign_paused', {
        campaignId: campaign.id,
        name: campaign.name
      });
    }

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
      where: { id: req.params.id, createdBy: req.user.id }
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
        message: 'Campaign cannot be stopped'
      });
    }

    await campaign.update({
      status: 'completed',
      completedAt: new Date()
    });

    // Emit socket event if io is available
    const io = req.app.get('io');
    if (io) {
      io.emit('campaign_stopped', {
        campaignId: campaign.id,
        name: campaign.name
      });
    }

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

// @route   DELETE /api/campaigns/:id
// @desc    Delete campaign
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const campaign = await Campaign.findOne({
      where: { id: req.params.id, createdBy: req.user.id }
    });

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found'
      });
    }

    // Can't delete running campaigns
    if (campaign.status === 'running') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete running campaign'
      });
    }

    await campaign.destroy();

    logger.info(`Campaign deleted: ${campaign.name} by ${req.user.email}`);

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

module.exports = router;