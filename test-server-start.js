// Simple server startup test
console.log('Testing server startup...');

try {
  // Test database connection
  const { connectDB } = require('./backend/src/config/database');
  
  connectDB().then(() => {
    console.log('✅ Database connection successful');
    
    // Test model imports
    require('./backend/src/models');
    console.log('✅ Models loaded successfully');
    
    console.log('✅ Server should start without issues');
    process.exit(0);
  }).catch(error => {
    console.error('❌ Database connection failed:', error.message);
    process.exit(1);
  });
  
} catch (error) {
  console.error('❌ Server startup test failed:', error.message);
  process.exit(1);
}