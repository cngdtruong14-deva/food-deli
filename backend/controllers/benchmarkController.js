import orderModel from "../models/orderModel.js";
import mongoose from "mongoose";

const runBenchmark = async (req, res) => {
    try {
        // 1. Setup - Find a user with orders to make it realistic
        // We'll just pick a random user from an order, or use a dummy ID if empty.
        const sampleOrder = await orderModel.findOne();
        const userId = sampleOrder ? sampleOrder.userId : new mongoose.Types.ObjectId(); // Fallback

        // Query: Find orders by User, Sorted by Date Desc
        const queryFilter = { userId: userId };
        const sortOptions = { date: -1 };

        // 2. Measure Optimized Query (Using Index)
        const startOptimized = performance.now();
        const optimizedResult = await orderModel.find(queryFilter)
                                        .sort(sortOptions)
                                        .explain('executionStats');
        const endOptimized = performance.now();

        // 3. Measure Unoptimized Query (Force Collection Scan / Natural)
        // Note: $natural: 1 forces natural order, bypassing our specific index for sorting. 
        // Or we can hint to use NO index? .hint({ $natural: 1 }) effectively ignores other indexes.
        const startUnoptimized = performance.now();
        const unoptimizedResult = await orderModel.find(queryFilter)
                                          .sort(sortOptions)
                                          .hint({ $natural: 1 }) 
                                          .explain('executionStats');
        const endUnoptimized = performance.now();

        // 4. Extract Stats
        const stats = {
            query: `db.orders.find({ userId: '${userId}' }).sort({ date: -1 })`,
            optimized: {
                executionTimeMillis: optimizedResult.executionStats.executionTimeMillis,
                totalDocsExamined: optimizedResult.executionStats.totalDocsExamined,
                nReturned: optimizedResult.executionStats.nReturned,
                usedIndex: optimizedResult.queryPlanner.winningPlan.inputStage.indexName || "Unknown (Likely Compound)"
            },
            unoptimized: {
                executionTimeMillis: unoptimizedResult.executionStats.executionTimeMillis,
                totalDocsExamined: unoptimizedResult.executionStats.totalDocsExamined, 
                // In unoptimized sort, it might examine ALL docs if no match? 
                // Or if it finds matching docs by scan. 
                // With blocking sort, checks all?
                nReturned: unoptimizedResult.executionStats.nReturned,
                note: "Forced Collection Scan ($natural)"
            },
            improvement: {
                speedupFactor: (unoptimizedResult.executionStats.executionTimeMillis / (optimizedResult.executionStats.executionTimeMillis || 0.1)).toFixed(2) + "x"
            }
        };

        res.json({ success: true, benchmark: stats });

    } catch (error) {
        console.error("Benchmark Error:", error);
        res.json({ success: false, message: "Benchmark Failed", error: error.message });
    }
};

export { runBenchmark };
