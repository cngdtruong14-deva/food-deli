import foodModel from "../models/foodModel.js";
import stockTransactionModel from "../models/stockTransactionModel.js";
import userModel from "../models/userModel.js";

// AUDIT API: Adjust Food Stock & Log Transaction
const auditInventory = async (req, res) => {
    try {
        // 1. Auth Check (Admin Only)
        const { userId, adjustments, reason } = req.body; // adjustments: [{ foodId, actualStock }]
        
        const operator = await userModel.findById(userId);
        if (!operator || operator.role !== "admin") {
            return res.json({ success: false, message: "Unauthorized. Admin Access Required." });
        }

        if (!adjustments || !Array.isArray(adjustments)) {
             return res.json({ success: false, message: "Invalid input. 'adjustments' must be an array." });
        }

        const auditResults = [];
        const transactions = [];

        // 2. Process Adjustments
        for (const adj of adjustments) {
            const { foodId, actualStock } = adj;
            
            const food = await foodModel.findById(foodId);
            if (!food) {
                auditResults.push({ foodId, status: "Not Found" });
                continue;
            }

            const currentStock = food.stock;
            const variance = actualStock - currentStock;

            // Only update if there is a change
            if (variance !== 0) {
                // Update Food Stock
                food.stock = actualStock;
                await food.save();

                // Create Transaction Record
                const transaction = new stockTransactionModel({
                    food: food._id,
                    type: 'AUDIT_ADJUSTMENT',
                    quantity: variance, // +5 or -3
                    previousQty: currentStock,
                    newQty: actualStock,
                    reason: reason || "End of Day Audit",
                    performedBy: userId,
                    performedByName: `${operator.name} (${operator.email})`,
                    branch: null // Food stock is currently global/central in this simplified model
                });

                await transaction.save();
                transactions.push(transaction);
                
                auditResults.push({
                    foodId,
                    name: food.name,
                    previous: currentStock,
                    actual: actualStock,
                    variance: variance,
                    status: "Updated"
                });
            } else {
                 auditResults.push({ foodId, name: food.name, status: "No Change" });
            }
        }

        res.json({ 
            success: true, 
            message: `Audit completed. ${transactions.length} items adjusted.`,
            results: auditResults 
        });

    } catch (error) {
        console.error("Audit Error:", error);
        res.json({ success: false, message: "Error processing audit" });
    }
};

const getAuditHistory = async (req, res) => {
    try {
        const history = await stockTransactionModel.find({ type: 'AUDIT_ADJUSTMENT' })
            .populate('food', 'name')
            .populate('performedBy', 'name')
            .sort({ createdAt: -1 })
            .limit(100);
            
        res.json({ success: true, data: history });
    } catch (error) {
         console.error("Audit History Error:", error);
        res.json({ success: false, message: "Error fetching history" });
    }
}

// AI-powered Smart Restock Suggestions
import axios from "axios";

const getSmartRestockSuggestions = async (req, res) => {
    try {
        const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:5001';
        
        const response = await axios.get(`${AI_SERVICE_URL}/api/forecast/ingredients`);
        
        if (response.data.success) {
            res.json({
                success: true,
                data: response.data.data,
                message: response.data.message
            });
        } else {
            res.json({
                success: false,
                message: response.data.message || "Failed to fetch forecast"
            });
        }
    } catch (error) {
        console.error("AI Forecast Error:", error.message);
        // Graceful degradation if AI service is down
        res.json({
            success: true,
            data: [],
            message: "AI Service không khả dụng. Vui lòng thử lại sau."
        });
    }
};

export { auditInventory, getAuditHistory, getSmartRestockSuggestions };
