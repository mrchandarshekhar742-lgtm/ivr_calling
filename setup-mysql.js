const mysql = require('mysql2/promise');
require('dotenv').config({ path: './backend/.env' });

async function setupDatabase() {
  console.log('🗄️ Setting up MySQL database...\n');

  try {
    // Connect to MySQL server (without specifying database)
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || ''
    });

    console.log('✅ Connected to MySQL server');

    // Create database if it doesn't exist
    const dbName = process.env.DB_NAME || 'ivr_system';
    await connection.execute(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
    console.log(`✅ Database '${dbName}' created or already exists`);

    // Close connection
    await connection.end();

    console.log('\n🎉 MySQL database setup completed!');
    console.log('\n📋 Database Configuration:');
    console.log(`   Host: ${process.env.DB_HOST || 'localhost'}`);
    console.log(`   Port: ${process.env.DB_PORT || 3306}`);
    console.log(`   Database: ${dbName}`);
    console.log(`   User: ${process.env.DB_USER || 'root'}`);
    console.log('\n🚀 You can now start the backend server with: npm start');

  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('\n💡 Solutions:');
      console.error('   1. Check your MySQL username and password in backend/.env');
      console.error('   2. Make sure MySQL server is running');
      console.error('   3. Grant proper permissions to the user');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('\n💡 Solutions:');
      console.error('   1. Make sure MySQL server is installed and running');
      console.error('   2. Check if MySQL is running on the correct port');
      console.error('   3. Install MySQL: https://dev.mysql.com/downloads/mysql/');
    }
    
    process.exit(1);
  }
}

setupDatabase();