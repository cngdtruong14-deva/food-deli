
import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import stockModel from "../../models/stockModel.js";
import stockTransactionModel from "../../models/stockTransactionModel.js";
import ingredientModel from "../../models/ingredientModel.js";
import importReceiptModel from "../../models/importReceiptModel.js";
import supplierModel from "../../models/supplierModel.js";
import userModel from "../../models/userModel.js";

import { connectDB } from "../../config/db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') }); // Point to backend/.env

const runDebug = async () => {
    try {
        console.log("Loading Env from:", path.resolve(__dirname, '../../.env'));
        if (!process.env.MONGO_URI && !process.env.MONGO_URL) {
            console.error("❌ MONGO_URI is missing from env!");
            process.exit(1);
        }

        console.log("Connecting to DB...");
        await connectDB();
        
        // Wait a bit for connection to be fully ready
        await new Promise(r => setTimeout(r, 1000));
        console.log("✅ DB Connected & Ready");

        // 1. Get Admin User
        const admin = await userModel.findOne({ email: "admin@demo.com" });
        if (!admin) throw new Error("Admin not found");

        // 2. Get Supplier
        const supplier = await supplierModel.findOne({ name: "Nhà Cung Cấp Thịt Sạch" });
        if (!supplier) throw new Error("Supplier not found");

        // 3. Get Ingredient
        const ingredient = await ingredientModel.findOne(); // Get any ingredient
        if (!ingredient) throw new Error("No ingredient found");

        console.log(`Testing with Ingredient: ${ingredient.name} (${ingredient._id})`);

        // 4. Create Pending Receipt
        const receiptCode = `TEST-${Date.now()}`;
        const items = [{
            ingredient: ingredient._id,
            ingredientName: ingredient.name,
            quantity: 10,
            unit: ingredient.unit,
            pricePerUnit: 50000,
            total: 500000
        }];

        const receipt = await importReceiptModel.create({
            code: receiptCode,
            supplier: supplier._id,
            branch: null, // Central warehouse
            items: items,
            totalAmount: 500000,
            status: 'PENDING',
            createdBy: admin._id,
            createdByName: admin.name
        });

        console.log(`created pending receipt: ${receipt._id}`);

        // 5. Try "Complete" Logic (Copied from Controller)
        console.log("Attempting completion logic...");
        
        // 5. Try "Complete" Logic (Transaction)
        console.log("Attempting completion logic with TRANSACTION...");
        
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            for (const item of receipt.items) {
                console.log(`Processing item: ${item.ingredientName}`);
                
                let stock = await stockModel.findOne({ 
                    ingredient: item.ingredient, 
                    branch: receipt.branch || null 
                }).session(session);
    
                const previousQty = stock ? stock.quantity : 0;
                const newQty = previousQty + item.quantity;
    
                if (stock) {
                    stock.quantity = newQty;
                    stock.lastUpdated = Date.now();
                    await stock.save({ session });
                    console.log("Stock updated");
                } else {
                    console.log("Creating new stock...");
                    const stockArr = await stockModel.create([{
                        ingredient: item.ingredient,
                        branch: receipt.branch || null,
                        quantity: newQty,
                        minThreshold: 5
                    }], { session });
                    stock = stockArr[0];
                    console.log("Stock created");
                }
    
                await stockTransactionModel.create([{
                    stock: stock._id,
                    ingredient: item.ingredient,
                    branch: receipt.branch || null,
                    type: 'IMPORT',
                    quantity: item.quantity,
                    previousQty,
                    newQty,
                    reason: `Nhập kho từ phiếu ${receipt.code}`,
                    referenceId: receipt.code,
                    performedBy: admin._id,
                    performedByName: admin.name
                }], { session });
                console.log("Transaction created");
            }
    
            receipt.status = 'COMPLETED';
            await receipt.save({ session });
            
            await session.commitTransaction();
            session.endSession();
            console.log("✅ Transaction Committed!");
            
        } catch (err) {
            await session.abortTransaction();
            session.endSession();
            throw err;
        }

        console.log("✅ Receipt Completed Successfully!");

    } catch (error) {
        console.error("❌ FAILED:", error);
    } finally {
        await mongoose.connection.close();
    }
};

runDebug();
