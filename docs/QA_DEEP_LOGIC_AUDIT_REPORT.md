# 🔍 DEEP LOGIC AUDIT REPORT
**Date:** 2024-12-19  
**Scope:** Upsell UI Logic, Review System, Sold Count Logic  
**Severity Levels:** 🔴 CRITICAL | 🟠 HIGH | 🟡 MEDIUM | 🟢 LOW

---

## 📊 EXECUTIVE SUMMARY

| Category | Critical | High | Medium | Low | Total |
|----------|----------|------|--------|-----|-------|
| **Upsell UI Logic** | 1 | 2 | 1 | 0 | 4 |
| **Review System** | 0 | 2 | 1 | 0 | 3 |
| **Sold Count Logic** | 2 | 1 | 0 | 0 | 3 |
| **TOTAL** | **3** | **5** | **2** | **0** | **10** |

---

## 🔴 CRITICAL ISSUES (Must Fix Immediately)

### [CRITICAL-1] Sold Count Never Increments
**Component:** `backend/controllers/orderController.js`  
**Issue:** The `soldCount` field in `foodModel` is **NEVER updated** when orders are completed.  
**Location:** `updateStatus()` function (lines 433-435)  
**Impact:** 
- Analytics are completely broken
- "Bán chạy nhất" badges show incorrect data
- Business intelligence reports are inaccurate
- User trust in "X đã bán" metrics is compromised

**Current Code:**
```javascript
if (status === "Served" || status === "Delivered") {
  await deductInventoryForOrder(orderId);
  // ❌ MISSING: soldCount increment
}
```

**Recommended Fix:**
```javascript
// ============ UPDATE SOLD COUNT ON COMPLETION ============
if (status === "Served" || status === "Delivered") {
  await deductInventoryForOrder(orderId);
  
  // Increment soldCount for each item in the order
  for (const item of updatedOrder.items) {
    await foodModel.findByIdAndUpdate(
      item._id,
      { $inc: { soldCount: item.quantity } }
    );
  }
}
```

---

### [CRITICAL-2] Sold Count Never Decrements on Refund/Cancellation
**Component:** `backend/controllers/orderController.js`  
**Issue:** When an order is changed from "COMPLETED" → "REFUNDED" or "CANCELLED", `soldCount` is not decremented.  
**Location:** `updateStatus()` function (lines 414-429)  
**Impact:**
- Sold counts become permanently inflated
- Products that were refunded still show as "sold"
- Revenue analytics become incorrect over time
- Data integrity is compromised

**Current Code:**
```javascript
if (status === "Cancelled" && updatedOrder) {
  // Restores stock ✅
  // ❌ MISSING: soldCount decrement if order was previously completed
}
```

**Recommended Fix:**
```javascript
// RESTORE FOOD STOCK ON CANCELLATION
if (status === "Cancelled" && updatedOrder) {
  const stockUpdates = [];
  const wasCompleted = ["Served", "Delivered", "Paid"].includes(updatedOrder.status);
  
  for (const item of updatedOrder.items) {
    await foodModel.findByIdAndUpdate(
      item._id, 
      { $inc: { stock: item.quantity } }
    );
    stockUpdates.push({ id: item._id, change: item.quantity });
    
    // Decrement soldCount if order was previously completed
    if (wasCompleted) {
      await foodModel.findByIdAndUpdate(
        item._id,
        { $inc: { soldCount: -item.quantity } }
      );
    }
  }
  
  if (io && stockUpdates.length > 0) {
    io.emit("food:stock_updated", stockUpdates);
  }
}
```

**Additional Fix Needed:** Handle status transitions properly:
```javascript
const updateStatus = async (req, res) => {
  try {
    // ... existing code ...
    
    const oldOrder = await orderModel.findById(orderId); // Get BEFORE update
    const oldStatus = oldOrder.status;
    const wasCompleted = ["Served", "Delivered", "Paid"].includes(oldStatus);
    const willBeCompleted = ["Served", "Delivered", "Paid"].includes(status);
    const willBeCancelled = status === "Cancelled" || status === "Refunded";
    
    const updatedOrder = await orderModel.findByIdAndUpdate(/* ... */);
    
    // Handle soldCount transitions
    if (wasCompleted && willBeCancelled) {
      // Decrement: Order was completed, now being cancelled/refunded
      for (const item of updatedOrder.items) {
        await foodModel.findByIdAndUpdate(
          item._id,
          { $inc: { soldCount: -item.quantity } }
        );
      }
    } else if (!wasCompleted && willBeCompleted) {
      // Increment: Order becoming completed
      for (const item of updatedOrder.items) {
        await foodModel.findByIdAndUpdate(
          item._id,
          { $inc: { soldCount: item.quantity } }
        );
      }
    }
    
    // ... rest of code ...
  }
}
```

