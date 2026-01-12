import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema({
  _id: { type: String, required: true }, // Keep original Food ID
  name: { type: String, required: true },
  price: { type: Number, required: true },
  image: { type: String, required: true },
  quantity: { type: Number, required: true },
  note: { type: String, default: "" }, // Task 1: Add note field
  // Any other fields from food item we copied?
}, { _id: false }); // Disable auto _id for subdoc if we use original ID? Actually let's allow it or not?
// We usually duplicate data here.
// Let's just use strict: false or define minimal fields.
// User requirement: "add note: { type: String }"
// Let's stick to generic array BUT with note mention? 
// No, explicit schema is better.

const orderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "user", default: null },
  guestId: { type: String, default: null },
  branchId: { type: mongoose.Schema.Types.ObjectId, ref: "branch", default: null },
  tableId: { type: mongoose.Schema.Types.ObjectId, ref: "table", default: null },
  orderType: { 
    type: String, 
    enum: ["Delivery", "Dine-in", "Takeaway"], 
    default: "Delivery" 
  },
  paymentMethod: {
    type: String,
    enum: ["Stripe", "Cash"],
    default: "Stripe"
  },
  items: [orderItemSchema], // Use Sub-schema
  amount: { type: Number, required: true },
  address: { type: Object, default: {} },
  status: { 
    type: String, 
    enum: ["Pending", "Confirmed", "Preparing", "Served", "Paid", "Cancelled"],
    default: "Pending" 
  },
  date: { type: Date, default: Date.now },
  payment: { type: Boolean, default: false },
  timeline: [{
    status: String, 
    timestamp: { type: Date, default: Date.now }
  }],
  cancellationReason: { type: String, default: null }
});

// Optimization: Indexes for faster queries
orderSchema.index({ userId: 1, date: -1 }); // Faster User Order History
orderSchema.index({ guestId: 1, date: -1 }); // Faster Guest Order History
orderSchema.index({ branchId: 1, status: 1, date: -1 }); // Faster Analytics Filtering
orderSchema.index({ status: 1, date: -1 }); // Faster Admin Dashboard
// HIGH PRIORITY FIX: Additional indexes for analytics
orderSchema.index({ date: -1, amount: 1 }); // For revenue queries
orderSchema.index({ branchId: 1, date: -1 }); // For branch-specific analytics
orderSchema.index({ payment: 1, status: 1 }); // For payment status filtering

const orderModel =
  mongoose.models.order || mongoose.model("order", orderSchema);

export default orderModel;
