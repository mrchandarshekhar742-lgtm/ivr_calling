const express = require('express');
const { Op } = require('sequelize');
const { query, validationResult } = require('express-validator');
const { CallLog, Campaign, Contact } = require('../models');
const { sequelize } = require('../config/database');
const auth = require('../middleware/auth');
const logger = require('../config/logger');

const router = express.Router();

// @route   GET /api/call-logs
// @desc    Get call logs with filters and pagination
// @access  Private
router.get('/', auth, [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('status').optional().isIn(['completed', 'failed', 'no-answer', 'busy', 'pending']),
  query('campaignId').optional().custom(value => {
    if (value === '' || value === undefined || value === null) return true;
    return Number.isInteger(parseInt(value)) && parseInt(value) > 0;
  }),
  query('startDate').optional().custom(value => {
    if (value === '' || value === undefined || value === null) return true;
    return !isNaN(Date.parse(value));
  }),
  query('endDate').optional().custom(value => {
    if (value === '' || value === undefined || value === null) return true;
    return !isNaN(Date.parse(value));
  }),
  query('search').optional().isString()
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

    const { 
      page = 1, 
      limit = 20, 
      status, 
      campaignId, 
      startDate, 
      endDate, 
      search 
    } = req.query;
    
    const offset = (page - 1) * limit;

    // Build where clause
    const whereClause = {};
    
    // Filter by user's campaigns only
    const userCampaigns = await Campaign.findAll({
      where: { createdBy: req.user.id },
      attributes: ['id']
    });
    const campaignIds = userCampaigns.map(c => c.id);
    
    if (campaignIds.length === 0) {
      return res.json({
        success: true,
        data: [],
        pagination: {
          total: 0,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: 0
        }
      });
    }
    
    whereClause.campaignId = { [Op.in]: campaignIds };

    if (status) whereClause.status = status;
    if (campaignId) whereClause.campaignId = campaignId;
    
    if (startDate || endDate) {
      whereClause.startTime = {};
      if (startDate) whereClause.startTime[Op.gte] = new Date(startDate);
      if (endDate) whereClause.startTime[Op.lte] = new Date(endDate);
    }

    if (search) {
      whereClause.deviceId = { [Op.like]: `%${search}%` };
    }

    const callLogs = await CallLog.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Campaign,
          as: 'campaign',
          attributes: ['id', 'name', 'type', 'status'],
          required: false
        },
        {
          model: Contact,
          as: 'contact',
          attributes: ['id', 'name'],
          required: false
        }
      ],
      limit: parseInt(limit),
      offset,
      order: [['startTime', 'DESC']]
    });

    res.json({
      success: true,
      data: callLogs.rows,
      pagination: {
        total: callLogs.count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(callLogs.count / limit)
      }
    });
  } catch (error) {
    logger.error('Get call logs error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/call-logs/:id
// @desc    Get single call log
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const callLog = await CallLog.findByPk(req.params.id, {
      include: [
        {
          model: Campaign,
          as: 'campaign',
          attributes: ['id', 'name', 'type', 'status'],
          where: { createdBy: req.user.id }
        },
        {
          model: Contact,
          as: 'contact',
          attributes: ['id', 'name', 'email', 'phone']
        }
      ]
    });

    if (!callLog) {
      return res.status(404).json({
        success: false,
        message: 'Call log not found'
      });
    }

    res.json({
      success: true,
      data: callLog
    });
  } catch (error) {
    logger.error('Get call log error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/call-logs/export
// @desc    Export call logs as CSV
// @access  Private
router.get('/export/csv', auth, [
  query('status').optional().isIn(['completed', 'failed', 'no-answer', 'busy', 'pending']),
  query('campaignId').optional().custom(value => {
    if (value === '' || value === undefined || value === null) return true;
    return Number.isInteger(parseInt(value)) && parseInt(value) > 0;
  }),
  query('startDate').optional().custom(value => {
    if (value === '' || value === undefined || value === null) return true;
    return !isNaN(Date.parse(value));
  }),
  query('endDate').optional().custom(value => {
    if (value === '' || value === undefined || value === null) return true;
    return !isNaN(Date.parse(value));
  }),
  query('search').optional().isString()
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

    const { status, campaignId, startDate, endDate, search } = req.query;

    // Build where clause (same as GET route)
    const whereClause = {};
    
    const userCampaigns = await Campaign.findAll({
      where: { createdBy: req.user.id },
      attributes: ['id']
    });
    const campaignIds = userCampaigns.map(c => c.id);
    
    if (campaignIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No campaigns found'
      });
    }
    
    whereClause.campaignId = { [Op.in]: campaignIds };

    if (status) whereClause.status = status;
    if (campaignId) whereClause.campaignId = campaignId;
    
    if (startDate || endDate) {
      whereClause.calledAt = {};
      if (startDate) whereClause.calledAt[Op.gte] = new Date(startDate);
      if (endDate) whereClause.calledAt[Op.lte] = new Date(endDate);
    }

    if (search) {
      whereClause.phoneNumber = { [Op.iLike]: `%${search}%` };
    }

    const callLogs = await CallLog.findAll({
      where: whereClause,
      include: [
        {
          model: Campaign,
          as: 'campaign',
          attributes: ['name', 'type']
        },
        {
          model: Contact,
          as: 'contact',
          attributes: ['name', 'email']
        }
      ],
      order: [['calledAt', 'DESC']]
    });

    // Generate CSV
    const csvHeaders = [
      'Phone Number',
      'Contact Name',
      'Contact Email',
      'Campaign Name',
      'Campaign Type',
      'Status',
      'Duration (seconds)',
      'DTMF Response',
      'Called At',
      'Device ID',
      'Error Message'
    ];

    const csvRows = callLogs.map(log => [
      log.phoneNumber,
      log.contact?.name || '',
      log.contact?.email || '',
      log.campaign?.name || '',
      log.campaign?.type || '',
      log.status,
      log.duration || 0,
      log.dtmfResponse || '',
      log.calledAt ? new Date(log.calledAt).toISOString() : '',
      log.deviceId || '',
      log.errorMessage || ''
    ]);

    const csvContent = [
      csvHeaders.join(','),
      ...csvRows.map(row => row.map(field => `"${field}"`).join(','))
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="call-logs-${new Date().toISOString().split('T')[0]}.csv"`);
    res.send(csvContent);

    logger.info(`Call logs exported by user ${req.user.id}`);
  } catch (error) {
    logger.error('Export call logs error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/call-logs/stats/summary
// @desc    Get call logs statistics summary
// @access  Private
router.get('/stats/summary', auth, [
  query('days').optional().isInt({ min: 1, max: 365 }),
  query('campaignId').optional().isInt({ min: 1 })
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

    const { days = 30, campaignId } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    // Build where clause
    const whereClause = {
      calledAt: { [Op.gte]: startDate }
    };

    // Filter by user's campaigns
    const userCampaigns = await Campaign.findAll({
      where: { createdBy: req.user.id },
      attributes: ['id']
    });
    const campaignIds = userCampaigns.map(c => c.id);
    
    if (campaignIds.length === 0) {
      return res.json({
        success: true,
        data: {
          totalCalls: 0,
          completedCalls: 0,
          failedCalls: 0,
          noAnswerCalls: 0,
          busyCalls: 0,
          successRate: 0,
          averageDuration: 0,
          totalDuration: 0
        }
      });
    }

    whereClause.campaignId = { [Op.in]: campaignIds };
    if (campaignId) whereClause.campaignId = campaignId;

    // Get call statistics
    const [
      totalCalls,
      completedCalls,
      failedCalls,
      noAnswerCalls,
      busyCalls,
      avgDuration
    ] = await Promise.all([
      CallLog.count({ where: whereClause }),
      CallLog.count({ where: { ...whereClause, status: 'completed' } }),
      CallLog.count({ where: { ...whereClause, status: 'failed' } }),
      CallLog.count({ where: { ...whereClause, status: 'no-answer' } }),
      CallLog.count({ where: { ...whereClause, status: 'busy' } }),
      CallLog.findOne({
        where: { ...whereClause, duration: { [Op.not]: null } },
        attributes: [
          [sequelize.fn('AVG', sequelize.col('duration')), 'avgDuration'],
          [sequelize.fn('SUM', sequelize.col('duration')), 'totalDuration']
        ]
      })
    ]);

    const successRate = totalCalls > 0 ? ((completedCalls / totalCalls) * 100).toFixed(2) : 0;
    const averageDuration = avgDuration?.dataValues?.avgDuration || 0;
    const totalDuration = avgDuration?.dataValues?.totalDuration || 0;

    res.json({
      success: true,
      data: {
        totalCalls,
        completedCalls,
        failedCalls,
        noAnswerCalls,
        busyCalls,
        successRate: parseFloat(successRate),
        averageDuration: Math.round(averageDuration),
        totalDuration: Math.round(totalDuration)
      }
    });
  } catch (error) {
    logger.error('Get call logs stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   DELETE /api/call-logs/:id
// @desc    Delete call log (admin only or for testing)
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const callLog = await CallLog.findByPk(req.params.id, {
      include: [
        {
          model: Campaign,
          as: 'campaign',
          where: { createdBy: req.user.id }
        }
      ]
    });

    if (!callLog) {
      return res.status(404).json({
        success: false,
        message: 'Call log not found'
      });
    }

    await callLog.destroy();

    logger.info(`Call log deleted: ${req.params.id} by user ${req.user.id}`);

    res.json({
      success: true,
      message: 'Call log deleted successfully'
    });
  } catch (error) {
    logger.error('Delete call log error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;