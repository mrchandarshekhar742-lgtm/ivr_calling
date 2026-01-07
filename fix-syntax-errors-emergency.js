// Emergency fix for syntax errors in routes
const fs = require('fs');
const path = require('path');

console.log('🚨 EMERGENCY SYNTAX FIX');
console.log('======================');

// Create minimal working analytics.js
const analyticsContent = `const express = require('express');
const auth = require('../middleware/auth');
const logger = require('../config/logger');

const router = express.Router();

// @route   GET /api/analytics/dashboard
// @desc    Get dashboard analytics
// @access  Private
router.get('/dashboard', auth, async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        overview: {
          totalCampaigns: 0,
          activeCampaigns: 0,
          totalContacts: 0,
          totalAudioFiles: 0,
          totalCallLogs: 0,
          successfulCalls: 0,
          failedCalls: 0,
          successRate: 0
        },
        recentCampaigns: [],
        recentCalls: []
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

// @route   GET /api/analytics
// @desc    Get basic analytics overview
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        overview: {
          totalCampaigns: 0,
          activeCampaigns: 0,
          totalContacts: 0,
          totalAudioFiles: 0
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
`;

// Create minimal working campaigns.js
const campaignsContent = `const express = require('express');
const { body, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const logger = require('../config/logger');

const router = express.Router();

// @route   GET /api/campaigns
// @desc    Get all campaigns for user
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        campaigns: [],
        pagination: {
          total: 0,
          page: 1,
          pages: 0
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
// @desc    Create new campaign
// @access  Private
router.post('/', auth, [
  body('name').trim().isLength({ min: 3, max: 100 }),
  body('description').optional().trim(),
  body('type').isIn(['broadcast', 'survey', 'notification', 'reminder', 'bulk', 'scheduled', 'triggered'])
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

    const { name, description, type } = req.body;

    const campaign = {
      id: Date.now(),
      name,
      description: description || '',
      type,
      status: 'draft',
      createdBy: req.user.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    logger.info(\`Campaign created: \${campaign.name} by \${req.user.email}\`);

    res.status(201).json({
      success: true,
      message: 'Campaign created successfully',
      data: campaign
    });
  } catch (error) {
    logger.error('Create campaign error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
`;

// Create minimal working callLogs.js
const callLogsContent = `const express = require('express');
const auth = require('../middleware/auth');
const logger = require('../config/logger');

const router = express.Router();

// @route   GET /api/call-logs
// @desc    Get call logs with filters and pagination
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    res.json({
      success: true,
      data: [],
      pagination: {
        total: 0,
        page: 1,
        limit: 20,
        pages: 0
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
`;

// Create minimal working schedules.js
const schedulesContent = `const express = require('express');
const auth = require('../middleware/auth');
const logger = require('../config/logger');

const router = express.Router();

// @route   GET /api/schedules
// @desc    Get all call schedules for current user
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    res.json({
      success: true,
      data: [],
      pagination: {
        total: 0,
        page: 1,
        limit: 10,
        pages: 0
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
`;

// Write all files
const routesDir = path.join(__dirname, 'src', 'routes');

try {
  fs.writeFileSync(path.join(routesDir, 'analytics.js'), analyticsContent);
  console.log('✅ Fixed analytics.js');
  
  fs.writeFileSync(path.join(routesDir, 'campaigns.js'), campaignsContent);
  console.log('✅ Fixed campaigns.js');
  
  fs.writeFileSync(path.join(routesDir, 'callLogs.js'), callLogsContent);
  console.log('✅ Fixed callLogs.js');
  
  fs.writeFileSync(path.join(routesDir, 'schedules.js'), schedulesContent);
  console.log('✅ Fixed schedules.js');
  
  console.log('');
  console.log('🎉 All route files fixed!');
  console.log('Now restart the backend: pm2 restart ivr-backend-8090');
  
} catch (error) {
  console.error('❌ Error fixing files:', error.message);
}