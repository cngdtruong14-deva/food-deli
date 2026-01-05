# Chiến Lược Mở Rộng Hệ Thống (Scaling Strategy)

## Tổng Quan

Tài liệu này mô tả chi tiết các chiến lược mở rộng quy mô cho hệ thống QR Order Platform khi lượng người dùng và dữ liệu tăng trưởng.

---

## 🎯 Mục Tiêu Scaling

### Chỉ Tiêu Hiệu Suất

| Metric | Current | Target (1 năm) | Target (3 năm) |
|--------|---------|----------------|----------------|
| Concurrent Users | 1,000 | 10,000 | 100,000 |
| Requests/second | 100 | 1,000 | 10,000 |
| Database Size | 10GB | 100GB | 1TB |
| Branches | 5 | 50 | 500 |
| Orders/day | 1,000 | 10,000 | 100,000 |

### Yêu Cầu SLA

- **Uptime**: 99.9% (8.76 giờ downtime/năm)
- **Response Time**: < 200ms (p95)
- **Database Query**: < 50ms (average)
- **Socket Latency**: < 100ms (p99)

---

## 📊 Giai Đoạn Scaling

### Giai Đoạn 1: Monolith (0-5 chi nhánh)

**Kiến trúc:**
```
┌──────────────────────────────────┐
│   Single Server                  │
│  ┌────────────────────────────┐  │
│  │  Node.js App               │  │
│  │  (Backend + WebSocket)     │  │
│  └────────────────────────────┘  │
│  ┌────────────────────────────┐  │
│  │  MySQL (Single Instance)   │  │
│  └────────────────────────────┘  │
│  ┌────────────────────────────┐  │
│  │  Redis (Single Instance)   │  │
│  └────────────────────────────┘  │
└──────────────────────────────────┘
```

**Đặc điểm:**
- Tất cả services trên 1 server
- Không cần load balancer
- Chi phí thấp, dễ quản lý
- Phù hợp cho startup, MVP

**Giới hạn:**
- Không scale được khi traffic tăng
- Single point of failure
- Khó maintain khi phát triển

---

### Giai Đoạn 2: Horizontal Scaling (5-50 chi nhánh)

**Kiến trúc:**
```
┌─────────────────────────────────────┐
│         Load Balancer (Nginx)        │
└──────────────┬──────────────────────┘
               │
    ┌──────────┼──────────┐
    ▼          ▼          ▼
┌────────┐ ┌────────┐ ┌────────┐
│ Node.js │ │ Node.js │ │ Node.js │
│ App 1   │ │ App 2   │ │ App 3   │
└────┬────┘ └────┬────┘ └────┬────┘
     │          │          │
     └──────────┼──────────┘
                ▼
     ┌──────────────────────┐
     │  Redis Cluster       │
     │  (Session Sync)      │
     └──────────┬───────────┘
                │
     ┌──────────┴───────────┐
     ▼                      ▼
┌────────────┐      ┌────────────┐
│ MySQL      │      │ Read        │
│ Master     │─────►│ Replica 1   │
│ (Writes)   │      │ (Reads)     │
└────────────┘      └────────────┘
```

**Đặc điểm:**
- Multiple app instances
- Load balancing
- Database read replicas
- Redis cluster cho session sharing
- Auto-scaling based on CPU/memory

**Công nghệ:**
- Docker Swarm hoặc Kubernetes
- Nginx load balancer
- MySQL Master-Slave replication
- Redis Sentinel/Cluster

---

### Giai Đoạn 3: Microservices (50-500 chi nhánh)

**Kiến trúc:**
```
┌─────────────────────────────────────────┐
│         API Gateway (Kong/Tyk)          │
└─────┬─────┬─────┬─────┬─────┬───────────┘
      │     │     │     │     │
      ▼     ▼     ▼     ▼     ▼
┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐
│ Order  │ │ Menu   │ │ Payment│ │ Notify │ │ Analytics│
│ Service│ │ Service│ │ Service│ │ Service│ │ Service │
└────┬───┘ └────┬───┘ └────┬───┘ └────┬───┘ └────┬───┘
     │          │          │          │          │
     └──────────┼──────────┼──────────┼──────────┘
                │          │          │
     ┌──────────┴──────────┴──────────┴──────────┐
     ▼                                            ▼
┌────────────┐                          ┌────────────┐
│ MySQL      │                          │ MongoDB    │
│ (Orders)   │                          │ (Logs)     │
└────────────┘                          └────────────┘
```

