import ingredientModel from "../models/ingredientModel.js";
import stockModel from "../models/stockModel.js";
import stockTransactionModel from "../models/stockTransactionModel.js";
import userModel from "../models/userModel.js"; // Import userModel for role check
import mongoose from "mongoose";

// Helper: Check User Role & Branch
const checkUserRole = async (userId) => {
    if (!userId) return { role: 'guest', branchId: null };
    const user = await userModel.findById(userId);
    return user ? { role: user.role, branchId: user.branchId } : { role: 'guest', branchId: null };
};

// Add ingredient (Master Data) - ADMIN ONLY
const addIngredient = async (req, res) => {
    try {
        const { role } = await checkUserRole(req.body.userId);
        if (role !== "admin") {
            return res.json({ success: false, message: "Unauthorized: Admin only" });
        }

        // 1. Create Master Ingredient
        const ingredient = new ingredientModel({
            name: req.body.name,
            category: req.body.category,
            unit: req.body.unit,
            costPrice: req.body.costPrice
        });
        const savedIng = await ingredient.save();

        // 2. Initialize Stock for Central Warehouse (Branch: null)
        const initialStock = req.body.stock || 0;
        const initialMin = req.body.minStock || 5;

        await stockModel.create({
            ingredient: savedIng._id,
            branch: null, // Central
            quantity: initialStock,
            minThreshold: initialMin
        });

        res.json({ success: true, message: "Ingredient Added to Master Data & Central Warehouse" });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Error adding ingredient" });
    }
}

// List ingredients with Stock info (Role Aware)
const listIngredients = async (req, res) => {
    try {
        // WARN: GET request usually doesn't have body. We'll check query param 'userId' if available.
        const userId = req.query.userId;
        let role = 'admin'; // Default fallback if no auth
        let userBranchId = null;

        // FIX: Handle "null" string and undefined properly
        if (userId && userId !== 'null' && userId !== 'undefined') {
            const userCheck = await checkUserRole(userId);
            role = userCheck.role;
            userBranchId = userCheck.branchId;
        }

        let branchId = req.query.branchId || null; 
        
        // SECURITY ENFORCEMENT
        if (role === 'manager') {
            // Manager can ONLY see their own branch
            branchId = userBranchId; 
        }

        // Handle "null" string
        const queryBranch = (branchId === 'null' || branchId === '' || !branchId) ? null : branchId;

        // 1. Fetch All Ingredients (Master Data)
        const ingredients = await ingredientModel.find({});

        // 2. Fetch Stock for the resolved Branch
        const stocks = await stockModel.find({ branch: queryBranch });
        
        // Map stock
        const stockMap = new Map();
        stocks.forEach(s => {
            stockMap.set(s.ingredient.toString(), s);
        });

        // 3. Merge
        const mergedData = ingredients.map(ing => {
            const stockEntry = stockMap.get(ing._id.toString());
            return {
                _id: ing._id,
                name: ing.name,
                category: ing.category,
                unit: ing.unit,
                costPrice: ing.costPrice,
                lastUpdated: ing.lastUpdated,
                stock: stockEntry ? stockEntry.quantity : 0,
                minStock: stockEntry ? stockEntry.minThreshold : 5,
                stockLastUpdated: stockEntry ? stockEntry.lastUpdated : null
            };
        });

        res.json({ success: true, data: mergedData, viewContext: role === 'manager' ? 'branch' : 'central' });
    } catch (error) {
        console.error('[ingredientController] listIngredients ERROR:', error.message, error.stack);
        res.json({ success: false, message: "Error fetching inventory" });
    }
}

