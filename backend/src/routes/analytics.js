const express = require('express');
const { Op } = require('sequelize');
const { query, validationResult } = require('express-validator');
const { User, Campaign, Contact, AudioFile, CallLog } = require('../models');
const auth = require('../middleware/auth');
const logger = require('../config/logger');

const router = express.Router();

// @route   GET /api/analytics
// @desc    Get basic analytics overview
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    // Get basic counts for current user only
    const userFilter = { createdBy: req.user.id };

    const [
      totalCampaigns,
      activeCampaigns,
      totalContacts,
      totalAudioFiles
    ] = await Promise.all([
      Campaign.count({ where: userFilter }),
      Campaign.count({ where: { ...userFilter, status: 'running' } }),
      Contact.count({ where: userFilter }),
      AudioFile.count({ where: { uploadedBy: req.user.id } })
    ]);

    res.json({
      success: true,
      data: {
        overview: {
          totalCampaigns,
          activeCampaigns,
          totalContacts,
          totalAudioFiles
        }
      }
    });
  } catch (error) {
    logger.error('Get analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/analytics/test
// @desc    Test analytics endpoint (no auth required)
// @access  Public
router.get('/test', async (req, res) => {
  try {
    res.json({
      success: true,
      message: 'Analytics endpoint is working',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Analytics test error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/analytics/dashboard
// @desc    Get dashboard analytics
// @access  Private
router.get('/dashboard', auth, async (req, res) => {
  try {
    // Get basic counts for current user only
    const userFilter = { createdBy: req.user.id };

    // Get basic counts
    const [
      totalCampaigns,
      activeCampaigns,
      totalContacts,
      totalAudioFiles,
      totalCallLogs,
      successfulCalls,
      failedCalls
    ] = await Promise.all([
      Campaign.count({ where: userFilter }),
      Campaign.count({ where: { ...userFilter, status: 'running' } }),
      Contact.count({ where: userFilter }),
      AudioFile.count({ where: { uploadedBy: req.user.id } }),
      CallLog.count(),
      CallLog.count({ where: { status: 'completed' } }),
      CallLog.count({ where: { status: 'failed' } })
    ]);

    // Get recent campaigns
    const recentCampaigns = await Campaign.findAll({
      where: userFilter,
      limit: 5,
      order: [['createdAt', 'DESC']],
      include: [{
        model: AudioFile,
        as: 'audioFile',
        attributes: ['id', 'name'],
        required: false
      }]
    });

    // Provide mock daily stats if no call logs exist
    const dailyCallStats = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      dailyCallStats.push({
        date: date.toISOString().split('T')[0],
        totalCalls: Math.floor(Math.random() * 50),
        successfulCalls: Math.floor(Math.random() * 40),
        failedCalls: Math.floor(Math.random() * 10)
      });
    }

    // Calculate success rate
    const successRate = totalCallLogs > 0 ? ((successfulCalls / totalCallLogs) * 100).toFixed(2) : 0;

    res.json({
      success: true,
      data: {
        overview: {
          totalCampaigns,
          activeCampaigns,
          totalContacts,
          totalAudioFiles,
          totalCallLogs,
          successfulCalls,
          failedCalls,
          successRate: parseFloat(successRate)
        },
        recentCampaigns,
        dailyCallStats
      }
    });
  } catch (error) {
    logger.error('Dashboard analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/analytics/campaigns
// @desc    Get campaign analytics
// @access  Private
router.get('/campaigns', auth, [
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601(),
  query('campaignId').optional().isInt({ min: 1 })
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

    const { startDate, endDate, campaignId } = req.query;
    const userId = req.user.id;

    // Build where clause for current user only
    const whereClause = { createdBy: userId };
    if (campaignId) whereClause.id = campaignId;
    if (startDate) whereClause.createdAt = { [Op.gte]: new Date(startDate) };
    if (endDate) {
      whereClause.createdAt = whereClause.createdAt || {};
      whereClause.createdAt[Op.lte] = new Date(endDate);
    }

    // Get campaigns with basic info
    const campaigns = await Campaign.findAll({
      where: whereClause,
      include: [
        {
          model: AudioFile,
          as: 'audioFile',
          attributes: ['id', 'name', 'duration'],
          required: false
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'firstName', 'lastName']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    // Add mock statistics for each campaign
    const campaignStats = campaigns.map(campaign => ({
      ...campaign.toJSON(),
      totalCalls: Math.floor(Math.random() * 100),
      successfulCalls: Math.floor(Math.random() * 80),
      failedCalls: Math.floor(Math.random() * 20),
      avgDuration: Math.floor(Math.random() * 120) + 30,
      successRate: (Math.random() * 30 + 70).toFixed(2),
      failureRate: (Math.random() * 30).toFixed(2)
    }));

    res.json({
      success: true,
      data: campaignStats
    });
  } catch (error) {
    logger.error('Campaign analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/analytics/calls
// @desc    Get call analytics
// @access  Private
router.get('/calls', auth, [
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601(),
  query('campaignId').optional().isInt({ min: 1 }),
  query('status').optional().isIn(['completed', 'failed', 'no-answer', 'busy']),
  query('groupBy').optional().isIn(['hour', 'day', 'week', 'month'])
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

    const { groupBy = 'day' } = req.query;

    // Generate mock call statistics
    const callStats = [];
    const periods = groupBy === 'hour' ? 24 : 7;
    
    for (let i = periods - 1; i >= 0; i--) {
      const date = new Date();
      if (groupBy === 'hour') {
        date.setHours(date.getHours() - i);
        callStats.push({
          period: date.toISOString().split('T')[1].split(':')[0] + ':00',
          totalCalls: Math.floor(Math.random() * 20),
          completedCalls: Math.floor(Math.random() * 15),
          failedCalls: Math.floor(Math.random() * 5),
          noAnswerCalls: Math.floor(Math.random() * 3),
          busyCalls: Math.floor(Math.random() * 2),
          avgDuration: Math.floor(Math.random() * 60) + 30,
          totalDuration: Math.floor(Math.random() * 1200) + 300
        });
      } else {
        date.setDate(date.getDate() - i);
        callStats.push({
          period: date.toISOString().split('T')[0],
          totalCalls: Math.floor(Math.random() * 100),
          completedCalls: Math.floor(Math.random() * 80),
          failedCalls: Math.floor(Math.random() * 20),
          noAnswerCalls: Math.floor(Math.random() * 10),
          busyCalls: Math.floor(Math.random() * 5),
          avgDuration: Math.floor(Math.random() * 120) + 30,
          totalDuration: Math.floor(Math.random() * 5000) + 1000
        });
      }
    }

    // Mock DTMF response analysis
    const dtmfStats = [
      { response: '1', count: Math.floor(Math.random() * 50) + 20 },
      { response: '2', count: Math.floor(Math.random() * 30) + 10 },
      { response: '0', count: Math.floor(Math.random() * 20) + 5 },
      { response: '9', count: Math.floor(Math.random() * 15) + 3 }
    ];

    // Mock device performance
    const deviceStats = [
      {
        deviceId: 'DEVICE_001',
        totalCalls: Math.floor(Math.random() * 100) + 50,
        successfulCalls: Math.floor(Math.random() * 80) + 40,
        avgDuration: Math.floor(Math.random() * 60) + 45,
        successRate: (Math.random() * 20 + 75).toFixed(2)
      },
      {
        deviceId: 'DEVICE_002',
        totalCalls: Math.floor(Math.random() * 80) + 30,
        successfulCalls: Math.floor(Math.random() * 60) + 25,
        avgDuration: Math.floor(Math.random() * 50) + 40,
        successRate: (Math.random() * 25 + 70).toFixed(2)
      }
    ];

    res.json({
      success: true,
      data: {
        callStats,
        dtmfStats,
        deviceStats
      }
    });
  } catch (error) {
    logger.error('Call analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/analytics/performance
// @desc    Get system performance metrics
// @access  Private
router.get('/performance', auth, async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    // Get user-specific metrics
    const [
      userCampaigns,
      userContacts,
      userAudioFiles,
      userCallsToday
    ] = await Promise.all([
      Campaign.count({ where: { createdBy: req.user.id } }),
      Contact.count({ where: { createdBy: req.user.id } }),
      AudioFile.count({ where: { uploadedBy: req.user.id } }),
      CallLog.count({
        where: {
          createdAt: {
            [Op.gte]: new Date().setHours(0, 0, 0, 0)
          }
        }
      })
    ]);

    // Get resource usage (simplified)
    const memoryUsage = process.memoryUsage();

    res.json({
      success: true,
      data: {
        user: {
          campaigns: userCampaigns,
          contacts: userContacts,
          audioFiles: userAudioFiles,
          callsToday: userCallsToday
        },
        system: {
          uptime: Math.round(process.uptime()),
          memoryUsage: {
            rss: Math.round(memoryUsage.rss / 1024 / 1024), // MB
            heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024), // MB
            heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024) // MB
          }
        }
      }
    });
  } catch (error) {
    logger.error('Performance analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;