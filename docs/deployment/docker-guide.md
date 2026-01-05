```markdown
# Docker Deployment Guide

## Docker Architecture

```
┌────────────────────────────────────────────────┐
│              Docker Host                       │
│  ┌──────────────────────────────────────────┐  │
│  │   Docker Network: qr-order-network       │  │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐   │  |
│  │  │ MySQL   │  │ Redis   │  │ Backend │   │  │  
│  │  │ :3306   │  │ :6379   │  │ :5000   │   │  │
│  │  └─────────┘  └─────────┘  └─────────┘   │  │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐   │  │
│  │  │Customer │  │ Admin   │  │ Nginx   │   │  │
│  │  │ :3000   │  │ :3001   │  │ :80     │   │  |
│  │  └─────────┘  └─────────┘  └─────────┘   │  │
│  └──────────────────────────────────────────┘  │
└────────────────────────────────────────────────┘
```

## 1. Docker Images

### Backend Dockerfile

```dockerfile
# backend/Dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# Add build steps if needed
# RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nodejs

COPY --from=deps --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --chown=nodejs:nodejs . .

USER nodejs

EXPOSE 5000

CMD ["node", "server.js"]
```

### Frontend Customer Dockerfile

```dockerfile
# frontend-customer/Dockerfile
FROM node:18-alpine AS base

# Dependencies
FROM base AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

# Builder
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED 1

RUN npm run build

# Runner
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
```

### Frontend Admin Dockerfile

```dockerfile
# frontend-admin/Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

---

## 2. Docker Compose Files

### Development (docker-compose.yml)

```yaml
version: '3.8'

services:
  mysql:
    image: mysql:8.0
    container_name: qr-order-mysql-dev
    environment:
      MYSQL_ROOT_PASSWORD: ${DB_ROOT_PASSWORD:-rootpassword}
      MYSQL_DATABASE: ${DB_NAME:-qr_order_db}
      MYSQL_USER: ${DB_USER:-qruser}
      MYSQL_PASSWORD: ${DB_PASSWORD:-qrpassword}
    ports:
      - "3306:3306"
    volumes:
      - mysql_data:/var/lib/mysql
      - ./database/init.sql:/docker-entrypoint-initdb.d/01-init.sql
      - ./database/seed.sql:/docker-entrypoint-initdb.d/02-seed.sql
    networks:
      - qr-order-network
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      timeout: 20s
      retries: 10

  redis:
    image: redis:7-alpine
    container_name: qr-order-redis-dev
    command: redis-server --appendonly yes
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    networks:
      - qr-order-network
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 3s
      retries: 5

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
      target: base
    container_name: qr-order-backend-dev
    environment:
      NODE_ENV: development
      DB_HOST: mysql
      DB_PORT: 3306
      DB_NAME: ${DB_NAME:-qr_order_db}
      DB_USER: ${DB_USER:-qruser}
      DB_PASSWORD: ${DB_PASSWORD:-qrpassword}
      REDIS_HOST: redis
      REDIS_PORT: 6379
      JWT_SECRET: ${JWT_SECRET}
      PORT: 5000
    ports:
      - "5000:5000"
    volumes:
      - ./backend:/app
      - /app/node_modules
    depends_on:
      mysql:
        condition: service_healthy
      redis:
        condition: service_healthy
    networks:
      - qr-order-network
    command: npm run dev

  frontend-customer:
    build:
      context: ./frontend-customer
      dockerfile: Dockerfile
      target: base
    container_name: qr-order-customer-dev
    environment:
      NEXT_PUBLIC_API_URL: http://backend:5000/api/v1
      NEXT_PUBLIC_SOCKET_URL: http://localhost:5000
    ports:
      - "3000:3000"
    volumes:
      - ./frontend-customer:/app
      - /app/node_modules
      - /app/.next
    depends_on:
      - backend
    networks:
      - qr-order-network
    command: npm run dev

  frontend-admin:
    build:
      context: ./frontend-admin
      dockerfile: Dockerfile.dev
    container_name: qr-order-admin-dev
    environment:
      VITE_API_URL: http://backend:5000/api/v1
      VITE_SOCKET_URL: http://localhost:5000
    ports:
      - "3001:3001"
    volumes:
      - ./frontend-admin:/app
      - /app/node_modules
    depends_on:
      - backend
    networks:
      - qr-order-network
    command: npm run dev

volumes:
  mysql_data:
  redis_data:

networks:
  qr-order-network:
    driver: bridge
```

