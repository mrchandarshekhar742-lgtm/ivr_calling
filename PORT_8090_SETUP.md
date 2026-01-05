# 🚀 Port 8090 Configuration - IVR System

## 📋 Files Updated for Port 8090

### ✅ **Backend Configuration**
- `backend/.env` - PORT changed to 8090
- Backend will run on `http://localhost:8090`

### ✅ **Nginx Configuration**
- `nginx-ivr-8090.conf` - Updated upstream to port 8090
- Nginx will proxy API requests to port 8090

### ✅ **Deployment Script**
- `deploy-port-8090.sh` - Complete deployment for port 8090

## 🚀 **Quick Deployment Commands**

### **Option 1: Automated Deployment**
```bash
cd ~/ivr_calling
chmod +x deploy-port-8090.sh
./deploy-port-8090.sh
```

### **Option 2: Manual Setup**

#### **1. Update Backend Port**
```bash
cd ~/ivr_calling/backend
# Port already updated in .env file
grep PORT .env
# Should show: PORT=8090
```

#### **2. Update Nginx Configuration**
```bash
# Copy new nginx config
sudo cp nginx-ivr-8090.conf /etc/nginx/sites-available/ivr.wxon.in

# Enable site
sudo ln -sf /etc/nginx/sites-available/ivr.wxon.in /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Restart nginx
sudo systemctl restart nginx
```

#### **3. Start Backend on Port 8090**
```bash
# Stop existing processes
pm2 delete all

# Start backend on port 8090
cd ~/ivr_calling/backend
pm2 start server.js --name "ivr-backend-8090" --env production

# Start frontend
cd ~/ivr_calling/frontend
npm run build
pm2 serve build 3000 --name "ivr-frontend" --spa

# Save PM2 configuration
pm2 save
```

#### **4. Configure Firewall**
```bash
# Allow port 8090
sudo ufw allow 8090/tcp
sudo ufw allow 3000/tcp
sudo ufw allow 'Nginx Full'
sudo ufw --force enable
```

## 🔍 **Verification Steps**

### **1. Check Services**
```bash
# PM2 status
pm2 status

# Should show:
# - ivr-backend-8090 (online)
# - ivr-frontend (online)
```

### **2. Test Endpoints**
```bash
# Backend health check (direct)
curl http://localhost:8090/health

# Backend through domain
curl https://ivr.wxon.in/health

# Frontend
curl http://localhost:3000

# Domain
curl https://ivr.wxon.in
```

### **3. Test Registration**
```bash
# Test registration endpoint
curl -X POST https://ivr.wxon.in/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Test",
    "lastName": "User",
    "email": "test@example.com",
    "password": "password123",
    "phone": "1234567890"
  }'
```

## 🔧 **Configuration Details**

### **Backend (.env)**
```env
NODE_ENV=production
PORT=8090  # ← Changed to 8090
FRONTEND_URL=https://ivr.wxon.in
DB_HOST=localhost
DB_NAME=ivr_system_prod
DB_USER=ivr_user
DB_PASSWORD=IVR_wxon_2024_SecurePass!
```

### **Nginx Upstream**
```nginx
upstream ivr_backend {
    server 127.0.0.1:8090;  # ← Changed to 8090
    keepalive 32;
}
```

### **PM2 Process Names**
- Backend: `ivr-backend-8090`
- Frontend: `ivr-frontend`

## 🛠️ **Management Commands**

### **PM2 Management**
```bash
# Check status
pm2 status

# Restart backend
pm2 restart ivr-backend-8090

# Restart frontend
pm2 restart ivr-frontend

# View logs
pm2 logs ivr-backend-8090
pm2 logs ivr-frontend

# Monitor resources
pm2 monit
```

### **Service Management**
```bash
# Restart nginx
sudo systemctl restart nginx

# Check nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Check nginx status
sudo systemctl status nginx
```

## 🌐 **Access URLs**

After successful deployment:
- **Website**: https://ivr.wxon.in
- **API**: https://ivr.wxon.in/api
- **Health Check**: https://ivr.wxon.in/health
- **Backend Direct**: http://localhost:8090
- **Frontend Direct**: http://localhost:3000

## 🚨 **Troubleshooting**

### **Port Conflict**
```bash
# Check what's using port 8090
sudo netstat -tulpn | grep :8090

# Kill process if needed
sudo kill -9 <PID>
```

### **Nginx Issues**
```bash
# Test nginx config
sudo nginx -t

# Check nginx error logs
sudo tail -f /var/log/nginx/error.log
```

### **PM2 Issues**
```bash
# Delete all processes and restart
pm2 delete all
pm2 start server.js --name "ivr-backend-8090" --env production
```

## ✅ **Success Indicators**

System is working when:
- ✅ `pm2 status` shows both services online
- ✅ `curl http://localhost:8090/health` returns OK
- ✅ `https://ivr.wxon.in` loads without errors
- ✅ Registration/Login works
- ✅ No 500/502 errors in browser

**Your IVR system is now configured to run on port 8090! 🚀**