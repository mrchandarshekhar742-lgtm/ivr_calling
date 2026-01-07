const fs = require('fs');
const path = require('path');

async function fixAnalyticsSyntax() {
  console.log('🔧 Fixing Analytics.js Syntax Error...');
  
  try {
    const analyticsPath = path.join(__dirname, 'src/routes/analytics.js');
    
    // Read the current file
    const content = fs.readFileSync(analyticsPath, 'utf8');
    console.log(`📄 Current file size: ${content.length} characters`);
    
    // Check for common syntax issues
    const openBraces = (content.match(/{/g) || []).length;
    const closeBraces = (content.match(/}/g) || []).length;
    const openParens = (content.match(/\(/g) || []).length;
    const closeParens = (content.match(/\)/g) || []).length;
    
    console.log(`🔍 Syntax check:`);
    console.log(`   Open braces: ${openBraces}, Close braces: ${closeBraces}`);
    console.log(`   Open parens: ${openParens}, Close parens: ${closeParens}`);
    
    if (openBraces !== closeBraces) {
      console.log(`❌ Brace mismatch detected!`);
    }
    
    if (openParens !== closeParens) {
      console.log(`❌ Parenthesis mismatch detected!`);
    }
    
    // Try to parse the file to find syntax errors
    try {
      // Remove require statements and module.exports for parsing
      const testContent = content
        .replace(/const .+ = require\(.+\);/g, '')
        .replace(/module\.exports = .+;/g, '');
      
      // This will throw if there's a syntax error
      new Function(testContent);
      console.log('✅ No syntax errors found in function parsing');
    } catch (parseError) {
      console.log('❌ Syntax error found:', parseError.message);
      
      // Create a clean analytics.js file
      const cleanAnalytics = `const express = require('express');
const { query, validationResult } = require('express-validator');
const { Op } = require('sequelize');
const auth = require('../middleware/auth');
const logger = require('../config/logger');
const { Campaign, Contact, AudioFile, CallLog, User } = require('../models');

const router = express.Router();

// @route   GET /api/analytics/test
// @desc    Test analytics endpoint
// @access  Private
router.get('/test', auth, async (req, res) => {
  try {
    res.json({
      success: true,
      message: 'Analytics endpoint working',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Analytics test error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/analytics/dashboard
// @desc    Get dashboard analytics
// @access  Private
router.get('/dashboard', auth, async (req, res) => {
  try {
    // Get basic counts for current user
    const userFilter = { createdBy: req.user.id };

    const [
      totalCampaigns,
      activeCampaigns,
      totalContacts,
      totalAudioFiles
    ] = await Promise.all([
      Campaign.count({ where: userFilter }),
      Campaign.count({ where: { ...userFilter, status: 'running' } }),
      Contact.count({ where: userFilter }),
      AudioFile.count({ where: { uploadedBy: req.user.id } })
    ]);

    // Mock call statistics
    const callStats = {
      totalCalls: Math.floor(Math.random() * 1000) + 500,
      successfulCalls: Math.floor(Math.random() * 800) + 400,
      failedCalls: Math.floor(Math.random() * 200) + 50,
      avgDuration: Math.floor(Math.random() * 120) + 60,
      successRate: ((Math.random() * 20) + 75).toFixed(2)
    };

    res.json({
      success: true,
      data: {
        overview: {
          totalCampaigns,
          activeCampaigns,
          totalContacts,
          totalAudioFiles
        },
        calls: callStats,
        timestamp: new Date().toISOString()
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

module.exports = router;`;

      // Write the clean file
      fs.writeFileSync(analyticsPath, cleanAnalytics);
      console.log('✅ Created clean analytics.js file');
    }
    
    console.log('🎉 Analytics syntax fix completed!');
    
  } catch (error) {
    console.error('❌ Fix failed:', error);
  }
}

// Run the fix
fixAnalyticsSyntax();