### Production (docker-compose.prod.yml)

```yaml
version: '3.8'

services:
  mysql:
    image: mysql:8.0
    container_name: qr-order-mysql-prod
    environment:
      MYSQL_ROOT_PASSWORD: ${DB_ROOT_PASSWORD}
      MYSQL_DATABASE: ${DB_NAME}
      MYSQL_USER: ${DB_USER}
      MYSQL_PASSWORD: ${DB_PASSWORD}
    volumes:
      - mysql_data_prod:/var/lib/mysql
      - ./database/backups:/backups
    networks:
      - qr-order-network
    restart: unless-stopped
    command: --default-authentication-plugin=mysql_native_password
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      timeout: 20s
      retries: 10

  redis:
    image: redis:7-alpine
    container_name: qr-order-redis-prod
    command: redis-server --requirepass ${REDIS_PASSWORD} --appendonly yes --maxmemory 256mb --maxmemory-policy allkeys-lru
    volumes:
      - redis_data_prod:/data
    networks:
      - qr-order-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "redis-cli", "--raw", "incr", "ping"]
      interval: 10s
      timeout: 3s
      retries: 5

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
      target: runner
    container_name: qr-order-backend-prod
    environment:
      NODE_ENV: production
      DB_HOST: mysql
      DB_PORT: 3306
      DB_NAME: ${DB_NAME}
      DB_USER: ${DB_USER}
      DB_PASSWORD: ${DB_PASSWORD}
      REDIS_HOST: redis
      REDIS_PORT: 6379
      REDIS_PASSWORD: ${REDIS_PASSWORD}
      JWT_SECRET: ${JWT_SECRET}
      JWT_REFRESH_SECRET: ${JWT_REFRESH_SECRET}
      PORT: 5000
    depends_on:
      mysql:
        condition: service_healthy
      redis:
        condition: service_healthy
    networks:
      - qr-order-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:5000/api/v1/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  frontend-customer:
    build:
      context: ./frontend-customer
      dockerfile: Dockerfile
      target: runner
    container_name: qr-order-customer-prod
    environment:
      NEXT_PUBLIC_API_URL: https://api.yourdomain.com/api/v1
      NEXT_PUBLIC_SOCKET_URL: https://api.yourdomain.com
    depends_on:
      - backend
    networks:
      - qr-order-network
    restart: unless-stopped

  frontend-admin:
    build:
      context: ./frontend-admin
      dockerfile: Dockerfile
    container_name: qr-order-admin-prod
    depends_on:
      - backend
    networks:
      - qr-order-network
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    container_name: qr-order-nginx-prod
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./config/nginx.conf:/etc/nginx/nginx.conf
      - ./config/ssl:/etc/nginx/ssl
      - nginx_logs:/var/log/nginx
    depends_on:
      - backend
      - frontend-customer
      - frontend-admin
    networks:
      - qr-order-network
    restart: unless-stopped

volumes:
  mysql_data_prod:
  redis_data_prod:
  nginx_logs:

networks:
  qr-order-network:
    driver: bridge
```

---

## 3. Nginx Configuration

