require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const http = require('http');
const { Server } = require('socket.io');

// Import configurations and middleware
const logger = require('./src/config/logger');
const { connectDB } = require('./src/config/database');
const { apiLimiter } = require('./src/middleware/rateLimiter');
const errorHandler = require('./src/middleware/errorHandler');
const productionMiddleware = require('./src/middleware/production');

// Import models to ensure associations are loaded
require('./src/models');

// Import routes
const authRoutes = require('./src/routes/auth');
const campaignRoutes = require('./src/routes/campaigns');
const contactRoutes = require('./src/routes/contacts');
const audioRoutes = require('./src/routes/audio-simple');
const deviceRoutes = require('./src/routes/devices');
const analyticsRoutes = require('./src/routes/analytics');
const templateRoutes = require('./src/routes/templates');
const scheduleRoutes = require('./src/routes/schedules');
const callLogRoutes = require('./src/routes/callLogs');
const ivrFlowRoutes = require('./src/routes/ivrFlows');

const app = express();
const server = http.createServer(app);

// Socket.IO setup
const io = new Server(server, {
  cors: {
    origin: [
      process.env.FRONTEND_URL || 'https://ivr.wxon.in',
      'http://ivr.wxon.in',
      'http://localhost:3000'
    ],
    methods: ['GET', 'POST']
  }
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  logger.info(`Socket connected: ${socket.id}`);
  
  socket.on('disconnect', () => {
    logger.info(`Socket disconnected: ${socket.id}`);
  });
});

// Make io available to routes
app.set('io', io);

/* ================================
   BASIC & SECURITY MIDDLEWARE
================================ */
productionMiddleware(app);

app.use(helmet());
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

/* ================================
   CORS (PRODUCTION SAFE)
================================ */
app.use(
  cors({
    origin: [
      process.env.FRONTEND_URL || 'https://ivr.wxon.in',
      'http://ivr.wxon.in',
      'http://localhost:3000'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.options('*', cors());

/* ================================
   LOGGING
================================ */
app.use(morgan('combined', {
  stream: { write: msg => logger.info(msg.trim()) }
}));

/* ================================
   RATE LIMITING
================================ */
app.use('/api', apiLimiter);

/* ================================
   HEALTH CHECK
================================ */
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'IVR Backend',
    environment: process.env.NODE_ENV,
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

/* ================================
   API ROUTES (ONLY API)
================================ */
app.use('/api/auth', authRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/audio', audioRoutes);
app.use('/api/devices', deviceRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/schedules', scheduleRoutes);
app.use('/api/call-logs', callLogRoutes);
app.use('/api/ivr-flows', ivrFlowRoutes);

/* ================================
   404 HANDLER (JSON ONLY)
================================ */
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'API route not found'
  });
});

/* ================================
   ERROR HANDLER (LAST)
================================ */
app.use(errorHandler);

/* ================================
   SERVER START
================================ */
const PORT = process.env.PORT || 8090;

const startServer = async () => {
  try {
    await connectDB();
    server.listen(PORT, () => {
      logger.info(`🚀 IVR Backend running on port ${PORT}`);
      logger.info(`🌍 Environment: ${process.env.NODE_ENV}`);
    });
  } catch (err) {
    logger.error('❌ Server failed to start', err);
    process.exit(1);
  }
};

startServer();

/* ================================
   GRACEFUL SHUTDOWN
================================ */
process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down...');
  process.exit(0);
});
