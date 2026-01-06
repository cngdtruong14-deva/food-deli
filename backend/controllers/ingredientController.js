import ingredientModel from "../models/ingredientModel.js";

// Add ingredient
const addIngredient = async (req, res) => {
    try {
        const ingredient = new ingredientModel({
            name: req.body.name,
            category: req.body.category,
            unit: req.body.unit,
            stock: req.body.stock,
            minStock: req.body.minStock,
            costPrice: req.body.costPrice
        });
        await ingredient.save();
        res.json({ success: true, message: "Ingredient Added" });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Error" });
    }
}

// List ingredients
const listIngredients = async (req, res) => {
    try {
        const ingredients = await ingredientModel.find({});
        res.json({ success: true, data: ingredients });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Error" });
    }
}

// Update ingredient (Stock or Details)
const updateIngredient = async (req, res) => {
    try {
        const { id, stock, minStock, costPrice, name, category, unit } = req.body;
        
        // Build update object based on provided fields
        const updateData = {};
        if (stock !== undefined) updateData.stock = stock;
        if (minStock !== undefined) updateData.minStock = minStock;
        if (costPrice !== undefined) updateData.costPrice = costPrice;
        if (name) updateData.name = name;
        if (category) updateData.category = category;
        if (unit) updateData.unit = unit;
        
        updateData.lastUpdated = Date.now();

        await ingredientModel.findByIdAndUpdate(req.body.id, updateData);
        res.json({ success: true, message: "Ingredient Updated" });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Error" });
    }
}

// Remove ingredient
const removeIngredient = async (req, res) => {
    try {
        const ingredient = await ingredientModel.findById(req.body.id);
        await ingredientModel.findByIdAndDelete(req.body.id);
        res.json({ success: true, message: "Ingredient Removed" });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Error" });
    }
}

export { addIngredient, listIngredients, updateIngredient, removeIngredient };
