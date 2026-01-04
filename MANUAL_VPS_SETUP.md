# 🚀 Manual VPS Deployment Commands

## Step 1: VPS पर Old Directory Remove करें

```bash
# VPS में login करें
ssh root@your-vps-ip

# Old directory remove करें (अगर है तो)
rm -rf ivr_calling
rm -rf ivr-system
rm -rf preRecord
# या जो भी name से clone किया था

# Home directory clean करें
cd ~
ls -la  # Check करें कि कोई old project folder है या नहीं
```

## Step 2: Fresh Project Clone करें

```bash
# Fresh clone करें
git clone https://github.com/mrchandarshekhar742-lgtm/ivr_calling.git
cd ivr_calling

# Check करें कि सभी files आ गई हैं
ls -la
```

## Step 3: Node.js Install करें (अगर नहीं है)

```bash
# Node.js install करें
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Version check करें
node --version
npm --version
```

## Step 4: MySQL Install और Setup करें

```bash
# MySQL install करें
sudo apt update
sudo apt install mysql-server -y

# MySQL secure करें
sudo mysql_secure_installation

# MySQL में login करें
sudo mysql -u root -p

# Database और user create करें
CREATE DATABASE ivr_system;
CREATE USER 'ivr_user'@'localhost' IDENTIFIED BY 'your_secure_password';
GRANT ALL PRIVILEGES ON ivr_system.* TO 'ivr_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

## Step 5: Backend Setup करें

```bash
# Backend directory में जाएं
cd ~/ivr_calling/backend

# Dependencies install करें
npm install

# Environment file setup करें
cp .env.example .env

# .env file edit करें
nano .env
```

### Backend .env Configuration:
```env
NODE_ENV=production
PORT=5000
FRONTEND_URL=http://your-vps-ip:3000

# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_NAME=ivr_system
DB_USER=ivr_user
DB_PASSWORD=your_secure_password

# JWT Configuration (Generate secure secrets)
JWT_SECRET=your_super_secure_jwt_secret_here_minimum_32_characters
JWT_EXPIRES_IN=24h
JWT_REFRESH_SECRET=your_super_secure_refresh_secret_here_minimum_32_characters
JWT_REFRESH_EXPIRES_IN=7d

# File Upload Configuration
MAX_FILE_SIZE=50MB
UPLOAD_PATH=./uploads

# Logging Configuration
LOG_LEVEL=info
LOG_FILE=./logs/app.log
```

## Step 6: Frontend Setup करें

```bash
# Frontend directory में जाएं
cd ~/ivr_calling/frontend

# Dependencies install करें
npm install

# Environment file create करें
echo "REACT_APP_API_URL=http://your-vps-ip:5000" > .env

# Production build करें
npm run build
```

## Step 7: PM2 Install करें (Process Management)

```bash
# PM2 globally install करें
sudo npm install -g pm2

# PM2 startup script setup करें
pm2 startup
# जो command output में आए उसे run करें
```

## Step 8: Services Start करें

```bash
# Backend start करें
cd ~/ivr_calling/backend
pm2 start server.js --name "ivr-backend"

# Frontend serve करें (Production)
cd ~/ivr_calling/frontend
pm2 serve build 3000 --name "ivr-frontend" --spa

# PM2 processes save करें
pm2 save
```

## Step 9: Firewall Configure करें

```bash
# UFW firewall setup करें
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 3000/tcp  # Frontend
sudo ufw allow 5000/tcp  # Backend API
sudo ufw --force enable

# Status check करें
sudo ufw status
```

## Step 10: Test करें

```bash
# Services status check करें
pm2 status

# Application test करें
curl http://localhost:5000/health
curl http://localhost:3000

# Logs check करें
pm2 logs
```

## 🔧 Management Commands

### PM2 Process Management:
```bash
# Status देखें
pm2 status

# Logs देखें
pm2 logs

# Restart करें
pm2 restart all

# Stop करें
pm2 stop all

# Delete करें
pm2 delete all
```

### Application Update:
```bash
# Code update करें
cd ~/ivr_calling
git pull

# Backend restart करें
cd backend
npm install  # अगर नए dependencies हैं
pm2 restart ivr-backend

# Frontend rebuild करें
cd ../frontend
npm install  # अगर नए dependencies हैं
npm run build
pm2 restart ivr-frontend
```

### Database Backup:
```bash
# Backup create करें
mysqldump -u ivr_user -p ivr_system > backup-$(date +%Y%m%d).sql

# Backup restore करें
mysql -u ivr_user -p ivr_system < backup-20240104.sql
```

## 🌐 Access Your Application

- **Frontend**: `http://your-vps-ip:3000`
- **Backend API**: `http://your-vps-ip:5000`
- **Health Check**: `http://your-vps-ip:5000/health`

## 🚨 Troubleshooting

### Common Issues:

1. **Port already in use**:
   ```bash
   sudo netstat -tulpn | grep :3000
   sudo netstat -tulpn | grep :5000
   pm2 delete all
   ```

2. **Database connection error**:
   ```bash
   sudo systemctl status mysql
   sudo systemctl restart mysql
   mysql -u ivr_user -p  # Test connection
   ```

3. **Permission errors**:
   ```bash
   sudo chown -R $USER:$USER ~/ivr_calling
   chmod -R 755 ~/ivr_calling
   ```

4. **Frontend not loading**:
   ```bash
   cd ~/ivr_calling/frontend
   npm run build
   pm2 restart ivr-frontend
   ```

## ✅ Success Indicators

System ready होने पर:
- ✅ `pm2 status` में दोनों services "online" हों
- ✅ `curl http://localhost:5000/health` response दे
- ✅ `curl http://localhost:3000` HTML response दे
- ✅ Browser में website खुले
- ✅ Login/Register काम करे

**आपका IVR System manually deploy हो गया! 🎉**