**Đặc điểm:**
- Tách thành microservices độc lập
- Mỗi service có database riêng (nếu cần)
- Message queue (RabbitMQ/Kafka) cho async communication
- Service discovery (Consul/Eureka)
- API Gateway cho routing

**Lợi ích:**
- Scale từng service độc lập
- Deploy độc lập
- Technology stack đa dạng
- Fault isolation

---

## 🔧 Chiến Lược Scaling Cụ Thể

### 1. Application Layer Scaling

#### Vertical Scaling (Scale Up)

**Khi nào dùng:**
- Database cần nhiều RAM/CPU
- Single-threaded bottlenecks
- Không thể scale horizontal

**Cách thực hiện:**
```bash
# Tăng instance size trên cloud
# AWS: t3.medium → t3.large → t3.xlarge
# GCP: n1-standard-2 → n1-standard-4
```

**Giới hạn:**
- Chi phí tăng nhanh
- Có giới hạn hardware
- Không giải quyết được single point of failure

#### Horizontal Scaling (Scale Out)

**Khi nào dùng:**
- Traffic tăng đột biến
- Cần high availability
- Stateless applications

**Cách thực hiện:**
```yaml
# docker-compose.yml
services:
  backend:
    deploy:
      replicas: 5
      resources:
        limits:
          cpus: '1'
          memory: 512M
```

**Auto-scaling Rules:**
```yaml
# Kubernetes HPA
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: backend-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: backend
  minReplicas: 2
  maxReplicas: 20
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

---

### 2. Database Scaling

#### Read Replicas

**Setup:**
```sql
-- Master configuration
[mysqld]
server-id = 1
log-bin = mysql-bin
binlog-format = ROW

-- Replica configuration
[mysqld]
server-id = 2
relay-log = mysql-relay-bin
read-only = 1
```

**Application Code:**
```javascript
// Read from replica, write to master
const readPool = mysql.createPool({
  host: 'mysql-replica-1',
  // ... read queries
});

const writePool = mysql.createPool({
  host: 'mysql-master',
  // ... write queries
});
```

#### Database Sharding

**Khi nào cần:**
- Database size > 500GB
- Write throughput quá cao
- Cần phân tán theo địa lý

**Sharding Strategy:**
```javascript
// Shard by branch_id
function getShard(branchId) {
  const shardNumber = parseInt(branchId.slice(-1)) % 4;
  return `mysql-shard-${shardNumber}`;
}

// Route queries to correct shard
const shard = getShard(order.branchId);
await db[shard].query('INSERT INTO orders ...', [order]);
```

**Sharding Key:**
- `branch_id` - Phân tán theo chi nhánh
- `customer_id` - Phân tán theo khách hàng
- `created_at` - Phân tán theo thời gian

---

### 3. Caching Strategy

#### Multi-Level Caching

```
Request
  │
  ▼
┌─────────────┐
│ CDN Cache   │ (Static assets)
└──────┬──────┘
       │ Cache Miss
       ▼
┌─────────────┐
│ Redis Cache │ (Application cache)
└──────┬──────┘
       │ Cache Miss
       ▼
┌─────────────┐
│ MySQL       │ (Database)
└─────────────┘
```

**Cache Layers:**
1. **Browser Cache**: Static assets (24h)
2. **CDN Cache**: Images, CSS, JS (1h)
3. **Redis Cache**: API responses (30min)
4. **Application Cache**: In-memory (5min)

**Cache Invalidation:**
```javascript
// Invalidate on update
async function updateProduct(productId, data) {
  await db.query('UPDATE products SET ... WHERE id = ?', [productId]);
  
  // Invalidate cache
  await redis.del(`product:${productId}`);
  await redis.del('products:all');
  await redis.del(`products:category:${data.categoryId}`);
}
```

---

### 4. WebSocket Scaling

#### Redis Pub/Sub for Socket.io

**Problem:** Socket.io không share state giữa các instances

**Solution:** Redis adapter
```javascript
const io = require('socket.io')(server);
const redisAdapter = require('socket.io-redis');

io.adapter(redisAdapter({
  host: 'redis-cluster',
  port: 6379
}));

// Now all instances share socket events
io.to('table-123').emit('order:update', data);
```

**Architecture:**
```
Client 1 ──► Node Instance 1 ──► Redis Pub/Sub ──► Node Instance 2 ──► Client 2
```

---

### 5. File Storage Scaling

#### Object Storage (S3/GCS)

**Migration từ local storage:**
```javascript
// Before: Local storage
app.use('/uploads', express.static('uploads'));

