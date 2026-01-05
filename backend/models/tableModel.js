import mongoose from "mongoose";

const tableSchema = new mongoose.Schema({
  branchId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "branch", 
    required: true,
    index: true 
  },
  tableNumber: { type: String, required: true },
  capacity: { type: Number, default: 4 },
  status: { 
    type: String, 
    enum: ["Available", "Occupied", "Reserved"], 
    default: "Available" 
  },
  qrCode: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now }
});

// Compound index for unique table numbers per branch
tableSchema.index({ branchId: 1, tableNumber: 1 }, { unique: true });

const tableModel = mongoose.models.table || mongoose.model("table", tableSchema);

export default tableModel;
