# API Endpoint Structure

## Auth & Users

- `POST /api/user/register` - Register new user
- `POST /api/user/login` - Login
- `POST /api/user/admin-login` - Admin/Staff login
- `GET /api/user/profile` - Get current user profile (Auth required)

## Branches

- `GET /api/branch/list` - Public list of active branches
- `POST /api/branch/add` - Create branch (Admin only)
- `PUT /api/branch/:id` - Update branch (Admin/Manager)
- `DELETE /api/branch/:id` - Delete branch (Admin only)

## Tables

- `GET /api/table/list/:branchId` - List tables for a branch
- `POST /api/table/add` - Add table (Manager/Admin)
- `GET /api/table/qr/:id` - Generate/Get QR code for table

## Food & Menu

- `GET /api/food/list` - List all food
- `POST /api/food/add` - Add food (Admin/Manager)
- `POST /api/food/remove` - Remove food (Admin/Manager)
- `POST /api/food/availability` - Toggle availability (Kitchen/Manager)
- `GET /api/category/list` - List categories

## Orders

- `POST /api/order/place` - Place new order (supports Table/Branch context)
- `POST /api/order/verify` - Verify Stripe payment
- `GET /api/order/userorders` - Get history for customer
- `GET /api/order/list` - List all orders (filtered by Branch for staff)
- `POST /api/order/status` - Update order status (Kitchen/Waiter flow)

## Cart

- `POST /api/cart/add` - Add item to cart
- `POST /api/cart/remove` - Remove item from cart
- `POST /api/cart/get` - Get user cart

## Real-time (Socket.io Events)

- `emit('join_branch', branchId)` - Staff joins branch room
- `emit('new_order', orderData)` - Server -> Branch Room
- `emit('order_status_update', {orderId, status})` - Server -> Customer
