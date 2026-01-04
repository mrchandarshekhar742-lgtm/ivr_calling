# 🎯 IVR Call Management System

A complete **IVR (Interactive Voice Response) Call Management System** built with React.js, Node.js, and MySQL. This system allows you to manage automated calling campaigns, audio files, contacts, and track call analytics.

## 🚀 Features

### 📞 **Call Management**
- Create and manage calling campaigns
- Schedule automated calls
- Real-time call tracking and logging
- DTMF response collection
- Call analytics and reporting

### 🎵 **Audio Management**
- Upload and manage audio files (MP3, WAV, AAC, OGG)
- Database BLOB storage for security
- Built-in audio player with controls
- Audio streaming with range support

### 👥 **Contact Management**
- Import/export contacts (CSV support)
- Contact grouping and categorization
- Bulk contact operations
- Contact history tracking

### 📊 **Analytics & Reporting**
- Real-time dashboard
- Call success/failure rates
- Campaign performance metrics
- Export reports to CSV

### 📱 **Mobile App**
- React Native Android app
- Real-time sync with backend
- Call management on mobile
- APK ready for distribution

## 🛠️ Technology Stack

- **Backend**: Node.js, Express.js, MySQL, Sequelize ORM, Socket.IO
- **Frontend**: React.js, Tailwind CSS, React Router, React Query
- **Mobile**: React Native for Android
- **Authentication**: JWT tokens
- **File Storage**: Database BLOB storage
- **Real-time**: Socket.IO for live updates

## 🚀 Quick Start

### **Development Setup**

1. **Clone the repository**
   ```bash
   git clone https://github.com/mrchandarshekhar742-lgtm/ivr_calling.git
   cd ivr_calling
   ```

2. **Backend Setup**
   ```bash
   cd backend
   npm install
   cp .env.example .env
   # Edit .env with your database credentials
   npm run dev
   ```

3. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   echo "REACT_APP_API_URL=http://localhost:5000" > .env
   npm run dev
   ```

4. **Access the application**
   - **Web Interface**: http://localhost:3000
   - **API**: http://localhost:5000
   - **Health Check**: http://localhost:5000/health

### **Production Deployment**

For VPS deployment, follow the manual setup guide:

**📚 See `MANUAL_VPS_SETUP.md` for complete deployment instructions**

## 📱 Mobile App

### **Android App Setup**
```bash
cd IVRCallManager
npm install

# Build APK
npm run build:android

# Install on device
npm run install:device
```

## 🔧 Configuration

### **Backend Environment (.env)**
```env
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:3000

# Database
DB_HOST=localhost
DB_PORT=3306
DB_NAME=ivr_system
DB_USER=root
DB_PASSWORD=your_password

# JWT
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=24h
```

### **Frontend Environment (.env)**
```env
REACT_APP_API_URL=http://localhost:5000
REACT_APP_ENVIRONMENT=development
```

## 🛡️ Security Features

- **JWT Authentication** with refresh tokens
- **Rate Limiting** (100 requests/15min)
- **CORS Protection** with domain whitelisting
- **Input Validation** on all endpoints
- **SQL Injection Protection** with Sequelize ORM
- **XSS Protection** with security headers
- **File Upload Restrictions** and validation

## 📊 API Endpoints

### **Authentication**
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh JWT token

### **Campaigns**
- `GET /api/campaigns` - List campaigns
- `POST /api/campaigns` - Create campaign
- `PUT /api/campaigns/:id` - Update campaign
- `DELETE /api/campaigns/:id` - Delete campaign

### **Audio Files**
- `GET /api/audio` - List audio files
- `POST /api/audio` - Upload audio file
- `GET /api/audio/:id/stream` - Stream audio file
- `GET /api/audio/:id/download` - Download audio file

### **Analytics**
- `GET /api/analytics` - Basic analytics
- `GET /api/analytics/dashboard` - Dashboard data
- `GET /api/analytics/campaigns` - Campaign analytics

## 🔄 Database Schema

### **Main Tables**
- **users** - User accounts and authentication
- **campaigns** - Calling campaigns
- **contacts** - Contact information
- **audio_files** - Audio file metadata and BLOB data
- **call_logs** - Call history and results
- **call_schedules** - Scheduled calls

## 📈 Performance Features

- Database connection pooling
- Gzip compression
- Static file caching
- Real-time updates with Socket.IO
- Optimized BLOB storage for audio files
- Rate limiting and security middleware

## 🧪 Testing

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

## 📦 Project Structure

```
ivr_calling/
├── backend/                 # Node.js API server
│   ├── src/                # Source code
│   ├── uploads/            # File uploads
│   ├── logs/               # Application logs
│   └── server.js           # Main server file
├── frontend/               # React.js application
│   ├── src/                # React components
│   ├── public/             # Static files
│   └── build/              # Production build
├── IVRCallManager/         # React Native mobile app
│   ├── android/            # Android build files
│   └── App.tsx             # Main app component
└── MANUAL_VPS_SETUP.md     # Deployment guide
```

## 🚀 Deployment

### **Manual VPS Deployment**
Follow the step-by-step guide in `MANUAL_VPS_SETUP.md` for:
- VPS setup and configuration
- Database installation and setup
- Application deployment
- Process management with PM2
- Firewall configuration

### **Process Management**
```bash
# Start services
pm2 start server.js --name "ivr-backend"
pm2 serve build 3000 --name "ivr-frontend" --spa

# Monitor services
pm2 status
pm2 logs

# Restart services
pm2 restart all
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

- **Documentation**: Check `MANUAL_VPS_SETUP.md` for deployment
- **Issues**: Create an issue on GitHub
- **Repository**: https://github.com/mrchandarshekhar742-lgtm/ivr_calling

## 🎯 Key Features Summary

- ✅ **Complete IVR System** - Web dashboard + Mobile app
- ✅ **Manual Deployment Ready** - Simple VPS setup
- ✅ **Database BLOB Storage** - Secure audio file management
- ✅ **Real-time Updates** - Socket.IO integration
- ✅ **Production Security** - JWT, rate limiting, CORS
- ✅ **Mobile Integration** - Android app with APK
- ✅ **Easy Management** - PM2 process management

---

**Ready for production deployment! Follow MANUAL_VPS_SETUP.md for VPS setup.**