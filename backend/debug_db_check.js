import mongoose from "mongoose";
import "dotenv/config";
import foodModel from "./models/foodModel.js";
import categoryModel from "./models/categoryModel.js";

async function run() {
    try {
        console.log("Connecting to DB...");
        if (!process.env.MONGO_URL) {
            console.error("❌ MONGO_URL is missing in .env");
            process.exit(1);
        }
        
        await mongoose.connect(process.env.MONGO_URL);
        console.log("✅ DB Connected!");
        
        const foodCount = await foodModel.countDocuments({});
        console.log(`🍎 Food Count: ${foodCount}`);
        
        const catCount = await categoryModel.countDocuments({});
        console.log(`📂 Category Count: ${catCount}`);

        if (foodCount > 0) {
            const sample = await foodModel.findOne({});
            console.log("Sample Food:", sample);
        } else {
            console.log("⚠️ No food items found! Did you seed the database?");
        }

        process.exit(0);
    } catch (error) {
        console.error("❌ Error:", error);
        process.exit(1);
    }
}
run();
