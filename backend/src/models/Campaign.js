const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Campaign = sequelize.define('Campaign', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [3, 100]
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('draft', 'scheduled', 'running', 'paused', 'completed', 'cancelled'),
    defaultValue: 'draft'
  },
  type: {
    type: DataTypes.ENUM('bulk', 'scheduled', 'triggered'),
    allowNull: false
  },
  audioFileId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'audio_files',
      key: 'id'
    }
  },
  createdBy: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  scheduledAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  startedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  completedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  settings: {
    type: DataTypes.JSON,
    defaultValue: {
      maxConcurrentCalls: 5,
      retryAttempts: 3,
      retryInterval: 300, // 5 minutes
      callTimeout: 60, // 1 minute
      priority: 1
    }
  },
  stats: {
    type: DataTypes.JSON,
    defaultValue: {
      totalContacts: 0,
      completedCalls: 0,
      successfulCalls: 0,
      failedCalls: 0,
      dtmfResponses: {}
    }
  }
}, {
  tableName: 'campaigns'
});

// Instance methods
Campaign.prototype.updateStats = function(statsUpdate) {
  this.stats = { ...this.stats, ...statsUpdate };
  return this.save();
};

Campaign.prototype.canStart = function() {
  return ['draft', 'paused'].includes(this.status);
};

Campaign.prototype.canPause = function() {
  return this.status === 'running';
};

Campaign.prototype.canStop = function() {
  return ['running', 'paused'].includes(this.status);
};

module.exports = Campaign;