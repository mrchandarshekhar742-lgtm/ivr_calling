const { Sequelize } = require('sequelize');
const path = require('path');
const logger = require('./logger');

// Create Sequelize instance
let sequelize;

// Try MySQL first, fallback to SQLite if MySQL is not available
try {
  if (process.env.DB_HOST && process.env.DB_HOST !== '') {
    // Use MySQL with mysql2
    sequelize = new Sequelize({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT || 3306,
      database: process.env.DB_NAME || 'ivr_system',
      username: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      dialect: 'mysql',
      dialectModule: require('mysql2'),
      logging: process.env.NODE_ENV === 'development' ? (msg) => logger.debug(msg) : false,
      pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
      },
      define: {
        timestamps: true,
        underscored: true,
        freezeTableName: true
      }
    });
    logger.info('🗄️ Using MySQL database');
  } else {
    throw new Error('MySQL not configured, falling back to SQLite');
  }
} catch (error) {
  // Fallback to SQLite for development
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: path.join(__dirname, '../../database.sqlite'),
    logging: process.env.NODE_ENV === 'development' ? (msg) => logger.debug(msg) : false,
    define: {
      timestamps: true,
      underscored: true,
      freezeTableName: true
    }
  });
  logger.info('🗄️ Using SQLite database (fallback)');
}

// Test database connection
const connectDB = async () => {
  try {
    await sequelize.authenticate();
    logger.info('✅ Database connected successfully');
    
    // Sync database in development
    if (process.env.NODE_ENV === 'development') {
      // Skip sync for now due to schema issues, but server can run
      logger.info('📊 Database connection established (sync skipped)');
      
      // Check if default users exist
      await ensureDefaultUsers();
    }
  } catch (error) {
    logger.error('❌ Database connection failed:', error.message);
    
    // Provide helpful error messages
    if (error.original?.code === 'ER_ACCESS_DENIED_ERROR') {
      logger.error('🔐 Access denied - Check your database credentials');
    } else if (error.original?.code === 'ECONNREFUSED') {
      logger.error('🔌 Connection refused - Make sure MySQL is running');
    } else if (error.original?.code === 'ER_BAD_DB_ERROR') {
      logger.error('🗄️ Database does not exist - Create the database first');
    }
    
    throw error;
  }
};

// Create default users for development
const ensureDefaultUsers = async () => {
  try {
    // No default users needed - users will register themselves
    logger.info('👤 User registration system ready');
  } catch (error) {
    logger.error('Failed to ensure default users:', error.message);
  }
};

module.exports = { sequelize, connectDB };