const { User } = require('./src/models');

async function checkUsers() {
  try {
    console.log('🔍 Checking users in database...');
    
    const users = await User.findAll({
      attributes: ['id', 'firstName', 'lastName', 'email', 'role', 'status', 'createdAt']
    });
    
    if (users.length === 0) {
      console.log('❌ No users found in database!');
      console.log('Creating admin user...');
      
      const newUser = await User.create({
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@ivr.com',
        password: 'admin123',
        role: 'admin',
        status: 'active'
      });
      
      console.log('✅ Admin user created:', newUser.email);
    } else {
      console.log(`✅ Found ${users.length} users:`);
      users.forEach(user => {
        console.log(`- ${user.email} (${user.role}) - ${user.status}`);
      });
    }
    
    // Test password comparison
    const testUser = await User.findOne({ where: { email: 'admin@ivr.com' } });
    if (testUser) {
      const isPasswordValid = await testUser.comparePassword('admin123');
      console.log(`🔑 Password test for admin@ivr.com: ${isPasswordValid ? '✅ Valid' : '❌ Invalid'}`);
    }
    
  } catch (error) {
    console.error('❌ Database error:', error.message);
  }
  
  process.exit(0);
}

checkUsers();