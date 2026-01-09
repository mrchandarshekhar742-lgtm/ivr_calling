const { Device } = require('./backend/src/models');

async function testDB() {
  try {
    const devices = await Device.findAll({ limit: 1 });
    console.log('✅ Database connection OK, devices found:', devices.length);
    process.exit(0);
  } catch (error) {
    console.log('❌ Database error:', error.message);
    console.log('Full error:', error);
    process.exit(1);
  }
}

testDB();