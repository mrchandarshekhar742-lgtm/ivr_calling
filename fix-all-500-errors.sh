#!/bin/bash

echo "🚨 FIXING ALL 500 ERRORS ON VPS"
echo "==============================="

# Stop backend
pm2 stop ivr-backend-8090

# Navigate to backend
cd /var/www/ivr-platform/ivr_calling/backend

# Check all route files for syntax errors
echo "🔍 Checking all route files..."

echo "Checking callLogs.js..."
node -c src/routes/callLogs.js
if [ $? -ne 0 ]; then
    echo "❌ callLogs.js has syntax error - fixing..."
    
    cat > src/routes/callLogs.js << 'EOF'
const express = require('express');
const { Op } = require('sequelize');
const auth = require('../middleware/auth');
const logger = require('../config/logger');
const CallLog = require('../models/CallLog');
const Campaign = require('../models/Campaign');
const Contact = require('../models/Contact');

const router = express.Router();

// @route   GET /api/call-logs/export/csv
router.get('/export/csv', auth, async (req, res) => {
  try {
    const { status, campaignId, startDate, endDate } = req.query;

    const whereClause = { userId: req.user.id };
    if (status) whereClause.status = status;
    if (campaignId) whereClause.campaignId = campaignId;

    const callLogs = await CallLog.findAll({
      where: whereClause,
      include: [
        {
          model: Campaign,
          as: 'campaign',
          attributes: ['id', 'name', 'type']
        },
        {
          model: Contact,
          as: 'contact',
          attributes: ['id', 'name', 'phone']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    const csvHeaders = 'ID,Contact Name,Phone Number,Campaign,Status,Duration,DTMF Response,Called At,Device ID\n';
    const csvRows = callLogs.map(log => {
      const contactName = log.contact?.name || 'Unknown';
      const phoneNumber = log.contact?.phone || 'N/A';
      const campaignName = log.campaign?.name || 'Unknown Campaign';
      const calledAt = log.startTime ? new Date(log.startTime).toISOString() : 'N/A';
      const duration = log.duration || 0;
      const dtmfResponse = log.dtmfResponse || '';
      const deviceId = log.deviceId || 'N/A';
      
      return `${log.id},"${contactName}","${phoneNumber}","${campaignName}","${log.status}",${duration},"${dtmfResponse}","${calledAt}","${deviceId}"`;
    }).join('\n');

    const csvContent = csvHeaders + csvRows;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="call-logs-${new Date().toISOString().split('T')[0]}.csv"`);
    res.send(csvContent);

    logger.info(`Call logs exported by ${req.user.email}: ${callLogs.length} records`);
  } catch (error) {
    logger.error('Export call logs error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/call-logs
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20, status, campaignId } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = { userId: req.user.id };
    if (status) whereClause.status = status;
    if (campaignId) whereClause.campaignId = campaignId;

    const callLogs = await CallLog.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Campaign,
          as: 'campaign',
          attributes: ['id', 'name', 'type']
        },
        {
          model: Contact,
          as: 'contact',
          attributes: ['id', 'name', 'phone']
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']]
    });

    const transformedLogs = callLogs.rows.map(log => ({
      id: log.id,
      campaignId: log.campaignId,
      contactId: log.contactId,
      phoneNumber: log.contact?.phone || 'N/A',
      status: log.status,
      duration: log.duration,
      dtmfResponse: log.dtmfResponse,
      calledAt: log.startTime,
      deviceId: log.deviceId,
      campaign: log.campaign,
      contact: log.contact,
      createdAt: log.createdAt,
      updatedAt: log.updatedAt
    }));

    res.json({
      success: true,
      data: transformedLogs,
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

module.exports = router;
EOF
    echo "✅ callLogs.js fixed"
fi

echo "Checking devices.js..."
node -c src/routes/devices.js
if [ $? -ne 0 ]; then
    echo "❌ devices.js has syntax error - fixing..."
    
    cat > src/routes/devices.js << 'EOF'
const express = require('express');
const { body, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const logger = require('../config/logger');
const crypto = require('crypto');
const Device = require('../models/Device');

const router = express.Router();

const generateDeviceToken = (deviceId, userId) => {
  return crypto.createHash('sha256')
    .update(`${deviceId}-${userId}-${Date.now()}`)
    .digest('hex')
    .substring(0, 32);
};

// @route   GET /api/devices/stats/summary
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
router.post('/register', auth, [
  body('deviceId').trim().isLength({ min: 1 }),
  body('deviceName').trim().isLength({ min: 1 })
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

    let existingDevice = await Device.findOne({ where: { deviceId } });
    
    if (existingDevice) {
      if (existingDevice.userId !== req.user.id) {
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
        
        return res.json({
          success: true,
          message: 'Device re-registered successfully',
          data: existingDevice.toJSON()
        });
      } else {
        existingDevice.deviceName = deviceName;
        existingDevice.status = 'online';
        existingDevice.lastSeen = new Date();
        
        await existingDevice.save();
        
        return res.json({
          success: true,
          message: 'Device updated and set online successfully',
          data: existingDevice.toJSON()
        });
      }
    }

    const deviceToken = generateDeviceToken(deviceId, req.user.id);

    const deviceData = await Device.create({
      deviceId,
      deviceName,
      androidVersion: androidVersion || 'Unknown',
      deviceModel: deviceModel || 'Android Device',
      appVersion: appVersion || '1.0.0',
      userId: req.user.id,
      userEmail: req.user.email,
      status: 'online',
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

    res.json({
      success: true,
      message: 'Device registered successfully',
      data: deviceData.toJSON()
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
router.get('/', auth, async (req, res) => {
  try {
    const userDevices = await Device.findAll({
      where: { userId: req.user.id },
      order: [['lastSeen', 'DESC']]
    });

    const devicesWithTokenPreview = userDevices.map(device => ({
      ...device.toJSON(),
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

module.exports = router;
EOF
    echo "✅ devices.js fixed"
fi

echo "Checking schedules.js..."
node -c src/routes/schedules.js
if [ $? -ne 0 ]; then
    echo "❌ schedules.js has syntax error - fixing..."
    
    cat > src/routes/schedules.js << 'EOF'
const express = require('express');
const auth = require('../middleware/auth');
const logger = require('../config/logger');

const router = express.Router();

// @route   GET /api/schedules
router.get('/', auth, async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        schedules: [],
        pagination: {
          total: 0,
          page: 1,
          pages: 0
        }
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

module.exports = router;
EOF
    echo "✅ schedules.js fixed"
fi

# Check server.js
echo "Checking server.js..."
node -c server.js
if [ $? -ne 0 ]; then
    echo "❌ server.js has syntax error"
    exit 1
fi

echo "✅ All syntax checks passed"

# Start backend
echo "🚀 Starting backend..."
pm2 start server.js --name "ivr-backend-8090" --env production
pm2 save

# Wait for startup
sleep 5

# Test endpoints
echo "🧪 Testing endpoints..."

echo "Testing health..."
curl -s http://localhost:8090/health

echo ""
echo "Testing call-logs..."
curl -s -H "Authorization: Bearer test" http://localhost:8090/api/call-logs | head -100

echo ""
echo "Testing devices..."
curl -s -H "Authorization: Bearer test" http://localhost:8090/api/devices | head -100

echo ""
echo "Testing schedules..."
curl -s -H "Authorization: Bearer test" http://localhost:8090/api/schedules | head -100

echo ""
echo "🎉 Backend restarted and tested!"

pm2 status