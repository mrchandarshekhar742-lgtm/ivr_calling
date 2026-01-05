const fs = require('fs');
const path = require('path');

console.log('🔍 CHECKING FRONTEND BUILD');
console.log('==========================');

// Check if build directory exists
const buildDir = path.join(__dirname, 'build');
if (!fs.existsSync(buildDir)) {
  console.error('❌ Build directory not found!');
  console.log('Run: npm run build');
  process.exit(1);
}

console.log('✅ Build directory exists');

// Check main JS file
const staticDir = path.join(buildDir, 'static', 'js');
if (fs.existsSync(staticDir)) {
  const jsFiles = fs.readdirSync(staticDir).filter(f => f.startsWith('main.') && f.endsWith('.js'));
  
  if (jsFiles.length > 0) {
    const mainJsFile = path.join(staticDir, jsFiles[0]);
    const content = fs.readFileSync(mainJsFile, 'utf8');
    
    console.log(`✅ Main JS file: ${jsFiles[0]}`);
    
    // Check for API URLs
    if (content.includes('/api/devices/register')) {
      console.log('✅ Correct API URL found: /api/devices/register');
    } else if (content.includes('/devices/register')) {
      console.log('❌ Incorrect API URL found: /devices/register (missing /api)');
    } else {
      console.log('⚠️ Device registration URL not found in build');
    }
    
    // Check for API base URL
    if (content.includes('https://ivr.wxon.in/api')) {
      console.log('✅ Correct API base URL found: https://ivr.wxon.in/api');
    } else if (content.includes('https://ivr.wxon.in')) {
      console.log('❌ API base URL missing /api: https://ivr.wxon.in');
    } else {
      console.log('⚠️ API base URL not found in build');
    }
    
    // Check for localhost references
    if (content.includes('localhost:8090')) {
      console.log('✅ Correct fallback URL: localhost:8090');
    } else if (content.includes('localhost:5000')) {
      console.log('❌ Old fallback URL: localhost:5000');
    }
    
  } else {
    console.error('❌ Main JS file not found in build');
  }
} else {
  console.error('❌ Static JS directory not found in build');
}

// Check environment variables in build
console.log('\n📋 ENVIRONMENT CHECK:');
console.log('REACT_APP_API_URL:', process.env.REACT_APP_API_URL);
console.log('NODE_ENV:', process.env.NODE_ENV);

console.log('\n🔧 RECOMMENDATIONS:');
console.log('1. If URLs are incorrect, rebuild frontend: npm run build');
console.log('2. Clear browser cache or test in incognito mode');
console.log('3. Check .env and .env.production files');
console.log('4. Restart PM2: pm2 restart all');