# 🔍 CRITICAL SYSTEM AUDIT REPORT
**Date:** 2024-12-19  
**Auditor:** Senior System Architect & Security Auditor  
**Scope:** Data Integrity (MongoDB) & Real-time Reliability (Socket.io)  
**Severity Levels:** 🔴 CRITICAL | 🟠 HIGH | 🟡 MEDIUM | 🔵 LOW

---

## 📊 EXECUTIVE SUMMARY

| Category | Critical | High | Medium | Low | Total |
|----------|----------|------|--------|-----|-------|
| **MongoDB & Data Integrity** | 3 | 4 | 2 | 1 | 10 |
| **Socket.io & Real-time** | 2 | 3 | 1 | 0 | 6 |
| **Recent Features** | 0 | 1 | 2 | 0 | 3 |
| **TOTAL** | **5** | **8** | **5** | **1** | **19** |

---

## 🔴 CRITICAL ISSUES (Production-Breaking)

### [CRITICAL-1] Double Event Emission: Change Streams + Controllers
**File/Module:** `backend/streams/index.js` + `backend/controllers/orderController.js`  
**Issue:** Events are emitted **TWICE** - once from Change Streams and once from Controllers. This causes duplicate notifications on clients, UI flickering, and potential state desync.  
**Location:** 
- `streams/index.js:51` - Emits `new_order` on insert
- `streams/index.js:72-87` - Emits `order_update` and `order:status_updated` on update
- `orderController.js:171` - Emits `food:stock_updated` in placeOrder
- `orderController.js:439-454` - Emits `order:status_updated` in updateStatus

**Impact:**
- Clients receive duplicate events
- UI updates twice (flickering)
- State management becomes inconsistent
- Performance degradation (2x network traffic)
- Potential race conditions in frontend state updates

**Evidence:**
```javascript
// streams/index.js:51
io.to(`branch_${fullOrder.branch._id}`).emit('new_order', fullOrder);

// orderController.js:439 (if controller also emits)
io.to(`user_${updatedOrder.userId}`).emit("order:status_updated", {...});
```

**Suggested Fix:**
```javascript
// Option 1: Disable Change Streams (if using standalone MongoDB)
// Set global.CHANGE_STREAMS_ACTIVE = false in streams/index.js

// Option 2: Use flag to prevent double emission
// In orderController.js, check flag before emitting:
if (!global.CHANGE_STREAMS_ACTIVE) {
  io.emit("order:status_updated", {...});
}

// Option 3: Centralize event emission in one place (RECOMMENDED)
// Create eventEmitter service that checks source before emitting
```

---

### [CRITICAL-2] No Transaction Safety in placeOrder - Race Condition Risk
**File/Module:** `backend/controllers/orderController.js`  
**Issue:** Stock deduction uses `$inc` with query filter (good), but the **entire order placement is NOT wrapped in a transaction**. If the order save fails AFTER stock is deducted, stock is lost. Manual rollback exists but is not atomic.  
**Location:** Lines 133-196

**Impact:**
- Stock can be deducted but order not created (data loss)
- Manual rollback can fail if server crashes mid-rollback
- Race condition: Two orders can both pass stock check, both deduct, but only one order saved
- Inventory becomes permanently incorrect

**Current Code:**
```javascript
// Stock deducted here (lines 137-148)
for (const item of items) {
    const food = await foodModel.findOneAndUpdate(
        { _id: item._id, stock: { $gte: item.quantity } },
        { $inc: { stock: -item.quantity } }
    );
}

// Order saved here (line 196) - NOT ATOMIC with stock deduction
await newOrder.save();
```

**Suggested Fix:**
```javascript
const placeOrder = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    // ... validation code ...
    
    // ATOMIC: Stock deduction + Order creation in one transaction
    const deductedItems = [];
    for (const item of items) {
      const food = await foodModel.findOneAndUpdate(
        { _id: item._id, stock: { $gte: item.quantity } },
        { $inc: { stock: -item.quantity } },
        { new: true, session } // ← Add session
      );
      if (!food) throw new Error(`Insufficient stock: ${item.name}`);
      deductedItems.push(item);
    }
    
    const newOrder = new orderModel({...});
    await newOrder.save({ session }); // ← Add session
    
    await session.commitTransaction();
    
    // Emit events AFTER successful commit
    if (io) {
      io.emit("food:stock_updated", stockUpdates);
    }
    
    res.json({ success: true, ... });
  } catch (error) {
    await session.abortTransaction();
    // Rollback handled automatically by MongoDB
    res.json({ success: false, message: error.message });
  } finally {
    session.endSession();
  }
};
```

