import mongoose from "mongoose";

const ingredientSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    category: { type: String, required: true }, // Meat, Seafood, Vegetable, Spice, Dry, Drink, Other
    unit: { type: String, required: true }, // kg, g, liter, ml, pcs, can, bottle
    costPrice: { type: Number, required: false, default: 0 },
    lastUpdated: { type: Date, default: Date.now }
});

const ingredientModel = mongoose.models.ingredient || mongoose.model("ingredient", ingredientSchema);

export default ingredientModel;
