const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const CallTemplate = sequelize.define('CallTemplate', {
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
  category: {
    type: DataTypes.ENUM('survey', 'reminder', 'notification', 'marketing', 'emergency', 'custom'),
    allowNull: false,
    defaultValue: 'custom'
  },
  audioFileId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'audio_files',
      key: 'id'
    }
  },
  script: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  dtmfOptions: {
    type: DataTypes.JSON,
    defaultValue: {
      '1': { action: 'confirm', label: 'Press 1 to confirm' },
      '2': { action: 'decline', label: 'Press 2 to decline' },
      '0': { action: 'repeat', label: 'Press 0 to repeat' }
    }
  },
  settings: {
    type: DataTypes.JSON,
    defaultValue: {
      maxDuration: 120, // 2 minutes
      waitForDtmf: 10, // 10 seconds
      repeatCount: 2,
      transferOnNoResponse: false,
      transferNumber: null
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
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  usageCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  tableName: 'call_templates'
});

// Instance methods
CallTemplate.prototype.incrementUsage = function() {
  this.usageCount += 1;
  return this.save();
};

module.exports = CallTemplate;