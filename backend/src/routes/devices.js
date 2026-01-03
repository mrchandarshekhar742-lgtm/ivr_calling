const express = require('express');
const { body, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const logger = require('../config/logger');

const router = express.Router();

// In-memory storage for connected devices (in production, use Redis)
const connectedDevices = new Map();

// @route   GET /api/devices
// @desc    Get all registered devices
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const devices = Array.from(connectedDevices.values()).map(device => ({
      ...device,
      isOnline: Date.now() - device.lastSeen < 30000 // 30 seconds threshold
    }));

    res.json({
      success: true,
      data: {
        devices,
        totalDevices: devices.length,
        onlineDevices: devices.filter(d => d.isOnline).length
      }
    });
  } catch (error) {
    logger.error('Get devices error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/devices/register
// @desc    Register a new device
// @access  Private
router.post('/register', auth, [
  body('deviceId').trim().isLength({ min: 1, max: 100 }),
  body('deviceName').trim().isLength({ min: 1, max: 100 }),
  body('deviceModel').optional().trim().isLength({ max: 100 }),
  body('androidVersion').optional().trim().isLength({ max: 50 }),
  body('appVersion').optional().trim().isLength({ max: 50 })
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
      deviceId,
      deviceName,
      deviceModel,
      androidVersion,
      appVersion,
      capabilities = []
    } = req.body;

    const device = {
      id: deviceId,
      name: deviceName,
      model: deviceModel,
      androidVersion,
      appVersion,
      capabilities,
      userId: req.user.id,
      status: 'online',
      registeredAt: new Date(),
      lastSeen: Date.now(),
      callsHandled: 0,
      currentCampaign: null
    };

    connectedDevices.set(deviceId, device);

    // Emit device registration to all connected clients
    const io = req.app.get('io');
    io.emit('device:registered', device);

    logger.info(`Device registered: ${deviceName} (${deviceId}) by ${req.user.email}`);

    res.status(201).json({
      success: true,
      message: 'Device registered successfully',
      data: device
    });
  } catch (error) {
    logger.error('Register device error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/devices/:deviceId/heartbeat
// @desc    Update device heartbeat
// @access  Private
router.put('/:deviceId/heartbeat', auth, async (req, res) => {
  try {
    const { deviceId } = req.params;
    const device = connectedDevices.get(deviceId);

    if (!device) {
      return res.status(404).json({
        success: false,
        message: 'Device not found'
      });
    }

    // Check if user owns the device
    if (device.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Update last seen
    device.lastSeen = Date.now();
    device.status = 'online';
    connectedDevices.set(deviceId, device);

    res.json({
      success: true,
      message: 'Heartbeat updated',
      data: { lastSeen: device.lastSeen }
    });
  } catch (error) {
    logger.error('Device heartbeat error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/devices/:deviceId/status
// @desc    Update device status
// @access  Private
router.put('/:deviceId/status', auth, [
  body('status').isIn(['online', 'offline', 'busy', 'idle'])
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

    const { deviceId } = req.params;
    const { status } = req.body;
    const device = connectedDevices.get(deviceId);

    if (!device) {
      return res.status(404).json({
        success: false,
        message: 'Device not found'
      });
    }

    // Check if user owns the device
    if (device.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    device.status = status;
    device.lastSeen = Date.now();
    connectedDevices.set(deviceId, device);

    // Emit status change to all connected clients
    const io = req.app.get('io');
    io.emit('device:statusChanged', { deviceId, status });

    logger.info(`Device status updated: ${device.name} -> ${status}`);

    res.json({
      success: true,
      message: 'Device status updated',
      data: device
    });
  } catch (error) {
    logger.error('Update device status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/devices/:deviceId/assign-campaign
// @desc    Assign campaign to device
// @access  Private
router.post('/:deviceId/assign-campaign', auth, [
  body('campaignId').isInt({ min: 1 })
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

    const { deviceId } = req.params;
    const { campaignId } = req.body;
    const device = connectedDevices.get(deviceId);

    if (!device) {
      return res.status(404).json({
        success: false,
        message: 'Device not found'
      });
    }

    // Check if device is online
    const isOnline = Date.now() - device.lastSeen < 30000;
    if (!isOnline) {
      return res.status(400).json({
        success: false,
        message: 'Device is offline'
      });
    }

    // Verify campaign exists
    const { Campaign } = require('../models');
    const campaign = await Campaign.findByPk(campaignId);
    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found'
      });
    }

    device.currentCampaign = campaignId;
    device.status = 'busy';
    connectedDevices.set(deviceId, device);

    // Emit campaign assignment to device
    const io = req.app.get('io');
    io.to(`device:${deviceId}`).emit('campaign:assigned', {
      campaignId,
      campaign: campaign.toJSON()
    });

    logger.info(`Campaign ${campaignId} assigned to device ${device.name}`);

    res.json({
      success: true,
      message: 'Campaign assigned to device',
      data: { deviceId, campaignId }
    });
  } catch (error) {
    logger.error('Assign campaign error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/devices/:deviceId/call-result
// @desc    Report call result from device
// @access  Private
router.post('/:deviceId/call-result', auth, [
  body('callId').trim().isLength({ min: 1 }),
  body('contactId').isInt({ min: 1 }),
  body('status').isIn(['completed', 'failed', 'no-answer', 'busy']),
  body('duration').optional().isInt({ min: 0 }),
  body('dtmfResponse').optional().trim(),
  body('errorMessage').optional().trim()
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

    const { deviceId } = req.params;
    const {
      callId,
      contactId,
      status,
      duration = 0,
      dtmfResponse,
      errorMessage,
      metadata = {}
    } = req.body;

    const device = connectedDevices.get(deviceId);
    if (!device) {
      return res.status(404).json({
        success: false,
        message: 'Device not found'
      });
    }

    // Create call log entry
    const { CallLog } = require('../models');
    const callLog = await CallLog.create({
      campaignId: device.currentCampaign,
      contactId,
      deviceId,
      callId,
      status,
      duration,
      dtmfResponse,
      errorMessage,
      metadata,
      endTime: new Date()
    });

    // Update device stats
    device.callsHandled += 1;
    connectedDevices.set(deviceId, device);

    // Emit call result to all connected clients
    const io = req.app.get('io');
    io.emit('call:completed', {
      deviceId,
      callLog: callLog.toJSON()
    });

    logger.info(`Call result reported: ${callId} -> ${status} from device ${device.name}`);

    res.json({
      success: true,
      message: 'Call result recorded',
      data: callLog
    });
  } catch (error) {
    logger.error('Call result error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   DELETE /api/devices/:deviceId
// @desc    Unregister device
// @access  Private
router.delete('/:deviceId', auth, async (req, res) => {
  try {
    const { deviceId } = req.params;
    const device = connectedDevices.get(deviceId);

    if (!device) {
      return res.status(404).json({
        success: false,
        message: 'Device not found'
      });
    }

    // Check if user owns the device
    if (device.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    connectedDevices.delete(deviceId);

    // Emit device unregistration to all connected clients
    const io = req.app.get('io');
    io.emit('device:unregistered', { deviceId });

    logger.info(`Device unregistered: ${device.name} (${deviceId})`);

    res.json({
      success: true,
      message: 'Device unregistered successfully'
    });
  } catch (error) {
    logger.error('Unregister device error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/devices/:deviceId/logs
// @desc    Get device call logs
// @access  Private
router.get('/:deviceId/logs', auth, async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const device = connectedDevices.get(deviceId);
    if (!device) {
      return res.status(404).json({
        success: false,
        message: 'Device not found'
      });
    }

    const { CallLog } = require('../models');
    const { count, rows } = await CallLog.findAndCountAll({
      where: { deviceId },
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: require('../models').Campaign,
          as: 'campaign',
          attributes: ['id', 'name']
        },
        {
          model: require('../models').Contact,
          as: 'contact',
          attributes: ['id', 'name', 'phone']
        }
      ]
    });

    res.json({
      success: true,
      data: {
        logs: rows,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(count / limit)
        }
      }
    });
  } catch (error) {
    logger.error('Get device logs error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;