/**
 * Migration Script: Convert string categories to Category documents
 * 
 * Run with: node scripts/migrateCategories.js
 * 
 * This script:
 * 1. Finds all distinct category strings from existing foods
 * 2. Creates Category documents for each
 * 3. Updates all food documents to reference the new Category ObjectIds
 */

import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

// Define schemas inline to avoid model conflicts
const categorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  image: { type: String, default: "" },
  isActive: { type: Boolean, default: true }
});

const oldFoodSchema = new mongoose.Schema({
  name: String,
  description: String,
  price: Number,
  image: String,
  category: mongoose.Schema.Types.Mixed, // Can be string or ObjectId
  isAvailable: { type: Boolean, default: true }
});

async function migrate() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URL);
    console.log("Connected!");

    const Category = mongoose.model("category", categorySchema);
    const Food = mongoose.model("food", oldFoodSchema);

    // Step 1: Get all foods with string categories
    const foods = await Food.find({});
    console.log(`Found ${foods.length} food items`);

    // Step 2: Extract distinct category strings
    const categoryStrings = [...new Set(
      foods
        .filter(f => typeof f.category === "string")
        .map(f => f.category)
    )];

    if (categoryStrings.length === 0) {
      console.log("No string categories found. Migration may have already been run.");
      await mongoose.disconnect();
      return;
    }

    console.log(`Found ${categoryStrings.length} distinct categories:`, categoryStrings);

    // Step 3: Create Category documents
    const categoryMap = {};
    for (const name of categoryStrings) {
      let category = await Category.findOne({ name });
      if (!category) {
        category = await Category.create({ name });
        console.log(`Created category: ${name}`);
      } else {
        console.log(`Category already exists: ${name}`);
      }
      categoryMap[name] = category._id;
    }

    // Step 4: Update food documents
    let updatedCount = 0;
    for (const food of foods) {
      if (typeof food.category === "string" && categoryMap[food.category]) {
        await Food.updateOne(
          { _id: food._id },
          { $set: { category: categoryMap[food.category] } }
        );
        updatedCount++;
      }
    }

    console.log(`Updated ${updatedCount} food items`);
    console.log("Migration complete!");

    await mongoose.disconnect();
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

migrate();
