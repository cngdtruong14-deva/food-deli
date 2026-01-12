import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "user", 
    required: true 
  },
  order: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "order", 
    required: true,
    unique: true // One review per order
  },
  branch: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "branch" 
  },
  rating: { 
    type: Number, 
    min: 1, 
    max: 5, 
    required: true 
  },
  comment: { 
    type: String, 
    maxLength: 500 
  },
  images: [{ 
    type: String 
  }],
  // Admin reply to the review
  adminReply: {
    text: { type: String, maxLength: 500 },
    repliedAt: { type: Date },
    repliedBy: { type: mongoose.Schema.Types.ObjectId, ref: "user" }
  },
}, { timestamps: true });

// Index for efficient queries
reviewSchema.index({ branch: 1, createdAt: -1 });
reviewSchema.index({ user: 1 });
// HIGH PRIORITY FIX: Explicit unique index on order (ensures one review per order)
reviewSchema.index({ order: 1 }, { unique: true });
// Index for rating-based queries
reviewSchema.index({ rating: -1, createdAt: -1 });

const reviewModel = mongoose.models.review || mongoose.model("review", reviewSchema);

export default reviewModel;
