## 1. Tổng quan kiến trúc

### 1.1 Kiến trúc tổng thể (High-Level Architecture)

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                             │
├──────────────────────────┬──────────────────────────────────────┤
│  Customer Web App        │    Admin Portal                      │
│  (Next.js - Mobile)      │    (React SPA)                       │
│  - Menu browsing         │    - Dashboard                       │
│  - QR scanning           │    - Product management              │
│  - Order placement       │    - Kitchen display                 │
│  - Real-time updates     │    - Analytics                       │
└──────────────────────────┴──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                      NGINX REVERSE PROXY                         │
│  - Load balancing                                                │
│  - SSL termination                                               │
│  - Static file serving                                           │
└─────────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                      APPLICATION LAYER                           │
├──────────────────────────┬──────────────────────────────────────┤
│   REST API Server        │    WebSocket Server                  │
│   (Express.js)           │    (Socket.io)                       │
│   - Authentication       │    - Order notifications             │
│   - Business logic       │    - Kitchen updates                 │
│   - CRUD operations      │    - Real-time sync                  │
└──────────────────────────┴──────────────────────────────────────┘
                           │
          ┌────────────────┼────────────────┐
          ▼                ▼                ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│   Redis      │  │   MySQL      │  │  External    │
│   Cache      │  │   Database   │  │  Services    │
│              │  │              │  │              │
│ - Sessions   │  │ - Products   │  │ - Payment    │
│ - Analytics  │  │ - Orders     │  │ - Zalo ZNS   │
│ - Queue      │  │ - Customers  │  │ - Email      │
└──────────────┘  └──────────────┘  └──────────────┘
```

### 1.2 Kiến trúc Backend (Layered Architecture)

```
┌─────────────────────────────────────────────┐
│           PRESENTATION LAYER                │
│  - Routes/Endpoints                         │
│  - Request validation                       │
│  - Response formatting                      │
└─────────────────────────────────────────────┘
                    ▼
┌─────────────────────────────────────────────┐
│           MIDDLEWARE LAYER                  │
│  - Authentication (JWT)                     │
│  - Authorization (RBAC)                     │
│  - Rate limiting                            │
│  - Error handling                           │
└─────────────────────────────────────────────┘
                    ▼
┌─────────────────────────────────────────────┐
│           BUSINESS LOGIC LAYER              │
│  - Controllers                              │
│  - Services                                 │
│  - Business rules                           │
└─────────────────────────────────────────────┘
                    ▼
┌─────────────────────────────────────────────┐
│           DATA ACCESS LAYER                 │
│  - Models                                   │
│  - Database queries                         │
│  - ORM operations                           │
└─────────────────────────────────────────────┘
                    ▼
┌─────────────────────────────────────────────┐
│           DATABASE LAYER                    │
│  - MySQL (Primary storage)                 │
│  - Redis (Cache & sessions)                │
└─────────────────────────────────────────────┘
```

## 2. Component Interaction

### 2.1 Luồng đặt hàng (Order Flow)

```sequence
Customer -> QR Code: 1. Scan QR
QR Code -> Frontend: 2. Redirect to /menu?table=5
Frontend -> API: 3. GET /api/tables/5
API -> Database: 4. Verify table exists
Database -> API: 5. Return table info
API -> Frontend: 6. Return menu data
Frontend -> Customer: 7. Display menu

Customer -> Frontend: 8. Add items to cart
Customer -> Frontend: 9. Place order
Frontend -> API: 10. POST /api/orders
API -> Database: 11. Insert order
API -> Socket: 12. Emit 'kitchen:new_order'
Socket -> Kitchen: 13. Push notification
Database -> API: 14. Order created
API -> Frontend: 15. Return order ID
Frontend -> Customer: 16. Show success
```

### 2.2 Real-time Communication Architecture

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│  Customer   │◄───────►│   Socket.io  │◄───────►│   Kitchen   │
│   Client    │  WS     │    Server    │  WS     │   Display   │
└─────────────┘         └──────────────┘         └─────────────┘
       │                       │                         │
       │                       ▼                         │
       │              ┌─────────────────┐               │
       │              │  Redis Pub/Sub  │               │
       │              │  (Scale across  │               │
       │              │   instances)    │               │
       │              └─────────────────┘               │
       │                                                 │
       └──────────── Event: 'order:status_update' ─────┘
```