```nginx
# config/nginx.conf
events {
    worker_connections 1024;
}

http {
    upstream backend_api {
        least_conn;
        server backend:5000;
    }

    upstream frontend_customer {
        server frontend-customer:3000;
    }

    upstream frontend_admin {
        server frontend-admin:80;
    }

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=100r/m;
    limit_req_zone $binary_remote_addr zone=order_limit:10m rate=30r/m;

    # Redirect HTTP to HTTPS
    server {
        listen 80;
        server_name yourdomain.com www.yourdomain.com;
        return 301 https://$server_name$request_uri;
    }

    # Customer Frontend
    server {
        listen 443 ssl http2;
        server_name yourdomain.com www.yourdomain.com;

        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/key.pem;
        ssl_protocols TLSv1.2 TLSv1.3;

        location / {
            proxy_pass http://frontend_customer;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
        }
    }

    # Admin Portal
    server {
        listen 443 ssl http2;
        server_name admin.yourdomain.com;

        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/key.pem;

        location / {
            proxy_pass http://frontend_admin;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }
    }

    # API Server
    server {
        listen 443 ssl http2;
        server_name api.yourdomain.com;

        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/key.pem;

        # API endpoints with rate limiting
        location /api/v1/ {
            limit_req zone=api_limit burst=20 nodelay;
            
            proxy_pass http://backend_api;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            
            # CORS headers
            add_header 'Access-Control-Allow-Origin' '*' always;
            add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
            add_header 'Access-Control-Allow-Headers' 'Authorization, Content-Type' always;
        }

        # Order creation with stricter rate limit
        location /api/v1/orders {
            limit_req zone=order_limit burst=10 nodelay;
            
            proxy_pass http://backend_api;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
        }

        # WebSocket endpoint
        location /socket.io/ {
            proxy_pass http://backend_api;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
            
            # WebSocket timeout
            proxy_read_timeout 86400;
            proxy_send_timeout 86400;
        }
    }
}
```

---

## 4. Docker Commands Reference

### Development

```bash
# Start all services
docker-compose up -d

# Start specific service
docker-compose up -d backend

# View logs
docker-compose logs -f
docker-compose logs -f backend

# Stop services
docker-compose stop

# Stop and remove containers
docker-compose down

# Rebuild images
docker-compose build
docker-compose build --no-cache backend

# Execute command in container
docker-compose exec backend sh
docker-compose exec mysql mysql -u root -p

# View running containers
docker-compose ps

# Restart service
docker-compose restart backend
```

### Production

```bash
# Deploy production
docker-compose -f docker-compose.prod.yml up -d

# Pull latest images
docker-compose -f docker-compose.prod.yml pull

# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Scale services (if needed)
docker-compose -f docker-compose.prod.yml up -d --scale backend=3

# Update single service
docker-compose -f docker-compose.prod.yml up -d --no-deps --build backend
```

### Database Operations

```bash
# Backup database
docker-compose exec mysql mysqldump -u root -p qr_order_db > backup_$(date +%Y%m%d).sql

# Restore database
docker-compose exec -T mysql mysql -u root -p qr_order_db < backup_20250115.sql

# Access MySQL CLI
docker-compose exec mysql mysql -u root -p

# View database size
docker-compose exec mysql mysql -u root -p -e "
  SELECT 
    table_schema AS 'Database',
    ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS 'Size (MB)'
  FROM information_schema.TABLES
  WHERE table_schema = 'qr_order_db'
  GROUP BY table_schema;
"
```

### Redis Operations

```bash
# Access Redis CLI
docker-compose exec redis redis-cli

# Check Redis info
docker-compose exec redis redis-cli INFO

# Monitor Redis commands
docker-compose exec redis redis-cli MONITOR

# Clear all cache
docker-compose exec redis redis-cli FLUSHALL

# Check memory usage
docker-compose exec redis redis-cli INFO memory
```

### Monitoring & Debugging

