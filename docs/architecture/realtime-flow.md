# Real-time Communication Flow (Socket.io)

## Connection Architecture

```
Client (Browser)
    │
    │ WebSocket Handshake
    ▼
┌──────────────────┐
│  Socket.io       │
│  Server          │
│  (Node.js)       │
└────────┬─────────┘
         │
         ├──► Room: table-{table_id}
         ├──► Room: kitchen-{branch_id}
         ├──► Room: customer-{customer_id}
         └──► Room: admin-{branch_id}
```

## Events Specification

### 1. Connection Events

#### connect
Khi client kết nối thành công

**Client → Server:**
```javascript
socket.on('connect', () => {
  console.log('Connected:', socket.id);
});
```

#### join_room
Client tham gia room cụ thể

**Client → Server:**
```javascript
socket.emit('join_room', {
  type: 'table' | 'kitchen' | 'admin',
  id: 'table-uuid' | 'branch-uuid',
  userId: 'user-uuid' // Optional
});
```

**Server Response:**
```javascript
socket.emit('room_joined', {
  room: 'table-abc123',
  message: 'Successfully joined room'
});
```

---

### 2. Order Events

#### order:create
Khách hàng tạo đơn hàng mới

**Client → Server:**
```javascript
socket.emit('order:create', {
  tableId: 'table-uuid',
  customerId: 'cust-uuid' | null,
  items: [
    {
      productId: 'prod-1',
      quantity: 2,
      notes: 'Không hành'
    }
  ]
});
```

**Server Processing:**
1. Validate dữ liệu
2. Lưu vào database
3. Broadcast tới kitchen
4. Response cho client

**Server → Kitchen:**
```javascript
io.to('kitchen-branch123').emit('kitchen:new_order', {
  orderId: 'order-uuid',
  orderNumber: 'ORD-20250115-0124',
  tableNumber: 'A01',
  items: [
    {
      productName: 'Phở Bò Tái',
      quantity: 2,
      notes: 'Không hành',
      status: 'pending'
    }
  ],
  priority: 'normal',
  timestamp: '2025-01-15T10:30:00Z'
});
```

**Server → Client:**
```javascript
socket.emit('order:created', {
  success: true,
  orderId: 'order-uuid',
  orderNumber: 'ORD-20250115-0124',
  estimatedTime: 25
});
```

---

#### order:status_update
Cập nhật trạng thái đơn hàng

**Kitchen → Server:**
```javascript
socket.emit('order:status_update', {
  orderId: 'order-uuid',
  newStatus: 'preparing' | 'ready' | 'served',
  itemId: 'item-uuid' | null // Nếu update từng món
});
```

**Server → Customer Table:**
```javascript
io.to('table-abc123').emit('order:status_changed', {
  orderId: 'order-uuid',
  status: 'preparing',
  message: 'Your order is being prepared',
  timestamp: '2025-01-15T10:32:00Z'
});
```

**Server → Admin Dashboard:**
```javascript
io.to('admin-branch123').emit('order:updated', {
  orderId: 'order-uuid',
  status: 'preparing',
  tableNumber: 'A01'
});
```

---

#### order:cancel
Hủy đơn hàng

**Client/Staff → Server:**
```javascript
socket.emit('order:cancel', {
  orderId: 'order-uuid',
  reason: 'Customer requested'
});
```

**Server → All relevant rooms:**
```javascript
// To customer
io.to('table-abc123').emit('order:cancelled', {
  orderId: 'order-uuid',
  message: 'Your order has been cancelled'
});

// To kitchen
io.to('kitchen-branch123').emit('kitchen:order_cancelled', {
  orderId: 'order-uuid',
  tableNumber: 'A01'
});
```

---

### 3. Kitchen Events

#### kitchen:item_ready
Món ăn đã sẵn sàng

**Kitchen → Server:**
```javascript
socket.emit('kitchen:item_ready', {
  orderId: 'order-uuid',
  itemId: 'item-uuid'
});
```

