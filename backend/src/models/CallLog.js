const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const CallLog = sequelize.define('CallLog', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  campaignId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'campaigns',
      key: 'id'
    }
  },
  contactId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'contacts',
      key: 'id'
    }
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  deviceId: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  callId: {
    type: DataTypes.STRING(100),
    allowNull: true,
    unique: true
  },
  status: {
    type: DataTypes.ENUM('initiated', 'ringing', 'answered', 'completed', 'failed', 'busy', 'no_answer', 'cancelled'),
    allowNull: false
  },
  startTime: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  endTime: {
    type: DataTypes.DATE,
    allowNull: true
  },
  duration: {
    type: DataTypes.INTEGER, // in seconds
    allowNull: true
  },
  dtmfResponse: {
    type: DataTypes.STRING(10),
    allowNull: true
  },
  responseTime: {
    type: DataTypes.INTEGER, // time to respond in seconds
    allowNull: true
  },
  errorMessage: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  metadata: {
    type: DataTypes.JSON,
    defaultValue: {}
  }
}, {
  tableName: 'call_logs'
});

// Instance methods
CallLog.prototype.complete = function(dtmfResponse = null, responseTime = null) {
  this.status = 'completed';
  this.endTime = new Date();
  this.duration = Math.floor((this.endTime - this.startTime) / 1000);
  
  if (dtmfResponse) {
    this.dtmfResponse = dtmfResponse;
  }
  
  if (responseTime) {
    this.responseTime = responseTime;
  }
  
  return this.save();
};

CallLog.prototype.fail = function(errorMessage) {
  this.status = 'failed';
  this.endTime = new Date();
  this.duration = Math.floor((this.endTime - this.startTime) / 1000);
  this.errorMessage = errorMessage;
  return this.save();
};

CallLog.prototype.getDurationFormatted = function() {
  if (!this.duration) return '0s';
  
  const minutes = Math.floor(this.duration / 60);
  const seconds = this.duration % 60;
  
  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }
  return `${seconds}s`;
};

module.exports = CallLog;