```bash
# Check container resource usage
docker stats

# Inspect container
docker inspect qr-order-backend-prod

# View container processes
docker top qr-order-backend-prod

# Copy files from container
docker cp qr-order-backend-prod:/app/logs ./local-logs

# View disk usage
docker system df

# Clean up unused resources
docker system prune -a
```

---

## 5. Environment Variables Management

### .env File Structure

```env
# .env.production
NODE_ENV=production

# Database
DB_HOST=mysql
DB_PORT=3306
DB_NAME=qr_order_prod
DB_USER=qr_prod_user
DB_PASSWORD=super_secure_password_here_change_in_prod
DB_ROOT_PASSWORD=root_super_secure_password

# Redis
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=redis_secure_password

# JWT
JWT_SECRET=your-256-bit-secret-key-generate-with-openssl
JWT_REFRESH_SECRET=your-refresh-token-secret
JWT_EXPIRE=15m
JWT_REFRESH_EXPIRE=7d

# API URLs
API_URL=https://api.yourdomain.com
CUSTOMER_URL=https://yourdomain.com
ADMIN_URL=https://admin.yourdomain.com

# Payment Gateway
VNPAY_TMN_CODE=your_vnpay_code
VNPAY_SECRET_KEY=your_vnpay_secret
VNPAY_RETURN_URL=https://yourdomain.com/payment/callback

MOMO_PARTNER_CODE=your_momo_code
MOMO_ACCESS_KEY=your_momo_access_key
MOMO_SECRET_KEY=your_momo_secret

# Notification Services
ZALO_OA_ID=your_zalo_official_account_id
ZALO_APP_ID=your_zalo_app_id
ZALO_SECRET_KEY=your_zalo_secret

# Email Service
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=noreply@yourdomain.com
SMTP_PASSWORD=app_specific_password

# AWS (Optional - for S3 storage)
AWS_REGION=ap-southeast-1
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
S3_BUCKET_NAME=qr-order-assets

# Monitoring (Optional)
SENTRY_DSN=your_sentry_dsn
```

### Generate Secure Secrets

```bash
# Generate JWT secret
openssl rand -base64 64

# Generate random password
openssl rand -base64 32

# Generate UUID
uuidgen
```

---

## 6. Health Checks & Monitoring

### Docker Health Check Configuration

```yaml
# In docker-compose.prod.yml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:5000/api/v1/health"]
  interval: 30s      # Check every 30 seconds
  timeout: 10s       # Timeout after 10 seconds
  retries: 3         # Retry 3 times before marking unhealthy
  start_period: 40s  # Wait 40s before first check
```

### Health Check Endpoint

```javascript
// backend/src/routes/health.routes.js
const express = require('express');
const router = express.Router();
const db = require('../config/database');
const redis = require('../config/redis');

router.get('/health', async (req, res) => {
  const health = {
    uptime: process.uptime(),
    timestamp: Date.now(),
    status: 'OK',
    services: {
      database: 'unknown',
      redis: 'unknown'
    }
  };

  try {
    // Check database
    await db.query('SELECT 1');
    health.services.database = 'healthy';
  } catch (error) {
    health.services.database = 'unhealthy';
    health.status = 'DEGRADED';
  }

  try {
    // Check Redis
    await redis.ping();
    health.services.redis = 'healthy';
  } catch (error) {
    health.services.redis = 'unhealthy';
    health.status = 'DEGRADED';
  }

  const statusCode = health.status === 'OK' ? 200 : 503;
  res.status(statusCode).json(health);
});

module.exports = router;
```

---

## 7. Backup & Recovery

### Automated Backup Script

