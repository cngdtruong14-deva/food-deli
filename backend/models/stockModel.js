import mongoose from "mongoose";

const stockSchema = new mongoose.Schema({
    ingredient: { type: mongoose.Schema.Types.ObjectId, ref: "ingredient", required: true },
    branch: { type: mongoose.Schema.Types.ObjectId, ref: "branch", default: null }, // Null means Central Warehouse
    quantity: { type: Number, default: 0 },
    minThreshold: { type: Number, default: 5 },
    lastUpdated: { type: Date, default: Date.now }
});

// Compound index to ensure one stock entry per ingredient per branch
stockSchema.index({ ingredient: 1, branch: 1 }, { unique: true });

const stockModel = mongoose.models.stock || mongoose.model("stock", stockSchema);

export default stockModel;
