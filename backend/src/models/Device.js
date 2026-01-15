const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Device = sequelize.define('Device', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  deviceId: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: true
    }
  },
  deviceName: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  androidVersion: {
    type: DataTypes.STRING(50),
    defaultValue: 'Unknown'
  },
  deviceModel: {
    type: DataTypes.STRING(100),
    defaultValue: 'Android Device'
  },
  appVersion: {
    type: DataTypes.STRING(20),
    defaultValue: '1.0.0'
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  userEmail: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('online', 'offline', 'busy'),
    defaultValue: 'offline'
  },
  token: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  lastSeen: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  capabilities: {
    type: DataTypes.JSON,
    defaultValue: ['voice_call', 'dtmf_input']
  },
  stats: {
    type: DataTypes.JSON,
    defaultValue: {
      totalCalls: 0,
      successfulCalls: 0,
      failedCalls: 0,
      lastCallAt: null
    }
  },
  pendingCommands: {
    type: DataTypes.JSON,
    defaultValue: [],
    field: 'pending_commands'  // Map to database column name
  }
}, {
  tableName: 'devices'
});

// Instance methods
Device.prototype.updateStatus = function(status) {
  this.status = status;
  this.lastSeen = new Date();
  return this.save();
};

Device.prototype.incrementCallStats = function(success = true) {
  const stats = this.stats || { totalCalls: 0, successfulCalls: 0, failedCalls: 0, lastCallAt: null };
  stats.totalCalls += 1;
  if (success) {
    stats.successfulCalls += 1;
  } else {
    stats.failedCalls += 1;
  }
  stats.lastCallAt = new Date();
  this.stats = stats;
  return this.save();
};

module.exports = Device;