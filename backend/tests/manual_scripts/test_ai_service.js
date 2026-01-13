import mongoose from 'mongoose';
import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// --- CONFIGURATION ---
const PYTHON_PORT = 5001;
const PYTHON_URL = `http://localhost:${PYTHON_PORT}`;
const MONGO_TIMEOUT = 5000;
const SEED_ORDER_COUNT = 100;
const KEEP_DATA = true; // Keep data for UI testing

// --- UTILS ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const log = (msg) => console.log(msg);
const errorLog = (msg) => console.error(msg);

// --- MAIN DIAGNOSTIC FLOW ---
async function runDiagnostics() {
    console.log("🔍 STARTING AI FORECASTING DATA SEEDER (REAL MENU MODE)...\n");

    // 0. ENV LOADING
    const envPath = path.resolve(__dirname, '../../.env');
    dotenv.config({ path: envPath });

    let mongoUri = process.env.MONGO_URI || process.env.MONGO_URL;
    if (!mongoUri) {
        errorLog("❌ CRITICAL: NO MONGO URI FOUND in .env");
        process.exit(1);
    }
    console.log(`🔑 Mongo URI Loaded: ${mongoUri.substring(0, 15)}...`);

    // 1. MONGODB CONNECTION
    try {
        await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: MONGO_TIMEOUT });
        console.log("✅ MongoDB Connected Successfully!");
    } catch (error) {
        errorLog(`❌ MongoDB Connection Failed: ${error.message}`);
        process.exit(1);
    }

    // 2. DEFINE SCHEMAS
    // Note: We use 'food' collection which should already be populated by seedVietnameseMenu.js
    const FoodSchema = new mongoose.Schema({ name: String, price: Number, image: String, category: String });
    const OrderSchema = new mongoose.Schema({ userId: String, items: Array, amount: Number, status: String, payment: Boolean, date: { type: Date, default: Date.now } });
    const IngredientSchema = new mongoose.Schema({ name: String, unit: String });
    const StockSchema = new mongoose.Schema({ ingredient: mongoose.Schema.Types.ObjectId, branch: mongoose.Schema.Types.ObjectId, quantity: Number });
    const RecipeSchema = new mongoose.Schema({ foodId: mongoose.Schema.Types.ObjectId, ingredients: Array });

    const FoodModel = mongoose.models.food || mongoose.model('food', FoodSchema);
    const OrderModel = mongoose.models.order || mongoose.model('order', OrderSchema);
    const IngredientModel = mongoose.models.ingredient || mongoose.model('ingredient', IngredientSchema);
    const StockModel = mongoose.models.stock || mongoose.model('stock', StockSchema);
    const RecipeModel = mongoose.models.recipe || mongoose.model('recipe', RecipeSchema);

    try {
        console.log(`\n🔎 Looking for 'COMBO 1' and 'COMBO 2' in database...`);
        const combo1 = await FoodModel.findOne({ name: "COMBO 1" });
        const combo2 = await FoodModel.findOne({ name: "COMBO 2" });

        if (!combo1 || !combo2) {
            errorLog("❌ ERROR: Could not find 'COMBO 1' or 'COMBO 2'.");
            errorLog("   👉 Please run: node backend/scripts/seedVietnameseMenu.js first!");
            process.exit(1);
        }
        console.log("✅ Found Combos:", combo1._id, combo2._id);

        console.log(`\n🌱 Preparing Data for ${SEED_ORDER_COUNT} orders (Last 30 days)...`);

        // A. Create/Find Ingredients (Clean old test ones if needed, or just append)
        // We'll create specific ingredients for these combos
        await IngredientModel.deleteMany({ name: { $in: ["Thịt Bò Ba Chỉ Mỹ", "Tôm Sú Tươi", "Rau Lẩu Tổng Hợp", "Gà Ri Thả Vườn", "Xôi Nếp Nương"] } });
        
        const ingredients = await IngredientModel.insertMany([
            { name: "Thịt Bò Ba Chỉ Mỹ", unit: "kg" },
            { name: "Tôm Sú Tươi", unit: "kg" },
            { name: "Rau Lẩu Tổng Hợp", unit: "set" },
            { name: "Gà Ri Thả Vườn", unit: "kg" },
            { name: "Xôi Nếp Nương", unit: "kg" }
        ]);
        const [beef, shrimp, veggies, chicken, stickyRice] = ingredients;
        
        // B. Create Stock (Central Warehouse - Branch null)
        await StockModel.deleteMany({ ingredient: { $in: ingredients.map(i => i._id) } });
        await StockModel.insertMany([
            { ingredient: beef._id, branch: null, quantity: 5 },    // Low (Demand will be high)
            { ingredient: shrimp._id, branch: null, quantity: 100 },
            { ingredient: veggies._id, branch: null, quantity: 200 },
            { ingredient: chicken._id, branch: null, quantity: 8 }, // Low
            { ingredient: stickyRice._id, branch: null, quantity: 50 }
        ]);

        // C. Create Recipes for the Real Combos
        // Clean old recipes for these foods
        await RecipeModel.deleteMany({ foodId: { $in: [combo1._id, combo2._id] } });
        
        await RecipeModel.insertMany([
            { 
                foodId: combo1._id, 
                ingredients: [
                    { ingredientId: beef._id, quantityNeeded: 0.5, unit: "kg" },
                    { ingredientId: shrimp._id, quantityNeeded: 0.3, unit: "kg" },
                    { ingredientId: veggies._id, quantityNeeded: 1, unit: "set" }
                ] 
            },
            { 
                foodId: combo2._id, 
                ingredients: [
                    { ingredientId: chicken._id, quantityNeeded: 1.2, unit: "kg" },
                    { ingredientId: stickyRice._id, quantityNeeded: 0.5, unit: "kg" }
                ] 
            }
        ]);

        // D. Generate Orders
        // Optional: Clean old diagnostic orders
        await OrderModel.deleteMany({ userId: "diag_user_combo_test" });

        const orders = [];
        const today = new Date();
        
        for (let i = 0; i < SEED_ORDER_COUNT; i++) {
            // Random date within last 30 days
            const daysAgo = Math.floor(Math.random() * 30);
            const orderDate = new Date(today);
            orderDate.setDate(today.getDate() - daysAgo);

            // Determine Items (Mostly Combo 1 and Combo 2)
            const rand = Math.random();
            let items = [];
            
            if (rand < 0.50) {
                // Combo 1
                items = [
                    { _id: combo1._id, price: combo1.price, quantity: 1, name: combo1.name }
                ];
            } else if (rand < 0.90) {
                // Combo 2
                items = [
                    { _id: combo2._id, price: combo2.price, quantity: 1, name: combo2.name }
                ];
            } else {
                // Both
                items = [
                    { _id: combo1._id, price: combo1.price, quantity: 1, name: combo1.name },
                    { _id: combo2._id, price: combo2.price, quantity: 1, name: combo2.name }
                ];
            }

            orders.push({
                userId: "diag_user_combo_test",
                items: items,
                amount: items.reduce((sum, item) => sum + (item.price * item.quantity), 0),
                status: "Served", // Completed status
                payment: true,
                date: orderDate
            });
        }

        await OrderModel.insertMany(orders);
        console.log(`✅ Successfully seeded ${orders.length} orders using 'COMBO 1' and 'COMBO 2'.`);

        // E. Call Forecast Endpoint
        console.log("\n🤖 Testing AI Forecast Endpoint...");
        try {
            const res = await axios.get(`${PYTHON_URL}/api/forecast/ingredients`);
            console.log("✅ Forecast Response Received!");
            
            const suggestions = res.data.data || [];
            console.log("\n📊 FORCAST RESULTS (Top 5):");
            console.log(JSON.stringify(suggestions.slice(0, 5), null, 2));
            
            if (suggestions.length > 0) {
                 console.log(`\nFound ${suggestions.length} suggestions.`);
            } else {
                 console.warn("⚠️ No suggestions returned. Check logic/data.");
            }

        } catch (err) {
            errorLog(`❌ Forecast Endpoint Failed: ${err.message}`);
        }

    } catch (error) {
        errorLog(`\n❌ SEEDING FAILED: ${error.message}`);
    } finally {
        if (KEEP_DATA) {
            console.log("\n💾 Data KEPT for UI Testing.");
            console.log("   Login as Admin -> Inventory -> 'Dự báo AI'.");
            console.log("   Check specifically for 'Thịt Bò Ba Chỉ Mỹ' and 'Gà Ri Thả Vườn'.");
        } else {
            // cleanup if needed
        }
        await mongoose.connection.close();
        process.exit(0);
    }
}

runDiagnostics();
