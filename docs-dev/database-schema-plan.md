# Complete Database Schema (Mongoose)

## 1. Branch Schema

```javascript
const branchSchema = new mongoose.Schema({
  name: { type: String, required: true },
  address: { type: String, required: true },
  phone: { type: String },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});
```

## 2. Table Schema

```javascript
const tableSchema = new mongoose.Schema({
  branchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Branch",
    required: true,
    index: true,
  },
  name: { type: String, required: true }, // e.g., "T-01"
  capacity: { type: Number, default: 4 },
  status: {
    type: String,
    enum: ["Available", "Occupied", "Reserved"],
    default: "Available",
  },
  currentOrderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Order",
    default: null,
  }, // Link to active session
  qrCode: { type: String }, // Unique identifier string for QR generation
});
```

## 3. User Schema (Updated)

```javascript
const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ["customer", "kitchen", "waiter", "manager", "admin"],
      default: "customer",
    },
    branchId: { type: mongoose.Schema.Types.ObjectId, ref: "Branch" }, // Null for Admin/Customer
    cartData: { type: Object, default: {} },
  },
  { minimize: false }
);
```

## 4. Category Schema

```javascript
const categorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  image: { type: String },
  description: { type: String },
  isActive: { type: Boolean, default: true },
});
```

## 5. Food Schema (Updated)

```javascript
const foodSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  image: { type: String, required: true },
  category: { type: String, required: true }, // Can eventually move to ObjectId ref
  isAvailable: { type: Boolean, default: true },
});
```

## 6. Order Schema (Updated)

```javascript
const orderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  branchId: { type: mongoose.Schema.Types.ObjectId, ref: "Branch" }, // Required for valid orders
  tableId: { type: mongoose.Schema.Types.ObjectId, ref: "Table" }, // Optional (Dine-in only)

  items: [
    {
      foodId: { type: mongoose.Schema.Types.ObjectId, ref: "Food" },
      name: { type: String }, // Snapshot of name at time of order
      price: { type: Number }, // Snapshot of price at time of order
      quantity: { type: Number, required: true },
    },
  ],

  amount: { type: Number, required: true },
  address: { type: Object }, // Delivery address (if Delivery)

  status: {
    type: String,
    enum: [
      "Pending",
      "Confirmed",
      "Preparing",
      "OutForDelivery",
      "served",
      "Completed",
      "Cancelled",
    ],
    default: "Pending",
  },

  paymentMethod: { type: String, enum: ["COD", "Stripe"], default: "COD" },
  payment: { type: Boolean, default: false },
  date: { type: Date, default: Date.now },
});
```
