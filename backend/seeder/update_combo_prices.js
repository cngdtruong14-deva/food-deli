
import mongoose from "mongoose";
import dotenv from "dotenv";
import { fileURLToPath } from 'url';
import path from 'path';
import foodModel from "../models/foodModel.js";
import { connectDB } from "../config/db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const updatePrices = async () => {
    try {
        await connectDB();
        console.log("✅ DB Connected");

        // Fallback or Specific Updates for Combos shown in screenshot
        const updates = [
            { name: "COMBO 4", price: 1483000, original: 1680000 },
            { name: "COMBO 5", price: 1495000, original: 1750000 },
            { name: "COMBO 6", price: 1582000, original: 1850000 }
        ];

        for (const update of updates) {
            const food = await foodModel.findOneAndUpdate(
                { name: update.name },
                { 
                    price: update.price,
                    originalPrice: update.original
                },
                { new: true }
            );
            if (food) {
                console.log(`✅ Updated ${food.name}: Price ${food.price}, Original ${food.originalPrice}`);
            } else {
                console.log(`⚠️ Could not find ${update.name}`);
            }
        }
        
        console.log("Done");
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

updatePrices();
