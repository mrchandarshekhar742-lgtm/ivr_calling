const fs = require('fs');
const path = require('path');

console.log('🔧 FIXING ALL API ISSUES');
console.log('========================\n');

// 1. Fix contacts.js - Remove duplicate bulk-text route and fix order
console.log('1. Fixing contacts.js route order...');
const contactsPath = path.join(__dirname, 'src/routes/contacts.js');
let contactsContent = fs.readFileSync(contactsPath, 'utf8');

// Remove the duplicate bulk-text route at the end
const duplicateRouteStart = contactsContent.lastIndexOf('// @route   POST /api/contacts/bulk-text');
if (duplicateRouteStart > 0) {
    const beforeDuplicate = contactsContent.substring(0, duplicateRouteStart);
    const moduleExportIndex = beforeDuplicate.lastIndexOf('module.exports = router;');
    if (moduleExportIndex > 0) {
        contactsContent = beforeDuplicate.substring(0, moduleExportIndex) + 'module.exports = router;\n';
    }
}

// Ensure bulk-text route is before :id routes
if (!contactsContent.includes('router.post(\'/bulk-text\'') || contactsContent.indexOf('router.post(\'/bulk-text\'') > contactsContent.indexOf('router.get(\'/:id\'')) {
    // Find the position after bulk route and before :id route
    const bulkRouteEnd = contactsContent.indexOf('});', contactsContent.indexOf('router.post(\'/bulk\''));
    const idRouteStart = contactsContent.indexOf('// @route   GET /api/contacts/:id');
    
    if (bulkRouteEnd > 0 && idRouteStart > 0) {
        const bulkTextRoute = `
// @route   POST /api/contacts/bulk-text
// @desc    Bulk import contacts from text numbers
// @access  Private
router.post('/bulk-text', auth, [
  body('contacts').isArray().withMessage('Contacts must be an array')
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

    const { contacts } = req.body;
    const createdContacts = [];
    const duplicates = [];

    for (const contactData of contacts) {
      try {
        // Check if contact already exists
        const existingContact = await Contact.findOne({
          where: {
            phone: contactData.phone,
            createdBy: req.user.id
          }
        });

        if (existingContact) {
          duplicates.push(contactData.phone);
          continue;
        }

        // Create new contact
        const contact = await Contact.create({
          ...contactData,
          createdBy: req.user.id
        });

        createdContacts.push(contact);
      } catch (error) {
        logger.error(\`Error creating contact \${contactData.phone}:\`, error);
      }
    }

    logger.info(\`Bulk text import: \${createdContacts.length} contacts created by \${req.user.email}\`);

    res.json({
      success: true,
      message: \`Successfully imported \${createdContacts.length} contacts\`,
      data: {
        added: createdContacts.length,
        duplicates: duplicates.length,
        total: contacts.length
      }
    });
  } catch (error) {
    logger.error('Bulk text import error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

`;
        
        const beforeId = contactsContent.substring(0, bulkRouteEnd + 3);
        const afterId = contactsContent.substring(idRouteStart);
        contactsContent = beforeId + bulkTextRoute + afterId;
    }
}

fs.writeFileSync(contactsPath, contactsContent);
console.log('✅ Fixed contacts.js');

// 2. Fix campaigns.js - Ensure all campaign types are accepted
console.log('2. Fixing campaigns.js validation...');
const campaignsPath = path.join(__dirname, 'src/routes/campaigns.js');
let campaignsContent = fs.readFileSync(campaignsPath, 'utf8');

// Update campaign type validation
campaignsContent = campaignsContent.replace(
    /body\('type'\)\.isIn\(\[.*?\]\)/g,
    "body('type').isIn(['broadcast', 'survey', 'notification', 'reminder', 'bulk', 'scheduled', 'triggered'])"
);

campaignsContent = campaignsContent.replace(
    /body\('type'\)\.optional\(\)\.isIn\(\[.*?\]\)/g,
    "body('type').optional().isIn(['broadcast', 'survey', 'notification', 'reminder', 'bulk', 'scheduled', 'triggered'])"
);

fs.writeFileSync(campaignsPath, campaignsContent);
console.log('✅ Fixed campaigns.js');

// 3. Fix audio.js - Ensure proper MIME type handling
console.log('3. Fixing audio.js MIME types...');
const audioPath = path.join(__dirname, 'src/routes/audio.js');
let audioContent = fs.readFileSync(audioPath, 'utf8');

// Ensure all common audio MIME types are supported
const mimeTypes = [
    'audio/mpeg',
    'audio/mp3', 
    'audio/wav',
    'audio/wave',
    'audio/x-wav',
    'audio/mp4',
    'audio/aac',
    'audio/ogg',
    'audio/webm',
    'audio/flac'
];

const mimeTypeString = mimeTypes.map(type => `'${type}'`).join(',\n    ');
audioContent = audioContent.replace(
    /const allowedMimes = \[[\s\S]*?\];/,
    `const allowedMimes = [
    ${mimeTypeString}
  ];`
);

fs.writeFileSync(audioPath, audioContent);
console.log('✅ Fixed audio.js');