---

### [CRITICAL-3] Orphaned Data Risk: No Cascade Delete Handling
**File/Module:** `backend/models/*.js`  
**Issue:** If a User is deleted, their Reviews and Orders become orphaned. MongoDB doesn't support CASCADE DELETE like SQL. The `user` field in `reviewModel` and `userId` in `orderModel` will reference non-existent users, causing:
- `populate('user')` to return `null`
- UI crashes when trying to display user name
- Data integrity violations

**Location:** 
- `reviewModel.js:4-8` - `user` field references user
- `orderModel.js:19` - `userId` field (String, not ObjectId ref, but still problematic)

**Impact:**
- Reviews show "null" or crash when user is deleted
- Order history breaks for deleted users
- Analytics become inaccurate
- Frontend crashes on `review.user.name` when user is null

**Suggested Fix:**
```javascript
// Option 1: Soft Delete (RECOMMENDED)
// In userModel.js, add:
isDeleted: { type: Boolean, default: false },
deletedAt: { type: Date, default: null }

// Option 2: Pre-delete Hook
userSchema.pre('remove', async function(next) {
  // Set userId to null or mark as deleted
  await reviewModel.updateMany(
    { user: this._id },
    { $set: { user: null, isOrphaned: true } }
  );
  await orderModel.updateMany(
    { userId: this._id.toString() },
    { $set: { userId: null, isOrphaned: true } }
  );
  next();
});

// Option 3: Manual cleanup endpoint (Admin only)
// Create cleanup function that handles orphaned data
```

---

### [CRITICAL-4] Socket.io Room Security: No Authentication Validation
**File/Module:** `backend/server.js`  
**Issue:** Users can join ANY room by sending `join_user` or `join_branch` events. There's no validation that the user is authorized to join that room. User A can listen to User B's order updates.  
**Location:** Lines 71-80

**Impact:**
- **PRIVACY BREACH:** User A can receive User B's order status updates
- **SECURITY VULNERABILITY:** Unauthorized access to sensitive data
- **GDPR/Compliance Violation:** Personal data exposed to wrong users

**Current Code:**
```javascript
socket.on("join_user", (userId) => {
  socket.join(`user_${userId}`); // ❌ No validation!
  console.log(`Socket ${socket.id} joined user_${userId}`);
});
```

**Suggested Fix:**
```javascript
// Add authentication middleware for socket
io.use(async (socket, next) => {
  const token = socket.handshake.auth.token || socket.handshake.headers.token;
  if (!token) {
    return next(new Error("Authentication required"));
  }
  
  try {
    // Verify token and get user
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.userId;
    socket.userRole = decoded.role;
    next();
  } catch (err) {
    next(new Error("Invalid token"));
  }
});

// Validate room access
socket.on("join_user", (userId) => {
  // Only allow joining own room (or admin can join any)
  if (socket.userId !== userId && socket.userRole !== 'admin') {
    return socket.emit('error', { message: 'Unauthorized room access' });
  }
  socket.join(`user_${userId}`);
});

socket.on("join_branch", (branchId) => {
  // Verify user has access to this branch
  if (socket.userRole !== 'admin' && socket.userBranchId !== branchId) {
    return socket.emit('error', { message: 'Unauthorized branch access' });
  }
  socket.join(`branch_${branchId}`);
});
```

---

### [CRITICAL-5] Payload Mismatch: Change Stream Sends Full Object, Controller Sends Minimal
**File/Module:** `backend/streams/index.js` vs `backend/controllers/orderController.js`  
**Issue:** Change Stream emits fully populated objects (with `user`, `items`, `branch`), but Controller emits minimal objects (just `orderId` and `status`). Frontend code expecting full object from Change Stream will crash when receiving minimal object from Controller (or vice versa).  
**Location:**
- `streams/index.js:51` - Sends `fullOrder` (populated)
- `orderController.js:439` - Sends `{ orderId, status }` (minimal)

**Impact:**
- Frontend crashes: `order.user.name` is undefined when receiving controller event
- Inconsistent UI behavior
- Hard to debug (works sometimes, fails other times)

