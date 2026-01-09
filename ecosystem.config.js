module.exports = {
  apps: [{
    name: 'ivr-backend-8090',
    script: './backend/server.js',
    cwd: '/var/www/ivr-platform/ivr_calling',
    env: {
      NODE_ENV: 'production',
      PORT: 8090,
      FRONTEND_URL: 'https://ivr.wxon.in',
      DB_HOST: 'localhost',
      DB_PORT: 3306,
      DB_NAME: 'ivr_system_prod',
      DB_USER: 'ivr_user',
      DB_PASSWORD: 'IVR_wxon_2024_SecurePass!',
      JWT_SECRET: 'dvslaoehfweihehf78vq4r44vy438472330c5mvtg7ryyyw4g4two84tghity8b5isv47y5v74vnhg',
      JWT_EXPIRES_IN: '24h',
      JWT_REFRESH_SECRET: 'vhn4ty875vyvnt485v7y7nev8ny94od8yn8vtv57nuiduy84nt7y5n56o965ettt847v4y7t5t8y87',
      JWT_REFRESH_EXPIRES_IN: '7d',
      MAX_FILE_SIZE: '50MB',
      UPLOAD_PATH: './uploads',
      LOG_LEVEL: 'warn',
      LOG_FILE: './logs/app.log',
      RATE_LIMIT_WINDOW_MS: 900000,
      RATE_LIMIT_MAX_REQUESTS: 100,
      CORS_ORIGIN: 'https://ivr.wxon.in',
      REDIS_HOST: 'localhost',
      REDIS_PORT: 6379,
      REDIS_PASSWORD: ''
    },
    instances: 1,
    exec_mode: 'fork',
    watch: false,
    max_memory_restart: '1G',
    error_file: '/var/log/pm2/ivr-backend-error.log',
    out_file: '/var/log/pm2/ivr-backend-out.log',
    log_file: '/var/log/pm2/ivr-backend-combined.log',
    time: true
  }]
};