// Update ingredient (Master Data OR Stock)
const updateIngredient = async (req, res) => {
    try {
        const { id, stock, minStock, costPrice, name, category, unit, branchId, userId } = req.body;
        
        const { role, branchId: userBranchId } = await checkUserRole(userId);

        // Resolve Target Branch
        let targetBranch = (branchId === 'null' || !branchId) ? null : branchId;

        // SECURITY ENFORCEMENT
        if (role === 'manager') {
            if (targetBranch !== userBranchId && String(targetBranch) !== String(userBranchId)) {
                 return res.json({ success: false, message: "Unauthorized: Cannot update other branches" });
            }
            // Manager CANNOT update Master Data
            if (name || category || unit || costPrice) {
                 return res.json({ success: false, message: "Unauthorized: Branch Manager cannot edit Master Data" });
            }
            targetBranch = userBranchId; // Force strict branch
        } else if (role !== 'admin') {
             return res.json({ success: false, message: "Unauthorized" });
        }

        // 1. Update Master Data (Admin Only)
        if (role === 'admin') {
            const updateMaster = {};
            if (costPrice !== undefined) updateMaster.costPrice = costPrice;
            if (name) updateMaster.name = name;
            if (category) updateMaster.category = category;
            if (unit) updateMaster.unit = unit;
            
            if (Object.keys(updateMaster).length > 0) {
                updateMaster.lastUpdated = Date.now();
                await ingredientModel.findByIdAndUpdate(id, updateMaster);
            }
        }

        // 2. Update Stock (Admin or Manager)
        if (stock !== undefined || minStock !== undefined) {
             const updateStock = { lastUpdated: Date.now() };
             if (stock !== undefined) updateStock.quantity = stock;
             if (minStock !== undefined) updateStock.minThreshold = minStock;

             await stockModel.findOneAndUpdate(
                 { ingredient: id, branch: targetBranch },
                 updateStock,
                 { upsert: true, new: true }
             );
        }

        res.json({ success: true, message: "Ingredient Updated" });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Error updating ingredient" });
    }
}

// Internal Stock Transfer - ADMIN ONLY
const transferStock = async (req, res) => {
    const session = await mongoose.startSession();
    try {
        const { role } = await checkUserRole(req.body.userId);
        if (role !== "admin") {
            return res.json({ success: false, message: "Unauthorized: Admin only" });
        }

        session.startTransaction();
        const { ingredientId, fromBranch, toBranch, quantity } = req.body;
        const qty = Number(quantity);

        if (qty <= 0) throw new Error("Invalid quantity");

        const sourceBranch = (fromBranch === 'null' || !fromBranch) ? null : fromBranch;
        const destBranch = (toBranch === 'null' || !toBranch) ? null : toBranch;

        // 1. Deduct from Source
        const sourceStock = await stockModel.findOne({ ingredient: ingredientId, branch: sourceBranch }).session(session);
        if (!sourceStock || sourceStock.quantity < qty) {
            throw new Error("Insufficient stock in source warehouse");
        }
        
        // Atomic decrement check (extra safety)
        const deductResult = await stockModel.updateOne(
            { _id: sourceStock._id, quantity: { $gte: qty } },
            { $inc: { quantity: -qty } }
        ).session(session);

        if (deductResult.modifiedCount === 0) {
             throw new Error("Concurrency Conflict: Stock changed during transaction");
        }

        // 2. Add to Destination
        await stockModel.findOneAndUpdate(
            { ingredient: ingredientId, branch: destBranch },
            { $inc: { quantity: qty }, $setOnInsert: { minThreshold: 5 } },
            { upsert: true, new: true, session: session }
        );

        await session.commitTransaction();
        res.json({ success: true, message: "Transfer Successful" });

    } catch (error) {
        await session.abortTransaction();
        console.log(error);
        res.json({ success: false, message: error.message || "Transfer Failed" });
    } finally {
        session.endSession();
    }
}

// Remove ingredient - ADMIN ONLY
const removeIngredient = async (req, res) => {
    try {
        const { role } = await checkUserRole(req.body.userId);
        if (role !== "admin") {
            return res.json({ success: false, message: "Unauthorized: Admin only" });
        }

        await ingredientModel.findByIdAndDelete(req.body.id);
        await stockModel.deleteMany({ ingredient: req.body.id }); 
        res.json({ success: true, message: "Ingredient Removed" });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Error" });
    }
}

// =========================================
// ADVANCED INVENTORY OPERATIONS
// =========================================

