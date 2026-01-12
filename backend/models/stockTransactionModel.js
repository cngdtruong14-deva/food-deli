import mongoose from "mongoose";

const stockTransactionSchema = new mongoose.Schema({
    stock: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "stock", 
        required: false // Optional: For Ingredient Tracking
    },
    ingredient: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "ingredient", 
        required: false // Optional: For Ingredient Tracking
    },
    food: {
        type: mongoose.Schema.Types.ObjectId, 
        ref: "food", 
        required: false // Optional: For Food Item Tracking
    },
    branch: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "branch", 
        default: null // Null = Central Warehouse
    },
    type: { 
        type: String, 
        enum: ['IMPORT', 'SALE', 'TRANSFER_IN', 'TRANSFER_OUT', 'WASTE', 'AUDIT_ADJUSTMENT'],
        required: true 
    },
    quantity: { 
        type: Number, 
        required: true // Can be negative (for deductions)
    },
    previousQty: { 
        type: Number, 
        required: true 
    },
    newQty: { 
        type: Number, 
        required: true 
    },
    reason: { 
        type: String, 
        default: '' 
    },
    referenceId: { 
        type: String, 
        default: null // Order ID, Transfer ID, etc.
    },
    performedBy: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "user",
        default: null
    },
    performedByName: {
        type: String,
        default: 'System'
    }
}, { 
    timestamps: true // Adds createdAt and updatedAt
});

// Index for efficient queries
stockTransactionSchema.index({ stock: 1, createdAt: -1 });
stockTransactionSchema.index({ ingredient: 1, branch: 1, createdAt: -1 });
stockTransactionSchema.index({ type: 1, createdAt: -1 });

const stockTransactionModel = mongoose.models.stockTransaction || mongoose.model("stockTransaction", stockTransactionSchema);

export default stockTransactionModel;