```bash
#!/bin/bash
# scripts/backup.sh

set -e

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups"
MYSQL_CONTAINER="qr-order-mysql-prod"
DB_NAME="qr_order_prod"
DB_USER="root"
DB_PASSWORD="${DB_ROOT_PASSWORD}"

# Create backup directory
mkdir -p ${BACKUP_DIR}

# Backup MySQL database
echo "Starting MySQL backup..."
docker exec ${MYSQL_CONTAINER} mysqldump \
  -u ${DB_USER} \
  -p${DB_PASSWORD} \
  --single-transaction \
  --quick \
  --lock-tables=false \
  ${DB_NAME} | gzip > ${BACKUP_DIR}/mysql_${TIMESTAMP}.sql.gz

# Backup Redis data
echo "Starting Redis backup..."
docker exec qr-order-redis-prod redis-cli SAVE
docker cp qr-order-redis-prod:/data/dump.rdb ${BACKUP_DIR}/redis_${TIMESTAMP}.rdb

# Remove backups older than 7 days
find ${BACKUP_DIR} -name "mysql_*.sql.gz" -mtime +7 -delete
find ${BACKUP_DIR} -name "redis_*.rdb" -mtime +7 -delete

# Upload to S3 (optional)
# aws s3 cp ${BACKUP_DIR}/mysql_${TIMESTAMP}.sql.gz s3://your-backup-bucket/

echo "Backup completed: ${TIMESTAMP}"
```

### Restore from Backup

```bash
#!/bin/bash
# scripts/restore.sh

BACKUP_FILE=$1
MYSQL_CONTAINER="qr-order-mysql-prod"
DB_NAME="qr_order_prod"

if [ -z "$BACKUP_FILE" ]; then
  echo "Usage: ./restore.sh "
  exit 1
fi

echo "Restoring database from ${BACKUP_FILE}..."

# Decompress and restore
gunzip < ${BACKUP_FILE} | docker exec -i ${MYSQL_CONTAINER} mysql \
  -u root \
  -p${DB_ROOT_PASSWORD} \
  ${DB_NAME}

echo "Restore completed!"
```

### Cron Job for Automated Backups

```bash
# Add to crontab (crontab -e)
# Daily backup at 2 AM
0 2 * * * /path/to/scripts/backup.sh >> /var/log/qr-order-backup.log 2>&1

# Weekly full backup at Sunday 3 AM
0 3 * * 0 /path/to/scripts/full-backup.sh >> /var/log/qr-order-backup.log 2>&1
```

---

## 8. Scaling Strategies

### Horizontal Scaling

```yaml
# docker-compose.scale.yml
version: '3.8'

services:
  backend:
    deploy:
      replicas: 3
      restart_policy:
        condition: on-failure
        delay: 5s
        max_attempts: 3
      resources:
        limits:
          cpus: '1'
          memory: 512M
        reservations:
          cpus: '0.5'
          memory: 256M

  nginx:
    # Load balancer will distribute across backend replicas
    depends_on:
      - backend
```

### Docker Swarm (Production Clustering)

```bash
# Initialize swarm
docker swarm init

# Deploy stack
docker stack deploy -c docker-compose.prod.yml qr-order

# Scale services
docker service scale qr-order_backend=5

# View services
docker service ls

# View service logs
docker service logs -f qr-order_backend
```

---

## 9. Security Best Practices

### Docker Security Checklist

```yaml
# Secure docker-compose configuration
services:
  backend:
    # Run as non-root user
    user: "1001:1001"
    
    # Read-only root filesystem
    read_only: true
    
    # Temporary filesystem for /tmp
    tmpfs:
      - /tmp
    
    # Security options
    security_opt:
      - no-new-privileges:true
    
    # Limit capabilities
    cap_drop:
      - ALL
    cap_add:
      - NET_BIND_SERVICE
    
    # Resource limits
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 512M
```

### Network Isolation

```yaml
networks:
  frontend:
    driver: bridge
  backend:
    driver: bridge
    internal: true  # No external access

services:
  nginx:
    networks:
      - frontend
  
  backend:
    networks:
      - frontend
      - backend
  
  mysql:
    networks:
      - backend  # Only accessible from backend network
```

---

## 10. Troubleshooting

### Common Issues

#### Issue 1: Container keeps restarting