## 3. Data Flow Patterns

### 3.1 Caching Strategy

```
Request Flow với Redis Cache:

┌─────────┐
│ Request │
└────┬────┘
     │
     ▼
┌─────────────┐     Cache Hit    ┌───────────┐
│ Redis Cache │─────────────────►│  Response │
└─────────────┘                  └───────────┘
     │
     │ Cache Miss
     ▼
┌─────────────┐
│   MySQL     │
└─────────────┘
     │
     ▼
┌─────────────┐
│ Update Cache│
└─────────────┘
     │
     ▼
┌───────────┐
│ Response  │
└───────────┘
```

**Cache Keys Design:**
- `menu:{branch_id}` - TTL: 1 hour
- `table:{table_id}` - TTL: 30 minutes
- `order:{order_id}` - TTL: 5 minutes
- `customer:{customer_id}` - TTL: 24 hours

### 3.2 Event-Driven Architecture

```
Order Placement Events:

order:create
    │
    ├──► kitchen:notify (Real-time)
    │
    ├──► inventory:deduct (Async)
    │
    ├──► analytics:track (Async)
    │
    └──► customer:log (Async)

Event Handlers:
- Synchronous: Critical path (order creation)
- Asynchronous: Non-blocking (analytics, logs)
```

## 4. Security Architecture

### 4.1 Authentication Flow

```
┌──────────┐
│  Login   │
└────┬─────┘
     │
     ▼
┌─────────────────┐
│ POST /api/login │
└────┬────────────┘
     │
     ▼
┌──────────────────┐         ┌──────────┐
│ Verify Password  │────────►│   JWT    │
│   (bcrypt)       │         │  Token   │
└──────────────────┘         └────┬─────┘
                                  │
                                  ▼
                       ┌──────────────────────┐
                       │ Access Token (15m)   │
                       │ Refresh Token (7d)   │
                       └──────────────────────┘
```

**JWT Payload:**
```json
{
  "userId": "uuid",
  "email": "user@example.com",
  "role": "admin|staff|customer",
  "branchId": "branch_uuid",
  "iat": 1234567890,
  "exp": 1234567890
}
```

### 4.2 Authorization (RBAC)

```
Roles & Permissions Matrix:

┌──────────┬─────────┬─────────┬──────────┬───────────┐
│ Resource │ Customer│  Staff  │  Manager │ Super Admin│
├──────────┼─────────┼─────────┼──────────┼───────────┤
│ Menu     │  Read   │ Read    │ CRUD     │   CRUD    │
│ Order    │  Create │ CRUD    │ CRUD     │   CRUD    │
│ Table    │  Read   │ Update  │ CRUD     │   CRUD    │
│ Branch   │  -      │ Read    │ Update   │   CRUD    │
│ Analytics│  -      │ Read    │ Read     │   CRUD    │
│ Settings │  -      │ -       │ Update   │   CRUD    │
└──────────┴─────────┴─────────┴──────────┴───────────┘
```

## 5. Scalability Considerations

### 5.1 Horizontal Scaling

```
                    ┌─────────────┐
                    │   Nginx LB  │
                    └──────┬──────┘
                           │
        ┌──────────────────┼──────────────────┐
        ▼                  ▼                  ▼
┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│   Node.js    │   │   Node.js    │   │   Node.js    │
│  Instance 1  │   │  Instance 2  │   │  Instance 3  │
└──────────────┘   └──────────────┘   └──────────────┘
        │                  │                  │
        └──────────────────┼──────────────────┘
                           ▼
                  ┌─────────────────┐
                  │  Redis Cluster  │
                  │  (Session Sync) │
                  └─────────────────┘
```

### 5.2 Database Optimization

**Read Replicas:**
```
┌─────────────┐
│   Master    │ (Writes)
│   MySQL     │
└──────┬──────┘
       │
       │ Replication
       │
       ├──────────────┬──────────────┐
       ▼              ▼              ▼
┌────────────┐ ┌────────────┐ ┌────────────┐
│  Replica 1 │ │  Replica 2 │ │  Replica 3 │
│  (Reads)   │ │  (Reads)   │ │  (Reads)   │
└────────────┘ └────────────┘ └────────────┘
```

