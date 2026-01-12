import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import mongoose from "mongoose";
import stockModel from "../models/stockModel.js";
import ingredientModel from "../models/ingredientModel.js";
import { connectDB } from "../config/db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const checkStats = async () => {
    try {
        await connectDB();
        console.log("✅ Database connected");

        const stockCount = await stockModel.countDocuments();
        const ingredientCount = await ingredientModel.countDocuments();

        console.log(`📊 Statistics:`);
        console.log(`   - Total Ingredients: ${ingredientCount}`);
        console.log(`   - Total Stock Records: ${stockCount}`);

        const centralStocks = await stockModel.countDocuments({ branch: null });
        console.log(`   - Central Warehouse Items: ${centralStocks}`);

        // Sample check
        const sample = await stockModel.findOne().populate('ingredient');
        if (sample) {
            console.log(`🔍 Sample Stock Record:`);
            console.log(`   - Ingredient: ${sample.ingredient.name}`);
            console.log(`   - Branch: ${sample.branch || "Central Warehouse"}`);
            console.log(`   - Quantity: ${sample.quantity} ${sample.ingredient.unit}`);
        } else {
            console.log("⚠️ No stocks found!");
        }

        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

checkStats();
