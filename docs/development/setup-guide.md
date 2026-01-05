```markdown
# Development Setup Guide

## Yêu cầu hệ thống

### Software Requirements
- **Node.js**: >= 18.x LTS
- **MySQL**: >= 8.0
- **Redis**: >= 7.0
- **Docker**: >= 24.0 (Optional but recommended)
- **Git**: >= 2.30

### Hardware Requirements
- **RAM**: Minimum 8GB, Recommended 16GB
- **Disk**: Minimum 20GB free space
- **CPU**: 4 cores recommended

---

## Bước 1: Clone Repository

```bash
# Clone project
git clone https://github.com/your-org/qr-order-platform.git
cd qr-order-platform

# Checkout development branch
git checkout develop
## Bước 2: Setup Backend

### 2.1 Install Dependencies

```bash
cd backend
npm install
```

### 2.2 Configure Environment Variables

```bash
# Copy file mẫu
cp .env.example .env

# Chỉnh sửa .env
nano .env
```

**File .env cần thiết:**
```env
# Application
NODE_ENV=development
PORT=5000
APP_NAME=QR Order Platform

# Database
DB_HOST=localhost
DB_PORT=3306
DB_NAME=qr_order_db
DB_USER=root
DB_PASSWORD=your_password

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRE=24h

# Socket.io
SOCKET_CORS_ORIGIN=http://localhost:3000,http://localhost:3001
```

### 2.3 Setup Database

```bash
# Khởi tạo database
mysql -u root -p < ../database/init.sql

# Import dữ liệu mẫu
mysql -u root -p qr_order_db < ../database/seed.sql

# Hoặc dùng script
npm run migrate
npm run seed
```

### 2.4 Start Backend Server

```bash
# Development mode với auto-reload
npm run dev

# Production mode
npm start

# Kiểm tra server đang chạy
curl http://localhost:5000/api/v1/health
```

**Expected Output:**
```json
{
  "success": true,
  "message": "Server is running",
  "timestamp": "2025-01-15T10:00:00Z"
}
```

---

## Bước 3: Setup Frontend Customer

### 3.1 Install Dependencies

```bash
cd ../frontend-customer
npm install
```

### 3.2 Configure Environment

```bash
cp .env.local.example .env.local
nano .env.local
```

**File .env.local:**
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
NEXT_PUBLIC_APP_NAME=QR Order
NEXT_PUBLIC_STORAGE_KEY=qr_order_cart
```

### 3.3 Start Development Server

```bash
npm run dev

# Server chạy tại http://localhost:3000
```

---

## Bước 4: Setup Frontend Admin

### 4.1 Install Dependencies

```bash
cd ../frontend-admin
npm install
```

### 4.2 Configure Environment

```bash
cp .env.example .env
nano .env
```

**File .env:**
```env
VITE_API_URL=http://localhost:5000/api/v1
VITE_SOCKET_URL=http://localhost:5000
VITE_APP_NAME=QR Order Admin
```

### 4.3 Start Development Server

```bash
npm run dev

# Server chạy tại http://localhost:3001
```

---

## Bước 5: Setup với Docker (Recommended)

### 5.1 Start All Services

```bash
# Từ thư mục root
docker-compose up -d

# Xem logs
docker-compose logs -f

# Stop services
docker-compose down
```

### 5.2 Access Services

- **Backend API**: http://localhost:5000
- **Frontend Customer**: http://localhost:3000
- **Frontend Admin**: http://localhost:3001
- **MySQL**: localhost:3306
- **Redis**: localhost:6379

---

## Bước 6: Verify Installation

### 6.1 Test Backend API

```bash
# Health check
curl http://localhost:5000/api/v1/health

# Test products endpoint
curl http://localhost:5000/api/v1/products
```

### 6.2 Test Socket Connection

```bash
# Install wscat
npm install -g wscat