// 4. Create a comprehensive API test
console.log('4. Creating final API test...');
const testContent = `const axios = require('axios');
const FormData = require('form-data');

const BASE_URL = 'https://ivr.wxon.in';
let authToken = null;

async function testAllAPIs() {
    console.log('🚀 TESTING ALL APIs');
    console.log('==================\\n');

    let passed = 0;
    let failed = 0;

    // 1. Health Check
    try {
        const health = await axios.get(\`\${BASE_URL}/health\`);
        console.log('✅ Health Check: OK');
        passed++;
    } catch (error) {
        console.log('❌ Health Check: FAILED');
        failed++;
    }

    // 2. Login
    try {
        const login = await axios.post(\`\${BASE_URL}/api/auth/login\`, {
            email: 'admin@ivr.com',
            password: 'admin123'
        });
        authToken = login.data.data?.token || login.data.token;
        console.log('✅ Login: OK');
        passed++;
    } catch (error) {
        console.log('❌ Login: FAILED');
        failed++;
        return;
    }

    const headers = { 'Authorization': \`Bearer \${authToken}\` };

    // 3. Auth Me
    try {
        await axios.get(\`\${BASE_URL}/api/auth/me\`, { headers });
        console.log('✅ Auth Me: OK');
        passed++;
    } catch (error) {
        console.log('❌ Auth Me: FAILED');
        failed++;
    }

    // 4. Audio List
    try {
        await axios.get(\`\${BASE_URL}/api/audio\`, { headers });
        console.log('✅ Audio List: OK');
        passed++;
    } catch (error) {
        console.log('❌ Audio List: FAILED');
        failed++;
    }

    // 5. Contacts List
    try {
        await axios.get(\`\${BASE_URL}/api/contacts\`, { headers });
        console.log('✅ Contacts List: OK');
        passed++;
    } catch (error) {
        console.log('❌ Contacts List: FAILED');
        failed++;
    }

    // 6. Bulk Text Import
    try {
        await axios.post(\`\${BASE_URL}/api/contacts/bulk-text\`, {
            contacts: [{ name: 'Test', phone: '999' + Date.now(), email: '', notes: 'Test' }]
        }, { headers });
        console.log('✅ Bulk Text Import: OK');
        passed++;
    } catch (error) {
        console.log('❌ Bulk Text Import: FAILED -', error.response?.status, error.response?.data?.message);
        failed++;
    }

    // 7. Campaigns List
    try {
        await axios.get(\`\${BASE_URL}/api/campaigns\`, { headers });
        console.log('✅ Campaigns List: OK');
        passed++;
    } catch (error) {
        console.log('❌ Campaigns List: FAILED');
        failed++;
    }

    // 8. Campaign Creation
    try {
        await axios.post(\`\${BASE_URL}/api/campaigns\`, {
            name: 'Test Campaign ' + Date.now(),
            description: 'Test',
            type: 'broadcast',
            settings: {}
        }, { headers });
        console.log('✅ Campaign Creation: OK');
        passed++;
    } catch (error) {
        console.log('❌ Campaign Creation: FAILED -', error.response?.status, error.response?.data?.message);
        failed++;
    }

    // 9. Devices List
    try {
        await axios.get(\`\${BASE_URL}/api/devices\`, { headers });
        console.log('✅ Devices List: OK');
        passed++;
    } catch (error) {
        console.log('❌ Devices List: FAILED');
        failed++;
    }

    // 10. Device Registration
    try {
        await axios.post(\`\${BASE_URL}/api/devices/register\`, {
            deviceId: 'TEST_' + Date.now(),
            deviceName: 'Test Device',
            androidVersion: '13',
            deviceModel: 'Test',
            appVersion: '1.0'
        }, { headers });
        console.log('✅ Device Registration: OK');
        passed++;
    } catch (error) {
        console.log('❌ Device Registration: FAILED');
        failed++;
    }

    // 11. Analytics
    try {
        await axios.get(\`\${BASE_URL}/api/analytics/dashboard\`, { headers });
        console.log('✅ Analytics: OK');
        passed++;
    } catch (error) {
        console.log('❌ Analytics: FAILED');
        failed++;
    }

    // 12. Call Logs
    try {
        await axios.get(\`\${BASE_URL}/api/call-logs\`, { headers });
        console.log('✅ Call Logs: OK');
        passed++;
    } catch (error) {
        console.log('❌ Call Logs: FAILED');
        failed++;
    }

    // 13. Schedules
    try {
        await axios.get(\`\${BASE_URL}/api/schedules\`, { headers });
        console.log('✅ Schedules: OK');
        passed++;
    } catch (error) {
        console.log('❌ Schedules: FAILED');
        failed++;
    }

    console.log(\`\\n📊 RESULTS: \${passed} passed, \${failed} failed\`);
    console.log(\`📈 Success Rate: \${((passed/(passed+failed))*100).toFixed(1)}%\`);

    if (failed === 0) {
        console.log('\\n🎉 ALL APIs WORKING PERFECTLY!');
    } else if (failed <= 2) {
        console.log('\\n⚠️  Minor issues, mostly working');
    } else {
        console.log('\\n🚨 Multiple issues need attention');
    }
}

testAllAPIs().catch(console.error);`;

fs.writeFileSync(path.join(__dirname, 'test-all-apis-final.js'), testContent);
console.log('✅ Created final API test');

console.log('\n🎯 ALL FIXES APPLIED!');
console.log('====================');
console.log('✅ Fixed contacts bulk-text route order');
console.log('✅ Fixed campaign type validation');
console.log('✅ Fixed audio MIME type support');
console.log('✅ Created comprehensive API test');
console.log('\nNow run: node test-all-apis-final.js');