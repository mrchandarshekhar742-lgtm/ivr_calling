# 🌐 VPS Deployment Guide - IVR Call Management System

## 🚀 Complete VPS Deployment Process

### Prerequisites:
- VPS with Ubuntu 20.04+ or CentOS 8+
- Root or sudo access
- Domain name (optional but recommended)
- SSL certificate (for HTTPS)

## 📋 Step 1: VPS Server Setup

### Initial Server Configuration:
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install essential packages
sudo apt install -y curl wget git nginx certbot python3-certbot-nginx

# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installations
node --version
npm --version
nginx -v
```

### Create Application User:
```bash
# Create dedicated user for the application
sudo adduser ivrapp
sudo usermod -aG sudo ivrapp

# Switch to application user
sudo su - ivrapp
```

## 📁 Step 2: Deploy Application Code

### Clone Repository:
```bash
# Clone your new repository (replace with your repo URL)
git clone https://github.com/yourusername/ivr-call-management.git
cd ivr-call-management

# Install backend dependencies
cd backend
npm install --production

# Install frontend dependencies
cd ../frontend
npm install
npm run build

# Return to project root
cd ..
```

### Environment Configuration:
```bash
# Create production environment file
cd backend
cp .env.example .env

# Edit environment variables
nano .env
```

### Production Environment Variables:
```env
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_NAME=ivr_production
DB_USER=ivr_user
DB_PASS=your_secure_password

# JWT Configuration
JWT_SECRET=your_super_secure_jwt_secret_key_here
JWT_EXPIRE=7d

# Server Configuration
PORT=5000
NODE_ENV=production
FRONTEND_URL=https://yourdomain.com

# File Upload
MAX_FILE_SIZE=50MB
UPLOAD_PATH=/home/ivrapp/ivr-call-management/backend/uploads

# SSL/Security
HTTPS_ENABLED=true
SSL_CERT_PATH=/etc/letsencrypt/live/yourdomain.com/fullchain.pem
SSL_KEY_PATH=/etc/letsencrypt/live/yourdomain.com/privkey.pem
```

## 🗄️ Step 3: Database Setup

### Install MySQL:
```bash
# Install MySQL Server
sudo apt install -y mysql-server

# Secure MySQL installation
sudo mysql_secure_installation

# Login to MySQL
sudo mysql -u root -p
```

### Create Database and User:
```sql
-- Create database
CREATE DATABASE ivr_production CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create user
CREATE USER 'ivr_user'@'localhost' IDENTIFIED BY 'your_secure_password';

-- Grant privileges
GRANT ALL PRIVILEGES ON ivr_production.* TO 'ivr_user'@'localhost';
FLUSH PRIVILEGES;

-- Exit MySQL
EXIT;
```

### Initialize Database:
```bash
# Run database setup script
cd /home/ivrapp/ivr-call-management
node setup-mysql.js
```

## 🔧 Step 4: Process Management with PM2

### Install PM2:
```bash
# Install PM2 globally
sudo npm install -g pm2

# Create PM2 ecosystem file
cd /home/ivrapp/ivr-call-management
nano ecosystem.config.js
```

### PM2 Configuration:
```javascript
module.exports = {
  apps: [
    {
      name: 'ivr-backend',
      script: './backend/server.js',
      cwd: '/home/ivrapp/ivr-call-management',
      instances: 2,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 5000
      },
      error_file: './logs/backend-error.log',
      out_file: './logs/backend-out.log',
      log_file: './logs/backend-combined.log',
      time: true,
      max_memory_restart: '1G',
      node_args: '--max-old-space-size=1024'
    }
  ]
};
```

### Start Application:
```bash
# Create logs directory
mkdir -p /home/ivrapp/ivr-call-management/logs

# Start application with PM2
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 startup script
pm2 startup
# Follow the instructions provided by PM2

# Check application status
pm2 status
pm2 logs
```

## 🌐 Step 5: Nginx Configuration

### Create Nginx Configuration:
```bash
sudo nano /etc/nginx/sites-available/ivr-app
```

### Nginx Configuration File:
```nginx
# HTTP to HTTPS redirect
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

# HTTPS Configuration
server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # Security Headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload";

    # Frontend (React build)
    location / {
        root /home/ivrapp/ivr-call-management/frontend/build;
        index index.html index.htm;
        try_files $uri $uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # Socket.IO
    location /socket.io/ {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # File uploads
    location /uploads/ {
        alias /home/ivrapp/ivr-call-management/backend/uploads/;
        expires 1y;
        add_header Cache-Control "public";
    }

    # Health check
    location /health {
        proxy_pass http://localhost:5000;
        access_log off;
    }
}
```

### Enable Nginx Site:
```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/ivr-app /etc/nginx/sites-enabled/

# Test Nginx configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
sudo systemctl enable nginx
```

## 🔒 Step 6: SSL Certificate Setup

### Get SSL Certificate:
```bash
# Get SSL certificate from Let's Encrypt
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Test automatic renewal
sudo certbot renew --dry-run

# Setup automatic renewal
sudo crontab -e
# Add this line:
# 0 12 * * * /usr/bin/certbot renew --quiet
```

## 🔥 Step 7: Firewall Configuration

### Configure UFW Firewall:
```bash
# Enable UFW
sudo ufw enable

# Allow SSH
sudo ufw allow ssh

# Allow HTTP and HTTPS
sudo ufw allow 80
sudo ufw allow 443

# Allow backend port (if needed for direct access)
sudo ufw allow 5000

# Check firewall status
sudo ufw status
```

## 📊 Step 8: Monitoring and Logging

### Setup Log Rotation:
```bash
sudo nano /etc/logrotate.d/ivr-app
```

### Log Rotation Configuration:
```
/home/ivrapp/ivr-call-management/logs/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 ivrapp ivrapp
    postrotate
        pm2 reload ivr-backend
    endscript
}
```

### System Monitoring:
```bash
# Install monitoring tools
sudo apt install -y htop iotop nethogs

