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
    // Filter out deleted items
    const foods = await foodModel.find({ isDeleted: { $ne: true } }).populate("category");
    
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

// remove food item (Soft Delete)
const removeFood = async (req, res) => {
  try {
    let userData = await userModel.findById(req.body.userId);
    if (!userData || userData.role !== "admin") {
      return res.json({ success: false, message: "You are not admin" });
    }

    const food = await foodModel.findByIdAndUpdate(req.body.id, { isDeleted: true });
    if (food) {
        // Do not unlink file yet
      res.json({ success: true, message: "Food moved to Trash" });
    } else {
      res.json({ success: false, message: "Food not found" });
    }
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error" });
  }
};

// list trash foods
const listTrashFood = async (req, res) => {
  try {
    const foods = await foodModel.find({ isDeleted: true }).populate("category");
    
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
    res.json({ success: false, message: "Error fetching trash" });
  }
};

// restore food item
const restoreFood = async (req, res) => {
  try {
    let userData = await userModel.findById(req.body.userId);
    if (!userData || userData.role !== "admin") {
        return res.json({ success: false, message: "You are not admin" });
    }
    const food = await foodModel.findByIdAndUpdate(req.body.id, { isDeleted: false });
    if(food) {
        res.json({ success: true, message: "Food Restored" });
    } else {
        res.json({ success: false, message: "Food not found" });
    }
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error restoring food" });
  }
};

// force delete food item
const forceDeleteFood = async (req, res) => {
  try {
    let userData = await userModel.findById(req.body.userId);
    if (!userData || userData.role !== "admin") {
      return res.json({ success: false, message: "You are not admin" });
    }

    const food = await foodModel.findById(req.body.id);
    if (food) {
      fs.unlink(`uploads/${food.image}`, () => {});
      await foodModel.findByIdAndDelete(req.body.id);
      res.json({ success: true, message: "Food Permanently Deleted" });
    } else {
      res.json({ success: false, message: "Food not found" });
    }
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error deleting food" });
  }
};

// update food item
const updateFood = async (req, res) => {
  try {
    let userData = await userModel.findById(req.body.userId);
    // Note: auth middleware usually puts userId in body, but if using form-data, ensure userId is passed or extracted from token
    // If using authMiddleware (which we are), req.body.userId comes from the token decoding in middleware (if middleware sets it).
    // Let's assume middleware does: req.body.userId = decoded.id.
    
    if (!userData || userData.role !== 'admin') {
      return res.json({ success: false, message: "You are not admin" });
    }

    const { id, name, description, price, category, stock } = req.body;
    
    const food = await foodModel.findById(id);
    if (!food) {
        return res.json({ success: false, message: "Food not found" });
    }

    // Find category ID if name is passed
    let categoryId = category;
    let categoryObj = null;

    // Check if category is a valid ObjectId (24 hex characters)
    if (category && category.match(/^[0-9a-fA-F]{24}$/)) {
        categoryObj = await categoryModel.findById(category);
    }

    if (!categoryObj) {
        categoryObj = await categoryModel.findOne({ name: category });
    }

    if (categoryObj) {
        categoryId = categoryObj._id;
    } 

    const updateData = {
        name,
        description,
        price,
        stock
    };
    
    if (categoryId) {
        updateData.category = categoryId;
    }
    
    // Handle Image Update
    if (req.file) {
        // Delete old image
        fs.unlink(`uploads/${food.image}`, (err) => {
            if (err) console.log("Failed to delete old image:", err);
        });
        updateData.image = req.file.filename;
    }

    await foodModel.findByIdAndUpdate(id, updateData);
    res.json({ success: true, message: "Food Updated" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error updating food" });
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

export { addFood, listFood, removeFood, listCategories, listTrashFood, restoreFood, forceDeleteFood, updateFood };
