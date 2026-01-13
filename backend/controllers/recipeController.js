import recipeModel from "../models/recipeModel.js";
import ingredientModel from "../models/ingredientModel.js";
import foodModel from "../models/foodModel.js";
import userModel from "../models/userModel.js";

// Create or Update a Recipe
const saveRecipe = async (req, res) => {
  try {
    // Verify admin
    const userData = await userModel.findById(req.user ? req.user.id : req.body.userId);
    if (!userData || userData.role !== "admin") {
      return res.json({ success: false, message: "Không có quyền truy cập" });
    }

    const { foodId, ingredients, notes } = req.body;

    if (!foodId || !ingredients || ingredients.length === 0) {
      return res.json({ success: false, message: "Thiếu thông tin foodId hoặc ingredients" });
    }

    // Verify food exists
    const food = await foodModel.findById(foodId);
    if (!food) {
      return res.json({ success: false, message: "Không tìm thấy món ăn" });
    }

    // Calculate total cost from ingredients
    let calculatedCost = 0;
    for (const ing of ingredients) {
      const ingredientData = await ingredientModel.findById(ing.ingredientId);
      if (ingredientData) {
        // Cost = costPrice per unit * quantity needed
        calculatedCost += (ingredientData.costPrice || 0) * ing.quantityNeeded;
      }
    }

    // Round to 2 decimal places
    calculatedCost = Math.round(calculatedCost * 100) / 100;

    // Upsert recipe
    const recipe = await recipeModel.findOneAndUpdate(
      { foodId },
      { 
        foodId,
        ingredients,
        calculatedCost,
        notes: notes || ""
      },
      { upsert: true, new: true }
    );

    // Update food's costPrice
    await foodModel.findByIdAndUpdate(foodId, { costPrice: calculatedCost });

    res.json({ 
      success: true, 
      message: "Lưu công thức thành công",
      data: recipe,
      calculatedCost
    });
  } catch (error) {
    console.error("Save recipe error:", error);
    res.json({ success: false, message: "Lỗi: " + error.message });
  }
};

// Get recipe for a specific food
const getRecipe = async (req, res) => {
  try {
    const { foodId } = req.params;
    
    const recipe = await recipeModel
      .findOne({ foodId })
      .populate("ingredients.ingredientId", "name unit costPrice stock");

    if (!recipe) {
      return res.json({ success: true, data: null, message: "Chưa có công thức" });
    }

    res.json({ success: true, data: recipe });
  } catch (error) {
    console.error("Get recipe error:", error);
    res.json({ success: false, message: "Lỗi: " + error.message });
  }
};

// List all recipes (Admin)
const listRecipes = async (req, res) => {
  try {
    // Verify admin
    const userData = await userModel.findById(req.user ? req.user.id : req.body.userId);
    if (!userData || userData.role !== "admin") {
      return res.json({ success: false, message: "Không có quyền truy cập" });
    }

    const recipes = await recipeModel
      .find({})
      .populate("foodId", "name price image category")
      .populate("ingredients.ingredientId", "name unit costPrice stock")
      .sort({ updatedAt: -1 });

    res.json({ success: true, data: recipes });
  } catch (error) {
    console.error("List recipes error:", error);
    res.json({ success: false, message: "Lỗi: " + error.message });
  }
};

// Delete a recipe
const deleteRecipe = async (req, res) => {
  try {
    // Verify admin
    const userData = await userModel.findById(req.user ? req.user.id : req.body.userId);
    if (!userData || userData.role !== "admin") {
      return res.json({ success: false, message: "Không có quyền truy cập" });
    }

    const { foodId } = req.params;
    
    await recipeModel.findOneAndDelete({ foodId });
    
    // Reset food's costPrice to 0
    await foodModel.findByIdAndUpdate(foodId, { costPrice: 0 });

    res.json({ success: true, message: "Xóa công thức thành công" });
  } catch (error) {
    console.error("Delete recipe error:", error);
    res.json({ success: false, message: "Lỗi: " + error.message });
  }
};

// Recalculate all recipe costs (useful when ingredient prices change)
const recalculateAllCosts = async (req, res) => {
  try {
    // Verify admin
    const userData = await userModel.findById(req.user ? req.user.id : req.body.userId);
    if (!userData || userData.role !== "admin") {
      return res.json({ success: false, message: "Không có quyền truy cập" });
    }

    const recipes = await recipeModel.find({});
    let updated = 0;

    for (const recipe of recipes) {
      let calculatedCost = 0;
      
      for (const ing of recipe.ingredients) {
        const ingredientData = await ingredientModel.findById(ing.ingredientId);
        if (ingredientData) {
          calculatedCost += (ingredientData.costPrice || 0) * ing.quantityNeeded;
        }
      }

      calculatedCost = Math.round(calculatedCost * 100) / 100;

      // Update recipe and food
      await recipeModel.findByIdAndUpdate(recipe._id, { calculatedCost });
      await foodModel.findByIdAndUpdate(recipe.foodId, { costPrice: calculatedCost });
      updated++;
    }

    res.json({ 
      success: true, 
      message: `Đã cập nhật giá vốn cho ${updated} công thức` 
    });
  } catch (error) {
    console.error("Recalculate costs error:", error);
    res.json({ success: false, message: "Lỗi: " + error.message });
  }
};

export { saveRecipe, getRecipe, listRecipes, deleteRecipe, recalculateAllCosts };
