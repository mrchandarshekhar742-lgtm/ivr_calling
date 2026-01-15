const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const IVRNode = sequelize.define('IVRNode', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  flowId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'ivr_flows',
      key: 'id'
    }
  },
  nodeKey: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: 'Unique identifier within flow: main_menu, option_1, etc.'
  },
  nodeName: {
    type: DataTypes.STRING(255),
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
  promptText: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Text description of the prompt for reference'
  },
  nodeType: {
    type: DataTypes.ENUM('menu', 'message', 'input', 'transfer', 'end'),
    defaultValue: 'menu'
  },
  timeout: {
    type: DataTypes.INTEGER,
    defaultValue: 10,
    comment: 'Seconds to wait for DTMF input'
  },
  retryCount: {
    type: DataTypes.INTEGER,
    defaultValue: 3
  },
  retryAudioFileId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Audio to play on invalid/no input'
  },
  parentNodeId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Parent node for hierarchical structure'
  },
  actions: {
    type: DataTypes.JSON,
    defaultValue: {},
    comment: 'DTMF key to action mapping: {"1": {"type": "goto", "target": "node_key"}}'
  },
  metadata: {
    type: DataTypes.JSON,
    defaultValue: {}
  }
}, {
  tableName: 'ivr_nodes',
  timestamps: true
});

module.exports = IVRNode;
