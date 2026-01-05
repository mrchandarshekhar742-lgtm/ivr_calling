const express = require('express');
const { body, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const logger = require('../config/logger');

const router = express.Router();

// @route   GET /api/devices
// @desc    Get all registered Android devices
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    // For now, return empty array as we don't have device model yet
    res.json({
      success: true,
      data: {
        devices: [],
        total: 0
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
// @desc    Register new Android device
// @access  Private
router.post('/register', auth, [
  body('deviceId').trim().isLength({ min: 1 }),
  body('deviceName').trim().isLength({ min: 1 }),
  body('androidVersion').optional().trim()
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

    const { deviceId, deviceName, androidVersion } = req.body;

    logger.info(`Device registration attempt: ${deviceName} (${deviceId}) by ${req.user.email}`);

    // For now, just return success
    res.json({
      success: true,
      message: 'Device registered successfully',
      data: {
        deviceId,
        deviceName,
        androidVersion,
        status: 'active',
        registeredAt: new Date()
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

module.exports = router;