import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, unique: true, sparse: true },
    phone: { type: String, unique: true, sparse: true },
    password: { type: String },
    role: { 
      type: String, 
      enum: ["customer", "staff", "manager", "admin"], 
      default: "customer" 
    },
    branchId: { type: mongoose.Schema.Types.ObjectId, ref: "branch", default: null },
    cartData: { type: Object, default: {} },
    isDeleted: { type: Boolean, default: false }, // Soft Delete
  },
  { minimize: false }
);

const userModel = mongoose.models.user || mongoose.model("user", userSchema);
export default userModel;
