# MySQL Installation Guide

## Windows Installation

### Option 1: Using Chocolatey (Recommended)
```bash
# Install Chocolatey if not already installed
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

# Install MySQL
choco install mysql

# Start MySQL service
net start mysql
```

### Option 2: Manual Installation
1. Download MySQL Community Server from: https://dev.mysql.com/downloads/mysql/
2. Run the installer and follow the setup wizard
3. Set root password during installation
4. Start MySQL service

### Option 3: Using XAMPP (Easiest for Development)
1. Download XAMPP from: https://www.apachefriends.org/download.html
2. Install XAMPP
3. Start MySQL from XAMPP Control Panel

## After Installation

1. Update your `backend/.env` file with the correct password:
```env
DB_PASSWORD=your_mysql_root_password
```

2. Run the database setup:
```bash
node setup-mysql.js
```

3. Start the backend:
```bash
cd backend
npm start
```

## Alternative: Use MySQL Docker Container

If you prefer Docker:
```bash
docker run --name mysql-ivr -e MYSQL_ROOT_PASSWORD=password123 -e MYSQL_DATABASE=ivr_system -p 3306:3306 -d mysql:8.0
```

Then update `backend/.env`:
```env
DB_PASSWORD=password123
```