const express = require('express');
const auth = require('../middleware/auth');
const logger = require('../config/logger');
const Campaign = require('../models/Campaign');
const Contact = require('../models/Contact');
const AudioFile = require('../models/AudioFile');
const CallLog = require('../models/CallLog');
const Device = require('../models/Device');

const router = express.Router();

// @route   GET /api/analytics/dashboard
// @desc    Get dashboard analytics
// @access  Private
router.get('/dashboard', auth, async (req, res) => {
  try {
    // Get real counts from database
    const [
      totalCampaigns,
      activeCampaigns,
      totalContacts,
      totalAudioFiles,
      totalCallLogs,
      successfulCalls,
      failedCalls,
      onlineDevices
    ] = await Promise.all([
      Campaign.count({ where: { createdBy: req.user.id } }),
      Campaign.count({ where: { createdBy: req.user.id, status: 'active' } }),
      Contact.count({ where: { createdBy: req.user.id } }),
      AudioFile.count({ where: { uploadedBy: req.user.id } }),
      CallLog.count({ where: { userId: req.user.id } }),
      CallLog.count({ where: { userId: req.user.id, status: 'completed' } }),
      CallLog.count({ where: { userId: req.user.id, status: 'failed' } }),
      Device.count({ where: { userId: req.user.id, status: 'online' } })
    ]);

    const successRate = totalCallLogs > 0 ? ((successfulCalls / totalCallLogs) * 100).toFixed(1) : 0;

    // Get recent campaigns
    const recentCampaigns = await Campaign.findAll({
      where: { createdBy: req.user.id },
      limit: 5,
      order: [['createdAt', 'DESC']],
      attributes: ['id', 'name', 'status', 'createdAt']
    });

    // Get recent calls
    const recentCalls = await CallLog.findAll({
      where: { userId: req.user.id },
      limit: 10,
      order: [['createdAt', 'DESC']],
      attributes: ['id', 'contactPhone', 'status', 'duration', 'createdAt']
    });

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
          successRate: parseFloat(successRate),
          onlineDevices
        },
        recentCampaigns,
        recentCalls
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
router.get('/campaigns', auth, async (req, res) => {
  try {
    res.json({
      success: true,
      data: []
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
router.get('/calls', auth, async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        callStats: [],
        dtmfStats: [],
        deviceStats: []
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
    const memoryUsage = process.memoryUsage();
    res.json({
      success: true,
      data: {
        user: {
          campaigns: 0,
          contacts: 0,
          audioFiles: 0,
          callsToday: 0
        },
        system: {
          uptime: Math.round(process.uptime()),
          memoryUsage: {
            rss: Math.round(memoryUsage.rss / 1024 / 1024),
            heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
            heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024)
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

// @route   GET /api/analytics/test
// @desc    Test analytics endpoint
// @access  Private
router.get('/test', auth, async (req, res) => {
  try {
    res.json({
      success: true,
      message: 'Analytics API is working',
      data: {
        timestamp: new Date().toISOString(),
        user: req.user.email,
        status: 'healthy'
      }
    });
  } catch (error) {
    logger.error('Analytics test error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/analytics
// @desc    Get basic analytics overview
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    // Get real counts from database
    const [
      totalCampaigns,
      activeCampaigns,
      totalContacts,
      totalAudioFiles
    ] = await Promise.all([
      Campaign.count({ where: { createdBy: req.user.id } }),
      Campaign.count({ where: { createdBy: req.user.id, status: 'active' } }),
      Contact.count({ where: { createdBy: req.user.id } }),
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

module.exports = router;