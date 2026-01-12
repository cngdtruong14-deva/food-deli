// ============================================
// HIGH PRIORITY FIXES FOR reviewController.js
// ============================================
// Apply these fixes to: backend/controllers/reviewController.js

// ============ FIX 1: Race Condition Prevention (Use Unique Index) ============
// Location: reviewModel.js - ADD THIS TO SCHEMA

// In: backend/models/reviewModel.js
// ADD unique constraint:
/*
import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true },
  order: { type: mongoose.Schema.Types.ObjectId, ref: "order", required: true, unique: true }, // ← ADD unique: true
  branch: { type: mongoose.Schema.Types.ObjectId, ref: "branch" },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, default: "" },
  images: [{ type: String }],
  adminReply: {
    text: String,
    repliedAt: Date,
    repliedBy: { type: mongoose.Schema.Types.ObjectId, ref: "user" }
  }
}, { timestamps: true });

// Create unique index (if not already exists)
reviewSchema.index({ order: 1 }, { unique: true });

export default mongoose.model("review", reviewSchema);
*/

// ============ FIX 2: Improved submitReview with Race Condition Handling ============
// Location: submitReview() function, replace lines 49-65

// REPLACE THIS:
// Check if already reviewed
const existingReview = await reviewModel.findOne({ order: orderId });
if (existingReview) {
  return res.json({ success: false, message: "Đơn hàng này đã được đánh giá rồi" });
}

// Create review
const review = new reviewModel({
  user: userId,
  order: orderId,
  branch: order.branchId || null,
  rating: Math.round(rating),
  comment: comment || "",
  images: images || [],
});

await review.save();

// WITH THIS:
// ============ HIGH PRIORITY FIX: Atomic duplicate check ============
// Try to create review - unique index will prevent duplicates
let review;
try {
  review = new reviewModel({
    user: userId,
    order: orderId,
    branch: order.branchId || null,
    rating: Math.round(rating),
    comment: comment || "",
    images: images || [],
  });

  await review.save();
} catch (error) {
  // Check if it's a duplicate key error (MongoDB error code 11000)
  if (error.code === 11000 || error.code === 11001) {
    return res.json({ success: false, message: "Đơn hàng này đã được đánh giá rồi" });
  }
  
  // If it's a different error, check manually as fallback
  const existingReview = await reviewModel.findOne({ order: orderId });
  if (existingReview) {
    return res.json({ success: false, message: "Đơn hàng này đã được đánh giá rồi" });
  }
  
  // Re-throw if it's a different error
  throw error;
}

// ============ FIX 3: Explicit Status Validation ============
// Location: submitReview() function, replace lines 40-47

// REPLACE THIS:
// Check order status - only allow review for completed orders
const validStatuses = ["Delivered", "Served", "Paid"];
if (!validStatuses.includes(order.status)) {
  return res.json({ 
    success: false, 
    message: `Chỉ có thể đánh giá đơn hàng đã hoàn thành (${validStatuses.join(", ")})` 
  });
}

// WITH THIS:
// ============ HIGH PRIORITY FIX: Explicit status validation ============
const validStatuses = ["Delivered", "Served", "Paid"];
const invalidStatuses = ["Cancelled", "Refunded", "Pending", "Confirmed"];

// First check: Explicitly block invalid statuses
if (invalidStatuses.includes(order.status)) {
  return res.json({ 
    success: false, 
    message: `Không thể đánh giá đơn hàng với trạng thái: ${order.status}. Chỉ có thể đánh giá đơn hàng đã hoàn thành.` 
  });
}

// Second check: Only allow valid statuses
if (!validStatuses.includes(order.status)) {
  return res.json({ 
    success: false, 
    message: `Chỉ có thể đánh giá đơn hàng đã hoàn thành (${validStatuses.join(", ")})` 
  });
}

// ============ FIX 4: Floating Point Precision Fix ============
// Location: getProductReviews() function, replace line 338

// REPLACE THIS:
stats: {
  averageRating: parseFloat(statResult.averageRating.toFixed(1)),
  totalReviews: statResult.totalReviews,
  // ...
}

// WITH THIS:
// ============ HIGH PRIORITY FIX: Proper floating point handling ============
const rawAvg = statResult.averageRating || 0;
// Round to 1 decimal place, avoiding floating point errors
const roundedAvg = Math.round(rawAvg * 10) / 10;
// Clamp to valid range (0-5)
const clampedAvg = Math.max(0, Math.min(5, roundedAvg));

stats: {
  averageRating: clampedAvg,
  totalReviews: statResult.totalReviews,
  distribution: {
    1: statResult.star1,
    2: statResult.star2,
    3: statResult.star3,
    4: statResult.star4,
    5: statResult.star5
  }
}

// ============ FIX 5: Update foodModel averageRating setter ============
// Location: backend/models/foodModel.js, line 16

// REPLACE THIS:
averageRating: { type: Number, default: 0, set: (v) => Math.round(v * 10) / 10 }

// WITH THIS:
averageRating: { 
  type: Number, 
  default: 0, 
  set: (v) => {
    if (typeof v !== 'number' || isNaN(v)) return 0;
    const rounded = Math.round(v * 10) / 10;
    return Math.max(0, Math.min(5, rounded)); // Clamp to valid range 0-5
  }
}
