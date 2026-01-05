```markdown
# API Design Specification

## Base URL
```
Development: http://localhost:5000/api/v1
Production:  https://api.qrorder.vn/api/v1
```

## Authentication

### Headers
```http
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
X-Branch-ID: <branch_uuid> (Required for some endpoints)
```

## Standard Response Format

### Success Response
```json
{
  "success": true,
  "data": {
    // Response data
  },
  "message": "Operation successful",
  "timestamp": "2025-01-15T10:30:00Z"
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "PRODUCT_NOT_FOUND",
    "message": "Product with ID xyz not found",
    "details": {}
  },
  "timestamp": "2025-01-15T10:30:00Z"
}
```

## API Endpoints

### 1. Authentication

#### POST /auth/login
Đăng nhập hệ thống

**Request Body:**
```json
{
  "email": "admin@restaurant.com",
  "password": "SecurePassword123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "user-uuid",
      "email": "admin@restaurant.com",
      "name": "Admin User",
      "role": "admin",
      "branchId": "branch-uuid"
    }
  }
}
```

#### POST /auth/refresh
Làm mới access token

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

#### POST /auth/logout
Đăng xuất

**Headers:** `Authorization: Bearer <token>`

---

### 2. Products (Món ăn)

#### GET /products
Lấy danh sách món ăn

**Query Parameters:**
- `category` (optional): Filter by category ID
- `status` (optional): `available`, `out_of_stock`
- `search` (optional): Search by name
- `page` (default: 1)
- `limit` (default: 20)
- `sort` (default: `name`): `name`, `price`, `sold_count`, `rating`

**Example Request:**
```http
GET /products?category=cat-uuid&status=available&page=1&limit=20
```

**Response:**
```json
{
  "success": true,
  "data": {
    "products": [
      {
        "id": "prod-uuid-1",
        "categoryId": "cat-uuid",
        "categoryName": "Main Course",
        "name": "Phở Bò Tái",
        "description": "Traditional Vietnamese beef noodle soup",
        "price": 65000,
        "costPrice": 35000,
        "imageUrl": "https://cdn.example.com/pho-bo.jpg",
        "preparationTime": 15,
        "calories": 450,
        "isSpicy": false,
        "isVegetarian": false,
        "tags": ["best-seller", "signature"],
        "status": "available",
        "soldCount": 1523,
        "rating": 4.8
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 156,
      "totalPages": 8
    }
  }
}
```

#### GET /products/:id
Lấy chi tiết món ăn

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "prod-uuid-1",
    "name": "Phở Bò Tái",
    "price": 65000,
    "ingredients": [
      {"name": "Beef", "quantity": 200, "unit": "gram"},
      {"name": "Rice Noodles", "quantity": 300, "unit": "gram"}
    ],
    "reviews": [],
    "relatedProducts": []
  }
}
```

#### POST /products
Tạo món ăn mới (Admin only)

**Request Body:**
```json
{
  "categoryId": "cat-uuid",
  "name": "Bún Chả Hà Nội",
  "description": "Grilled pork with rice noodles",
  "price": 55000,
  "costPrice": 30000,
  "imageUrl": "https://cdn.example.com/bun-cha.jpg",
  "preparationTime": 20,
  "isSpicy": false,
  "isVegetarian": false
}
```

#### PUT /products/:id
Cập nhật món ăn

#### DELETE /products/:id
Xóa món ăn (Soft delete)

---

### 3. Categories (Danh mục)

#### GET /categories
Lấy danh sách danh mục

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "cat-uuid-1",
      "name": "Appetizers",
      "icon": "🥗",
      "displayOrder": 1,
      "productCount": 12
    },
    {
      "id": "cat-uuid-2",
      "name": "Main Course",
      "icon": "🍜",
      "displayOrder": 2,
      "productCount": 35
    }
  ]
}
```

---

### 4. Tables (Bàn ăn)

#### GET /tables
Lấy danh sách bàn

**Query Parameters:**
- `branchId` (required)
- `status` (optional): `available`, `occupied`, `reserved`
- `floor` (optional): Floor number

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "table-uuid-1",
      "branchId": "branch-uuid",
      "tableNumber": "A01",
      "capacity": 4,
      "qrCode": "https://api.qrserver.com/v1/...",
      "floorNumber": 1,
      "zone": "Regular",
      "status": "available"
    }
  ]
}
```

