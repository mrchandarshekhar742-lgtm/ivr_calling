const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const CallSchedule = sequelize.define('CallSchedule', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  campaignId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'campaigns',
      key: 'id'
    }
  },
  scheduleType: {
    type: DataTypes.ENUM('once', 'daily', 'weekly', 'monthly', 'custom'),
    allowNull: false
  },
  startDate: {
    type: DataTypes.DATE,
    allowNull: false
  },
  endDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  timeSlots: {
    type: DataTypes.JSON,
    defaultValue: [
      { start: '09:00', end: '17:00', days: [1, 2, 3, 4, 5] } // Monday to Friday, 9 AM to 5 PM
    ]
  },
  timezone: {
    type: DataTypes.STRING(50),
    defaultValue: 'UTC'
  },
  maxCallsPerHour: {
    type: DataTypes.INTEGER,
    defaultValue: 100
  },
  priority: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
    validate: {
      min: 1,
      max: 10
    }
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  lastExecuted: {
    type: DataTypes.DATE,
    allowNull: true
  },
  nextExecution: {
    type: DataTypes.DATE,
    allowNull: true
  },
  createdBy: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  }
}, {
  tableName: 'call_schedules'
});

// Instance methods
CallSchedule.prototype.calculateNextExecution = function() {
  const now = new Date();
  let nextExec = new Date(this.startDate);
  
  switch (this.scheduleType) {
    case 'once':
      nextExec = this.startDate > now ? this.startDate : null;
      break;
    case 'daily':
      nextExec.setDate(now.getDate() + 1);
      break;
    case 'weekly':
      nextExec.setDate(now.getDate() + 7);
      break;
    case 'monthly':
      nextExec.setMonth(now.getMonth() + 1);
      break;
  }
  
  if (this.endDate && nextExec > this.endDate) {
    nextExec = null;
  }
  
  this.nextExecution = nextExec;
  return nextExec;
};

module.exports = CallSchedule;