**Suggested Fix:**
```javascript
// Standardize payload format
// In orderController.js, populate before emitting:
const updatedOrder = await orderModel.findByIdAndUpdate(...)
  .populate('user', 'name email')
  .populate('branchId', 'name')
  .populate('tableId', 'tableNumber floor');

// Emit consistent format
io.to(`user_${updatedOrder.userId}`).emit("order:status_updated", {
  orderId: updatedOrder._id,
  status: updatedOrder.status,
  order: updatedOrder // Include full object for consistency
});
```

---

## 🟠 HIGH SEVERITY ISSUES

### [HIGH-1] Missing Indexes on Critical Query Fields
**File/Module:** `backend/models/foodModel.js`, `backend/models/orderModel.js`  
**Issue:** Missing indexes on frequently queried fields:
- `foodModel`: No index on `soldCount` (used for "Bán chạy nhất" sorting)
- `foodModel`: No index on `averageRating` (used for sorting/filtering)
- `orderModel`: Missing compound index for `{ branchId, status, date }` (used in analytics)

**Impact:**
- Slow queries as data grows
- Full collection scans on large datasets
- Poor performance in production

**Suggested Fix:**
```javascript
// In foodModel.js
foodSchema.index({ soldCount: -1 }); // For "Bán chạy nhất"
foodSchema.index({ averageRating: -1 }); // For rating sort
foodSchema.index({ category: 1, soldCount: -1 }); // Compound for category + popularity

// In orderModel.js (already has some, but add):
orderSchema.index({ branchId: 1, status: 1, date: -1 }); // Already exists ✅
orderSchema.index({ status: 1, date: -1 }); // Already exists ✅
// Add for analytics:
orderSchema.index({ date: -1, amount: 1 }); // For revenue queries
```

---

### [HIGH-2] Floating Point Precision in Money Calculations
**File/Module:** `backend/controllers/orderController.js`, `backend/controllers/reportController.js`  
**Issue:** Price calculations use `Math.round()` but intermediate calculations can accumulate floating point errors. VND amounts can have decimal precision issues.  
**Location:**
- `orderController.js:122` - `calculatedAmount += food.price * item.quantity`
- `reportController.js:108-114` - Multiple `Math.round()` calls

**Impact:**
- Revenue totals can be off by small amounts
- Accounting discrepancies
- Customer billing errors

**Suggested Fix:**
```javascript
// Use integer math for VND (store as smallest unit)
// Or use decimal.js library for precise calculations
import Decimal from 'decimal.js';

let calculatedAmount = new Decimal(0);
for (const item of items) {
  const itemTotal = new Decimal(food.price)
    .times(item.quantity)
    .toDecimalPlaces(0); // VND has no decimals
  calculatedAmount = calculatedAmount.plus(itemTotal);
}
calculatedAmount = calculatedAmount.toNumber();
```

---

### [HIGH-3] Change Stream Memory Leak: Streams Not Closed on Disconnect
**File/Module:** `backend/streams/index.js`  
**Issue:** Change Streams are created but never closed. If server restarts or connection drops, old streams may not be properly cleaned up, causing memory leaks.  
**Location:** Lines 38, 114

**Impact:**
- Memory leaks over time
- Multiple streams watching same collection
- Server performance degradation

**Suggested Fix:**
```javascript
// Store stream references
let orderStream = null;
let stockStream = null;

const startStreams = (io) => {
  // Close existing streams if any
  if (orderStream) {
    orderStream.close();
  }
  if (stockStream) {
    stockStream.close();
  }
  
  orderStream = orderModel.watch([], { fullDocument: 'updateLookup' });
  // ... rest of code ...
  
  // Handle errors and cleanup
  orderStream.on('error', (err) => {
    console.error("Order Stream Error:", err);
    // Attempt to restart stream
    setTimeout(() => startStreams(io), 5000);
  });
};

// Graceful shutdown
process.on('SIGTERM', () => {
  if (orderStream) orderStream.close();
  if (stockStream) stockStream.close();
});
```

---

### [HIGH-4] Review averageRating Update Not Atomic
**File/Module:** `backend/controllers/reviewController.js`  
**Issue:** When a review is created, the Product's `averageRating` is NOT updated. The rating is stored in `reviewModel` but `foodModel.averageRating` remains stale.  
**Location:** `submitReview()` function - No update to foodModel

**Impact:**
- Product ratings are incorrect
- "Top rated" products show wrong data
- User trust issues