#### GET /tables/:id
Lấy thông tin bàn và đơn hàng đang active

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "table-uuid-1",
    "tableNumber": "A01",
    "status": "occupied",
    "currentOrder": {
      "id": "order-uuid",
      "orderNumber": "ORD-20250115-0123",
      "items": [],
      "total": 250000,
      "status": "preparing"
    }
  }
}
```

#### POST /tables/generate-qr
Tạo mã QR cho bàn

**Request Body:**
```json
{
  "tableId": "table-uuid-1"
}
```

---

### 5. Orders (Đơn hàng)

#### POST /orders
Tạo đơn hàng mới

**Request Body:**
```json
{
  "tableId": "table-uuid-1",
  "customerId": "cust-uuid" | null,
  "items": [
    {
      "productId": "prod-uuid-1",
      "quantity": 2,
      "notes": "Không hành"
    },
    {
      "productId": "prod-uuid-2",
      "quantity": 1
    }
  ],
  "notes": "Gọi cơm trước"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "orderId": "order-uuid",
    "orderNumber": "ORD-20250115-0124",
    "tableNumber": "A01",
    "subtotal": 185000,
    "discount": 0,
    "tax": 18500,
    "total": 203500,
    "status": "pending",
    "estimatedTime": 25
  }
}
```

#### GET /orders/:id
Lấy chi tiết đơn hàng

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "order-uuid",
    "orderNumber": "ORD-20250115-0124",
    "table": {
      "id": "table-uuid",
      "tableNumber": "A01"
    },
    "customer": {
      "id": "cust-uuid",
      "name": "Nguyễn Văn A",
      "phone": "0912345678"
    },
    "items": [
      {
        "id": "item-uuid-1",
        "productName": "Phở Bò Tái",
        "quantity": 2,
        "unitPrice": 65000,
        "subtotal": 130000,
        "status": "preparing",
        "notes": "Không hành"
      }
    ],
    "subtotal": 185000,
    "discount": 0,
    "tax": 18500,
    "total": 203500,
    "paymentStatus": "pending",
    "orderStatus": "confirmed",
    "createdAt": "2025-01-15T10:30:00Z",
    "timeline": [
      {
        "status": "pending",
        "timestamp": "2025-01-15T10:30:00Z"
      },
      {
        "status": "confirmed",
        "timestamp": "2025-01-15T10:30:30Z"
      }
    ]
  }
}
```

#### PUT /orders/:id/status
Cập nhật trạng thái đơn hàng (Kitchen/Staff)

**Request Body:**
```json
{
  "status": "preparing" | "ready" | "served" | "completed" | "cancelled",
  "notes": "Optional cancellation reason"
}
```

#### PUT /orders/:id/items/:itemId/status
Cập nhật trạng thái món trong đơn

**Request Body:**
```json
{
  "status": "preparing" | "ready" | "served"
}
```

#### POST /orders/:id/payment
Thanh toán đơn hàng

**Request Body:**
```json
{
  "paymentMethod": "cash" | "card" | "vnpay" | "momo",
  "discountCode": "NEWYEAR2025" | null,
  "loyaltyPoints": 0
}
```

---

### 6. Customers (Khách hàng)

#### GET /customers
Lấy danh sách khách hàng (Admin)

**Query Parameters:**
- `segment` (optional): Filter by segment
- `search` (optional): Search by phone/name
- `sortBy` (default: `totalSpent`): `name`, `totalSpent`, `lastOrderDate`

