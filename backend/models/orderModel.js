import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
  userId: { type: String, default: null },
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
  items: { type: Array, required: true },
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

const orderModel =
  mongoose.models.order || mongoose.model("order", orderSchema);

export default orderModel;
