import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema({
  _id: { type: String, required: true }, // Keep original Food ID
  name: { type: String, required: true },
  price: { type: Number, required: true },
  image: { type: String, required: true },
  quantity: { type: Number, required: true },
  note: { type: String, default: "" },
}, { _id: false });

export default orderItemSchema;
