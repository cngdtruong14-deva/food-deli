import mongoose from "mongoose";

const addressSchema = new mongoose.Schema({
  firstName: { type: String, default: "" },
  lastName: { type: String, default: "" },
  email: { type: String, default: "" },
  phone: { type: String, default: "" },
  street: { type: String, default: "" },
  city: { type: String, default: "" },
  state: { type: String, default: "" },
  zipcode: { type: String, default: "" },
  country: { type: String, default: "Vietnam" },
}, { _id: false, strict: true });

export default addressSchema;
