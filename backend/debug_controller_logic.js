import mongoose from "mongoose";
import ingredientModel from "./models/ingredientModel.js";
import stockModel from "./models/stockModel.js";
import { connectDB } from "./config/db.js";
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

const debugController = async () => {
    try {
        await connectDB();
        console.log("✅ DB Connected");

        // Simulate Query Params
        const branchId = 'null'; // Frontend sends string 'null'
        
        // Logic from Controller
        const queryBranch = (branchId === 'null' || branchId === '' || !branchId) ? null : branchId;
        console.log(`ℹ️ Resolved Query Branch: ${queryBranch}`);

        // 1. Fetch All Ingredients
        const ingredients = await ingredientModel.find({});
        console.log(`ℹ️ Found ${ingredients.length} ingredients`);

        // 2. Fetch Stock 
        const stocks = await stockModel.find({ branch: queryBranch });
        console.log(`ℹ️ Found ${stocks.length} stock entries for branch ${queryBranch}`);

        // Map
        const stockMap = new Map();
        stocks.forEach(s => {
            stockMap.set(s.ingredient.toString(), s);
        });

        // Merge
        const mergedData = ingredients.map(ing => {
            const stockEntry = stockMap.get(ing._id.toString());
            return {
                _id: ing._id,
                name: ing.name,
                stock: stockEntry ? stockEntry.quantity : 0
            };
        });

        console.log("ℹ️ First 5 merged items:");
        console.log(mergedData.slice(0, 5));

        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

debugController();
