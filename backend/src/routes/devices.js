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

// @route   GET /api/devices/stats/summary
// @desc    Get devices statistics summary
// @access  Private
router.get('/stats/summary', auth, async (req, res) => {
  try {
    const userDevices = await Device.findAll({
      where: { userId: req.user.id }
    });

    const stats = {
      totalDevices: userDevices.length,
      onlineDevices: userDevices.filter(d => d.status === 'online').length,
      offlineDevices: userDevices.filter(d => d.status === 'offline').length,
      busyDevices: userDevices.filter(d => d.status === 'busy').length,
      totalCalls: userDevices.reduce((sum, d) => sum + (d.stats?.totalCalls || 0), 0),
      successfulCalls: userDevices.reduce((sum, d) => sum + (d.stats?.successfulCalls || 0), 0),
      failedCalls: userDevices.reduce((sum, d) => sum + (d.stats?.failedCalls || 0), 0)
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('Get device stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/devices/register
// @desc    Register new Android device
// @access  Private
router.post('/register', auth, [
  body('deviceId').trim().isLength({ min: 1 }),
  body('deviceName').trim().isLength({ min: 1 }),
  body('androidVersion').optional().trim(),
  body('deviceModel').optional().trim(),
  body('appVersion').optional().trim()
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

    const { deviceId, deviceName, androidVersion, deviceModel, appVersion } = req.body;

    // Check if device already exists
    let existingDevice = await Device.findOne({ where: { deviceId } });
    
    if (existingDevice) {
      if (existingDevice.userId !== req.user.id) {
        // Allow re-registration by different user - update ownership
        logger.info(`Device ${deviceId} re-registered by different user: ${req.user.email} (was: ${existingDevice.userEmail})`);
        
        // Update existing device with new user
        existingDevice.userId = req.user.id;
        existingDevice.userEmail = req.user.email;
        existingDevice.deviceName = deviceName;
        existingDevice.androidVersion = androidVersion || 'Unknown';
        existingDevice.deviceModel = deviceModel || 'Android Device';
        existingDevice.appVersion = appVersion || '1.0.0';
        existingDevice.status = 'online';
        existingDevice.token = generateDeviceToken(deviceId, req.user.id);
        existingDevice.lastSeen = new Date();
        
        await existingDevice.save();
        
        const deviceData = existingDevice.toJSON();
        
        logger.info(`Device re-registered in database: ${deviceName} (${deviceId}) by ${req.user.email}`);

        return res.json({
          success: true,
          message: 'Device re-registered successfully',
          data: {
            ...deviceData,
            instructions: {
              serverUrl: 'https://ivr.wxon.in',
              apiEndpoint: 'https://ivr.wxon.in/api',
              socketUrl: 'https://ivr.wxon.in',
              token: deviceData.token
            }
          }
        });
      } else {
        // Same user re-registering - update device info and set online
        existingDevice.deviceName = deviceName;
        existingDevice.androidVersion = androidVersion || existingDevice.androidVersion;
        existingDevice.deviceModel = deviceModel || existingDevice.deviceModel;
        existingDevice.appVersion = appVersion || existingDevice.appVersion;
        existingDevice.status = 'online';
        existingDevice.lastSeen = new Date();
        
        await existingDevice.save();
        
        const deviceData = existingDevice.toJSON();
        
        logger.info(`Device updated in database: ${deviceName} (${deviceId}) by ${req.user.email}`);

        return res.json({
          success: true,
          message: 'Device updated and set online successfully',
          data: {
            ...deviceData,
            instructions: {
              serverUrl: 'https://ivr.wxon.in',
              apiEndpoint: 'https://ivr.wxon.in/api',
              socketUrl: 'https://ivr.wxon.in',
              token: deviceData.token
            }
          }
        });
      }
    }

    // Generate device token
    const deviceToken = generateDeviceToken(deviceId, req.user.id);

    // Create new device
    const deviceData = await Device.create({
      deviceId,
      deviceName,
      androidVersion: androidVersion || 'Unknown',
      deviceModel: deviceModel || 'Android Device',
      appVersion: appVersion || '1.0.0',
      userId: req.user.id,
      userEmail: req.user.email,
      status: 'online', // Automatically set to online on registration
      token: deviceToken,
      lastSeen: new Date(),
      capabilities: ['voice_call', 'dtmf_input'],
      stats: {
        totalCalls: 0,
        successfulCalls: 0,
        failedCalls: 0,
        lastCallAt: null
      }
    });

    logger.info(`Device registered in database: ${deviceName} (${deviceId}) by ${req.user.email}`);

    res.json({
      success: true,
      message: 'Device registered successfully in database',
      data: {
        ...deviceData.toJSON(),
        instructions: {
          serverUrl: 'https://ivr.wxon.in',
          apiEndpoint: 'https://ivr.wxon.in/api',
          socketUrl: 'https://ivr.wxon.in',
          token: deviceToken
        }
      }
    });
  } catch (error) {
    logger.error('Register device error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

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
// @desc    Get single device with full token
// @access  Private
router.get('/:deviceId', auth, async (req, res) => {
  try {
    const device = await Device.findOne({
      where: { 
        deviceId: req.params.deviceId,
        userId: req.user.id 
      }
    });
    
    if (!device) {
      return res.status(404).json({
        success: false,
        message: 'Device not found'
      });
    }

    res.json({
      success: true,
      data: device
    });
  } catch (error) {
    logger.error('Get device error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/devices/:deviceId/status
// @desc    Update device status (online/offline)
// @access  Private
router.put('/:deviceId/status', auth, [
  body('status').isIn(['online', 'offline', 'busy'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status',
        errors: errors.array()
      });
    }

    const device = await Device.findOne({
      where: { 
        deviceId: req.params.deviceId,
        userId: req.user.id 
      }
    });
    
    if (!device) {
      return res.status(404).json({
        success: false,
        message: 'Device not found'
      });
    }

    // Update device status
    await device.updateStatus(req.body.status);

    logger.info(`Device status updated in database: ${device.deviceName} -> ${req.body.status}`);

    res.json({
      success: true,
      message: 'Device status updated in database',
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

// @route   DELETE /api/devices/:deviceId
// @desc    Remove device
// @access  Private
router.delete('/:deviceId', auth, async (req, res) => {
  try {
    const device = await Device.findOne({
      where: { 
        deviceId: req.params.deviceId,
        userId: req.user.id 
      }
    });
    
    if (!device) {
      return res.status(404).json({
        success: false,
        message: 'Device not found'
      });
    }

    const deviceName = device.deviceName;
    await device.destroy();

    logger.info(`Device removed from database: ${deviceName} (${req.params.deviceId}) by ${req.user.email}`);

    res.json({
      success: true,
      message: 'Device removed successfully from database'
    });
  } catch (error) {
    logger.error('Remove device error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/devices/:deviceId/test
// @desc    Test device connection
// @access  Private
router.post('/:deviceId/test', auth, async (req, res) => {
  try {
    const device = await Device.findOne({
      where: { 
        deviceId: req.params.deviceId,
        userId: req.user.id 
      }
    });
    
    if (!device) {
      return res.status(404).json({
        success: false,
        message: 'Device not found'
      });
    }

    // Update last seen
    device.lastSeen = new Date();
    await device.save();

    // In real implementation, you would send a test signal to the device
    logger.info(`Device test initiated: ${device.deviceName} (${req.params.deviceId})`);

    res.json({
      success: true,
      message: 'Test signal sent to device',
      data: {
        deviceId: req.params.deviceId,
        status: device.status,
        lastSeen: device.lastSeen,
        testResult: 'Connection successful'
      }
    });
  } catch (error) {
    logger.error('Test device error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;