**Server → Staff:**
```javascript
io.to('staff-branch123').emit('kitchen:serve_notification', {
  orderId: 'order-uuid',
  tableNumber: 'A01',
  itemName: 'Phở Bò Tái',
  message: 'Ready to serve'
});
```

---

### 4. Table Events

#### table:status_change
Thay đổi trạng thái bàn

**Staff → Server:**
```javascript
socket.emit('table:status_change', {
  tableId: 'table-uuid',
  newStatus: 'available' | 'occupied' | 'reserved' | 'cleaning'
});
```

**Server → Admin:**
```javascript
io.to('admin-branch123').emit('table:updated', {
  tableId: 'table-uuid',
  tableNumber: 'A01',
  status: 'available',
  timestamp: '2025-01-15T11:00:00Z'
});
```

---

### 5. Notification Events

#### notification:push
Gửi thông báo real-time

**Server → Client:**
```javascript
socket.emit('notification:push', {
  type: 'success' | 'info' | 'warning' | 'error',
  title: 'Order Confirmed',
  message: 'Your order has been sent to kitchen',
  action: {
    label: 'View Order',
    link: '/orders/order-uuid'
  },
  duration: 5000 // milliseconds
});
```

---

### 6. Analytics Events (Optional)

#### analytics:live_update
Cập nhật số liệu real-time cho dashboard

**Server → Admin:**
```javascript
setInterval(() => {
  io.to('admin-branch123').emit('analytics:live_update', {
    activeOrders: 12,
    revenueToday: 5000000,
    newCustomers: 5,
    avgOrderValue: 150000
  });
}, 30000); // Every 30 seconds
```

---

## Client Implementation Examples

### React Hook for Socket.io

```javascript
import { useEffect, useState } from 'react';
import io from 'socket.io-client';

export const useSocket = (url, options = {}) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const newSocket = io(url, {
      transports: ['websocket', 'polling'],
      ...options
    });

    newSocket.on('connect', () => {
      setConnected(true);
      setError(null);
    });

    newSocket.on('disconnect', () => {
      setConnected(false);
    });

    newSocket.on('connect_error', (err) => {
      setError(err);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [url]);

  return { socket, connected, error };
};
```

### Join Room Example

```javascript
const { socket } = useSocket('http://localhost:5000');

useEffect(() => {
  if (socket && tableId) {
    socket.emit('join_room', {
      type: 'table',
      id: tableId
    });

    socket.on('room_joined', (data) => {
      console.log('Joined room:', data.room);
    });
  }
}, [socket, tableId]);
```

### Listen to Order Updates

```javascript
useEffect(() => {
  if (socket) {
    socket.on('order:status_changed', (data) => {
      console.log('Order status:', data.status);
      // Update UI
      setOrderStatus(data.status);
    });

    return () => {
      socket.off('order:status_changed');
    };
  }
}, [socket]);
```

---

## Server Implementation

### Socket.io Server Setup

```javascript
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const redisAdapter = require('socket.io-redis');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN.split(','),
    methods: ['GET', 'POST']
  }
});

// Redis adapter for scaling
io.adapter(redisAdapter({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT
}));

// Connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // Join room
  socket.on('join_room', async (data) => {
    const { type, id } = data;
    const room = `${type}-${id}`;
    
    await socket.join(room);
    socket.emit('room_joined', { room });
  });

  // Order creation
  socket.on('order:create', async (orderData) => {
    try {
      // Save to database
      const order = await createOrder(orderData);
      
      // Notify kitchen
      io.to(`kitchen-${order.branchId}`).emit('kitchen:new_order', order);
      
      // Confirm to customer
      socket.emit('order:created', {
        success: true,
        orderId: order.id,
        orderNumber: order.orderNumber
      });
    } catch (error) {
      socket.emit('order:error', { message: error.message });
    }
  });

  // Order status update
  socket.on('order:status_update', async (data) => {
    const { orderId, newStatus } = data;
    
    // Update database
    await updateOrderStatus(orderId, newStatus);
    
    // Get order details
    const order = await getOrderById(orderId);
    
    // Notify customer table
    io.to(`table-${order.tableId}`).emit('order:status_changed', {
      orderId,
      status: newStatus
    });
    
    // Notify admin
    io.to(`admin-${order.branchId}`).emit('order:updated', {
      orderId,
      status: newStatus
    });
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

server.listen(5000, () => {
  console.log('Socket.io server running on port 5000');
});
```

