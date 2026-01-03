const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Contact = sequelize.define('Contact', {
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
      len: [2, 100]
    }
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: false,
    validate: {
      notEmpty: true,
      is: /^[\+]?[1-9][\d]{0,15}$/
    }
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: true,
    validate: {
      isEmail: true
    }
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive', 'pending', 'called', 'failed', 'do_not_call'),
    defaultValue: 'active'
  },
  campaignId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'campaigns',
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
  callAttempts: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  lastCallDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  lastResponse: {
    type: DataTypes.STRING(10),
    allowNull: true
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  customFields: {
    type: DataTypes.JSON,
    defaultValue: {}
  }
}, {
  tableName: 'contacts'
});

// Instance methods
Contact.prototype.incrementCallAttempts = function() {
  this.callAttempts += 1;
  this.lastCallDate = new Date();
  return this.save();
};

Contact.prototype.markAsCalled = function(response = null) {
  this.status = 'called';
  this.lastCallDate = new Date();
  if (response) {
    this.lastResponse = response;
  }
  return this.save();
};

Contact.prototype.markAsFailed = function() {
  this.status = 'failed';
  this.lastCallDate = new Date();
  return this.save();
};

module.exports = Contact;