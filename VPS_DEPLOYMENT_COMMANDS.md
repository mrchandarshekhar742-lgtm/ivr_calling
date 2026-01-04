# 🚀 VPS Deployment Commands - IVR Call Management System

## 📋 Prerequisites
- Ubuntu 20.04+ VPS
- Root or sudo access
- Domain name (optional but recommended)

---

## 🔧 Step 1: Initial VPS Setup

### Connect to VPS:
```bash
ssh root@your-vps-ip
# OR
ssh username@your-vps-ip
```

### Update System:
```bash
sudo apt update && sudo apt upgrade -y
```

### Install Essential Packages:
```bash
sudo apt install -y curl wget git nginx certbot python3-certbot-nginx ufw htop
```

### Install Node.js 18:
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
```

### Verify Installations:
```bash
node --version
npm --version
nginx -v
```

---

## 👤 Step 2: Create Application User

```bash
# Create dedicated user
sudo adduser ivrapp
sudo usermod -aG sudo ivrapp

# Switch to application user
sudo su - ivrapp
```

---

## 📁 Step 3: Clone and Setup Application

### Clone Repository:
```bash
cd /home/ivrapp
git clone https://github.com/mrchandarshekhar742-lgtm/ivr_calling.git
cd ivr_calling
```

### Install Backend Dependencies:
```bash
cd backend
npm install --production
```

### Install Frontend Dependencies and Build:
```bash
cd ../frontend
npm install
npm run build
```

### Return to Project Root:
```bash
cd /home/ivrapp/ivr_calling
```

---

## 🗄️ Step 4: Database Setup

### Install MySQL:
```bash
sudo apt install -y mysql-server
sudo mysql_secure_installation
```

### Create Database:
```bash
sudo mysql -u root -p
```

```sql
CREATE DATABASE ivr_production CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'ivr_user'@'localhost' IDENTIFIED BY 'your_secure_password_here';
GRANT ALL PRIVILEGES ON ivr_production.* TO 'ivr_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

---

## ⚙️ Step 5: Environment Configuration

### Create Production Environment File:
```bash
cd /home/ivrapp/ivr_calling/backend
cp .env.example .env
nano .env
```

### Edit .env File (Replace with your values):
```env
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_NAME=ivr_production
DB_USER=ivr_user
DB_PASS=your_secure_password_here

# JWT Configuration
JWT_SECRET=your_super_secure_jwt_secret_key_minimum_32_characters
JWT_EXPIRE=7d

# Server Configuration
PORT=5000
NODE_ENV=production
FRONTEND_URL=https://yourdomain.com

# File Upload
MAX_FILE_SIZE=50MB
UPLOAD_PATH=/home/ivrapp/ivr_calling/backend/uploads

# Create uploads directory
mkdir -p /home/ivrapp/ivr_calling/backend/uploads
```

### Initialize Database:
```bash
cd /home/ivrapp/ivr_calling
node setup-mysql.js
```

---

## 🔄 Step 6: Process Management with PM2

### Install PM2:
```bash
sudo npm install -g pm2
```

### Create PM2 Configuration:
```bash
cd /home/ivrapp/ivr_calling
nano ecosystem.config.js
```

### PM2 Configuration File:
```javascript
module.exports = {
  apps: [
    {
      name: 'ivr-backend',
      script: './backend/server.js',
      cwd: '/home/ivrapp/ivr_calling',
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
      max_memory_restart: '1G'
    }
  ]
};
```

### Start Application:
```bash
# Create logs directory
mkdir -p /home/ivrapp/ivr_calling/logs

# Start application
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 startup
pm2 startup
# Follow the command it gives you (usually something like):
# sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u ivrapp --hp /home/ivrapp

# Check status
pm2 status
```

---

## 🌐 Step 7: Nginx Configuration

### Create Nginx Site Configuration:
```bash
sudo nano /etc/nginx/sites-available/ivr-app
```