---

### [CRITICAL-3] Division by Zero in Savings Calculation
**Component:** `frontend/src/components/FoodItem/FoodItem.jsx`  
**Issue:** If `finalOriginalPrice` is 0, division by zero occurs in savings percentage calculation.  
**Location:** Line 38  
**Impact:**
- JavaScript returns `Infinity` or `NaN`
- UI may crash or display "NaN%" or "Infinity%"
- User experience is broken

**Current Code:**
```javascript
const savingsPercent = finalOriginalPrice > 0 ? Math.round((savingsAmount / finalOriginalPrice) * 100) : 0;
```

**Problem:** While there's a check, if `finalOriginalPrice` becomes 0 due to edge cases (null, undefined coercion), the calculation can still fail.

**Recommended Fix:**
```javascript
// --- LOGIC: Smart Savings ---
let finalOriginalPrice = originalPrice || 0;
const isCombo = name.toLowerCase().includes("combo") || description.toLowerCase().includes("combo");

if (isCombo && (!finalOriginalPrice || finalOriginalPrice <= price)) {
  // Synthetic Savings: ~15% markup
  finalOriginalPrice = Math.ceil(price * 1.15 / 1000) * 1000; 
}

// Validate finalOriginalPrice before calculations
const hasSavings = finalOriginalPrice > 0 && finalOriginalPrice > price;
const savingsAmount = hasSavings ? (finalOriginalPrice - price) : 0;
const savingsPercent = hasSavings && finalOriginalPrice > 0 
  ? Math.round((savingsAmount / finalOriginalPrice) * 100) 
  : 0;

// Additional safety: Clamp savingsPercent to valid range
const clampedSavingsPercent = Math.max(0, Math.min(100, savingsPercent));
```

---

## 🟠 HIGH SEVERITY ISSUES

### [HIGH-1] Negative Savings Display When originalPrice < price
**Component:** `frontend/src/components/FoodItem/FoodItem.jsx`  
**Issue:** If `originalPrice` is set incorrectly (e.g., 50000) but `price` is higher (e.g., 60000), the UI will show negative savings.  
**Location:** Lines 36-38, 85-90  
**Impact:**
- Confusing user experience
- Loss of trust in pricing
- Potential legal issues (misleading pricing)

**Current Code:**
```javascript
const hasSavings = finalOriginalPrice > price;
```

**Problem:** This check happens AFTER synthetic price generation, but if originalPrice is manually set incorrectly, it can still pass through.

**Recommended Fix:**
```javascript
// Validate that originalPrice makes sense
if (originalPrice && originalPrice > 0 && originalPrice <= price) {
  // Invalid originalPrice - ignore it
  finalOriginalPrice = 0;
}

if (isCombo && (!finalOriginalPrice || finalOriginalPrice <= price)) {
  finalOriginalPrice = Math.ceil(price * 1.15 / 1000) * 1000;
}

const hasSavings = finalOriginalPrice > 0 && finalOriginalPrice > price;
const savingsAmount = hasSavings ? (finalOriginalPrice - price) : 0;
const savingsPercent = hasSavings ? Math.round((savingsAmount / finalOriginalPrice) * 100) : 0;

// Additional validation: Don't show savings if percentage is too low (< 1%)
if (savingsPercent < 1) {
  hasSavings = false;
}
```

---

### [HIGH-2] Race Condition in Review Duplicate Check
**Component:** `backend/controllers/reviewController.js`  
**Issue:** Between checking for existing review (line 50) and saving new review (line 65), a user can submit multiple requests simultaneously, creating duplicate reviews.  
**Location:** Lines 49-65  
**Impact:**
- Users can spam reviews
- Data integrity compromised
- Review statistics become inaccurate

**Current Code:**
```javascript
// Check if already reviewed
const existingReview = await reviewModel.findOne({ order: orderId });
if (existingReview) {
  return res.json({ success: false, message: "Đơn hàng này đã được đánh giá rồi" });
}

// Create review
const review = new reviewModel({ /* ... */ });
await review.save();
```

**Recommended Fix:**
```javascript
// Use findOneAndUpdate with upsert: false to make it atomic
const review = await reviewModel.findOneAndUpdate(
  { order: orderId },
  {
    $setOnInsert: {
      user: userId,
      order: orderId,
      branch: order.branchId || null,
      rating: Math.round(rating),
      comment: comment || "",
      images: images || [],
    }
  },
  { 
    upsert: false, // Don't create if doesn't exist
    new: true,
    runValidators: true
  }
);

if (review) {
  // Review already exists
  return res.json({ success: false, message: "Đơn hàng này đã được đánh giá rồi" });
}

// Create new review (atomic operation)
const newReview = new reviewModel({
  user: userId,
  order: orderId,
  branch: order.branchId || null,
  rating: Math.round(rating),
  comment: comment || "",
  images: images || [],
});

await newReview.save();
```

