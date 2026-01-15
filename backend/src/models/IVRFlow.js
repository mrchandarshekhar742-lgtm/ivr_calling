const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const IVRFlow = sequelize.define('IVRFlow', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  flowConfig: {
    type: DataTypes.JSON,
    defaultValue: {},
    comment: 'Complete IVR flow configuration with nodes and actions'
  },
  defaultLanguage: {
    type: DataTypes.STRING(10),
    defaultValue: 'en'
  },
  maxRetries: {
    type: DataTypes.INTEGER,
    defaultValue: 3
  },
  timeout: {
    type: DataTypes.INTEGER,
    defaultValue: 10,
    comment: 'Timeout in seconds for DTMF input'
  },
  stats: {
    type: DataTypes.JSON,
    defaultValue: {
      totalCalls: 0,
      completedCalls: 0,
      averageDuration: 0,
      popularChoices: {}
    }
  }
}, {
  tableName: 'ivr_flows',
  timestamps: true
});

module.exports = IVRFlow;
