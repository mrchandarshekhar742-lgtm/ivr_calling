const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

// Production security middleware
const productionMiddleware = (app) => {
  if (process.env.NODE_ENV === 'production') {
    // Enhanced security headers
    app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
          fontSrc: ["'self'", "https://fonts.gstatic.com"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'", "wss:", "ws:"],
          mediaSrc: ["'self'"],
          objectSrc: ["'none'"],
          frameSrc: ["'none'"],
        },
      },
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
      }
    }));

    // Compression
    app.use(compression({
      level: 6,
      threshold: 1024,
      filter: (req, res) => {
        if (req.headers['x-no-compression']) {
          return false;
        }
        return compression.filter(req, res);
      }
    }));

    // Enhanced rate limiting for production
    const strictLimiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // limit each IP to 100 requests per windowMs
      message: {
        error: 'Too many requests from this IP, please try again later.',
        retryAfter: 15 * 60 // 15 minutes
      },
      standardHeaders: true,
      legacyHeaders: false,
    });

    const authLimiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 5, // limit each IP to 5 auth requests per windowMs
      message: {
        error: 'Too many authentication attempts, please try again later.',
        retryAfter: 15 * 60
      },
      standardHeaders: true,
      legacyHeaders: false,
    });

    // Apply rate limiting
    app.use('/api/', strictLimiter);
    app.use('/api/auth/', authLimiter);

    // Trust proxy (for reverse proxy setups)
    app.set('trust proxy', 1);

    // Disable x-powered-by header
    app.disable('x-powered-by');

    console.log('✅ Production security middleware enabled');
  }
};

module.exports = productionMiddleware;