---

## Error Handling

### Connection Retry

```javascript
const socket = io('http://localhost:5000', {
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  reconnectionAttempts: Infinity
});

socket.on('reconnect_attempt', () => {
  console.log('Attempting to reconnect...');
});

socket.on('reconnect', (attemptNumber) => {
  console.log('Reconnected after', attemptNumber, 'attempts');
});
```

### Error Events

```javascript
socket.on('error', (error) => {
  console.error('Socket error:', error);
});

socket.on('connect_error', (error) => {
  console.error('Connection error:', error);
  // Show user-friendly message
});
```

---

## Performance Optimization

### Room Management

```javascript
// Leave unused rooms
socket.on('disconnect', () => {
  socket.rooms.forEach(room => {
    socket.leave(room);
  });
});
```

### Event Throttling

```javascript
// Throttle frequent events
const throttle = require('lodash.throttle');

const updateOrderStatus = throttle((data) => {
  socket.emit('order:status_update', data);
}, 1000); // Max once per second
```

### Compression

```javascript
const io = new Server(server, {
  compression: true, // Enable compression
  perMessageDeflate: true
});
```

---

## Security Considerations

### Authentication

```javascript
io.use(async (socket, next) => {
  const token = socket.handshake.auth.token;
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.userId;
    socket.role = decoded.role;
    next();
  } catch (error) {
    next(new Error('Authentication failed'));
  }
});
```

### Rate Limiting

```javascript
const rateLimit = require('socket.io-rate-limit');

io.use(rateLimit({
  windowMs: 60000, // 1 minute
  max: 100 // Max 100 events per minute
}));
```

---

## Testing

### Unit Test Example

```javascript
const { createServer } = require('http');
const { Server } = require('socket.io');
const Client = require('socket.io-client');

describe('Socket.io Events', () => {
  let io, serverSocket, clientSocket;

  beforeAll((done) => {
    const httpServer = createServer();
    io = new Server(httpServer);
    httpServer.listen(() => {
      const port = httpServer.address().port;
      clientSocket = new Client(`http://localhost:${port}`);
      io.on('connection', (socket) => {
        serverSocket = socket;
      });
      clientSocket.on('connect', done);
    });
  });

  afterAll(() => {
    io.close();
    clientSocket.close();
  });

  test('should join room', (done) => {
    clientSocket.emit('join_room', { type: 'table', id: '123' });
    serverSocket.on('join_room', (data) => {
      expect(data.type).toBe('table');
      expect(data.id).toBe('123');
      done();
    });
  });
});
```

---

## Monitoring

### Connection Metrics

```javascript
io.on('connection', (socket) => {
  // Track connections
  metrics.increment('socket.connections');
  
  socket.on('disconnect', () => {
    metrics.decrement('socket.connections');
  });
});
```

### Event Tracking

```javascript
socket.onAny((eventName, ...args) => {
  console.log(`Event: ${eventName}`, args);
  // Log to analytics
  analytics.track('socket_event', {
    event: eventName,
    socketId: socket.id
  });
});
```

---

## References

- [Socket.io Documentation](https://socket.io/docs/v4/)
- [Socket.io Redis Adapter](https://github.com/socketio/socket.io-redis)
- [WebSocket Protocol](https://tools.ietf.org/html/rfc6455)

