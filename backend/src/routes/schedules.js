const express = require('express');
const { body, validationResult, query } = require('express-validator');
const { Op } = require('sequelize');
const { CallSchedule, Campaign, User } = require('../models');
const auth = require('../middleware/auth');
const logger = require('../config/logger');

const router = express.Router();

// @route   GET /api/schedules
// @desc    Get all call schedules for current user
// @access  Private
router.get('/', auth, [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('status').optional().isIn(['active', 'paused', 'all'])
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

    const { page = 1, limit = 10, status = 'all' } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = { createdBy: req.user.id };
    if (status !== 'all') {
      whereClause.isActive = status === 'active';
    }

    const schedules = await CallSchedule.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Campaign,
          as: 'campaign',
          attributes: ['id', 'name', 'status']
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'firstName', 'lastName']
        }
      ],
      limit: parseInt(limit),
      offset,
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: schedules.rows,
      pagination: {
        total: schedules.count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(schedules.count / limit)
      }
    });
  } catch (error) {
    logger.error('Get schedules error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/schedules/:id
// @desc    Get single schedule
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const schedule = await CallSchedule.findOne({
      where: { 
        id: req.params.id,
        createdBy: req.user.id 
      },
      include: [
        {
          model: Campaign,
          as: 'campaign',
          attributes: ['id', 'name', 'status', 'type']
        }
      ]
    });

    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: 'Schedule not found'
      });
    }

    res.json({
      success: true,
      data: schedule
    });
  } catch (error) {
    logger.error('Get schedule error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/schedules
// @desc    Create new schedule
// @access  Private
router.post('/', auth, [
  body('name').trim().isLength({ min: 3, max: 100 }),
  body('campaignId').isInt({ min: 1 }),
  body('scheduleType').isIn(['once', 'daily', 'weekly', 'monthly', 'custom']),
  body('startDate').isISO8601(),
  body('endDate').optional().isISO8601(),
  body('timeSlots').optional().isArray(),
  body('timezone').optional().isString(),
  body('maxCallsPerHour').optional().isInt({ min: 1, max: 1000 }),
  body('priority').optional().isInt({ min: 1, max: 10 })
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

    const { 
      name, 
      campaignId, 
      scheduleType, 
      startDate, 
      endDate, 
      timeSlots, 
      timezone, 
      maxCallsPerHour, 
      priority 
    } = req.body;

    // Check if campaign exists and belongs to user
    const campaign = await Campaign.findOne({
      where: { 
        id: campaignId,
        createdBy: req.user.id 
      }
    });

    if (!campaign) {
      return res.status(400).json({
        success: false,
        message: 'Campaign not found or access denied'
      });
    }

    const schedule = await CallSchedule.create({
      name,
      campaignId,
      scheduleType,
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : null,
      timeSlots: timeSlots || [
        { start: '09:00', end: '17:00', days: [1, 2, 3, 4, 5] }
      ],
      timezone: timezone || 'UTC',
      maxCallsPerHour: maxCallsPerHour || 100,
      priority: priority || 1,
      createdBy: req.user.id
    });

    // Calculate next execution
    await schedule.calculateNextExecution();

    const createdSchedule = await CallSchedule.findByPk(schedule.id, {
      include: [
        {
          model: Campaign,
          as: 'campaign',
          attributes: ['id', 'name', 'status']
        }
      ]
    });

    logger.info(`Schedule created: ${schedule.name} by user ${req.user.id}`);

    res.status(201).json({
      success: true,
      message: 'Schedule created successfully',
      data: createdSchedule
    });
  } catch (error) {
    logger.error('Create schedule error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/schedules/:id
// @desc    Update schedule
// @access  Private
router.put('/:id', auth, [
  body('name').optional().trim().isLength({ min: 3, max: 100 }),
  body('scheduleType').optional().isIn(['once', 'daily', 'weekly', 'monthly', 'custom']),
  body('startDate').optional().isISO8601(),
  body('endDate').optional().isISO8601(),
  body('timeSlots').optional().isArray(),
  body('maxCallsPerHour').optional().isInt({ min: 1, max: 1000 }),
  body('priority').optional().isInt({ min: 1, max: 10 }),
  body('isActive').optional().isBoolean()
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

    const schedule = await CallSchedule.findOne({
      where: { 
        id: req.params.id,
        createdBy: req.user.id 
      }
    });

    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: 'Schedule not found'
      });
    }

    const updateData = {};
    const allowedFields = [
      'name', 'scheduleType', 'startDate', 'endDate', 
      'timeSlots', 'maxCallsPerHour', 'priority', 'isActive'
    ];

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        if (field === 'startDate' || field === 'endDate') {
          updateData[field] = req.body[field] ? new Date(req.body[field]) : null;
        } else {
          updateData[field] = req.body[field];
        }
      }
    });

    await schedule.update(updateData);

    // Recalculate next execution if schedule details changed
    if (updateData.scheduleType || updateData.startDate || updateData.endDate) {
      await schedule.calculateNextExecution();
    }

    const updatedSchedule = await CallSchedule.findByPk(schedule.id, {
      include: [
        {
          model: Campaign,
          as: 'campaign',
          attributes: ['id', 'name', 'status']
        }
      ]
    });

    logger.info(`Schedule updated: ${schedule.name} by user ${req.user.id}`);

    res.json({
      success: true,
      message: 'Schedule updated successfully',
      data: updatedSchedule
    });
  } catch (error) {
    logger.error('Update schedule error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   DELETE /api/schedules/:id
// @desc    Delete schedule
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const schedule = await CallSchedule.findOne({
      where: { 
        id: req.params.id,
        createdBy: req.user.id 
      }
    });

    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: 'Schedule not found'
      });
    }

    await schedule.destroy();

    logger.info(`Schedule deleted: ${schedule.name} by user ${req.user.id}`);

    res.json({
      success: true,
      message: 'Schedule deleted successfully'
    });
  } catch (error) {
    logger.error('Delete schedule error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/schedules/:id/execute
// @desc    Manually execute schedule
// @access  Private
router.post('/:id/execute', auth, async (req, res) => {
  try {
    const schedule = await CallSchedule.findOne({
      where: { 
        id: req.params.id,
        createdBy: req.user.id 
      },
      include: [
        {
          model: Campaign,
          as: 'campaign'
        }
      ]
    });

    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: 'Schedule not found'
      });
    }

    if (!schedule.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Schedule is not active'
      });
    }

    // Update last executed time
    await schedule.update({ 
      lastExecuted: new Date(),
      nextExecution: await schedule.calculateNextExecution()
    });

    // Here you would trigger the actual campaign execution
    // For now, we'll just log it
    logger.info(`Manual execution triggered for schedule: ${schedule.name}`);

    // Emit socket event for real-time updates
    const io = req.app.get('io');
    if (io) {
      io.emit('scheduleExecuted', {
        scheduleId: schedule.id,
        scheduleName: schedule.name,
        campaignId: schedule.campaignId,
        executedAt: new Date()
      });
    }

    res.json({
      success: true,
      message: 'Schedule executed successfully',
      data: {
        executedAt: new Date(),
        nextExecution: schedule.nextExecution
      }
    });
  } catch (error) {
    logger.error('Execute schedule error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/schedules/upcoming
// @desc    Get upcoming scheduled executions
// @access  Private
router.get('/upcoming/list', auth, async (req, res) => {
  try {
    const { hours = 24 } = req.query;
    const now = new Date();
    const futureTime = new Date(now.getTime() + (hours * 60 * 60 * 1000));

    const upcomingSchedules = await CallSchedule.findAll({
      where: {
        createdBy: req.user.id,
        isActive: true,
        nextExecution: {
          [Op.between]: [now, futureTime]
        }
      },
      include: [
        {
          model: Campaign,
          as: 'campaign',
          attributes: ['id', 'name', 'status']
        }
      ],
      order: [['nextExecution', 'ASC']]
    });

    res.json({
      success: true,
      data: upcomingSchedules
    });
  } catch (error) {
    logger.error('Get upcoming schedules error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;