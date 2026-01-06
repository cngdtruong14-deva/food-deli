# High-Performance Analytics Dashboard Design

## 1. Analytical Metrics & Logic

### A. Revenue Panel

- **Total Revenue**: Sum of `amount` for all orders with status `Paid` or `Served`.
- **Net Profit (Estimated)**: `Total Revenue - Total Cost`.
  - _Note_: Requires adding `costPrice` to the `Food` model.
- **Average Order Value (AOV)**: `Total Revenue / Total Count of Paid Orders`.
- **Payment Method Breakdown**: Pie chart showing percentage of `Stripe` vs `Cash` vs `COD`.

### B. Product Panel

- **Top 5 Best Selling**: Items with highest summed `quantity`.
- **Top 5 Least Selling**: Items with lowest summed `quantity`.
- **Profitability Matrix**: Scatter plot of _Sales Volume_ vs _Profit Margin_ (if cost available).

### C. Live Status Widget (Real-time)

- **Active Tables**: Count of tables where `status` is `Occupied`.
- **Kitchen Backlog**: Count of items (or orders) where `status` is `Confirmed` or `Preparing`.
  - _Insight_: Immediate bottleneck detection.

### D. Operations Panel (Heatmap & Performance)

- **Peak Hours**: Heatmap matrix (Day of Week x Hour). Shows when the restaurant is busiest.
- **Avg Preparation Time**: Average time between `Confirmed` and `Served`.
- **Lost Sales Analysis**: Pie chart of Cancellation Reasons.

### E. Customer Panel

- **Top Spenders**: Users with highest LTV.
- **Retention Rate**: Ratio of Returning Users vs New Users.

---

## 2. Schema Optimization

### A. `Order` Collection Update

1.  **Timeline**: Track status changes for Prep Time calculation.
2.  **Cancellation Reason**: Track why orders are lost.

```javascript
// models/orderModel.js updates
const orderSchema = new mongoose.Schema({
  // ... existing fields
  branchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "branch",
    required: true,
  }, // Ensure branchId is indexed
  timeline: [
    {
      status: String,
      timestamp: { type: Date, default: Date.now },
    },
  ],
  cancellationReason: { type: String, default: null }, // e.g. "Out of Stock", "Customer Changed Mind"
});
```

### B. `Food` Collection Update

1.  **Cost Price**: For profit calculation.

```javascript
// models/foodModel.js updates
const foodSchema = new mongoose.Schema({
  // ... existing fields
  costPrice: { type: Number, default: 0 }, // Import price or estimated cost
});
```

### C. `DailyStat` Collection (Pre-aggregation)

To ensure performance across multiple branches, `DailyStat` should be scoped by branch.

```javascript
// models/dailyStat.js
const dailyStatSchema = new mongoose.Schema({
  date: { type: String, required: true }, // "YYYY-MM-DD"
  branchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "branch",
    required: true,
  },
  totalRevenue: { type: Number, default: 0 },
  totalOrders: { type: Number, default: 0 },
  // ... other pre-calculated metrics
});
dailyStatSchema.index({ date: 1, branchId: 1 }, { unique: true });
```

---

## 3. Aggregation Pipelines

**Global Rule**: All pipelines MUST start with a `$match` stage for `branchId` if provided.

### A. Active Tables (Live Widget)

_Query `Table` collection directly._

```javascript
// Simple Count
const activeTables = await tableModel.countDocuments({
  branchId: branchId,
  status: "Occupied",
});
```

### B. Kitchen Backlog (Live Widget)

_Query `Order` collection directly._

```javascript
const backlogCount = await orderModel.countDocuments({
  branchId: branchId,
  status: { $in: ["Confirmed", "Preparing"] },
});
```

### C. Revenue by Day (Last 7 Days)

```javascript
const matchStage = {
  status: { $in: ["Paid", "Served"] },
  date: { $gte: sevenDaysAgo },
};
if (branchId) matchStage.branchId = new mongoose.Types.ObjectId(branchId);

const pipeline = [
  { $match: matchStage },
  {
    $group: {
      _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
      dailyRevenue: { $sum: "$amount" },
      // Optional: Gross Profit if costPrice is embedded or looked up
      count: { $sum: 1 },
    },
  },
  { $sort: { _id: 1 } },
];
```

### D. Peak Hours Heatmap

```javascript
const matchStage = { status: { $ne: "Cancelled" } };
if (branchId) matchStage.branchId = new mongoose.Types.ObjectId(branchId);

const pipeline = [
  { $match: matchStage },
  {
    $project: {
      dayOfWeek: { $isoDayOfWeek: "$date" },
      hour: { $hour: "$date" },
    },
  },
  {
    $group: {
      _id: { day: "$dayOfWeek", hour: "$hour" },
      orderCount: { $sum: 1 },
    },
  },
  { $sort: { "_id.day": 1, "_id.hour": 1 } },
];
```

### E. Lost Sales Analysis (Cancellation)

```javascript
const matchStage = { status: "Cancelled" };
if (branchId) matchStage.branchId = new mongoose.Types.ObjectId(branchId);

const pipeline = [
  { $match: matchStage },
  {
    $group: {
      _id: "$cancellationReason",
      count: { $sum: 1 },
      lostRevenue: { $sum: "$amount" },
    },
  },
];
```
