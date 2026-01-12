import orderModel from "../models/orderModel.js";
import foodModel from "../models/foodModel.js";
import ingredientModel from "../models/ingredientModel.js";
import stockTransactionModel from "../models/stockTransactionModel.js";
import userModel from "../models/userModel.js";
import mongoose from "mongoose";

// Helper: Check User Role
const checkUserRole = async (userId) => {
    if (!userId || userId === 'null' || userId === 'undefined') {
        return { role: 'admin', branchId: null };
    }
    const user = await userModel.findById(userId);
    return { 
        role: user?.role || 'admin', 
        branchId: user?.branchId || null 
    };
};

// Helper: Parse date range
const parseDateRange = (startDate, endDate) => {
    const start = startDate ? new Date(startDate) : new Date(new Date().setDate(new Date().getDate() - 30));
    const end = endDate ? new Date(endDate) : new Date();
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    return { start, end };
};

// =========================================
// OVERVIEW STATS API
// =========================================
const getOverviewStats = async (req, res) => {
    try {
        const { userId, startDate, endDate, branchId } = req.query;
        
        const { role } = await checkUserRole(userId);
        if (!['admin', 'manager'].includes(role)) {
            return res.json({ success: false, message: "Unauthorized" });
        }

        const { start, end } = parseDateRange(startDate, endDate);

        // Base match for completed orders
        const orderMatch = {
            status: { $in: ['Served', 'Paid'] },
            date: { $gte: start, $lte: end }
        };
        if (branchId && branchId !== 'null') {
            orderMatch.branchId = new mongoose.Types.ObjectId(branchId);
        }

        // 1. Get all completed orders
        const orders = await orderModel.find(orderMatch).lean();
        
        // 2. Calculate Revenue
        const revenue = orders.reduce((sum, o) => sum + (o.amount || 0), 0);
        const totalOrders = orders.length;

        // 3. Calculate COGS (Cost of Goods Sold)
        // Get all food items with their costPrice
        const foods = await foodModel.find({}).lean();
        const foodCostMap = {};
        foods.forEach(f => {
            foodCostMap[f.name] = f.costPrice || 0;
            foodCostMap[f._id.toString()] = f.costPrice || 0;
        });

        let cogs = 0;
        orders.forEach(order => {
            if (order.items && Array.isArray(order.items)) {
                order.items.forEach(item => {
                    const itemCost = foodCostMap[item.name] || foodCostMap[item._id] || 0;
                    cogs += (item.quantity || 1) * itemCost;
                });
            }
        });

        // 4. Calculate Waste Cost
        const wasteMatch = {
            type: 'WASTE',
            createdAt: { $gte: start, $lte: end }
        };
        if (branchId && branchId !== 'null') {
            wasteMatch.branch = new mongoose.Types.ObjectId(branchId);
        }

        const wasteTransactions = await stockTransactionModel.find(wasteMatch)
            .populate('ingredient', 'costPrice')
            .lean();

        // HIGH PRIORITY FIX: Round intermediate calculations to avoid floating point errors
        let wasteCost = 0;
        wasteTransactions.forEach(t => {
            const qty = Math.abs(t.quantity || 0);
            const cost = t.ingredient?.costPrice || 0;
            // Round each item calculation to prevent accumulation of errors
            wasteCost += Math.round(qty * cost);
        });
        wasteCost = Math.round(wasteCost);

        // 5. Calculate metrics (round intermediate results)
        const roundedRevenue = Math.round(revenue);
        const roundedCogs = Math.round(cogs);
        const grossProfit = Math.round(roundedRevenue - roundedCogs);
        const foodCostPercent = roundedRevenue > 0 
            ? Math.round(((roundedCogs + wasteCost) / roundedRevenue) * 100 * 10) / 10 
            : 0;

        // 6. Average Order Value (round to avoid floating point)
        const avgOrderValue = totalOrders > 0 ? Math.round(roundedRevenue / totalOrders) : 0;

        res.json({
            success: true,
            data: {
                revenue: roundedRevenue,
                cogs: roundedCogs,
                grossProfit: grossProfit,
                wasteCost: wasteCost,
                foodCostPercent: foodCostPercent,
                totalOrders,
                avgOrderValue: avgOrderValue,
                dateRange: { start, end }
            }
        });
    } catch (error) {
        console.error("getOverviewStats error:", error);
        res.json({ success: false, message: "Error fetching stats" });
    }
};

// =========================================
// REVENUE & PROFIT TREND API
// =========================================
const getRevenueProfitTrend = async (req, res) => {
    try {
        const { userId, startDate, endDate, branchId, groupBy = 'day' } = req.query;
        
        const { role } = await checkUserRole(userId);
        if (!['admin', 'manager'].includes(role)) {
            return res.json({ success: false, message: "Unauthorized" });
        }

        const { start, end } = parseDateRange(startDate, endDate);

        const orderMatch = {
            status: { $in: ['Served', 'Paid'] },
            date: { $gte: start, $lte: end }
        };
        if (branchId && branchId !== 'null') {
            orderMatch.branchId = new mongoose.Types.ObjectId(branchId);
        }

        // Get food cost map
        const foods = await foodModel.find({}).lean();
        const foodCostMap = {};
        foods.forEach(f => {
            foodCostMap[f.name] = f.costPrice || 0;
        });

        // Group format based on groupBy
        const dateFormat = groupBy === 'month' ? '%Y-%m' : '%Y-%m-%d';

        // Aggregate orders by date
        const pipeline = [
            { $match: orderMatch },
            {
                $group: {
                    _id: { $dateToString: { format: dateFormat, date: "$date" } },
                    revenue: { $sum: "$amount" },
                    orders: { $sum: 1 },
                    items: { $push: "$items" }
                }
            },
            { $sort: { _id: 1 } }
        ];

        const dailyData = await orderModel.aggregate(pipeline);

        // HIGH PRIORITY FIX: Calculate profit with proper rounding
        const trendData = dailyData.map(day => {
            let dayCogs = 0;
            if (day.items) {
                day.items.flat().forEach(item => {
                    const itemCost = foodCostMap[item?.name] || 0;
                    const quantity = item?.quantity || 1;
                    // Round each item calculation
                    dayCogs += Math.round(quantity * itemCost);
                });
            }
            dayCogs = Math.round(dayCogs);
            const roundedRevenue = Math.round(day.revenue);
            return {
                date: day._id,
                revenue: roundedRevenue,
                profit: Math.round(roundedRevenue - dayCogs),
                orders: day.orders
            };
        });

        res.json({ success: true, data: trendData });
    } catch (error) {
        console.error("getRevenueProfitTrend error:", error);
        res.json({ success: false, message: "Error fetching trend" });
    }
};

