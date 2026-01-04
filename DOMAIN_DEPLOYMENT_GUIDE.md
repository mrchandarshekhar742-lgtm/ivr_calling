# 🚀 Domain Deployment Guide - ivr.wxon.in

## 📋 Pre-Deployment Checklist

### ✅ Domain Setup (BigRock)
- [x] Subdomain `ivr.wxon.in` created in BigRock
- [x] A record pointing to your VPS IP
- [x] DNS propagation completed (test with `nslookup ivr.wxon.in`)

### ✅ VPS Requirements
- [x] Basic packages already installed (Node.js, MySQL, Nginx, PM2)
- [x] Previous project experience
- [x] Ubuntu/Debian server

## 🚀 Quick Deployment Commands

### Step 1: Clone Project
```bash
# Remove old project if exists
rm -rf ivr_calling

# Clone fresh project
git clone https://github.com/mrchandarshekhar742-lgtm/ivr_calling.git
cd ivr_calling
```

### Step 2: Run Deployment Script
```bash
# Make script executable
chmod +x deploy-ivr.sh

# Run deployment (will ask for MySQL root password)
./deploy-ivr.sh
```

### Step 3: Verify Deployment
```bash
# Check services
pm2 status

# Test endpoints
curl https://ivr.wxon.in/health
curl https://ivr.wxon.in

# Check logs
pm2 logs
```

## 🔧 Manual Configuration (Alternative)

### Backend Configuration
```bash
cd ~/ivr_calling/backend

# Install dependencies
npm install

# Setup environment
cp .env.production .env

# Edit database password
nano .env
# Change: DB_PASSWORD=IVR_wxon_2024_SecurePass!
```

### Frontend Configuration
```bash
cd ~/ivr_calling/frontend

# Install dependencies
npm install

# Setup environment
cp .env.production .env

# Build for production
npm run build
```

### Database Setup
```bash
# Login to MySQL
mysql -u root -p

# Create database and user
CREATE DATABASE ivr_system_prod CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'ivr_user'@'localhost' IDENTIFIED BY 'IVR_wxon_2024_SecurePass!';
GRANT ALL PRIVILEGES ON ivr_system_prod.* TO 'ivr_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### Nginx Configuration
```bash
# Copy nginx config
sudo cp nginx-ivr.conf /etc/nginx/sites-available/ivr.wxon.in

# Enable site
sudo ln -s /etc/nginx/sites-available/ivr.wxon.in /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Get SSL certificate
sudo certbot --nginx -d ivr.wxon.in

# Restart nginx
sudo systemctl restart nginx
```

### PM2 Process Management
```bash
# Start backend
cd ~/ivr_calling/backend
pm2 start server.js --name "ivr-backend" --env production

# Start frontend
cd ~/ivr_calling/frontend
pm2 serve build 3000 --name "ivr-frontend" --spa

# Save configuration
pm2 save
pm2 startup
```

## 🔍 Configuration Files

### Backend Environment (.env.production)
```env
NODE_ENV=production
PORT=5000
FRONTEND_URL=https://ivr.wxon.in

# Database
DB_HOST=localhost
DB_PORT=3306
DB_NAME=ivr_system_prod
DB_USER=ivr_user
DB_PASSWORD=IVR_wxon_2024_SecurePass!

# JWT Secrets (already configured)
JWT_SECRET=ivr_wxon_super_secure_jwt_secret_key_2024_minimum_32_characters_long
JWT_REFRESH_SECRET=ivr_wxon_super_secure_refresh_secret_2024_minimum_32_characters_long
```

### Frontend Environment (.env.production)
```env
REACT_APP_API_URL=https://ivr.wxon.in
REACT_APP_ENVIRONMENT=production
REACT_APP_DOMAIN=ivr.wxon.in
```

## 🌐 Access URLs

After successful deployment:
- **Main Website**: https://ivr.wxon.in
- **API Endpoint**: https://ivr.wxon.in/api
- **Health Check**: https://ivr.wxon.in/health
- **Admin Panel**: https://ivr.wxon.in/login

## 🛠️ Management Commands

### PM2 Management
```bash
# Check status
pm2 status

# View logs
pm2 logs

# Restart services
pm2 restart all

# Stop services
pm2 stop all

# Monitor resources
pm2 monit
```

### Nginx Management
```bash
# Check status
sudo systemctl status nginx

# Restart nginx
sudo systemctl restart nginx

# View logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Test configuration
sudo nginx -t
```

### SSL Certificate Management
```bash
# Check certificate status
sudo certbot certificates

# Renew certificates
sudo certbot renew

# Test renewal
sudo certbot renew --dry-run
```

### Database Management
```bash
# Backup database
mysqldump -u ivr_user -p ivr_system_prod > backup-$(date +%Y%m%d).sql

# Restore database
mysql -u ivr_user -p ivr_system_prod < backup-20240104.sql

# Access database
mysql -u ivr_user -p ivr_system_prod
```

## 🔄 Update Process

### Code Updates
```bash
cd ~/ivr_calling

# Pull latest changes
git pull

# Update backend
cd backend
npm install
pm2 restart ivr-backend

# Update frontend
cd ../frontend
npm install
npm run build
pm2 restart ivr-frontend
```

### Environment Updates
```bash
# Update backend environment
nano backend/.env

# Update frontend environment
nano frontend/.env

# Rebuild frontend
cd frontend
npm run build
pm2 restart ivr-frontend
```

## 🚨 Troubleshooting

### Common Issues

1. **Domain not accessible**
   ```bash
   # Check DNS
   nslookup ivr.wxon.in
   
   # Check nginx
   sudo nginx -t
   sudo systemctl status nginx
   ```

2. **SSL certificate issues**
   ```bash
   # Check certificate
   sudo certbot certificates
   
   # Renew if needed
   sudo certbot renew
   ```

3. **Backend not responding**
   ```bash
   # Check PM2 status
   pm2 status
   
   # Check logs
   pm2 logs ivr-backend
   
   # Restart if needed
   pm2 restart ivr-backend
   ```

4. **Database connection errors**
   ```bash
   # Test database connection
   mysql -u ivr_user -p ivr_system_prod
   
   # Check backend logs
   pm2 logs ivr-backend
   ```

## ✅ Success Verification

Your deployment is successful when:
- ✅ `https://ivr.wxon.in` loads the website
- ✅ `https://ivr.wxon.in/health` returns OK status
- ✅ `pm2 status` shows both services online
- ✅ SSL certificate is valid (green lock in browser)
- ✅ Login/registration works
- ✅ All features are accessible

## 📞 Support

If you encounter issues:
1. Check PM2 logs: `pm2 logs`
2. Check Nginx logs: `sudo tail -f /var/log/nginx/error.log`
3. Verify DNS: `nslookup ivr.wxon.in`
4. Test database: `mysql -u ivr_user -p ivr_system_prod`

**Your IVR system will be live at https://ivr.wxon.in! 🎉**