# Connect to socket
wscat -c ws://localhost:5000
```

### 6.3 Test Frontend

1. Mở browser: http://localhost:3000
2. Scan QR code hoặc nhập URL: http://localhost:3000/qr/table-uuid
3. Kiểm tra menu hiển thị
4. Thêm món vào giỏ hàng
5. Tạo đơn hàng

---

## Bước 7: Development Workflow

### 7.1 Git Branching Strategy

```
main (production)
  └── develop (development)
       ├── feature/add-payment-gateway
       ├── feature/ai-recommendation
       ├── bugfix/order-status-sync
       └── hotfix/critical-bug
```

### 7.2 Create Feature Branch

```bash
# Từ develop branch
git checkout develop
git pull origin develop

# Tạo feature branch
git checkout -b feature/your-feature-name

# Sau khi code xong
git add .
git commit -m "feat: add feature description"
git push origin feature/your-feature-name

# Tạo Pull Request trên GitHub
```

### 7.3 Commit Message Convention

```
feat: Thêm tính năng mới
fix: Sửa bug
docs: Cập nhật documentation
style: Format code (không ảnh hưởng logic)
refactor: Refactor code
test: Thêm/sửa tests
chore: Cập nhật build tools, dependencies
```

---

## Bước 8: Testing

### 8.1 Unit Tests

```bash
cd backend
npm test

# With coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

### 8.2 Integration Tests

```bash
npm run test:integration
```

### 8.3 E2E Tests

```bash
cd ../testing/e2e
npx playwright install
npx playwright test

# Với UI mode
npx playwright test --ui
```

---

## Bước 9: Debugging

### 9.1 Backend Debugging (VS Code)

**File .vscode/launch.json:**
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Backend",
      "skipFiles": ["/**"],
      "program": "${workspaceFolder}/backend/server.js",
      "env": {
        "NODE_ENV": "development"
      }
    }
  ]
}
```

### 9.2 Frontend Debugging

**Chrome DevTools:**
1. Mở Developer Tools (F12)
2. Tab "Sources" → Breakpoints
3. Tab "Network" → XHR requests
4. Tab "Console" → Logs

**React DevTools:**
```bash
# Install extension
# Chrome: React Developer Tools
# Firefox: React Developer Tools
```

---

## Bước 10: Common Issues & Solutions

### Issue 1: Cannot connect to MySQL

**Error:**
```
Error: ER_ACCESS_DENIED_ERROR: Access denied for user
```

**Solution:**
```bash
# Reset MySQL password
mysql -u root -p
ALTER USER 'root'@'localhost' IDENTIFIED BY 'new_password';
FLUSH PRIVILEGES;
```

### Issue 2: Port already in use

**Error:**
```
Error: listen EADDRINUSE: address already in use :::5000
```

**Solution:**
```bash
# Find process using port
lsof -i :5000

# Kill process
kill -9 

# Or use different port
PORT=5001 npm run dev
```

### Issue 3: Redis connection failed

**Solution:**
```bash
# Start Redis server
redis-server

# Or with Docker
docker run -d -p 6379:6379 redis:7-alpine
```

### Issue 4: CORS errors

**Error:**
```
Access to fetch at 'http://localhost:5000' from origin 'http://localhost:3000' has been blocked by CORS
```

**Solution:**
```javascript
// backend/src/config/app.js
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true
}));
```

---

## Bước 11: Development Tools

### Recommended VS Code Extensions

```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss",
    "dsznajder.es7-react-js-snippets",
    "formulahendry.auto-rename-tag",
    "christian-kohler.path-intellisense",
    "ms-azuretools.vscode-docker"
  ]
}
```

### Useful CLI Tools

```bash
# API Testing
npm install -g httpie

# Database GUI
# Download: MySQL Workbench, DBeaver

# Redis GUI
# Download: RedisInsight

# Performance Monitoring
npm install -g clinic
```

---

## Next Steps

1. ✅ Đọc [Coding Standards](./coding-standards.md)
2. ✅ Xem [API Documentation](../architecture/api-design.md)
3. ✅ Tham gia [Team Communication](../team/communication.md)
4. ✅ Review [Project Roadmap](../../README.md#roadmap)
```

---