// =========================================
// TOP SELLING ITEMS API
// =========================================
const getTopSellers = async (req, res) => {
    try {
        const { userId, startDate, endDate, branchId, limit = 10 } = req.query;
        
        const { role } = await checkUserRole(userId);
        if (!['admin', 'manager'].includes(role)) {
            return res.json({ success: false, message: "Unauthorized" });
        }

        const { start, end } = parseDateRange(startDate, endDate);

        const orderMatch = {
            status: { $in: ['Served', 'Paid'] },
            date: { $gte: start, $lte: end }
        };
        if (branchId && branchId !== 'null') {
            orderMatch.branchId = new mongoose.Types.ObjectId(branchId);
        }

        // Get food cost map
        const foods = await foodModel.find({}).lean();
        const foodCostMap = {};
        const foodPriceMap = {};
        foods.forEach(f => {
            foodCostMap[f.name] = f.costPrice || 0;
            foodPriceMap[f.name] = f.price || 0;
        });

        // Aggregate top products
        const pipeline = [
            { $match: orderMatch },
            { $unwind: "$items" },
            {
                $group: {
                    _id: "$items.name",
                    totalQty: { $sum: "$items.quantity" },
                    totalRevenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } }
                }
            },
            { $sort: { totalQty: -1 } },
            { $limit: parseInt(limit) }
        ];

        const topProducts = await orderModel.aggregate(pipeline);

        // HIGH PRIORITY FIX: Calculate margin with proper rounding to avoid floating point errors
        const result = topProducts.map(p => {
            const costPrice = foodCostMap[p._id] || 0;
            const roundedRevenue = Math.round(p.totalRevenue);
            const roundedQty = Math.round(p.totalQty);
            
            // Round intermediate calculations
            const totalCost = Math.round(costPrice * roundedQty);
            const profit = Math.round(roundedRevenue - totalCost);
            
            // Calculate margin with proper rounding
            const marginPercent = roundedRevenue > 0 
                ? Math.round((profit / roundedRevenue) * 100 * 10) / 10 
                : 0;

            return {
                name: p._id,
                quantity: roundedQty,
                revenue: roundedRevenue,
                cost: totalCost,
                profit: profit,
                marginPercent: marginPercent
            };
        });

        res.json({ success: true, data: result });
    } catch (error) {
        console.error("getTopSellers error:", error);
        res.json({ success: false, message: "Error fetching top sellers" });
    }
};

// =========================================
// WASTE ANALYSIS API
// =========================================
const getWasteAnalysis = async (req, res) => {
    try {
        const { userId, startDate, endDate, branchId, limit = 5 } = req.query;
        
        const { role } = await checkUserRole(userId);
        if (!['admin', 'manager'].includes(role)) {
            return res.json({ success: false, message: "Unauthorized" });
        }

        const { start, end } = parseDateRange(startDate, endDate);

        const wasteMatch = {
            type: 'WASTE',
            createdAt: { $gte: start, $lte: end }
        };
        if (branchId && branchId !== 'null') {
            wasteMatch.branch = new mongoose.Types.ObjectId(branchId);
        }

        // Aggregate waste by ingredient
        const pipeline = [
            { $match: wasteMatch },
            {
                $lookup: {
                    from: 'ingredients',
                    localField: 'ingredient',
                    foreignField: '_id',
                    as: 'ingredientData'
                }
            },
            { $unwind: '$ingredientData' },
            {
                $group: {
                    _id: '$ingredient',
                    name: { $first: '$ingredientData.name' },
                    unit: { $first: '$ingredientData.unit' },
                    costPrice: { $first: '$ingredientData.costPrice' },
                    totalQty: { $sum: { $abs: '$quantity' } },
                    count: { $sum: 1 }
                }
            },
            {
                $addFields: {
                    totalCost: { $multiply: ['$totalQty', { $ifNull: ['$costPrice', 0] }] }
                }
            },
            { $sort: { totalCost: -1 } },
            { $limit: parseInt(limit) }
        ];

        const wasteData = await stockTransactionModel.aggregate(pipeline);

        const result = wasteData.map(w => ({
            ingredientId: w._id,
            name: w.name,
            unit: w.unit,
            quantity: Math.round(w.totalQty * 10) / 10,
            cost: Math.round(w.totalCost),
            incidents: w.count
        }));

        res.json({ success: true, data: result });
    } catch (error) {
        console.error("getWasteAnalysis error:", error);
        res.json({ success: false, message: "Error fetching waste analysis" });
    }
};

export { getOverviewStats, getRevenueProfitTrend, getTopSellers, getWasteAnalysis };