**Indexing Strategy:**
- `products(category_id, status, created_at)`
- `orders(table_id, status, created_at)`
- `customers(phone_number)` - UNIQUE
- `activity_logs(customer_id, action_type, timestamp)`

## 6. Monitoring & Observability

### 6.1 Logging Strategy

```
Application Logs → Winston → File System
                            └→ ELK Stack (Optional)

Log Levels:
- ERROR: Critical failures
- WARN: Degraded performance
- INFO: Business events
- DEBUG: Development only
```

### 6.2 Metrics to Track

**Business Metrics:**
- Orders per minute
- Average order value
- Conversion rate (menu view → order)
- Table turnover time

**Technical Metrics:**
- API response time (p50, p95, p99)
- Database query time
- Socket.io connection count
- Cache hit ratio
- Error rate

**Alert Thresholds:**
- Response time > 500ms
- Error rate > 1%
- Database connections > 80% capacity
- Redis memory > 90%

## 7. Disaster Recovery

### 7.1 Backup Strategy

```
Daily:    Full database backup → AWS S3
Hourly:   Incremental backup → Local storage
Real-time: Binary logs enabled (Point-in-time recovery)
```

### 7.2 Failover Plan

```
Primary Region Failure:
    1. DNS failover to backup region (< 60s)
    2. Promote read replica to master
    3. Update application config
    4. Verify data consistency
```

## 8. Technology Stack Justification

| Technology | Why Chosen |
|-----------|-----------|
| **Node.js** | Non-blocking I/O for real-time; JavaScript fullstack |
| **Next.js** | SSR for SEO; excellent mobile performance |
| **MySQL** | ACID compliance; complex queries; proven reliability |
| **Redis** | In-memory speed; pub/sub for real-time |
| **Socket.io** | Fallback mechanisms; broad browser support |
| **Docker** | Environment consistency; easy deployment |

## 9. Development Workflow

```
┌──────────────┐
│   Feature    │
│   Branch     │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│   Local Dev  │
│   (Docker)   │
└──────┬───────┘
       │
       ▼
┌──────────────┐     Pass     ┌──────────────┐
│  CI Pipeline │─────────────►│  Staging     │
│  (Tests)     │              │  Environment │
└──────────────┘              └──────┬───────┘
       │                             │
       │ Fail                        │
       ▼                             ▼
┌──────────────┐              ┌──────────────┐
│  Fix & Push  │              │  Production  │
└──────────────┘              │  (Manual)    │
                              └──────────────┘
```

---

## 10. Performance Targets

| Metric | Target | Measurement |
|--------|--------|-------------|
| API Response Time | < 200ms | p95 |
| Socket Event Latency | < 100ms | p99 |
| Page Load Time | < 2s | LCP |
| Database Query | < 50ms | Average |
| Uptime | 99.9% | Monthly |
| Cache Hit Ratio | > 80% | Daily average |
| Concurrent Users | 10,000+ | Peak load |

## 11. API Design

### 11.1 RESTful API Conventions

**Base URL:** `https://api.example.com/v1`

**HTTP Methods:**
- `GET` - Retrieve resources
- `POST` - Create resources
- `PUT` - Full update
- `PATCH` - Partial update
- `DELETE` - Remove resources

**Response Format:**
```json
{
  "success": true,
  "data": {},
  "message": "Operation successful",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

**Error Response:**
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message",
    "details": {}
  },
  "timestamp": "2024-01-01T00:00:00Z"
}
```

### 11.2 Core API Endpoints