// After: S3
const AWS = require('aws-sdk');
const s3 = new AWS.S3();

async function uploadFile(file) {
  const params = {
    Bucket: 'qr-order-assets',
    Key: `products/${Date.now()}-${file.originalname}`,
    Body: file.buffer,
    ContentType: file.mimetype
  };
  
  return await s3.upload(params).promise();
}
```

**CDN Integration:**
```
User Request → CloudFront CDN → S3 Bucket
```

---

## 📈 Monitoring & Metrics

### Key Metrics to Track

**Application:**
- Request rate (req/s)
- Response time (p50, p95, p99)
- Error rate (%)
- Active connections

**Database:**
- Query time
- Connection pool usage
- Replication lag
- Slow queries

**Infrastructure:**
- CPU usage
- Memory usage
- Network I/O
- Disk I/O

### Alerting Thresholds

```yaml
alerts:
  - name: High CPU Usage
    condition: cpu > 80%
    duration: 5m
    action: scale_up
    
  - name: High Error Rate
    condition: error_rate > 1%
    duration: 2m
    action: notify_team
    
  - name: Database Replication Lag
    condition: replication_lag > 10s
    duration: 1m
    action: notify_dba
```

---

## 🚀 Migration Plan

### Phase 1: Preparation (Week 1-2)

- [ ] Audit current infrastructure
- [ ] Identify bottlenecks
- [ ] Set up monitoring
- [ ] Create backup strategy
- [ ] Document current state

### Phase 2: Horizontal Scaling (Week 3-4)

- [ ] Setup load balancer
- [ ] Deploy multiple app instances
- [ ] Configure Redis cluster
- [ ] Setup database read replicas
- [ ] Test failover scenarios

### Phase 3: Optimization (Week 5-6)

- [ ] Implement caching strategy
- [ ] Optimize database queries
- [ ] Setup CDN
- [ ] Configure auto-scaling
- [ ] Load testing

### Phase 4: Microservices (Week 7-12)

- [ ] Identify service boundaries
- [ ] Extract services one by one
- [ ] Setup API Gateway
- [ ] Implement service discovery
- [ ] Setup message queue

---

## 💰 Cost Optimization

### Cloud Cost Breakdown

| Service | Monthly Cost (5 branches) | Monthly Cost (50 branches) |
|---------|-------------------------|----------------------------|
| Compute | $200 | $2,000 |
| Database | $150 | $1,500 |
| Cache | $50 | $500 |
| Storage | $30 | $300 |
| CDN | $20 | $200 |
| **Total** | **$450** | **$4,500** |

### Cost Optimization Tips

1. **Reserved Instances**: Giảm 30-40% cho predictable workloads
2. **Spot Instances**: Giảm 70-90% cho non-critical tasks
3. **Auto-scaling**: Chỉ trả tiền khi cần
4. **Caching**: Giảm database load → giảm DB costs
5. **Compression**: Giảm bandwidth costs

---

## 📊 Performance Benchmarks

### Before Scaling

```
Concurrent Users: 1,000
Requests/sec: 100
Response Time (p95): 500ms
Database Queries: 200/sec
Error Rate: 0.5%
```

### After Scaling (Phase 2)

```
Concurrent Users: 10,000
Requests/sec: 1,000
Response Time (p95): 150ms
Database Queries: 500/sec (with caching)
Error Rate: 0.1%
```

### After Scaling (Phase 3)

```
Concurrent Users: 100,000
Requests/sec: 10,000
Response Time (p95): 100ms
Database Queries: 1,000/sec (with read replicas)
Error Rate: 0.05%
```

---

## 🔄 Rollback Strategy

### If Scaling Fails

1. **Immediate Rollback:**
   - Revert to previous infrastructure
   - Restore from backup
   - Notify team

2. **Gradual Rollback:**
   - Route 10% traffic to new infrastructure
   - Monitor for issues
   - Gradually increase if stable

3. **Blue-Green Deployment:**
   - Keep old infrastructure running
   - Switch traffic when new is stable
   - Keep old as backup

---

## 📚 Resources

- [AWS Auto Scaling Guide](https://docs.aws.amazon.com/autoscaling/)
- [Kubernetes Scaling](https://kubernetes.io/docs/tasks/run-application/horizontal-pod-autoscale/)
- [MySQL Replication](https://dev.mysql.com/doc/refman/8.0/en/replication.html)
- [Redis Cluster](https://redis.io/docs/manual/scaling/)

---

**Tài liệu này sẽ được cập nhật thường xuyên khi hệ thống phát triển.**