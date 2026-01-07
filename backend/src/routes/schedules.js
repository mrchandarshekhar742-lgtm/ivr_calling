const express = require('express');
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