#### GET /customers/:id
Lấy hồ sơ khách hàng

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "cust-uuid",
    "phone": "0912345678",
    "name": "Nguyễn Văn A",
    "email": "customer@example.com",
    "segment": {
      "id": "seg-vip",
      "name": "VIP",
      "color": "#FFD700",
      "discountPercentage": 10
    },
    "stats": {
      "totalOrders": 45,
      "totalSpent": 12500000,
      "avgOrderValue": 277778,
      "lastOrderDate": "2025-01-10T15:30:00Z"
    },
    "loyaltyPoints": 1250,
    "tier": "gold",
    "favoriteProducts": [
      {"id": "prod-1", "name": "Phở Bò", "orderCount": 12}
    ]
  }
}
```

#### POST /customers
Tạo/Cập nhật khách hàng (First-time QR scan)

**Request Body:**
```json
{
  "phone": "0912345678",
  "name": "Nguyễn Văn A",
  "email": "customer@example.com"
}
```

---

### 7. Analytics (Phân tích)

#### GET /analytics/dashboard
Lấy dữ liệu dashboard tổng quan

**Query Parameters:**
- `branchId` (optional): Specific branch or all
- `startDate`: ISO 8601 date
- `endDate`: ISO 8601 date

**Response:**
```json
{
  "success": true,
  "data": {
    "revenue": {
      "total": 125000000,
      "growth": 15.3,
      "comparedToPrevious": 108000000
    },
    "orders": {
      "total": 1523,
      "avgOrderValue": 82000,
      "completionRate": 98.5
    },
    "customers": {
      "new": 234,
      "returning": 1289,
      "retentionRate": 84.6
    },
    "topProducts": [
      {
        "id": "prod-1",
        "name": "Phở Bò",
        "soldCount": 456,
        "revenue": 29640000
      }
    ]
  }
}
```

#### GET /analytics/heatmap
Lấy dữ liệu heatmap theo giờ

**Response:**
```json
{
  "success": true,
  "data": {
    "heatmap": [
      {
        "day": "Monday",
        "hours": [
          {"hour": 8, "orderCount": 5, "revenue": 250000},
          {"hour": 9, "orderCount": 12, "revenue": 650000},
          {"hour": 12, "orderCount": 45, "revenue": 3200000}
        ]
      }
    ]
  }
}
```

#### GET /analytics/menu-matrix
Ma trận BCG cho menu (Admin)

**Response:**
```json
{
  "success": true,
  "data": {
    "stars": [
      {
        "productId": "prod-1",
        "name": "Phở Bò",
        "soldCount": 456,
        "profitMargin": 46.15,
        "revenue": 29640000
      }
    ],
    "cashCows": [],
    "questionMarks": [],
    "dogs": []
  }
}
```

---

### 8. Segments (Phân khúc khách hàng)

#### GET /segments
Lấy danh sách phân khúc

#### POST /segments/:id/customers
Tự động phân loại khách hàng vào segment

---

### 9. Recommendations (Gợi ý món)

#### GET /recommendations/customer/:customerId
Gợi ý món cho khách hàng cụ thể (AI-powered)

**Response:**
```json
{
  "success": true,
  "data": {
    "recommendations": [
      {
        "productId": "prod-5",
        "name": "Bún Chả",
        "reason": "Based on your previous orders",
        "confidence": 0.87
      }
    ]
  }
}
```

#### GET /recommendations/upsell
Gợi ý món kèm (Cross-sell)

**Query Parameters:**
- `productId`: Product being viewed

---

### 10. Notifications

#### POST /notifications/send
Gửi thông báo qua Zalo ZNS (Admin)

**Request Body:**
```json
{
  "customerId": "cust-uuid",
  "templateId": "welcome_new_customer",
  "data": {
    "customerName": "Nguyễn Văn A",
    "voucherCode": "WELCOME10"
  }
}
```

---

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `AUTH_REQUIRED` | 401 | Missing or invalid token |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `VALIDATION_ERROR` | 400 | Invalid request data |
| `DUPLICATE_ENTRY` | 409 | Resource already exists |
| `OUT_OF_STOCK` | 400 | Product unavailable |
| `TABLE_OCCUPIED` | 400 | Table already has active order |
| `PAYMENT_FAILED` | 402 | Payment processing error |
| `RATE_LIMIT` | 429 | Too many requests |
| `SERVER_ERROR` | 500 | Internal server error |

---

## Rate Limiting

```
General endpoints: 100 requests/minute per IP
Authentication:    10 requests/minute per IP
Order creation:    30 requests/minute per customer
```

---

## Webhooks (Optional)

### POST /webhooks/payment
Nhận callback từ VNPay/Momo

### POST /webhooks/zalo
Nhận callback từ Zalo ZNS
```

---

## Real-time Communication

Xem chi tiết tại: [Real-time Flow Documentation](./realtime-flow.md)