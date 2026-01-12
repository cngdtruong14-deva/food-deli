import mongoose from "mongoose";

const foodSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  image: { type: String, required: true },
  category: { type: mongoose.Schema.Types.ObjectId, ref: "category", required: true },
  isAvailable: { type: Boolean, default: true },
  stock: { type: Number, default: 100 },
  trackStock: { type: Boolean, default: true },
  isDeleted: { type: Boolean, default: false },
  costPrice: { type: Number, default: 0 },
  originalPrice: { type: Number, default: 0 }, // For "Savings" calculation
  soldCount: { type: Number, default: 0 },
  averageRating: { type: Number, default: 0, set: (v) => Math.round(v * 10) / 10 },
  totalReviews: { type: Number, default: 0 }
});

// TASK 1: Text Search Index
foodSchema.index({ name: 'text', description: 'text', category: 'text' }, { weights: { name: 10, category: 5, description: 1 } }); 
// TASK 3: Compound Index for Category Filter + Price Sort (ESR Rule)
foodSchema.index({ category: 1, price: 1 });

// HIGH PRIORITY FIX: Missing Indexes for Performance
// Index for "Bán chạy nhất" sorting
foodSchema.index({ soldCount: -1 });
// Index for rating-based sorting/filtering
foodSchema.index({ averageRating: -1 });
// Compound index for category + popularity queries
foodSchema.index({ category: 1, soldCount: -1 });
// Compound index for category + rating queries
foodSchema.index({ category: 1, averageRating: -1 });
// Index for availability filtering
foodSchema.index({ isAvailable: 1, isDeleted: 1 });

const foodModel = mongoose.models.food || mongoose.model("food", foodSchema);

export default foodModel;