**Alternative (Better):** Use unique index:
```javascript
// In reviewModel.js schema:
order: { type: mongoose.Schema.Types.ObjectId, ref: "order", required: true, unique: true }

// Then in controller:
try {
  const review = new reviewModel({ /* ... */ });
  await review.save();
} catch (error) {
  if (error.code === 11000) { // Duplicate key error
    return res.json({ success: false, message: "Đơn hàng này đã được đánh giá rồi" });
  }
  throw error;
}
```

---

### [HIGH-3] Missing Status Check: "Refunded" Not Explicitly Blocked
**Component:** `backend/controllers/reviewController.js`  
**Issue:** The valid statuses array only includes "Delivered", "Served", "Paid", but doesn't explicitly exclude "Refunded" or "Cancelled". If an order has status "Refunded", it might still be reviewable if the check is bypassed.  
**Location:** Lines 40-47  
**Impact:**
- Users might review refunded orders
- Business logic inconsistency

**Current Code:**
```javascript
const validStatuses = ["Delivered", "Served", "Paid"];
if (!validStatuses.includes(order.status)) {
  return res.json({ /* ... */ });
}
```

**Recommended Fix:**
```javascript
// Explicit whitelist approach (more secure)
const validStatuses = ["Delivered", "Served", "Paid"];
const invalidStatuses = ["Cancelled", "Refunded", "Pending", "Confirmed"];

if (invalidStatuses.includes(order.status)) {
  return res.json({ 
    success: false, 
    message: `Không thể đánh giá đơn hàng với trạng thái: ${order.status}` 
  });
}

if (!validStatuses.includes(order.status)) {
  return res.json({ 
    success: false, 
    message: `Chỉ có thể đánh giá đơn hàng đã hoàn thành (${validStatuses.join(", ")})` 
  });
}
```

---

### [HIGH-4] Ghost Click: Image Click Doesn't Stop Propagation
**Component:** `frontend/src/components/FoodItem/FoodItem.jsx`  
**Issue:** Clicking the image (line 72-77) opens the detail popup, but if the card is wrapped in a Link component (common pattern), both the popup AND navigation can trigger simultaneously.  
**Location:** Line 72  
**Impact:**
- Poor UX: User sees popup briefly then navigates away
- Confusing behavior
- Potential state management issues

**Current Code:**
```javascript
<div className="food-item-img-container" onClick={() => setShowDetail(true)}>
  <img 
    src={url + "/images/" + image} 
    alt={name} 
    className={`food-item-image ${isOutOfStock ? 'grayscale' : ''}`} 
  />
</div>
```

**Recommended Fix:**
```javascript
<div 
  className="food-item-img-container" 
  onClick={(e) => {
    e.stopPropagation(); // Prevent parent Link navigation
    e.preventDefault(); // Prevent default anchor behavior
    setShowDetail(true);
  }}
>
  <img 
    src={url + "/images/" + image} 
    alt={name} 
    className={`food-item-image ${isOutOfStock ? 'grayscale' : ''}`}
    onClick={(e) => {
      e.stopPropagation(); // Additional safety
      e.preventDefault();
    }}
  />
</div>
```

---

### [HIGH-5] Floating Point Precision in Average Rating
**Component:** `backend/controllers/reviewController.js`  
**Issue:** MongoDB aggregation `$avg` can produce floating point errors (e.g., 4.999999 instead of 5.0). While `toFixed(1)` is used, the intermediate calculation might accumulate errors.  
**Location:** Line 338  
**Impact:**
- Ratings display as 4.9 instead of 5.0
- User perception of quality affected
- Potential rounding inconsistencies

**Current Code:**
```javascript
averageRating: parseFloat(statResult.averageRating.toFixed(1)),
```

**Recommended Fix:**
```javascript
// Use proper rounding to avoid floating point errors
const rawAvg = statResult.averageRating || 0;
const roundedAvg = Math.round(rawAvg * 10) / 10; // Round to 1 decimal
const clampedAvg = Math.max(0, Math.min(5, roundedAvg)); // Clamp to 0-5 range

stats: {
  averageRating: clampedAvg,
  // ... rest
}
```

**Also check foodModel.js line 16:**
```javascript
// Current:
averageRating: { type: Number, default: 0, set: (v) => Math.round(v * 10) / 10 }

// Better:
averageRating: { 
  type: Number, 
  default: 0, 
  set: (v) => {
    if (typeof v !== 'number' || isNaN(v)) return 0;
    const rounded = Math.round(v * 10) / 10;
    return Math.max(0, Math.min(5, rounded)); // Clamp to valid range
  }
}
```