**Authentication:**
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/refresh` - Refresh token
- `POST /api/v1/auth/logout` - User logout

**Menu & Products:**
- `GET /api/v1/menu` - Get menu by branch
- `GET /api/v1/products/:id` - Get product details
- `GET /api/v1/categories` - Get categories

**Orders:**
- `POST /api/v1/orders` - Create order
- `GET /api/v1/orders/:id` - Get order details
- `PATCH /api/v1/orders/:id/status` - Update order status
- `GET /api/v1/orders` - List orders (with filters)

**Tables:**
- `GET /api/v1/tables/:id` - Get table info
- `GET /api/v1/tables` - List tables
- `PATCH /api/v1/tables/:id/status` - Update table status

**Admin:**
- `GET /api/v1/admin/dashboard/stats` - Dashboard statistics
- `GET /api/v1/admin/analytics/revenue` - Revenue analytics
- `POST /api/v1/admin/products` - Create product
- `PUT /api/v1/admin/products/:id` - Update product

### 11.3 WebSocket Events

**Client → Server:**
- `order:create` - Create new order
- `order:subscribe` - Subscribe to order updates
- `table:join` - Join table room

**Server → Client:**
- `order:status_update` - Order status changed
- `kitchen:new_order` - New order for kitchen
- `table:status_update` - Table status changed
- `notification:new` - New notification

## 12. Database Schema Overview

### 12.1 Core Tables

**users**
- `id` (UUID, PK)
- `email` (String, Unique)
- `password_hash` (String)
- `role` (Enum: admin, manager, staff, customer)
- `branch_id` (UUID, FK)
- `created_at`, `updated_at`

**branches**
- `id` (UUID, PK)
- `name` (String)
- `address` (String)
- `phone` (String)
- `status` (Enum: active, inactive)
- `created_at`, `updated_at`

**tables**
- `id` (UUID, PK)
- `branch_id` (UUID, FK)
- `table_number` (Integer)
- `qr_code` (String, Unique)
- `status` (Enum: available, occupied, reserved, cleaning)
- `capacity` (Integer)
- `created_at`, `updated_at`

**products**
- `id` (UUID, PK)
- `branch_id` (UUID, FK)
- `category_id` (UUID, FK)
- `name` (String)
- `description` (Text)
- `price` (Decimal)
- `image_url` (String)
- `status` (Enum: active, inactive, out_of_stock)
- `created_at`, `updated_at`

**orders**
- `id` (UUID, PK)
- `table_id` (UUID, FK)
- `customer_id` (UUID, FK, nullable)
- `status` (Enum: pending, confirmed, preparing, ready, served, completed, cancelled)
- `total_amount` (Decimal)
- `payment_status` (Enum: pending, paid, refunded)
- `created_at`, `updated_at`

**order_items**
- `id` (UUID, PK)
- `order_id` (UUID, FK)
- `product_id` (UUID, FK)
- `quantity` (Integer)
- `price` (Decimal)
- `notes` (Text, nullable)
- `created_at`

### 12.2 Relationships

```
branches (1) ──< (N) tables
branches (1) ──< (N) products
branches (1) ──< (N) users
tables (1) ──< (N) orders
orders (1) ──< (N) order_items
products (1) ──< (N) order_items
users (1) ──< (N) orders (as customer)
```

## 13. Error Handling

### 13.1 Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `AUTH_REQUIRED` | 401 | Authentication required |
| `AUTH_INVALID` | 401 | Invalid credentials |
| `AUTH_EXPIRED` | 401 | Token expired |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `VALIDATION_ERROR` | 400 | Request validation failed |
| `CONFLICT` | 409 | Resource conflict |
| `RATE_LIMIT` | 429 | Too many requests |
| `SERVER_ERROR` | 500 | Internal server error |
| `SERVICE_UNAVAILABLE` | 503 | Service temporarily unavailable |

### 13.2 Error Handling Flow

```
Request → Validation → Business Logic → Database
   │           │              │              │
   │           ▼              ▼              ▼
   │      Validation    Business Error   DB Error
   │         Error
   │           │              │              │
   └───────────┴──────────────┴──────────────┘
                      │
                      ▼
              Error Handler Middleware
                      │
                      ▼
              Formatted Error Response
