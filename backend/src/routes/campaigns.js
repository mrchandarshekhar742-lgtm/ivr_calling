const express = require('express');
const { body, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const logger = require('../config/logger');

const router = express.Router();

// @route   GET /api/campaigns
// @desc    Get all campaigns for user
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
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

module.exports = router;