---

## 🟡 MEDIUM SEVERITY ISSUES

### [MEDIUM-1] Combo Sub-Items Deletion Not Handled
**Component:** `frontend/src/components/FoodItem/FoodItem.jsx`  
**Issue:** If a combo's sub-items are deleted from the database, the synthetic `originalPrice` calculation (line 33) still works, but the displayed savings might be misleading since the "sum of individual items" no longer exists.  
**Location:** Lines 31-34  
**Impact:**
- Misleading pricing information
- User confusion

**Recommended Fix:**
```javascript
// In backend: Store combo items reference
// In frontend: Validate combo integrity
if (isCombo && (!finalOriginalPrice || finalOriginalPrice <= price)) {
  // Check if combo items are still valid (would require API call)
  // For now, add a warning or fallback
  finalOriginalPrice = Math.ceil(price * 1.15 / 1000) * 1000;
  
  // Add a note that this is an estimated savings
  // (Could add a flag: isEstimatedSavings: true)
}
```

**Better Solution:** Store combo breakdown in database:
```javascript
// In foodModel.js
comboItems: [{
  foodId: { type: mongoose.Schema.Types.ObjectId, ref: "food" },
  quantity: { type: Number, default: 1 }
}],
calculatedOriginalPrice: { type: Number } // Auto-calculated on save
```

---

### [MEDIUM-2] Concurrency in Sold Count Updates (MongoDB $inc is Safe, but...)
**Component:** `backend/controllers/orderController.js`  
**Issue:** While MongoDB's `$inc` is atomic, if two orders complete simultaneously for the same product, both will increment. This is actually CORRECT behavior, but we need to ensure the increments are properly tracked.  
**Location:** (After implementing CRITICAL-1 fix)  
**Impact:**
- Actually, this is fine - MongoDB handles it correctly
- But we should add logging/monitoring

**Recommended Fix:**
```javascript
// Add transaction logging for audit trail
if (status === "Served" || status === "Delivered") {
  await deductInventoryForOrder(orderId);
  
  for (const item of updatedOrder.items) {
    const result = await foodModel.findByIdAndUpdate(
      item._id,
      { $inc: { soldCount: item.quantity } },
      { new: true }
    );
    
    // Log for audit
    console.log(`[SoldCount] Incremented ${item.quantity} for ${item.name}. New total: ${result.soldCount}`);
  }
}
```

---

## 📋 IMPLEMENTATION PRIORITY

### Phase 1 (Immediate - This Week)
1. ✅ [CRITICAL-1] Implement soldCount increment on order completion
2. ✅ [CRITICAL-2] Implement soldCount decrement on refund/cancellation
3. ✅ [CRITICAL-3] Fix division by zero in savings calculation

### Phase 2 (High Priority - Next Week)
4. ✅ [HIGH-1] Fix negative savings display
5. ✅ [HIGH-2] Fix race condition in review duplicate check
6. ✅ [HIGH-3] Add explicit "Refunded" status check
7. ✅ [HIGH-4] Fix ghost click on image

### Phase 3 (Medium Priority - Next Sprint)
8. ✅ [HIGH-5] Improve floating point precision
9. ✅ [MEDIUM-1] Handle combo sub-items deletion
10. ✅ [MEDIUM-2] Add soldCount audit logging

---

## 🧪 TESTING RECOMMENDATIONS

### Unit Tests Needed:
1. **Sold Count Logic:**
   - Test increment on "Served" status
   - Test increment on "Delivered" status
   - Test decrement when "Served" → "Cancelled"
   - Test decrement when "Delivered" → "Refunded"
   - Test no change when "Pending" → "Cancelled"

2. **Review System:**
   - Test duplicate review prevention (race condition)
   - Test status validation (Refunded, Cancelled blocked)
   - Test floating point precision in averages

3. **Upsell UI:**
   - Test originalPrice = 0
   - Test originalPrice < price
   - Test originalPrice = null
   - Test division by zero scenarios

### Integration Tests:
1. Concurrent order completion (2 orders same product)
2. Order status transitions (all valid paths)
3. Review submission under load (100 concurrent requests)

---

## 📝 CODE FIXES SUMMARY

See attached files:
- `backend/controllers/orderController.js.fix` - Sold count fixes
- `backend/controllers/reviewController.js.fix` - Review system fixes
- `frontend/src/components/FoodItem/FoodItem.jsx.fix` - UI logic fixes

---

**Report Generated By:** Senior QA Automation Engineer  
**Review Status:** ⚠️ **REQUIRES IMMEDIATE ACTION**