// Report Waste (Báo Hủy) - Deduct stock and log transaction
const reportWaste = async (req, res) => {
    try {
        const { stockId, ingredientId, branchId, quantity, reason, userId } = req.body;

        if (!stockId || !quantity || quantity <= 0) {
            return res.json({ success: false, message: "Invalid input: stockId and positive quantity required" });
        }

        // Verify user authorization
        const { role, branchId: userBranch } = await checkUserRole(userId);
        if (role === 'manager' && userBranch?.toString() !== branchId) {
            return res.json({ success: false, message: "Unauthorized: Cannot modify other branch's stock" });
        }

        // Get current stock
        const stock = await stockModel.findById(stockId);
        if (!stock) {
            return res.json({ success: false, message: "Stock not found" });
        }

        const previousQty = stock.quantity;
        const newQty = Math.max(0, previousQty - quantity);

        // Update stock
        stock.quantity = newQty;
        stock.lastUpdated = Date.now();
        await stock.save();

        // Get user name for logging
        let performedByName = 'System';
        if (userId) {
            const user = await userModel.findById(userId);
            performedByName = user?.name || 'Unknown';
        }

        // Create transaction log
        await stockTransactionModel.create({
            stock: stockId,
            ingredient: ingredientId || stock.ingredient,
            branch: branchId === 'null' ? null : branchId,
            type: 'WASTE',
            quantity: -quantity,
            previousQty,
            newQty,
            reason: reason || 'Báo hủy',
            performedBy: userId,
            performedByName
        });

        res.json({ 
            success: true, 
            message: `Đã báo hủy ${quantity} đơn vị. Tồn kho mới: ${newQty}`,
            data: { previousQty, newQty, change: -quantity }
        });
    } catch (error) {
        console.error("reportWaste error:", error);
        res.json({ success: false, message: "Error reporting waste" });
    }
};

// Audit Stock (Kiểm Kê) - Adjust stock to actual quantity
const auditStock = async (req, res) => {
    try {
        const { audits, branchId, userId } = req.body;
        // audits: [{ stockId, actualQuantity }, ...]

        if (!audits || !Array.isArray(audits) || audits.length === 0) {
            return res.json({ success: false, message: "Invalid input: audits array required" });
        }

        // Verify user authorization
        const { role, branchId: userBranch } = await checkUserRole(userId);
        if (role === 'manager' && userBranch?.toString() !== branchId) {
            return res.json({ success: false, message: "Unauthorized: Cannot audit other branch's stock" });
        }

        let performedByName = 'System';
        if (userId) {
            const user = await userModel.findById(userId);
            performedByName = user?.name || 'Unknown';
        }

        const results = [];

        for (const audit of audits) {
            const { stockId, actualQuantity } = audit;
            
            const stock = await stockModel.findById(stockId);
            if (!stock) continue;

            const previousQty = stock.quantity;
            const diff = actualQuantity - previousQty;

            if (diff === 0) continue; // No change needed

            // Update stock
            stock.quantity = actualQuantity;
            stock.lastUpdated = Date.now();
            await stock.save();

            // Create transaction log
            await stockTransactionModel.create({
                stock: stockId,
                ingredient: stock.ingredient,
                branch: stock.branch,
                type: 'AUDIT_ADJUSTMENT',
                quantity: diff,
                previousQty,
                newQty: actualQuantity,
                reason: `Kiểm kê: ${diff > 0 ? '+' : ''}${diff}`,
                performedBy: userId,
                performedByName
            });

            results.push({
                stockId,
                previousQty,
                newQty: actualQuantity,
                diff
            });
        }

        res.json({ 
            success: true, 
            message: `Đã kiểm kê ${results.length} mục`,
            data: results
        });
    } catch (error) {
        console.error("auditStock error:", error);
        res.json({ success: false, message: "Error auditing stock" });
    }
};

// Get Stock History - Retrieve transaction log
const getStockHistory = async (req, res) => {
    try {
        const { stockId } = req.params;
        const { ingredientId, branchId, limit = 50 } = req.query;

        let query = {};

        if (stockId && stockId !== 'undefined') {
            query.stock = stockId;
        } else if (ingredientId) {
            query.ingredient = ingredientId;
            if (branchId) {
                query.branch = branchId === 'null' ? null : branchId;
            }
        } else {
            return res.json({ success: false, message: "stockId or ingredientId required" });
        }

        const history = await stockTransactionModel
            .find(query)
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .populate('ingredient', 'name')
            .lean();

        // Format for display
        const formattedHistory = history.map(h => ({
            _id: h._id,
            date: h.createdAt,
            type: h.type,
            quantity: h.quantity,
            previousQty: h.previousQty,
            newQty: h.newQty,
            reason: h.reason,
            performedBy: h.performedByName,
            ingredientName: h.ingredient?.name || 'Unknown'
        }));

        res.json({ success: true, data: formattedHistory });
    } catch (error) {
        console.error("getStockHistory error:", error);
        res.json({ success: false, message: "Error fetching history" });
    }
};

export { addIngredient, listIngredients, updateIngredient, removeIngredient, transferStock, reportWaste, auditStock, getStockHistory };
