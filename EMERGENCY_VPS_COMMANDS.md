# 🚨 EMERGENCY VPS COMMANDS - RESTORE WEBSITES IMMEDIATELY

## CRITICAL ISSUE
Your Nginx failed because the SSL certificate for `ivr.wxon.in` doesn't exist yet, which brought down ALL websites including `wxon.in` (your WhatsApp bulk messaging service).

## IMMEDIATE ACTIONS REQUIRED

### Step 1: SSH into your VPS
```bash
ssh ubuntu@your-vps-ip
# or however you normally connect to your VPS
```

### Step 2: Navigate to project directory
```bash
cd /home/ubuntu/ivr_calling
```

### Step 3: Run emergency fix script
```bash
chmod +x fix-nginx-emergency.sh
sudo ./fix-nginx-emergency.sh
```

### Step 4: If script fails, run manual commands

#### Create temporary HTTP-only config for ivr.wxon.in
```bash
sudo tee /etc/nginx/sites-available/ivr.wxon.in > /dev/null << 'EOF'
server {
    listen 80;
    server_name ivr.wxon.in www.ivr.wxon.in;
    client_max_body_size 50M;

    # API routes (Backend on port 8090)
    location /api/ {
        proxy_pass http://127.0.0.1:8090;
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

    # Socket.IO for real-time updates
    location /socket.io/ {
        proxy_pass http://127.0.0.1:8090;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Health check endpoint
    location /health {
        proxy_pass http://127.0.0.1:8090;
        access_log off;
    }

    # Static files (React build)
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF
```

#### Enable the site
```bash
sudo ln -sf /etc/nginx/sites-available/ivr.wxon.in /etc/nginx/sites-enabled/
```

#### Test and restart Nginx
```bash
sudo nginx -t
sudo systemctl start nginx
sudo systemctl status nginx
```

#### Test websites
```bash
curl -I http://wxon.in
curl -I http://ivr.wxon.in
```

## VERIFICATION STEPS

1. **Check wxon.in is back online**: Open http://wxon.in in browser
2. **Check ivr.wxon.in works**: Open http://ivr.wxon.in in browser
3. **Verify backend is running**: `pm2 status`
4. **Check logs if needed**: `pm2 logs ivr-backend`

## NEXT STEPS (After Emergency is Fixed)

### Generate SSL Certificate for ivr.wxon.in
```bash
sudo certbot --nginx -d ivr.wxon.in -d www.ivr.wxon.in
```

### Update to HTTPS configuration
After SSL certificate is generated, replace the temporary config with the full HTTPS version:
```bash
sudo cp nginx-ivr-8090.conf /etc/nginx/sites-available/ivr.wxon.in
sudo nginx -t
sudo systemctl reload nginx
```

## IMPORTANT NOTES

- **Priority 1**: Restore wxon.in (your main business website)
- **Priority 2**: Get ivr.wxon.in working on HTTP temporarily
- **Priority 3**: Add SSL certificate later

The emergency fix creates a temporary HTTP-only configuration that will get both sites working immediately. SSL can be added once the emergency is resolved.

## If You Need Help

If any command fails, send me the exact error message and I'll provide the fix immediately.