```

## 14. Deployment Architecture

### 14.1 Production Environment

```
┌─────────────────────────────────────────┐
│         Cloud Provider (AWS/Azure)      │
├─────────────────────────────────────────┤
│                                         │
│  ┌──────────────┐    ┌──────────────┐   │
│  │  Load        │    │  CDN         │   │
│  │  Balancer    │    │  (Static)    │   │
│  └──────────────┘    └──────────────┘   |
|         │                               │
│         ▼                               │
│  ┌──────────────────────────────────┐   │
│  │    Application Servers (ECS/K8s) │   │
│  │  ┌──────────┐  ┌──────────┐      │   │
│  │  │  Node    │  │  │  Node │      │   │
│  │  │  App 1   │  │  │  App 2│      │   │
│  │  └──────────┘  └──────────┘      │   │
│  └──────────────────────────────────┘   │
│         │                               │
│         ▼                               │
│  ┌──────────────────────────────────┐   │
│  │    Database Layer                │   │
│  │  ┌──────────┐  ┌──────────────┐  │   │
│  │  │  MySQL   │  │  Redis       │  │   │
│  │  │  (RDS)   │  │ (ElastiCache)│  │   |
│  │  └──────────┘  └──────────────┘  │   │
│  └──────────────────────────────────┘   │
│                                         │
│  ┌──────────────────────────────────┐   │
│  │    Monitoring & Logging          │   │
│  │  - CloudWatch / Application      │   │
│  │  - ELK Stack (Optional)          │   │
│  └──────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

### 14.2 Container Strategy

**Docker Images:**
- `app:latest` - Application server
- `nginx:latest` - Reverse proxy
- `mysql:8.0` - Database (dev only)
- `redis:7-alpine` - Cache (dev only)

**Docker Compose (Development):**
```yaml
services:
  app:
    build: ./backend
    ports: ["3000:3000"]
    environment:
      - NODE_ENV=development
      - DATABASE_URL=mysql://...
      - REDIS_URL=redis://...
  
  nginx:
    image: nginx:alpine
    ports: ["80:80", "443:443"]
    volumes: ["./nginx.conf:/etc/nginx/nginx.conf"]
  
  mysql:
    image: mysql:8.0
    environment:
      - MYSQL_ROOT_PASSWORD=...
      - MYSQL_DATABASE=restaurant_db
  
  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]
```

## 15. Testing Strategy

### 15.1 Testing Pyramid

```
        ┌──────────┐
        │   E2E    │  (10%)
        │   Tests  │
        ├──────────┤
       │ Integration│  (20%)
       │   Tests    │
       ├──────────┤
      │    Unit     │  (70%)
      │    Tests    │
      └──────────┘
```

### 15.2 Test Coverage Targets

- **Unit Tests:** > 80% coverage
- **Integration Tests:** Critical paths covered
- **E2E Tests:** Main user flows

### 15.3 Testing Tools

- **Unit:** Jest, Mocha
- **Integration:** Supertest, Jest
- **E2E:** Playwright, Cypress
- **Load Testing:** Artillery, k6

## 16. API Versioning Strategy

### 16.1 Versioning Approach

**URL-based versioning:**
- `/api/v1/orders`
- `/api/v2/orders` (future)

**Version Lifecycle:**
- v1: Current stable
- v2: Beta (when needed)
- Deprecation: 6 months notice before removal

### 16.2 Backward Compatibility

- New fields: Optional, non-breaking
- Removed fields: Deprecation period
- Changed behavior: New endpoint version

## 17. Data Migration Strategy

### 17.1 Migration Process

```
1. Schema Migration Scripts
   ↓
2. Data Migration (if needed)
   ↓
3. Validation & Testing
   ↓
4. Rollback Plan Ready
   ↓
5. Deploy to Staging
   ↓
6. Verify & Test
   ↓
7. Deploy to Production
   ↓
8. Monitor & Validate
```

### 17.2 Migration Tools

- **Database:** Knex.js migrations
- **Version Control:** Git-tracked migration files
- **Rollback:** Automatic rollback on failure

---

## Tài liệu tham khảo

- [REST API Best Practices](https://restfulapi.net/)
- [WebSocket Protocol](https://tools.ietf.org/html/rfc6455)
- [JWT Specification](https://tools.ietf.org/html/rfc7519)
- [Docker Documentation](https://docs.docker.com/)
- [MySQL Performance Tuning](https://dev.mysql.com/doc/refman/8.0/en/optimization.html)