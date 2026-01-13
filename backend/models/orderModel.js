import mongoose from "mongoose";
import orderItemSchema from "./schemas/orderItem.schema.js";
import addressSchema from "./schemas/address.schema.js";

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
  items: [orderItemSchema], // Use Imported Reference
  amount: { type: Number, required: true },
  address: { type: addressSchema, default: () => ({}) }, // Use Imported Schema
  status: { 
    type: String, 
    enum: ["Pending", "Confirmed", "Preparing", "Served", "Paid", "Cancelled"],
    default: "Pending" 
  },
  date: { type: Date, default: Date.now },
  payment: { type: Boolean, default: false },
  isReviewed: { type: Boolean, default: false }, // Persist review status
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
