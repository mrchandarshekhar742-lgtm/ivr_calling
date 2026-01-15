const express = require('express');
const { Op } = require('sequelize');
const { body, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const logger = require('../config/logger');
const { CallLog, Campaign, Contact } = require('../models');

const router = express.Router();

// @route   POST /api/call-logs
// @desc    Create new call log entry
// @access  Private
router.post('/', auth, [
  body('phoneNumber').trim().isLength({ min: 10, max: 15 }),
  body('deviceId').trim().isLength({ min: 1 }),
  body('status').isIn(['initiated', 'ringing', 'answered', 'completed', 'failed', 'busy', 'no_answer']),
  body('contactId').optional().isInt(),
  body('campaignId').optional().isInt(),
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

    const { 
      phoneNumber, 
      deviceId, 
      status, 
      contactId, 
      campaignId, 
      audioFileId,
      duration = 0,
      dtmfResponse = '',
      callType = 'outbound',
      metadata = {}
    } = req.body;

    const callLog = await CallLog.create({
      userId: req.user.id,
      phoneNumber,
      deviceId,
      status,
      contactId: contactId || null,
      campaignId: campaignId || null,
      audioFileId: audioFileId || null,
      duration,
      dtmfResponse,
      callType,
      metadata,
      startTime: new Date()
    });

    logger.info(`Call log created: ${phoneNumber} via ${deviceId} by ${req.user.email}`);

    res.status(201).json({
      success: true,
      message: 'Call log created successfully',
      data: callLog
    });
  } catch (error) {
    logger.error('Create call log error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/call-logs/export/csv
// @desc    Export call logs as CSV
// @access  Private
router.get('/export/csv', auth, async (req, res) => {
  try {
    const { status, campaignId, startDate, endDate } = req.query;

    const whereClause = { userId: req.user.id };
    if (status) whereClause.status = status;
    if (campaignId) whereClause.campaignId = campaignId;
    if (startDate) whereClause.startTime = { ...whereClause.startTime, [Op.gte]: new Date(startDate) };
    if (endDate) whereClause.startTime = { ...whereClause.startTime, [Op.lte]: new Date(endDate) };

    const callLogs = await CallLog.findAll({
      where: whereClause,
      include: [
        {
          model: Campaign,
          as: 'campaign',
          attributes: ['id', 'name', 'type'],
          required: false
        },
        {
          model: Contact,
          as: 'contact',
          attributes: ['id', 'name', 'phone'],
          required: false
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    // Generate CSV content
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
// @desc    Get call logs with filters and pagination
// @access  Private
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
          attributes: ['id', 'name', 'type'],
          required: false
        },
        {
          model: Contact,
          as: 'contact',
          attributes: ['id', 'name', 'phone'],
          required: false
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']]
    });

    // Transform data to match frontend expectations
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
// @route   PUT /api/call-logs/:callId/status
// @desc    Update call log status
// @access  Private
router.put('/:callId/status', auth, [
  body('status').isIn(['initiated', 'ringing', 'answered', 'completed', 'failed', 'busy', 'no_answer']),
  body('deviceId').optional().trim(),
  body('answered').optional().isBoolean(),
  body('notes').optional().trim()
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

    const { callId } = req.params;
    const { status, deviceId, answered, notes } = req.body;

    // Find or create call log
    let callLog = await CallLog.findOne({
      where: { 
        id: callId,
        userId: req.user.id 
      }
    });

    if (!callLog) {
      // Create new call log if not exists (for backward compatibility)
      callLog = await CallLog.create({
        id: callId,
        userId: req.user.id,
        deviceId: deviceId || 'unknown',
        status,
        answered: answered || false,
        notes: notes || '',
        startTime: new Date()
      });
    } else {
      // Update existing call log
      await callLog.update({
        status,
        answered: answered !== undefined ? answered : callLog.answered,
        notes: notes || callLog.notes,
        endTime: ['completed', 'failed', 'no_answer'].includes(status) ? new Date() : callLog.endTime
      });
    }

    logger.info(`Call log status updated: ${callId} -> ${status} by device ${deviceId}`);

    res.json({
      success: true,
      message: 'Call status updated successfully',
      data: callLog
    });
  } catch (error) {
    logger.error('Update call status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/call-logs/:callId/dtmf
// @desc    Update DTMF response for call log
// @access  Private
router.put('/:callId/dtmf', auth, [
  body('dtmfResponse').trim().isLength({ min: 1, max: 10 }),
  body('deviceId').optional().trim(),
  body('timestamp').optional().isISO8601()
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

    const { callId } = req.params;
    const { dtmfResponse, deviceId, timestamp } = req.body;

    // Find call log
    let callLog = await CallLog.findOne({
      where: { 
        id: callId,
        userId: req.user.id 
      }
    });

    if (!callLog) {
      return res.status(404).json({
        success: false,
        message: 'Call log not found'
      });
    }

    // Update DTMF response
    await callLog.update({
      dtmfResponse,
      dtmfTimestamp: timestamp ? new Date(timestamp) : new Date(),
      answered: true // If DTMF response received, call was answered
    });

    logger.info(`DTMF response recorded: ${callId} -> ${dtmfResponse} by device ${deviceId}`);

    res.json({
      success: true,
      message: 'DTMF response recorded successfully',
      data: {
        callId,
        dtmfResponse,
        timestamp: callLog.dtmfTimestamp
      }
    });
  } catch (error) {
    logger.error('Update DTMF response error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/call-logs/:callId
// @desc    Get single call log
// @access  Private
router.get('/:callId', auth, async (req, res) => {
  try {
    const callLog = await CallLog.findOne({
      where: { 
        id: req.params.callId,
        userId: req.user.id 
      },
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

// @route   DELETE /api/call-logs/:callId
// @desc    Delete call log
// @access  Private
router.delete('/:callId', auth, async (req, res) => {
  try {
    const callLog = await CallLog.findOne({
      where: { 
        id: req.params.callId,
        userId: req.user.id 
      }
    });

    if (!callLog) {
      return res.status(404).json({
        success: false,
        message: 'Call log not found'
      });
    }

    await callLog.destroy();

    logger.info(`Call log deleted: ${req.params.callId} by ${req.user.email}`);

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

// @route   POST /api/call-logs/:callId/ivr-navigation
// @desc    Track IVR navigation path (for interactive IVR flows)
// @access  Private
router.post('/:callId/ivr-navigation', auth, [
  body('nodeKey').trim().isLength({ min: 1 }),
  body('dtmfPressed').optional().trim().isLength({ max: 1 }),
  body('timestamp').optional().isISO8601()
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

    const callLog = await CallLog.findOne({
      where: { 
        callId: req.params.callId,
        userId: req.user.id 
      }
    });

    if (!callLog) {
      return res.status(404).json({
        success: false,
        message: 'Call log not found'
      });
    }

    const { nodeKey, dtmfPressed, timestamp } = req.body;

    // Add to IVR path
    const ivrPath = callLog.ivrPath || [];
    ivrPath.push({
      nodeKey,
      dtmfPressed: dtmfPressed || null,
      timestamp: timestamp || new Date().toISOString()
    });

    // Add to DTMF responses if DTMF was pressed
    const dtmfResponses = callLog.dtmfResponses || [];
    if (dtmfPressed) {
      dtmfResponses.push({
        key: dtmfPressed,
        nodeKey,
        timestamp: timestamp || new Date().toISOString()
      });
    }

    await callLog.update({
      ivrPath,
      dtmfResponses,
      currentNodeKey: nodeKey
    });

    logger.info(`IVR navigation tracked: ${req.params.callId} -> ${nodeKey} (DTMF: ${dtmfPressed || 'none'})`);

    res.json({
      success: true,
      message: 'IVR navigation tracked successfully',
      data: {
        callId: req.params.callId,
        nodeKey,
        dtmfPressed,
        ivrPath
      }
    });
  } catch (error) {
    logger.error('Track IVR navigation error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;