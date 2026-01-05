import mongoose from "mongoose";

const branchSchema = new mongoose.Schema({
  name: { type: String, required: true },
  address: { type: String, required: true },
  phone: { type: String, default: "" },
  image: { type: String, default: "" },
  openingHours: { type: String, default: "" },
  capacity: { type: String, default: "" },
  floors: { type: String, default: "" },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

const branchModel = mongoose.models.branch || mongoose.model("branch", branchSchema);

export default branchModel;