**Suggested Fix:**
```javascript
// After saving review, update food averageRating
await review.save();

// Calculate new average (atomic)
const reviews = await reviewModel.find({ order: { $in: orderIds } });
const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

// Update food (for each item in order)
for (const item of order.items) {
  await foodModel.findByIdAndUpdate(
    item._id,
    { 
      $set: { 
        averageRating: Math.round(avgRating * 10) / 10,
        totalReviews: reviews.length
      }
    }
  );
}
```

---

### [HIGH-5] Stock Rollback Not Atomic - Can Fail Partially
**File/Module:** `backend/controllers/orderController.js`  
**Issue:** Manual rollback in `placeOrder` (lines 150-157) loops through items sequentially. If one rollback fails, others may succeed, leaving inconsistent state.  
**Location:** Lines 149-163

**Impact:**
- Partial rollback = inventory inconsistency
- Some items restored, others not
- Data corruption

**Suggested Fix:**
```javascript
// Use transaction (see CRITICAL-2 fix)
// OR if transaction not possible, use bulk write:
catch (error) {
  const rollbackOps = deductedItems.map(item => ({
    updateOne: {
      filter: { _id: item._id },
      update: { $inc: { stock: item.quantity } }
    }
  }));
  
  await foodModel.bulkWrite(rollbackOps, { ordered: false });
  // All or nothing rollback
}
```

---

### [HIGH-6] Note Field May Not Display in Kitchen Module
**File/Module:** `backend/models/orderModel.js` + Kitchen Frontend  
**Issue:** `note` field exists in `orderItemSchema` (line 9), but need to verify Kitchen module displays it. If notes are not shown, kitchen staff won't see special instructions.  
**Location:** `orderModel.js:9` - Note field defined

**Impact:**
- Customer special requests ignored
- Poor service quality
- Customer complaints

**Suggested Fix:**
```javascript
// Verify Kitchen module reads note field
// In admin/src/pages/Kitchen/*.jsx or similar:
{order.items.map(item => (
  <div key={item._id}>
    <span>{item.name} x{item.quantity}</span>
    {item.note && (
      <span className="note-badge">📝 {item.note}</span>
    )}
  </div>
))}
```

---

### [HIGH-7] No Geospatial Index for Shipper Location (If Feature Exists)
**File/Module:** `backend/models/*.js`  
**Issue:** If shipper location tracking exists, no `2dsphere` index found. Geospatial queries will be slow. Also need to verify coordinate format is `[longitude, latitude]` (MongoDB standard), not `[latitude, longitude]`.  
**Location:** Not found in current models

**Impact:**
- Slow location-based queries
- Wrong coordinate format = wrong locations
- Shipper assignment fails

**Suggested Fix:**
```javascript
// If shipper model exists, add:
shipperSchema.index({ location: '2dsphere' });

// Verify coordinate format:
location: {
  type: {
    type: String,
    enum: ['Point'],
    default: 'Point'
  },
  coordinates: {
    type: [Number], // [longitude, latitude] - NOT [lat, lng]
    required: true
  }
}
```

---

### [HIGH-8] Socket.io CORS Allows All Origins (Security Risk)
**File/Module:** `backend/server.js`  
**Issue:** Socket.io CORS is set to `origin: "*"` (line 45). This allows ANY website to connect to your socket server, potentially causing:
- CSRF attacks
- Unauthorized data access
- DDoS amplification

**Impact:**
- Security vulnerability
- Potential data breach
- Compliance issues

**Suggested Fix:**
```javascript
const io = new Server(server, {
  cors: {
    origin: process.env.ALLOWED_ORIGINS?.split(',') || [
      "http://localhost:5173",
      "http://localhost:3000",
      process.env.FRONTEND_URL
    ],
    methods: ["GET", "POST"],
    credentials: true
  },
});
```

---

## 🟡 MEDIUM SEVERITY ISSUES

### [MEDIUM-1] Missing Validation: userId Can Be String or ObjectId
**File/Module:** `backend/models/orderModel.js`  
**Issue:** `userId` is defined as `String` (line 19), but should be `ObjectId` with ref for consistency. This causes:
- Inconsistent data types
- `populate()` doesn't work
- Type confusion in code

**Suggested Fix:**
```javascript
userId: { 
  type: mongoose.Schema.Types.ObjectId, 
  ref: "user", 
  default: null 
},
```

---

### [MEDIUM-2] No Index on reviewModel.order (Despite Unique Constraint)
**File/Module:** `backend/models/reviewModel.js`  
**Issue:** `order` field has `unique: true` but no explicit index. MongoDB creates index automatically, but explicit index with proper options is better.  
**Location:** Line 13

