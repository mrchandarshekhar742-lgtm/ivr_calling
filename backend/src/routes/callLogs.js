const express = require('express');
const { Op } = require('sequelize');
const auth = require('../middleware/auth');
const logger = require('../config/logger');
const { CallLog, Campaign, Contact } = require('../models');

const router = express.Router();

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