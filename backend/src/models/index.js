const User = require('./User');
const Campaign = require('./Campaign');
const Contact = require('./Contact');
const AudioFile = require('./AudioFile');
const CallLog = require('./CallLog');
const CallTemplate = require('./CallTemplate');
const CallSchedule = require('./CallSchedule');
const Device = require('./Device');
const IVRFlow = require('./IVRFlow');
const IVRNode = require('./IVRNode');

// Define associations
User.hasMany(Campaign, { foreignKey: 'createdBy', as: 'campaigns' });
Campaign.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });

User.hasMany(Contact, { foreignKey: 'createdBy', as: 'contacts' });
Contact.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });

User.hasMany(AudioFile, { foreignKey: 'uploadedBy', as: 'audioFiles' });
AudioFile.belongsTo(User, { foreignKey: 'uploadedBy', as: 'uploader' });

User.hasMany(Device, { foreignKey: 'userId', as: 'devices' });
Device.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(CallLog, { foreignKey: 'userId', as: 'callLogs' });
CallLog.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Campaign.hasMany(Contact, { foreignKey: 'campaignId', as: 'contacts' });
Contact.belongsTo(Campaign, { foreignKey: 'campaignId', as: 'campaign' });

Campaign.belongsTo(AudioFile, { foreignKey: 'audioFileId', as: 'audioFile' });
AudioFile.hasMany(Campaign, { foreignKey: 'audioFileId', as: 'campaigns' });

Campaign.hasMany(CallLog, { foreignKey: 'campaignId', as: 'callLogs' });
CallLog.belongsTo(Campaign, { foreignKey: 'campaignId', as: 'campaign' });

Contact.hasMany(CallLog, { foreignKey: 'contactId', as: 'callLogs' });
CallLog.belongsTo(Contact, { foreignKey: 'contactId', as: 'contact' });

// Call Template associations
User.hasMany(CallTemplate, { foreignKey: 'createdBy', as: 'callTemplates' });
CallTemplate.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });

CallTemplate.belongsTo(AudioFile, { foreignKey: 'audioFileId', as: 'audioFile' });
AudioFile.hasMany(CallTemplate, { foreignKey: 'audioFileId', as: 'callTemplates' });

// Call Schedule associations
User.hasMany(CallSchedule, { foreignKey: 'createdBy', as: 'callSchedules' });
CallSchedule.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });

Campaign.hasMany(CallSchedule, { foreignKey: 'campaignId', as: 'schedules' });
CallSchedule.belongsTo(Campaign, { foreignKey: 'campaignId', as: 'campaign' });

// IVR Flow associations
User.hasMany(IVRFlow, { foreignKey: 'userId', as: 'ivrFlows' });
IVRFlow.belongsTo(User, { foreignKey: 'userId', as: 'user' });

IVRFlow.hasMany(IVRNode, { foreignKey: 'flowId', as: 'nodes' });
IVRNode.belongsTo(IVRFlow, { foreignKey: 'flowId', as: 'flow' });

IVRNode.belongsTo(AudioFile, { foreignKey: 'audioFileId', as: 'audioFile' });
AudioFile.hasMany(IVRNode, { foreignKey: 'audioFileId', as: 'ivrNodes' });

CallLog.belongsTo(IVRFlow, { foreignKey: 'ivrFlowId', as: 'ivrFlow' });
IVRFlow.hasMany(CallLog, { foreignKey: 'ivrFlowId', as: 'callLogs' });

module.exports = {
  User,
  Campaign,
  Contact,
  AudioFile,
  CallLog,
  CallTemplate,
  CallSchedule,
  Device,
  IVRFlow,
  IVRNode
};