**Suggested Fix:**
```javascript
reviewSchema.index({ order: 1 }, { unique: true });
```

---

### [MEDIUM-3] Price Verification Happens Before Stock Check
**File/Module:** `backend/controllers/orderController.js`  
**Issue:** Price verification loop (lines 103-123) happens BEFORE stock deduction. If prices change between verification and deduction, user pays wrong amount.  
**Location:** Lines 96-131

**Suggested Fix:**
```javascript
// Move price verification INSIDE transaction
// Or use atomic price locking
```

---

### [MEDIUM-4] Change Stream Requires Replica Set (Not Documented)
**File/Module:** `backend/streams/index.js`  
**Issue:** Change Streams only work with Replica Set. Standalone MongoDB will fail silently. This is handled (line 26), but not well documented for deployment.  
**Location:** Lines 14-28

**Suggested Fix:**
```javascript
// Add clear documentation in README
// Or provide setup script for replica set
```

---

### [MEDIUM-5] No Error Handling for Populate Failures
**File/Module:** `backend/streams/index.js`  
**Issue:** `populate()` calls (lines 45-48) can fail if referenced documents are deleted. No error handling, causing stream to crash.  
**Location:** Lines 45-48, 65-67

**Suggested Fix:**
```javascript
try {
  const fullOrder = await orderModel.findById(orderId)
    .populate('user', 'name email')
    .populate('branch');
  
  if (!fullOrder || !fullOrder.user) {
    console.warn(`Order ${orderId} has orphaned user reference`);
    return; // Skip emission
  }
} catch (error) {
  console.error("Populate error:", error);
  // Emit minimal payload or skip
}
```

---

## 🔵 LOW SEVERITY ISSUES

### [LOW-1] Console.log Instead of Proper Logging
**File/Module:** Multiple files  
**Issue:** Uses `console.log` instead of structured logging (Winston, Pino). Makes production debugging harder.  
**Impact:** Low - Doesn't break functionality, but poor practice

**Suggested Fix:**
```javascript
import logger from './utils/logger.js';
logger.info('Order created', { orderId, userId });
```

---

## 📋 IMPLEMENTATION PRIORITY

### Phase 1 (Immediate - This Week) - CRITICAL
1. ✅ [CRITICAL-1] Fix double event emission
2. ✅ [CRITICAL-2] Add transaction safety to placeOrder
3. ✅ [CRITICAL-3] Implement orphaned data handling
4. ✅ [CRITICAL-4] Add socket.io room authentication
5. ✅ [CRITICAL-5] Standardize event payloads

### Phase 2 (High Priority - Next Week)
6. ✅ [HIGH-1] Add missing indexes
7. ✅ [HIGH-2] Fix floating point precision
8. ✅ [HIGH-3] Fix change stream memory leaks
9. ✅ [HIGH-4] Update averageRating atomically
10. ✅ [HIGH-5] Fix stock rollback atomicity
11. ✅ [HIGH-6] Verify note field in Kitchen
12. ✅ [HIGH-7] Add geospatial indexes (if needed)
13. ✅ [HIGH-8] Fix Socket.io CORS

### Phase 3 (Medium Priority - Next Sprint)
14. ✅ [MEDIUM-1] Fix userId type consistency
15. ✅ [MEDIUM-2] Add explicit review index
16. ✅ [MEDIUM-3] Fix price verification timing
17. ✅ [MEDIUM-4] Document replica set requirement
18. ✅ [MEDIUM-5] Add populate error handling

---

## 🧪 TESTING RECOMMENDATIONS

### Load Testing:
1. **Concurrent Orders:** 100 users place orders simultaneously for same product
2. **Socket Connections:** 1000 concurrent socket connections
3. **Change Stream Load:** Monitor memory usage with high write volume

### Security Testing:
1. **Socket Room Access:** Attempt to join other users' rooms
2. **CORS Validation:** Test from unauthorized origins
3. **Transaction Rollback:** Simulate server crash during order placement

### Data Integrity Testing:
1. **Orphaned Data:** Delete user, verify reviews/orders handled
2. **Stock Consistency:** Concurrent orders for last item
3. **Rating Accuracy:** Add/delete reviews, verify averageRating updates

---

**Report Status:** ⚠️ **REQUIRES IMMEDIATE ACTION**  
**Next Steps:** Review with team, prioritize fixes, create implementation tickets
