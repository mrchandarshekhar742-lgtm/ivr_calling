const express = require('express');
const auth = require('../middleware/auth');
const logger = require('../config/logger');
const CallSchedule = require('../models/CallSchedule');
const Campaign = require('../models/Campaign');

const router = express.Router();

// @route   GET /api/schedules
// @desc    Get all call schedules for current user
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = { createdBy: req.user.id };
    if (status) whereClause.status = status;

    const schedules = await CallSchedule.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Campaign,
          as: 'campaign',
          attributes: ['id', 'name', 'type', 'status']
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['scheduledAt', 'ASC']]
    });

    res.json({
      success: true,
      data: schedules.rows,
      pagination: {
        total: schedules.count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(schedules.count / limit)
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