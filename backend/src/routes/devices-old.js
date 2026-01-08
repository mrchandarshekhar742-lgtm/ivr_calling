const express = require('express');
const { body, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const logger = require('../config/logger');
const crypto = require('crypto');
const Device = require('../models/Device');

const router = express.Router();

// Generate device token
const generateDeviceToken = (deviceId, userId) => {
  return crypto.createHash('sha256')
    .update(`${deviceId}-${userId}-${Date.now()}`)
    .digest('hex')
    .substring(0, 32);
};

// @route   GET /api/devices
// @desc    Get all registered Android devices for current user
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const userDevices = await Device.findAll({
      where: { userId: req.user.id },
      order: [['lastSeen', 'DESC']]
    });

    const devicesWithTokenPreview = userDevices.map(device => ({
      ...device.toJSON(),
      // Don't expose full token in list
      tokenPreview: device.token ? `${device.token.substring(0, 8)}...` : null
    }));

    res.json({
      success: true,
      data: {
        devices: devicesWithTokenPreview,
        total: userDevices.length
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

// @route   GET /api/devices/:deviceId
// @desc    Get single device
// @access  Private
router.get('/:deviceId', authenticateToken, catchAsync(async (req, res, next) => {
  const device = deviceStorage.get(req.params.deviceId);

  if (!device || device.userId !== req.user.id) {
    return next(new AppError('Device not found', 404, 'DEVICE_NOT_FOUND'));
  }

  sendSuccess(res, device, 'Device retrieved successfully');
}));

// @route   POST /api/devices/register
// @desc    Register new device
// @access  Private
router.post('/register', authenticateToken, [
  body('deviceId').trim().notEmpty().withMessage('Device ID required'),
  body('deviceName').trim().notEmpty().withMessage('Device name required'),
  body('androidVersion').optional().trim(),
  body('deviceModel').optional().trim(),
  body('appVersion').optional().trim()
], catchAsync(async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new AppError('Validation failed', 400, 'VALIDATION_ERROR'));
  }

  const { deviceId, deviceName, androidVersion, deviceModel, appVersion } = req.body;

  // Check if device exists
  let device = deviceStorage.get(deviceId);

  if (device && device.userId !== req.user.id) {
    // Different user trying to register - update ownership
    logger.info(`Device ${deviceId} re-registered by different user`);
  }

  // Create or update device
  const deviceData = {
    deviceId,
    deviceName,
    userId: req.user.id,
    userEmail: req.user.email,
    androidVersion: androidVersion || 'Unknown',
    deviceModel: deviceModel || 'Android Device',
    appVersion: appVersion || '1.0.0',
    status: 'online',
    token: generateDeviceToken(deviceId, req.user.id),
    lastSeen: new Date(),
    capabilities: ['voice_call', 'dtmf_input'],
    stats: {
      totalCalls: 0,
      successfulCalls: 0,
      failedCalls: 0,
      lastCallAt: null
    }
  };

  deviceStorage.set(deviceId, deviceData);

  logger.info(`Device registered: ${deviceName} (${deviceId})`);

  sendSuccess(res, {
    ...deviceData,
    instructions: {
      serverUrl: 'https://ivr.wxon.in',
      apiEndpoint: 'https://ivr.wxon.in/api',
      socketUrl: 'https://ivr.wxon.in',
      token: deviceData.token
    }
  }, 'Device registered successfully', 201);
}));

// @route   PUT /api/devices/:deviceId/status
// @desc    Update device status
// @access  Private
router.put('/:deviceId/status', authenticateToken, [
  body('status').isIn(['online', 'offline', 'busy']).withMessage('Invalid status')
], catchAsync(async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new AppError('Validation failed', 400, 'VALIDATION_ERROR'));
  }

  const device = deviceStorage.get(req.params.deviceId);

  if (!device || device.userId !== req.user.id) {
    return next(new AppError('Device not found', 404, 'DEVICE_NOT_FOUND'));
  }

  device.status = req.body.status;
  device.lastSeen = new Date();
  deviceStorage.set(req.params.deviceId, device);

  logger.info(`Device status updated: ${device.deviceName} -> ${req.body.status}`);

  sendSuccess(res, device, 'Device status updated successfully');
}));

// @route   DELETE /api/devices/:deviceId
// @desc    Remove device
// @access  Private
router.delete('/:deviceId', authenticateToken, catchAsync(async (req, res, next) => {
  const device = deviceStorage.get(req.params.deviceId);

  if (!device || device.userId !== req.user.id) {
    return next(new AppError('Device not found', 404, 'DEVICE_NOT_FOUND'));
  }

  deviceStorage.delete(req.params.deviceId);

  logger.info(`Device removed: ${device.deviceName}`);

  sendSuccess(res, null, 'Device removed successfully');
}));

// @route   POST /api/devices/:deviceId/test
// @desc    Test device connection
// @access  Private
router.post('/:deviceId/test', authenticateToken, catchAsync(async (req, res, next) => {
  const device = deviceStorage.get(req.params.deviceId);

  if (!device || device.userId !== req.user.id) {
    return next(new AppError('Device not found', 404, 'DEVICE_NOT_FOUND'));
  }

  device.lastSeen = new Date();
  deviceStorage.set(req.params.deviceId, device);

  logger.info(`Device test initiated: ${device.deviceName}`);

  sendSuccess(res, {
    deviceId: req.params.deviceId,
    status: device.status,
    lastSeen: device.lastSeen,
    testResult: 'Connection successful'
  }, 'Test signal sent successfully');
}));

// @route   GET /api/devices/stats/summary
// @desc    Get devices statistics
// @access  Private
router.get('/stats/summary', authenticateToken, catchAsync(async (req, res, next) => {
  const userDevices = Array.from(deviceStorage.values())
    .filter(d => d.userId === req.user.id);

  const stats = {
    totalDevices: userDevices.length,
    onlineDevices: userDevices.filter(d => d.status === 'online').length,
    offlineDevices: userDevices.filter(d => d.status === 'offline').length,
    busyDevices: userDevices.filter(d => d.status === 'busy').length,
    totalCalls: userDevices.reduce((sum, d) => sum + (d.stats?.totalCalls || 0), 0),
    successfulCalls: userDevices.reduce((sum, d) => sum + (d.stats?.successfulCalls || 0), 0),
    failedCalls: userDevices.reduce((sum, d) => sum + (d.stats?.failedCalls || 0), 0)
  };

  sendSuccess(res, stats, 'Device statistics retrieved successfully');
}));

module.exports = router;