# Monitor PM2 processes
pm2 monit

# Check system resources
htop

# Monitor network connections
sudo netstat -tulpn | grep :5000
sudo netstat -tulpn | grep :80
sudo netstat -tulpn | grep :443
```

## 🔄 Step 9: Backup Strategy

### Create Backup Script:
```bash
nano /home/ivrapp/backup.sh
```

### Backup Script:
```bash
#!/bin/bash

# Backup configuration
BACKUP_DIR="/home/ivrapp/backups"
DATE=$(date +%Y%m%d_%H%M%S)
APP_DIR="/home/ivrapp/ivr-call-management"

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup database
mysqldump -u ivr_user -p ivr_production > $BACKUP_DIR/database_$DATE.sql

# Backup application files
tar -czf $BACKUP_DIR/app_$DATE.tar.gz -C $APP_DIR .

# Backup uploads
tar -czf $BACKUP_DIR/uploads_$DATE.tar.gz -C $APP_DIR/backend/uploads .

# Remove backups older than 30 days
find $BACKUP_DIR -name "*.sql" -mtime +30 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +30 -delete

echo "Backup completed: $DATE"
```

### Setup Automated Backups:
```bash
# Make script executable
chmod +x /home/ivrapp/backup.sh

# Add to crontab
crontab -e
# Add this line for daily backups at 2 AM:
# 0 2 * * * /home/ivrapp/backup.sh >> /home/ivrapp/backup.log 2>&1
```

## 📱 Step 10: Update Android App for Production

### Update App Configuration:
```typescript
// In IVRCallManager/App.tsx, update default server URL:
const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
  isConnected: false,
  serverUrl: 'https://yourdomain.com', // Update this
  deviceId: '',
  deviceName: '',
  phoneNumber: '',
});
```

### Build Production APK:
```bash
cd IVRCallManager
npm run build-apk-release
```

## 🚀 Step 11: Deployment Commands

### Quick Deployment Script:
```bash
#!/bin/bash
# deploy.sh

echo "🚀 Deploying IVR Call Management System..."

# Pull latest code
git pull origin main

# Install/update dependencies
cd backend && npm install --production
cd ../frontend && npm install && npm run build

# Restart application
pm2 restart ivr-backend

# Reload Nginx
sudo nginx -s reload

echo "✅ Deployment completed!"
```

## 🔍 Step 12: Health Checks and Monitoring

### Health Check Endpoints:
- **Backend Health**: `https://yourdomain.com/health`
- **API Status**: `https://yourdomain.com/api/auth/health`
- **Frontend**: `https://yourdomain.com`

### Monitoring Commands:
```bash
# Check application status
pm2 status

# View logs
pm2 logs ivr-backend

# Monitor system resources
htop

# Check Nginx status
sudo systemctl status nginx

# Check SSL certificate
sudo certbot certificates

# Test database connection
mysql -u ivr_user -p ivr_production -e "SELECT 1;"
```

## 🎯 Step 13: Performance Optimization

### Backend Optimization:
```bash
# Enable Nginx gzip compression
sudo nano /etc/nginx/nginx.conf

# Add in http block:
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_proxied expired no-cache no-store private must-revalidate auth;
gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/javascript application/json;
```

### Database Optimization:
```sql
-- Optimize MySQL for production
-- Add to /etc/mysql/mysql.conf.d/mysqld.cnf:

[mysqld]
innodb_buffer_pool_size = 1G
innodb_log_file_size = 256M
innodb_flush_log_at_trx_commit = 2
query_cache_size = 128M
query_cache_type = 1
```

## 📋 Deployment Checklist:

### Pre-deployment:
- [ ] VPS server configured
- [ ] Domain name pointed to VPS
- [ ] SSL certificate obtained
- [ ] Database created and configured
- [ ] Environment variables set
- [ ] Firewall configured

### Deployment:
- [ ] Code deployed to VPS
- [ ] Dependencies installed
- [ ] Database initialized
- [ ] PM2 configured and running
- [ ] Nginx configured and running
- [ ] SSL certificate working
- [ ] Health checks passing

### Post-deployment:
- [ ] Application accessible via domain
- [ ] API endpoints working
- [ ] Socket.IO connections working
- [ ] File uploads working
- [ ] Android app connects successfully
- [ ] Monitoring setup
- [ ] Backup strategy implemented

## 🆘 Troubleshooting:

### Common Issues:

#### "502 Bad Gateway"
```bash
# Check if backend is running
pm2 status
pm2 logs ivr-backend

# Check Nginx configuration
sudo nginx -t
sudo systemctl status nginx
```

#### "Database Connection Failed"
```bash
# Check MySQL status
sudo systemctl status mysql

# Test database connection
mysql -u ivr_user -p ivr_production
```

#### "SSL Certificate Issues"
```bash
# Check certificate status
sudo certbot certificates

# Renew certificate
sudo certbot renew
```

---

## 🎉 Success!

Your IVR Call Management System is now deployed on VPS and ready for production use!

**Access URLs:**
- **Web Dashboard**: `https://yourdomain.com`
- **API Health**: `https://yourdomain.com/health`
- **Admin Panel**: `https://yourdomain.com/login`

**Next Steps:**
1. Update Android app with production server URL
2. Build and distribute production APK
3. Train users on the system
4. Monitor performance and logs
5. Setup regular backups and maintenance

🚀 **Your IVR system is now live and scalable!**