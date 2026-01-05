import foodModel from "../models/foodModel.js";
import categoryModel from "../models/categoryModel.js";
import userModel from "../models/userModel.js";
import fs from "fs";

// add food items
const addFood = async (req, res) => {
  try {
    let userData = await userModel.findById(req.body.userId);
    if (!userData || userData.role !== "admin") {
      return res.json({ success: false, message: "You are not admin" });
    }

    // Find or create category
    let category = await categoryModel.findById(req.body.categoryId);
    if (!category) {
      // Fallback: try to find by name if categoryId is actually a name string (backwards compat)
      category = await categoryModel.findOne({ name: req.body.category });
      if (!category && req.body.category) {
        // Create new category if it doesn't exist
        category = await categoryModel.create({ name: req.body.category });
      }
    }

    if (!category) {
      return res.json({ success: false, message: "Invalid category" });
    }

    let image_filename = `${req.file.filename}`;
    const food = new foodModel({
      name: req.body.name,
      description: req.body.description,
      price: req.body.price,
      category: category._id,
      image: image_filename,
      stock: req.body.stock || 100,
    });

    await food.save();
    res.json({ success: true, message: "Food Added" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error" });
  }
};

// all foods
const listFood = async (req, res) => {
  try {
    const foods = await foodModel.find({}).populate("category");
    
    // Flatten response for frontend compatibility
    const flattenedFoods = foods.map(food => ({
      _id: food._id,
      name: food.name,
      description: food.description,
      price: food.price,
      image: food.image,
      category: food.category ? food.category.name : "Uncategorized",
      isAvailable: food.isAvailable,
      stock: food.stock,
      trackStock: food.trackStock
    }));
    
    res.json({ success: true, data: flattenedFoods });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error" });
  }
};

// remove food item
const removeFood = async (req, res) => {
  try {
    let userData = await userModel.findById(req.body.userId);
    if (!userData || userData.role !== "admin") {
      return res.json({ success: false, message: "You are not admin" });
    }

    const food = await foodModel.findById(req.body.id);
    if (food) {
      fs.unlink(`uploads/${food.image}`, () => {});
      await foodModel.findByIdAndDelete(req.body.id);
      res.json({ success: true, message: "Food Removed" });
    } else {
      res.json({ success: false, message: "Food not found" });
    }
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error" });
  }
};

// list categories
const listCategories = async (req, res) => {
  try {
    const categories = await categoryModel.find({ isActive: true });
    res.json({ success: true, data: categories });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error" });
  }
};

export { addFood, listFood, removeFood, listCategories };
