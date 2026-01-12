import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import mongoose from "mongoose";
import ingredientModel from "../models/ingredientModel.js";
import stockModel from "../models/stockModel.js";
import { connectDB } from "../config/db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const migrateStock = async () => {
    try {
        await connectDB();
        console.log("✅ Database connected for migration");

        // 1. Fetch all ingredients (Master Data)
        // Since we removed the schema fields, Mongoose might not return 'stock' unless we use strict: false 
        // OR we use direct collection access. But wait, we just updated the schema file, 
        // the ACTUAL DB documents still have 'stock' field until we overwrite them or drop them. 
        // Effectively, Mongoose will ignore fields not in schema unless we explicitely ask for them or use lean().
        // Actually, if we just updated the code, the data is still in Mongo. 
        // We probably need to define a temporary schema to read the old data OR rely on lean() returning everything.
        
        // Let's use a temporary schema to be safe and read the old data
        const tempSchema = new mongoose.Schema({
            name: String, 
            unit: String, 
            stock: Number, 
            minStock: Number 
        }, { strict: false });
        
        const TempIngredientModel = mongoose.model("temp_ingredient", tempSchema, "ingredients"); // force collection name

        const allIngredients = await TempIngredientModel.find({});
        console.log(`📝 Found ${allIngredients.length} ingredients to migrate...`);

        let migratedCount = 0;

        for (const ing of allIngredients) {
            // Check if stock entry enables
            const existingStock = await stockModel.findOne({ ingredient: ing._id, branch: null });
            
            if (!existingStock) {
                // Determine quantity from old field. If undefined, default to 0.
                const oldStock = ing.stock || 0;
                const oldMin = ing.minStock || 5;

                await stockModel.create({
                    ingredient: ing._id,
                    branch: null, // Central Warehouse
                    quantity: oldStock,
                    minThreshold: oldMin,
                    lastUpdated: new Date()
                });
                migratedCount++;
            }
        }

        console.log(`✅ Successfully migrated ${migratedCount} stock entries to Central Warehouse.`);
        
        // Optional: Remove stock/minStock fields from actual documents
        // console.log("🧹 Cleaning up old fields from Ingredient collection...");
        // await TempIngredientModel.updateMany({}, { $unset: { stock: "", minStock: "" } });
        // console.log("✨ Cleanup complete.");

        process.exit(0);
    } catch (error) {
        console.error("❌ Migration failed:", error);
        process.exit(1);
    }
};

migrateStock();
