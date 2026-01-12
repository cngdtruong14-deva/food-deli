import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import mongoose from "mongoose";
import ingredientModel from "../models/ingredientModel.js";
import stockModel from "../models/stockModel.js";
import branchModel from "../models/branchModel.js";
import { connectDB } from "../config/db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const verifySystem = async () => {
    try {
        await connectDB();
        console.log("✅ Database connected");

        // Check if ReplSet (Transactions require ReplSet)
        const isReplSet = mongoose.connection.client.topology.type === 'ReplicaSetWithPrimary';
        console.log(`ℹ️ Database Topology: ${mongoose.connection.client.topology.type}`);
        
        if (!isReplSet) {
             console.warn("⚠️ WARNING: Database is NOT a Replica Set. Transactions will FAIL in production logic.");
             // We will attempt transaction anyway to see if it errors.
        }

        // 1. Setup Test Data
        const testBranch = await branchModel.create({
            name: "Test Branch " + Date.now(),
            address: "Test Address",
            isActive: true
        });
        console.log(`📍 Created Test Branch: ${testBranch.name} (${testBranch._id})`);

        const testIng = await ingredientModel.create({
            name: "Test Ingredient " + Date.now(),
            category: "Test",
            unit: "kg",
            costPrice: 50000
        });
        console.log(`🥕 Created Test Ingredient: ${testIng.name}`);

        // 2. Initial Stock (Central)
        await stockModel.create({
            ingredient: testIng._id,
            branch: null,
            quantity: 100,
            minThreshold: 10
        });
        console.log("🏭 Initialized Central Stock: 100");

        // 3. Test Transfer Logic WITH TRANSACTION
        console.log("🔄 Attempting Transactional Transfer...");
        const session = await mongoose.startSession();
        try {
            session.startTransaction();
            const transferQty = 20;

            // Deduct Central
            const sourceStock = await stockModel.findOne({ ingredient: testIng._id, branch: null }).session(session);
            if (!sourceStock || sourceStock.quantity < transferQty) {
                 throw new Error("Insufficient stock");
            }
            
            sourceStock.quantity -= transferQty;
            await sourceStock.save();

            // Add to Branch
            await stockModel.findOneAndUpdate(
                { ingredient: testIng._id, branch: testBranch._id },
                { $inc: { quantity: transferQty }, $setOnInsert: { minThreshold: 5 } },
                { upsert: true, new: true, session: session }
            );

            await session.commitTransaction();
            console.log(`✅ Transaction Committed: Moved ${transferQty} items`);

        } catch (error) {
            await session.abortTransaction();
            console.error("❌ Transaction Aborted:", error.message);
            throw error; // Rethrow to fail test
        } finally {
            session.endSession();
        }

        // 4. Verify Quantities
        const centralStock = await stockModel.findOne({ ingredient: testIng._id, branch: null });
        const branchStock = await stockModel.findOne({ ingredient: testIng._id, branch: testBranch._id });

        console.log(`🔍 Central Stock: ${centralStock.quantity} (Expected: 80)`);
        console.log(`🔍 Branch Stock: ${branchStock ? branchStock.quantity : 0} (Expected: 20)`);

        if (centralStock.quantity === 80 && branchStock && branchStock.quantity === 20) {
            console.log("✅ VERIFICATION SUCCESS: Data Integrity Maintained");
        } else {
            console.error("❌ VERIFICATION FAILED: Data Mismatch");
            process.exit(1);
        }

        // Cleanup
        await branchModel.findByIdAndDelete(testBranch._id);
        await ingredientModel.findByIdAndDelete(testIng._id);
        await stockModel.deleteMany({ ingredient: testIng._id });
        console.log("🧹 Cleanup Complete");

        process.exit(0);
    } catch (error) {
        console.error("❌ Fatal Error:", error);
        process.exit(1);
    }
};

verifySystem();