```bash
# Check logs
docker logs qr-order-backend-prod --tail 100

# Check exit code
docker inspect qr-order-backend-prod --format='{{.State.ExitCode}}'

# Common exit codes:
# 0: Success
# 1: Application error
# 137: Out of memory (killed by OOM killer)
# 139: Segmentation fault
```

#### Issue 2: Database connection refused

```bash
# Check if MySQL is ready
docker exec qr-order-mysql-prod mysqladmin ping -h localhost

# Check network connectivity
docker exec qr-order-backend-prod ping mysql

# Verify environment variables
docker exec qr-order-backend-prod env | grep DB_
```

#### Issue 3: High memory usage

```bash
# Check memory usage
docker stats --no-stream

# Analyze container memory
docker exec qr-order-backend-prod node -e "console.log(process.memoryUsage())"

# Restart with memory limit
docker-compose restart backend
```

#### Issue 4: Socket.io not connecting

```bash
# Check if port is exposed
docker port qr-order-backend-prod

# Test WebSocket connection
wscat -c ws://localhost:5000/socket.io/?EIO=4&transport=websocket

# Check CORS settings
curl -H "Origin: http://localhost:3000" \
  -H "Access-Control-Request-Method: GET" \
  -X OPTIONS http://localhost:5000/socket.io/
```

---

## 11. Production Deployment Checklist

```markdown
### Pre-Deployment
- [ ] All tests passing (unit, integration, e2e)
- [ ] Code reviewed and approved
- [ ] Environment variables configured
- [ ] Database migrations ready
- [ ] SSL certificates obtained
- [ ] Backup strategy tested
- [ ] Monitoring tools configured
- [ ] Load testing completed

### Deployment
- [ ] Pull latest code
- [ ] Build Docker images
- [ ] Run database migrations
- [ ] Deploy containers
- [ ] Verify health checks
- [ ] Test critical user flows
- [ ] Monitor logs for errors
- [ ] Update DNS if needed

### Post-Deployment
- [ ] Verify all services running
- [ ] Check application metrics
- [ ] Test payment gateway
- [ ] Test notification services
- [ ] Monitor error rates
- [ ] Create deployment documentation
- [ ] Notify team of successful deployment
```

---

## 12. Performance Optimization

### Docker Image Optimization

```dockerfile
# Use multi-stage builds
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Final image
FROM node:18-alpine
WORKDIR /app
# Copy only necessary files
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
CMD ["node", "dist/server.js"]
```

### Layer Caching

```dockerfile
# Good: Install dependencies first (cached if package.json unchanged)
COPY package*.json ./
RUN npm ci

# Then copy source code
COPY . .
```

### Resource Limits

```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M
```

---

## 13. Monitoring with Docker

### Prometheus & Grafana Setup

```yaml
services:
  prometheus:
    image: prom/prometheus
    volumes:
      - ./config/prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    ports:
      - "9090:9090"

  grafana:
    image: grafana/grafana
    volumes:
      - grafana_data:/var/lib/grafana
    ports:
      - "3002:3000"
    depends_on:
      - prometheus
```

### Log Aggregation with ELK

```yaml
services:
  elasticsearch:
    image: elasticsearch:8.11.0
    environment:
      - discovery.type=single-node
    volumes:
      - elastic_data:/usr/share/elasticsearch/data

  logstash:
    image: logstash:8.11.0
    volumes:
      - ./config/logstash.conf:/usr/share/logstash/pipeline/logstash.conf
    depends_on:
      - elasticsearch

  kibana:
    image: kibana:8.11.0
    ports:
      - "5601:5601"
    depends_on:
      - elasticsearch
```

---

## Useful Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Reference](https://docs.docker.com/compose/compose-file/)
- [Docker Security Best Practices](https://docs.docker.com/engine/security/)
- [Nginx Docker Documentation](https://hub.docker.com/_/nginx)
```

---
