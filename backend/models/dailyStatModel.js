import mongoose from "mongoose";

const dailyStatSchema = new mongoose.Schema({
  date: { type: String, required: true }, // Format "YYYY-MM-DD"
  branchId: { type: mongoose.Schema.Types.ObjectId, ref: "branch", required: true },
  totalRevenue: { type: Number, default: 0 },
  totalOrders: { type: Number, default: 0 },
  paymentMethods: {
    Stripe: { type: Number, default: 0 },
    Cash: { type: Number, default: 0 }
  },
  topItems: [{
    name: String,
    quantity: Number,
    revenue: Number
  }],
  hourlyDistribution: [{ // Array of 24 integers, index = hour
    type: Number 
  }]
});

// Ensure we only have one stat document per branch per day
dailyStatSchema.index({ date: 1, branchId: 1 }, { unique: true });

const dailyStatModel = mongoose.models.dailyStat || mongoose.model("dailyStat", dailyStatSchema);

export default dailyStatModel;
