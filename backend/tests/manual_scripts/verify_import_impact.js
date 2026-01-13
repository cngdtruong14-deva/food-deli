
import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { connectDB } from "../../config/db.js";

import stockModel from "../../models/stockModel.js";
import stockTransactionModel from "../../models/stockTransactionModel.js";
import ingredientModel from "../../models/ingredientModel.js";
import importReceiptModel from "../../models/importReceiptModel.js";
import supplierModel from "../../models/supplierModel.js";
import userModel from "../../models/userModel.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const runVerification = async () => {
    try {
        console.log("🚀 Starting Import Logic Verification...");
        
        // 1. Connect
        if (!process.env.MONGO_URI && !process.env.MONGO_URL) {
            console.error("❌ MONGO_URI missing");
            process.exit(1);
        }
        await connectDB();
        await new Promise(r => setTimeout(r, 1000));
        console.log("✅ DB Connected");

        // 2. Setup Test Data
        const admin = await userModel.findOne({ email: "admin@demo.com" });
        if (!admin) throw new Error("Admin not found");

        const supplier = await supplierModel.findOne();
        if (!supplier) throw new Error("No supplier found");

        // Create a TEST INGREDIENT to avoid messing up real data
        const testIngName = `Test-Ing-${Date.now()}`;
        const ingredient = await ingredientModel.create({
            name: testIngName,
            unit: "kg",
            costPrice: 50000,
            category: "OTHER"
        });
        console.log(`Created Test Ingredient: ${ingredient.name} (Initial Cost: 50,000)`);

        // Check Initial Stock (Should be 0)
        const initialStock = await stockModel.findOne({ ingredient: ingredient._id, branch: null });
        const startQty = initialStock ? initialStock.quantity : 0;
        console.log(`Initial Stock: ${startQty}`);

        // 3. Create Receipt
        const receipt = await importReceiptModel.create({
            code: `TEST-REC-${Date.now()}`,
            supplier: supplier._id,
            branch: null, // Central
            items: [{
                ingredient: ingredient._id,
                ingredientName: ingredient.name,
                quantity: 10,
                unit: "kg",
                pricePerUnit: 60000, // Higher than 50k
                total: 600000
            }],
            totalAmount: 600000,
            status: 'PENDING',
            createdBy: admin._id
        });
        console.log(`Created Pending Receipt: ${receipt.code}`);

        // 4. Mimic "Complete Receipt" Logic (Robust Version)
        console.log("Executing Completion Logic...");
        
        let session = await mongoose.startSession();
        let transactionStarted = false;
        try {
            session.startTransaction();
            transactionStarted = true;
        } catch (e) {
            console.log("⚠️ Transactions not supported (Fallback used)");
            session.endSession();
            session = null;
        }

        const opts = session ? { session } : {};
        
        const item = receipt.items[0]; // Single item loop

        // A. Update/Create Stock
        let stock = await stockModel.findOne({ ingredient: item.ingredient, branch: null }).setOptions(opts);
        const previousQty = stock ? stock.quantity : 0;
        const newQty = previousQty + item.quantity;
        
        if (stock) {
            stock.quantity = newQty;
            await stock.save(opts);
        } else {
            const arr = await stockModel.create([{ 
                ingredient: item.ingredient, 
                branch: null, 
                quantity: newQty 
            }], session ? { session } : {});
            stock = arr[0];
        }

        // B. Update Cost Price (WMA)
        // (10 * 60000) / 10 = 60000 (Since prevQty was 0)
        // Actually, if created via seed, stock might be 0 but costPrice 50000?
        // Wait, creating ingredient sets costPrice=50000.
        // PrevQty=0.
        // Value = 0 * 50k + 10 * 60k = 600,000.
        // TotalQty = 10.
        // New Cost = 60,000.
        const ingDoc = await ingredientModel.findById(item.ingredient).setOptions(opts);
        const oldValue = previousQty * (ingDoc.costPrice || 0);
        const newValue = item.quantity * item.pricePerUnit;
        const totalQty = previousQty + item.quantity;
        if (totalQty > 0) {
            ingDoc.costPrice = Math.round((oldValue + newValue) / totalQty);
            await ingDoc.save(opts);
        }

        // C. Transaction Log
        await stockTransactionModel.create([{
            stock: stock._id,
            ingredient: item.ingredient,
            branch: null,
            type: 'IMPORT',
            quantity: item.quantity,
            previousQty,
            newQty,
            reason: 'Test Import',
            referenceId: receipt.code
        }], session ? { session } : {});

        // D. Update Receipt
        receipt.status = 'COMPLETED';
        await receipt.save(opts);

        if (transactionStarted) {
            await session.commitTransaction();
            session.endSession();
        }

        console.log("✅ Logic Executed.");

        // 5. Verification
        const finalStock = await stockModel.findOne({ ingredient: ingredient._id, branch: null });
        const finalIng = await ingredientModel.findById(ingredient._id);
        const trans = await stockTransactionModel.findOne({ referenceId: receipt.code });

        console.log("\n--- VERIFICATION RESULTS ---");
        console.log(`Expected Quantity: ${startQty + 10}`);
        console.log(`Actual Quantity:   ${finalStock.quantity}`);
        console.log(`Stock Update:      ${finalStock.quantity === startQty + 10 ? '✅ PASS' : '❌ FAIL'}`);

        console.log(`Expected Cost:     60000`);
        console.log(`Actual Cost:       ${finalIng.costPrice}`);
        console.log(`Cost Update:       ${finalIng.costPrice === 60000 ? '✅ PASS' : '❌ FAIL'}`);

        console.log(`Transaction Log:   ${trans ? '✅ FOUND' : '❌ MISSING'}`);
        if(trans) {
             console.log(`Trans Type:        ${trans.type} (${trans.type === 'IMPORT' ? '✅' : '❌'})`);
             console.log(`Trans Qty:         ${trans.quantity} (${trans.quantity === 10 ? '✅' : '❌'})`);
        }

    } catch (error) {
        console.error("❌ ERROR:", error);
    } finally {
        await mongoose.connection.close();
    }
};

runVerification();
