const bcrypt = require('bcryptjs');
const { User } = require('./src/models');

async function createAdminUser() {
  try {
    console.log('Creating admin user...');
    
    // Check if admin user already exists
    const existingUser = await User.findOne({ where: { email: 'admin@ivr.com' } });
    if (existingUser) {
      console.log('Admin user already exists!');
      console.log('Email: admin@ivr.com');
      console.log('Password: admin123');
      process.exit(0);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    // Create admin user
    const user = await User.create({
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@ivr.com',
      password: hashedPassword,
      role: 'admin',
      status: 'active'
    });

    console.log('✅ Admin user created successfully!');
    console.log('📧 Email: admin@ivr.com');
    console.log('🔑 Password: admin123');
    console.log('👤 Role: admin');
    console.log('');
    console.log('You can now login to the dashboard with these credentials.');
    
  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
    
    // Try to create with plain password (if bcrypt fails)
    try {
      console.log('Trying with plain password...');
      const user = await User.create({
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@ivr.com',
        password: 'admin123', // Plain password - User model should hash it
        role: 'admin',
        status: 'active'
      });
      console.log('✅ Admin user created with plain password!');
      console.log('📧 Email: admin@ivr.com');
      console.log('🔑 Password: admin123');
    } catch (plainError) {
      console.error('❌ Failed with plain password too:', plainError.message);
    }
  }
  
  process.exit(0);
}

createAdminUser();