### Nginx Configuration (Replace yourdomain.com with your domain):
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Security Headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";

    # Frontend (React build)
    location / {
        root /home/ivrapp/ivr_calling/frontend/build;
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
        alias /home/ivrapp/ivr_calling/backend/uploads/;
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

# Remove default site
sudo rm /etc/nginx/sites-enabled/default

# Test Nginx configuration
sudo nginx -t

# Start and enable Nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

---

## 🔒 Step 8: SSL Certificate (Optional but Recommended)

### Get SSL Certificate:
```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

### Test Auto-renewal:
```bash
sudo certbot renew --dry-run
```

---

## 🔥 Step 9: Firewall Configuration

```bash
# Enable UFW
sudo ufw enable

# Allow SSH
sudo ufw allow ssh

# Allow HTTP and HTTPS
sudo ufw allow 80
sudo ufw allow 443

# Check status
sudo ufw status
```

---

## 🎯 Step 10: Final Verification

### Check All Services:
```bash
# Check PM2 status
pm2 status

# Check Nginx status
sudo systemctl status nginx

# Check MySQL status
sudo systemctl status mysql

# Test application
curl http://localhost:5000/health
curl http://yourdomain.com/health
```

### View Logs:
```bash
# PM2 logs
pm2 logs

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

---

## 🚀 Quick Deployment Script

### Create Auto-Deploy Script:
```bash
nano /home/ivrapp/deploy.sh
```

### Deployment Script:
```bash
#!/bin/bash
echo "🚀 Deploying IVR Call Management System..."

cd /home/ivrapp/ivr_calling

# Pull latest code
git pull origin main

# Install/update backend dependencies
cd backend && npm install --production

# Build frontend
cd ../frontend && npm install && npm run build

# Restart application
pm2 restart ivr-backend

# Reload Nginx
sudo nginx -s reload

echo "✅ Deployment completed!"
echo "🌐 Access: https://yourdomain.com"
```

### Make Script Executable:
```bash
chmod +x /home/ivrapp/deploy.sh
```

---

## 📱 Step 11: Update Android App for Production

### Update App Server URL:
```bash
# Edit the Android app configuration
nano /home/ivrapp/ivr_calling/IVRCallManager/App.tsx

# Change serverUrl from:
# serverUrl: 'http://192.168.1.45:5000'
# To:
# serverUrl: 'https://yourdomain.com'
```

### Build Production APK:
```bash
cd /home/ivrapp/ivr_calling/IVRCallManager
npm install
cd android
./gradlew assembleRelease
```

---

## ✅ Deployment Verification Checklist

### Test These URLs:
- [ ] `https://yourdomain.com` - Frontend loads
- [ ] `https://yourdomain.com/health` - Backend health check
- [ ] `https://yourdomain.com/api/auth/login` - API endpoint
- [ ] Registration and login work
- [ ] Dashboard loads with data
- [ ] File upload works
- [ ] Real-time updates work

### Check Services:
```bash
# All services running
pm2 status
sudo systemctl status nginx
sudo systemctl status mysql

# No errors in logs
pm2 logs --lines 50
sudo tail -50 /var/log/nginx/error.log
```

---

## 🆘 Troubleshooting Commands

### If Backend Not Working:
```bash
pm2 restart ivr-backend
pm2 logs ivr-backend
```

### If Frontend Not Loading:
```bash
sudo nginx -t
sudo systemctl restart nginx
```

### If Database Issues:
```bash
mysql -u ivr_user -p ivr_production
# Test connection
```

### If SSL Issues:
```bash
sudo certbot certificates
sudo certbot renew
```

---

## 🎉 Success!

Your IVR Call Management System is now deployed on VPS!

### Access URLs:
- **Website**: `https://yourdomain.com`
- **API Health**: `https://yourdomain.com/health`
- **Admin Panel**: `https://yourdomain.com/login`

### Next Steps:
1. Register your first user account
2. Upload audio files
3. Import contacts
4. Create your first campaign
5. Update Android app with production URL
6. Build and distribute production APK

**🚀 Your IVR system is now live and ready for business!**