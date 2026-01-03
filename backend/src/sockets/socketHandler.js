const logger = require('../config/logger');

module.exports = (io) => {
  // Store connected users and devices
  const connectedUsers = new Map();
  const connectedDevices = new Map();

  io.on('connection', (socket) => {
    logger.info(`Socket connected: ${socket.id}`);

    // Handle user authentication
    socket.on('authenticate', (data) => {
      try {
        const { userId, userType = 'web', deviceId } = data;
        
        if (userType === 'web') {
          // Web client authentication
          connectedUsers.set(socket.id, { userId, socketId: socket.id });
          socket.join(`user:${userId}`);
          logger.info(`Web user authenticated: ${userId}`);
        } else if (userType === 'device') {
          // Android device authentication
          connectedDevices.set(socket.id, { userId, deviceId, socketId: socket.id });
          socket.join(`device:${deviceId}`);
          socket.join(`user:${userId}`);
          logger.info(`Device authenticated: ${deviceId} for user ${userId}`);
          
          // Notify web clients about device connection
          socket.to(`user:${userId}`).emit('device:connected', { deviceId });
        }

        socket.emit('authenticated', { success: true });
      } catch (error) {
        logger.error('Socket authentication error:', error);
        socket.emit('authenticated', { success: false, error: 'Authentication failed' });
      }
    });

    // Handle campaign events
    socket.on('campaign:start', (data) => {
      try {
        const { campaignId, deviceIds = [] } = data;
        
        // Notify selected devices to start campaign
        deviceIds.forEach(deviceId => {
          socket.to(`device:${deviceId}`).emit('campaign:start', {
            campaignId,
            timestamp: new Date()
          });
        });

        // Notify web clients
        const user = connectedUsers.get(socket.id);
        if (user) {
          socket.to(`user:${user.userId}`).emit('campaign:started', {
            campaignId,
            deviceIds,
            timestamp: new Date()
          });
        }

        logger.info(`Campaign ${campaignId} started on devices: ${deviceIds.join(', ')}`);
      } catch (error) {
        logger.error('Campaign start error:', error);
        socket.emit('error', { message: 'Failed to start campaign' });
      }
    });

    socket.on('campaign:pause', (data) => {
      try {
        const { campaignId, deviceIds = [] } = data;
        
        deviceIds.forEach(deviceId => {
          socket.to(`device:${deviceId}`).emit('campaign:pause', {
            campaignId,
            timestamp: new Date()
          });
        });

        const user = connectedUsers.get(socket.id);
        if (user) {
          socket.to(`user:${user.userId}`).emit('campaign:paused', {
            campaignId,
            deviceIds,
            timestamp: new Date()
          });
        }

        logger.info(`Campaign ${campaignId} paused on devices: ${deviceIds.join(', ')}`);
      } catch (error) {
        logger.error('Campaign pause error:', error);
        socket.emit('error', { message: 'Failed to pause campaign' });
      }
    });

    socket.on('campaign:stop', (data) => {
      try {
        const { campaignId, deviceIds = [] } = data;
        
        deviceIds.forEach(deviceId => {
          socket.to(`device:${deviceId}`).emit('campaign:stop', {
            campaignId,
            timestamp: new Date()
          });
        });

        const user = connectedUsers.get(socket.id);
        if (user) {
          socket.to(`user:${user.userId}`).emit('campaign:stopped', {
            campaignId,
            deviceIds,
            timestamp: new Date()
          });
        }

        logger.info(`Campaign ${campaignId} stopped on devices: ${deviceIds.join(', ')}`);
      } catch (error) {
        logger.error('Campaign stop error:', error);
        socket.emit('error', { message: 'Failed to stop campaign' });
      }
    });

    // Handle call events from devices
    socket.on('call:initiated', (data) => {
      try {
        const { callId, campaignId, contactId, deviceId } = data;
        const device = connectedDevices.get(socket.id);
        
        if (device) {
          // Notify web clients about call initiation
          socket.to(`user:${device.userId}`).emit('call:initiated', {
            callId,
            campaignId,
            contactId,
            deviceId,
            timestamp: new Date()
          });
        }

        logger.info(`Call initiated: ${callId} from device ${deviceId}`);
      } catch (error) {
        logger.error('Call initiation error:', error);
      }
    });

    socket.on('call:answered', (data) => {
      try {
        const { callId, campaignId, contactId, deviceId } = data;
        const device = connectedDevices.get(socket.id);
        
        if (device) {
          socket.to(`user:${device.userId}`).emit('call:answered', {
            callId,
            campaignId,
            contactId,
            deviceId,
            timestamp: new Date()
          });
        }

        logger.info(`Call answered: ${callId} on device ${deviceId}`);
      } catch (error) {
        logger.error('Call answered error:', error);
      }
    });

    socket.on('call:ended', (data) => {
      try {
        const { callId, campaignId, contactId, deviceId, duration, status, dtmfResponse } = data;
        const device = connectedDevices.get(socket.id);
        
        if (device) {
          socket.to(`user:${device.userId}`).emit('call:ended', {
            callId,
            campaignId,
            contactId,
            deviceId,
            duration,
            status,
            dtmfResponse,
            timestamp: new Date()
          });
        }

        logger.info(`Call ended: ${callId} on device ${deviceId} - Status: ${status}`);
      } catch (error) {
        logger.error('Call ended error:', error);
      }
    });

    // Handle DTMF input from devices
    socket.on('dtmf:input', (data) => {
      try {
        const { callId, digit, deviceId } = data;
        const device = connectedDevices.get(socket.id);
        
        if (device) {
          socket.to(`user:${device.userId}`).emit('dtmf:received', {
            callId,
            digit,
            deviceId,
            timestamp: new Date()
          });
        }

        logger.info(`DTMF input: ${digit} for call ${callId} on device ${deviceId}`);
      } catch (error) {
        logger.error('DTMF input error:', error);
      }
    });

    // Handle device status updates
    socket.on('device:status', (data) => {
      try {
        const { deviceId, status, batteryLevel, signalStrength } = data;
        const device = connectedDevices.get(socket.id);
        
        if (device) {
          socket.to(`user:${device.userId}`).emit('device:statusUpdate', {
            deviceId,
            status,
            batteryLevel,
            signalStrength,
            timestamp: new Date()
          });
        }

        logger.info(`Device status update: ${deviceId} - ${status}`);
      } catch (error) {
        logger.error('Device status error:', error);
      }
    });

    // Handle real-time notifications
    socket.on('notification:send', (data) => {
      try {
        const { userId, message, type = 'info' } = data;
        
        // Send notification to specific user
        socket.to(`user:${userId}`).emit('notification:received', {
          message,
          type,
          timestamp: new Date()
        });

        logger.info(`Notification sent to user ${userId}: ${message}`);
      } catch (error) {
        logger.error('Notification error:', error);
      }
    });

    // Handle heartbeat from devices
    socket.on('heartbeat', (data) => {
      try {
        const { deviceId } = data;
        const device = connectedDevices.get(socket.id);
        
        if (device) {
          // Update device last seen
          device.lastSeen = new Date();
          
          // Respond with server time
          socket.emit('heartbeat:ack', {
            serverTime: new Date(),
            deviceId
          });
        }
      } catch (error) {
        logger.error('Heartbeat error:', error);
      }
    });

    // Handle file upload progress (for large audio files)
    socket.on('upload:progress', (data) => {
      try {
        const { uploadId, progress, filename } = data;
        const user = connectedUsers.get(socket.id);
        
        if (user) {
          socket.emit('upload:progressUpdate', {
            uploadId,
            progress,
            filename,
            timestamp: new Date()
          });
        }
      } catch (error) {
        logger.error('Upload progress error:', error);
      }
    });

    // Handle disconnection
    socket.on('disconnect', (reason) => {
      try {
        logger.info(`Socket disconnected: ${socket.id} - Reason: ${reason}`);
        
        // Clean up user connection
        const user = connectedUsers.get(socket.id);
        if (user) {
          connectedUsers.delete(socket.id);
          logger.info(`Web user disconnected: ${user.userId}`);
        }
        
        // Clean up device connection
        const device = connectedDevices.get(socket.id);
        if (device) {
          connectedDevices.delete(socket.id);
          
          // Notify web clients about device disconnection
          socket.to(`user:${device.userId}`).emit('device:disconnected', {
            deviceId: device.deviceId
          });
          
          logger.info(`Device disconnected: ${device.deviceId}`);
        }
      } catch (error) {
        logger.error('Disconnect cleanup error:', error);
      }
    });

    // Handle errors
    socket.on('error', (error) => {
      logger.error('Socket error:', error);
    });
  });

  // Periodic cleanup of stale connections
  setInterval(() => {
    const now = Date.now();
    const staleThreshold = 5 * 60 * 1000; // 5 minutes

    connectedDevices.forEach((device, socketId) => {
      if (device.lastSeen && (now - device.lastSeen.getTime()) > staleThreshold) {
        logger.info(`Cleaning up stale device connection: ${device.deviceId}`);
        connectedDevices.delete(socketId);
        
        // Notify web clients
        io.to(`user:${device.userId}`).emit('device:disconnected', {
          deviceId: device.deviceId,
          reason: 'timeout'
        });
      }
    });
  }, 60000); // Run every minute

  logger.info('Socket.IO handlers initialized');
};