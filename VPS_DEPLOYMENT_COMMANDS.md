# 🚀 VPS DEPLOYMENT COMMANDS - ivr.wxon.in

## 📋 STEP-BY-STEP VPS DEPLOYMENT

### 1️⃣ **SSH into VPS**
```bash
ssh root@your-vps-ip
# या
ssh ubuntu@your-vps-ip
```

### 2️⃣ **Navigate to Project Directory**
```bash
cd /home/ubuntu/ivr_calling
# या अगर root user है तो
cd /var/www/ivr_calling
```

### 3️⃣ **Pull Latest Code**
```bash
git fetch origin
git reset --hard origin/main
git pull origin main
```

### 4️⃣ **Stop Existing Services**
```bash
# Stop PM2 processes
pm2 stop all
pm2 delete all

# या specific process stop करने के लिए
pm2 stop ivr-backend-8090
pm2 delete ivr-backend-8090
```

### 5️⃣ **Install Dependencies**
```bash
# Backend dependencies
cd backend
npm install

# Frontend dependencies  
cd ../frontend
npm install
cd ..
```

### 6️⃣ **Build Frontend**
```bash
cd frontend
npm run build
cd ..
```

### 7️⃣ **Start Backend with PM2**
```bash
cd backend
pm2 start server.js --name "ivr-backend-8090" --env production
pm2 save
cd ..
```

### 8️⃣ **Update Nginx Configuration**
```bash
# Copy nginx config
sudo cp nginx-ivr-8090.conf /etc/nginx/sites-available/ivr.wxon.in

# Enable site
sudo ln -sf /etc/nginx/sites-available/ivr.wxon.in /etc/nginx/sites-enabled/

# Remove default site if exists
sudo rm -f /etc/nginx/sites-enabled/default

# Test nginx config
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx
```

### 9️⃣ **Setup SSL (if not done)**
```bash
# Run SSL setup script
chmod +x setup-ssl-ivr.sh
./setup-ssl-ivr.sh
```

### 🔟 **Verify Deployment**
```bash
# Check PM2 status
pm2 status

# Check backend health
curl https://ivr.wxon.in/api/health

# Check nginx status
sudo systemctl status nginx

# View backend logs
pm2 logs ivr-backend-8090
```

---

## 🚀 **ONE-COMMAND DEPLOYMENT**

### **Complete Deployment Script**
```bash
# Make script executable and run
chmod +x deploy-all-fixes.sh
./deploy-all-fixes.sh
```

---

## 🔧 **MANUAL DEPLOYMENT (Step by Step)**

### **1. Update Code**
```bash
cd /home/ubuntu/ivr_calling
git pull origin main
```

### **2. Backend Setup**
```bash
cd backend
npm install
pm2 stop ivr-backend-8090 2>/dev/null || true
pm2 delete ivr-backend-8090 2>/dev/null || true
pm2 start server.js --name "ivr-backend-8090" --env production
pm2 save
cd ..
```

### **3. Frontend Setup**
```bash
cd frontend
npm install
npm run build
cd ..
```

### **4. Nginx Update**
```bash
sudo cp nginx-ivr-8090.conf /etc/nginx/sites-available/ivr.wxon.in
sudo nginx -t
sudo systemctl reload nginx
```

---

## 🧪 **TESTING COMMANDS**

### **Test All APIs**
```bash
cd backend
node ../test-all-critical-endpoints.js
```

### **Test Individual Components**
```bash
# Test backend health
curl https://ivr.wxon.in/api/health

# Test login API
curl -X POST https://ivr.wxon.in/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@ivr.com","password":"admin123"}'

# Test frontend
curl -I https://ivr.wxon.in
```

---

## 📊 **MONITORING COMMANDS**

### **Check Status**
```bash
# PM2 status
pm2 status

# PM2 monitoring
pm2 monit

# View logs
pm2 logs ivr-backend-8090

# View real-time logs
pm2 logs ivr-backend-8090 --lines 50 -f
```

### **System Status**
```bash
# Check nginx
sudo systemctl status nginx

# Check disk space
df -h

# Check memory
free -h

# Check processes
htop
```

---

## 🔄 **RESTART COMMANDS**

### **Restart Backend Only**
```bash
pm2 restart ivr-backend-8090
```

### **Restart Nginx Only**
```bash
sudo systemctl restart nginx
```

### **Full System Restart**
```bash
pm2 restart all
sudo systemctl restart nginx
```

---

## 🚨 **TROUBLESHOOTING COMMANDS**

### **If Backend Not Starting**
```bash
# Check syntax
cd backend
node -c server.js

# Check dependencies
npm install

# Check environment
cat .env.production

# Manual start for debugging
NODE_ENV=production node server.js
```

### **If Frontend Not Loading**
```bash
# Rebuild frontend
cd frontend
rm -rf build node_modules
npm install
npm run build
```

### **If SSL Issues**
```bash
# Renew SSL certificate
sudo certbot renew

# Check SSL status
sudo certbot certificates

# Test SSL
curl -I https://ivr.wxon.in
```

---

## 📱 **ANDROID APP TESTING**

### **After Deployment, Test Android App**
```bash
# Check device registration endpoint
curl -X POST https://ivr.wxon.in/api/devices/register \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"deviceId":"test123","deviceName":"Test Device"}'

# Check devices list
curl https://ivr.wxon.in/api/devices \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 🎯 **FINAL VERIFICATION CHECKLIST**

```bash
# ✅ 1. Backend running
pm2 status | grep ivr-backend-8090

# ✅ 2. Health check working  
curl https://ivr.wxon.in/api/health

# ✅ 3. Frontend loading
curl -I https://ivr.wxon.in

# ✅ 4. SSL working
curl -I https://ivr.wxon.in | grep "HTTP/2 200"

# ✅ 5. APIs working
curl -X POST https://ivr.wxon.in/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@ivr.com","password":"admin123"}'

# ✅ 6. Database working
# Login to website and check if data loads

# ✅ 7. Android app can connect
# Test device registration from Android app
```

---

## 🎉 **SUCCESS INDICATORS**

### **All These Should Work:**
- ✅ https://ivr.wxon.in (Frontend loads)
- ✅ https://ivr.wxon.in/api/health (Returns OK)
- ✅ Login works on website
- ✅ Audio upload works
- ✅ Campaign creation works
- ✅ Android app can register device
- ✅ Device shows online on website

### **PM2 Status Should Show:**
```
┌─────┬────────────────────┬─────────────┬─────────┬─────────┬──────────┬────────┬──────┬───────────┬──────────┬──────────┬──────────┬──────────┐
│ id  │ name               │ namespace   │ version │ mode    │ pid      │ uptime │ ↺    │ status    │ cpu      │ mem      │ user     │ watching │
├─────┼────────────────────┼─────────────┼─────────┼─────────┼──────────┼────────┼──────┼───────────┼──────────┼──────────┼──────────┼──────────┤
│ 0   │ ivr-backend-8090   │ default     │ 1.0.0   │ fork    │ 12345    │ 5m     │ 0    │ online    │ 0%       │ 50.0mb   │ ubuntu   │ disabled │
└─────┴────────────────────┴─────────────┴─────────┴─────────┴──────────┴────────┴──────┴───────────┴──────────┴──────────┴──────────┴──────────┘
```

---

## 📞 **READY FOR PRODUCTION!**

After successful deployment:
1. 🌐 Website: https://ivr.wxon.in
2. 📱 Android app can connect
3. 🎵 Audio upload/playback working
4. 📞 Call campaigns can be created
5. 📊 Analytics and logs working
6. 🔒 SSL certificate active
7. 🚀 All APIs responding correctly