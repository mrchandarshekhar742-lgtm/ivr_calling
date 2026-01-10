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
// @desc    Create new campaign with contacts and device selection
// @access  Private
router.post('/', auth, [
  body('name').trim().isLength({ min: 3, max: 100 }),
  body('description').optional().trim(),
  body('type').isIn(['broadcast', 'survey', 'notification', 'reminder', 'bulk', 'scheduled', 'triggered']),
  body('audioFileId').optional().isInt(),
  body('contactNumbers').optional().isArray(),
  body('selectedDevices').optional().isArray()
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
      description, 
      type, 
      audioFileId, 
      settings, 
      contactNumbers = [], 
      selectedDevices = [] 
    } = req.body;

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

    // Verify selected devices exist and are online
    if (selectedDevices.length > 0) {
      const { Device } = require('../models');
      const devices = await Device.findAll({
        where: {
          deviceId: selectedDevices,
          userId: req.user.id,
          status: 'online'
        }
      });

      if (devices.length !== selectedDevices.length) {
        return res.status(400).json({
          success: false,
          message: 'Some selected devices are not available or offline'
        });
      }
    }

    // Create campaign
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
      createdBy: req.user.id,
      totalContacts: contactNumbers.length,
      devicesUsed: selectedDevices.length,
      deviceDistribution: selectedDevices.map(deviceId => ({
        deviceId,
        assignedContacts: Math.ceil(contactNumbers.length / selectedDevices.length)
      }))
    });

    // Create contacts if provided
    if (contactNumbers.length > 0) {
      const { Contact } = require('../models');
      
      // Create contacts for this campaign
      const contactsToCreate = contactNumbers.map((phone, index) => ({
        name: `Contact ${index + 1}`,
        phone: phone.replace(/[^\d+]/g, ''), // Clean phone number
        createdBy: req.user.id,
        campaignId: campaign.id
      }));

      await Contact.bulkCreate(contactsToCreate, {
        ignoreDuplicates: true
      });
    }

    logger.info(`Campaign created: ${campaign.name} by ${req.user.email} with ${contactNumbers.length} contacts and ${selectedDevices.length} devices`);

    res.status(201).json({
      success: true,
      message: 'Campaign created successfully',
      data: {
        ...campaign.toJSON(),
        contactsCount: contactNumbers.length,
        devicesCount: selectedDevices.length
      }
    });
  } catch (error) {
    logger.error('Create campaign error:', error);
    console.error('Full campaign error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error: ' + error.message
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
// @desc    Start multi-device campaign with smart distribution
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

    // Get all online devices for this user
    const { Device, Contact, CallLog } = require('../models');
    const onlineDevices = await Device.findAll({
      where: { 
        userId: req.user.id,
        status: 'online'
      },
      order: [['lastSeen', 'DESC']] // Prioritize recently active devices
    });

    if (onlineDevices.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No online devices available for calling'
      });
    }

    // Get all contacts for this user
    const contacts = await Contact.findAll({
      where: { createdBy: req.user.id }
    });

    if (contacts.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No contacts available for calling'
      });
    }

    // Smart load distribution based on device performance
    const devicePerformance = await Promise.all(onlineDevices.map(async (device) => {
      const stats = device.stats || {};
      const successRate = stats.totalCalls > 0 ? 
        (stats.successfulCalls / stats.totalCalls) : 1.0;
      
      return {
        device,
        successRate,
        totalCalls: stats.totalCalls || 0,
        weight: successRate * 0.7 + (device.lastSeen ? 0.3 : 0) // Weighted scoring
      };
    }));

    // Sort devices by performance weight (best first)
    devicePerformance.sort((a, b) => b.weight - a.weight);

    // Distribute contacts with load balancing
    const distribution = [];
    const totalContacts = contacts.length;
    let remainingContacts = [...contacts];
    
    // Calculate base allocation per device
    const baseContactsPerDevice = Math.floor(totalContacts / onlineDevices.length);
    const extraContacts = totalContacts % onlineDevices.length;

    for (let i = 0; i < devicePerformance.length; i++) {
      const { device } = devicePerformance[i];
      
      // Allocate contacts (better performing devices get slightly more)
      let contactsForDevice = baseContactsPerDevice;
      if (i < extraContacts) contactsForDevice++; // Distribute remainder
      
      const deviceContacts = remainingContacts.splice(0, contactsForDevice);
      
      if (deviceContacts.length === 0) break;

      // Create call commands for this device with staggered timing
      const commands = deviceContacts.map((contact, index) => ({
        action: 'make_call',
        phoneNumber: contact.phone,
        callId: `campaign_${campaign.id}_contact_${contact.id}_${Date.now()}_${index}`,
        audioFileId: campaign.audioFileId,
        campaignId: campaign.id,
        contactId: contact.id,
        timestamp: new Date().toISOString(),
        deviceId: device.deviceId,
        delay: index * 2000, // 2 second delay between calls per device
        priority: 'normal'
      }));

      // Add commands to device's pending queue
      const currentCommands = device.pendingCommands || [];
      device.pendingCommands = [...currentCommands, ...commands];
      await device.save();

      distribution.push({
        deviceId: device.deviceId,
        deviceName: device.deviceName,
        contactsAssigned: deviceContacts.length,
        successRate: devicePerformance[i].successRate,
        estimatedDuration: deviceContacts.length * 45 // 45 seconds per call estimate
      });
      
      logger.info(`Assigned ${deviceContacts.length} contacts to device ${device.deviceId} (Success Rate: ${(devicePerformance[i].successRate * 100).toFixed(1)}%)`);
    }

    // Update campaign with distribution info
    await campaign.update({
      status: 'running',
      startedAt: new Date(),
      deviceDistribution: distribution,
      totalContacts: totalContacts,
      devicesUsed: onlineDevices.length
    });

    logger.info(`Multi-device campaign started: ${campaign.name} by ${req.user.email} - ${totalContacts} contacts distributed among ${onlineDevices.length} devices`);

    res.json({
      success: true,
      message: 'Multi-device campaign started successfully',
      data: {
        campaign,
        devicesUsed: onlineDevices.length,
        contactsDistributed: totalContacts,
        distribution,
        estimatedCompletionTime: Math.max(...distribution.map(d => d.estimatedDuration)),
        callsPerDevice: distribution.map(d => ({
          deviceId: d.deviceId,
          deviceName: d.deviceName,
          assignedCalls: d.contactsAssigned,
          successRate: `${(d.successRate * 100).toFixed(1)}%`
        }))
      }
    });
  } catch (error) {
    logger.error('Start multi-device campaign error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error: ' + error.message
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

// @route   GET /api/campaigns/:id/status
// @desc    Get real-time campaign status with device breakdown
// @access  Private
router.get('/:id/status', auth, async (req, res) => {
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

    const { Device, CallLog } = require('../models');
    
    // Get campaign call logs with device info
    const callLogs = await CallLog.findAll({
      where: { campaignId: req.params.id },
      include: [
        {
          model: Device,
          as: 'device',
          attributes: ['deviceId', 'deviceName', 'status']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    // Calculate statistics
    const stats = {
      totalCalls: callLogs.length,
      inProgress: callLogs.filter(log => log.status === 'in_progress').length,
      completed: callLogs.filter(log => ['completed', 'answered', 'no_answer'].includes(log.status)).length,
      failed: callLogs.filter(log => log.status === 'failed').length,
      answered: callLogs.filter(log => log.answered === true).length,
      dtmfResponses: callLogs.filter(log => log.dtmfResponse).length
    };

    // Device-wise breakdown
    const deviceStats = {};
    callLogs.forEach(log => {
      const deviceId = log.deviceId;
      if (!deviceStats[deviceId]) {
        deviceStats[deviceId] = {
          deviceId,
          deviceName: log.device?.deviceName || 'Unknown',
          status: log.device?.status || 'offline',
          totalCalls: 0,
          inProgress: 0,
          completed: 0,
          failed: 0,
          answered: 0,
          dtmfResponses: 0,
          avgDuration: 0
        };
      }
      
      const device = deviceStats[deviceId];
      device.totalCalls++;
      
      if (log.status === 'in_progress') device.inProgress++;
      else if (['completed', 'answered', 'no_answer'].includes(log.status)) device.completed++;
      else if (log.status === 'failed') device.failed++;
      
      if (log.answered) device.answered++;
      if (log.dtmfResponse) device.dtmfResponses++;
    });

    // Calculate average durations
    Object.keys(deviceStats).forEach(deviceId => {
      const deviceLogs = callLogs.filter(log => log.deviceId === deviceId && log.callDuration);
      if (deviceLogs.length > 0) {
        const totalDuration = deviceLogs.reduce((sum, log) => sum + (log.callDuration || 0), 0);
        deviceStats[deviceId].avgDuration = Math.round(totalDuration / deviceLogs.length);
      }
    });

    res.json({
      success: true,
      data: {
        campaign: {
          id: campaign.id,
          name: campaign.name,
          status: campaign.status,
          startedAt: campaign.startedAt,
          totalContacts: campaign.totalContacts,
          devicesUsed: campaign.devicesUsed
        },
        stats,
        deviceBreakdown: Object.values(deviceStats),
        recentCalls: callLogs.slice(0, 10).map(log => ({
          id: log.id,
          deviceId: log.deviceId,
          deviceName: log.device?.deviceName || 'Unknown',
          phoneNumber: log.phoneNumber,
          status: log.status,
          duration: log.callDuration,
          answered: log.answered,
          dtmfResponse: log.dtmfResponse,
          startedAt: log.startedAt,
          endedAt: log.endedAt
        }))
      }
    });
  } catch (error) {
    logger.error('Get campaign status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/campaigns/:id/devices
// @desc    Get device-wise campaign progress
// @access  Private
router.get('/:id/devices', auth, async (req, res) => {
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

    const { Device } = require('../models');
    
    // Get devices used in this campaign
    const devices = await Device.findAll({
      where: { userId: req.user.id }
    });

    const deviceProgress = devices.map(device => {
      const pendingCommands = device.pendingCommands || [];
      const campaignCommands = pendingCommands.filter(cmd => 
        cmd.campaignId && cmd.campaignId.toString() === req.params.id
      );

      return {
        deviceId: device.deviceId,
        deviceName: device.deviceName,
        status: device.status,
        lastSeen: device.lastSeen,
        pendingCalls: campaignCommands.length,
        currentCall: campaignCommands.length > 0 ? campaignCommands[0] : null,
        performance: device.stats || {
          totalCalls: 0,
          successfulCalls: 0,
          failedCalls: 0
        }
      };
    });

    res.json({
      success: true,
      data: {
        campaignId: req.params.id,
        devices: deviceProgress,
        summary: {
          totalDevices: devices.length,
          onlineDevices: devices.filter(d => d.status === 'online').length,
          busyDevices: devices.filter(d => d.status === 'busy').length,
          totalPendingCalls: deviceProgress.reduce((sum, d) => sum + d.pendingCalls, 0)
        }
      }
    });
  } catch (error) {
    logger.error('Get campaign devices error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
// @route   GET /api/call-logs/live
// @desc    Get live call updates for real-time monitoring
// @access  Private
router.get('/live-calls', auth, async (req, res) => {
  try {
    const { campaignId } = req.query;
    const { CallLog, Device } = require('../models');
    
    const whereClause = { userId: req.user.id };
    if (campaignId) whereClause.campaignId = campaignId;

    const liveCalls = await CallLog.findAll({
      where: {
        ...whereClause,
        status: 'in_progress'
      },
      include: [
        {
          model: Device,
          as: 'device',
          attributes: ['deviceId', 'deviceName', 'status']
        }
      ],
      order: [['startedAt', 'DESC']],
      limit: 50
    });

    const recentCompleted = await CallLog.findAll({
      where: {
        ...whereClause,
        status: ['completed', 'answered', 'no_answer', 'failed'],
        updatedAt: {
          [require('sequelize').Op.gte]: new Date(Date.now() - 5 * 60 * 1000) // Last 5 minutes
        }
      },
      include: [
        {
          model: Device,
          as: 'device',
          attributes: ['deviceId', 'deviceName', 'status']
        }
      ],
      order: [['updatedAt', 'DESC']],
      limit: 20
    });

    res.json({
      success: true,
      data: {
        liveCalls: liveCalls.map(call => ({
          id: call.id,
          campaignId: call.campaignId,
          deviceId: call.deviceId,
          deviceName: call.device?.deviceName || 'Unknown',
          phoneNumber: call.phoneNumber,
          status: call.status,
          duration: call.callDuration || Math.floor((new Date() - new Date(call.startedAt)) / 1000),
          startedAt: call.startedAt,
          dtmfResponse: call.dtmfResponse
        })),
        recentCompleted: recentCompleted.map(call => ({
          id: call.id,
          campaignId: call.campaignId,
          deviceId: call.deviceId,
          deviceName: call.device?.deviceName || 'Unknown',
          phoneNumber: call.phoneNumber,
          status: call.status,
          duration: call.callDuration,
          answered: call.answered,
          dtmfResponse: call.dtmfResponse,
          completedAt: call.endedAt || call.updatedAt
        })),
        summary: {
          activeCalls: liveCalls.length,
          recentlyCompleted: recentCompleted.length,
          timestamp: new Date().toISOString()
        }
      }
    });
  } catch (error) {
    logger.error('Get live calls error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/devices/performance
// @desc    Get device performance metrics for multi-device management
// @access  Private
router.get('/device-performance', auth, async (req, res) => {
  try {
    const { Device, CallLog } = require('../models');
    
    const devices = await Device.findAll({
      where: { userId: req.user.id },
      order: [['lastSeen', 'DESC']]
    });

    const performanceData = await Promise.all(devices.map(async (device) => {
      // Get call statistics for last 24 hours
      const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
      
      const recentCalls = await CallLog.findAll({
        where: {
          deviceId: device.deviceId,
          createdAt: {
            [require('sequelize').Op.gte]: last24Hours
          }
        }
      });

      const stats = {
        totalCalls: recentCalls.length,
        successfulCalls: recentCalls.filter(call => call.answered).length,
        failedCalls: recentCalls.filter(call => call.status === 'failed').length,
        avgDuration: 0,
        dtmfResponses: recentCalls.filter(call => call.dtmfResponse).length
      };

      if (recentCalls.length > 0) {
        const totalDuration = recentCalls.reduce((sum, call) => sum + (call.callDuration || 0), 0);
        stats.avgDuration = Math.round(totalDuration / recentCalls.length);
      }

      const successRate = stats.totalCalls > 0 ? 
        (stats.successfulCalls / stats.totalCalls) * 100 : 0;

      return {
        deviceId: device.deviceId,
        deviceName: device.deviceName,
        status: device.status,
        lastSeen: device.lastSeen,
        model: device.deviceModel,
        androidVersion: device.androidVersion,
        appVersion: device.appVersion,
        performance: {
          ...stats,
          successRate: Math.round(successRate * 100) / 100,
          callsPerHour: Math.round((stats.totalCalls / 24) * 100) / 100
        },
        pendingCommands: (device.pendingCommands || []).length,
        capabilities: device.capabilities || ['voice_call', 'dtmf_input']
      };
    }));

    // Sort by performance score
    performanceData.sort((a, b) => {
      const scoreA = a.performance.successRate * 0.6 + 
                    (a.status === 'online' ? 30 : 0) + 
                    Math.min(a.performance.callsPerHour, 10);
      const scoreB = b.performance.successRate * 0.6 + 
                    (b.status === 'online' ? 30 : 0) + 
                    Math.min(b.performance.callsPerHour, 10);
      return scoreB - scoreA;
    });

    res.json({
      success: true,
      data: {
        devices: performanceData,
        summary: {
          totalDevices: devices.length,
          onlineDevices: devices.filter(d => d.status === 'online').length,
          avgSuccessRate: performanceData.length > 0 ? 
            Math.round(performanceData.reduce((sum, d) => sum + d.performance.successRate, 0) / performanceData.length * 100) / 100 : 0,
          totalPendingCommands: performanceData.reduce((sum, d) => sum + d.pendingCommands, 0)
        }
      }
    });
  } catch (error) {
    logger.error('Get device performance error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});