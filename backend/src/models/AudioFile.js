const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const AudioFile = sequelize.define('AudioFile', {
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
  originalName: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  filename: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true
  },
  mimeType: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  size: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  duration: {
    type: DataTypes.FLOAT,
    allowNull: true
  },
  path: {
    type: DataTypes.STRING(500),
    allowNull: false
  },
  url: {
    type: DataTypes.STRING(500),
    allowNull: false
  },
  category: {
    type: DataTypes.ENUM('welcome', 'menu', 'goodbye', 'error', 'hold', 'transfer', 'custom'),
    defaultValue: 'custom'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  tags: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  uploadedBy: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  isPublic: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  usageCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  lastUsed: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'audio_files'
});

// Instance methods
AudioFile.prototype.incrementUsage = function() {
  this.usageCount += 1;
  this.lastUsed = new Date();
  return this.save();
};

AudioFile.prototype.getFileSize = function() {
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  if (this.size === 0) return '0 Byte';
  const i = parseInt(Math.floor(Math.log(this.size) / Math.log(1024)));
  return Math.round(this.size / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
};

module.exports = AudioFile;