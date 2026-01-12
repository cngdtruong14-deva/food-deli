import mongoose from "mongoose";

const importReceiptSchema = new mongoose.Schema({
    code: { 
        type: String, 
        required: true,
        unique: true
    },
    supplier: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "supplier", 
        required: true 
    },
    branch: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "branch", 
        default: null // Null = Central Warehouse
    },
    items: [{
        ingredient: { 
            type: mongoose.Schema.Types.ObjectId, 
            ref: "ingredient", 
            required: true 
        },
        ingredientName: { type: String }, // Denormalized for display
        quantity: { 
            type: Number, 
            required: true,
            min: 0
        },
        unit: { type: String },
        pricePerUnit: { 
            type: Number, 
            required: true,
            min: 0
        },
        total: { 
            type: Number, 
            required: true 
        }
    }],
    totalAmount: { 
        type: Number, 
        required: true,
        default: 0
    },
    status: { 
        type: String, 
        enum: ['PENDING', 'COMPLETED', 'CANCELLED'],
        default: 'PENDING'
    },
    notes: { 
        type: String, 
        default: '' 
    },
    createdBy: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "user" 
    },
    createdByName: { 
        type: String, 
        default: 'System' 
    },
    completedBy: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "user",
        default: null
    },
    completedByName: { 
        type: String, 
        default: null 
    },
    completedAt: { 
        type: Date, 
        default: null 
    }
}, { 
    timestamps: true 
});

// Indexes for efficient queries
importReceiptSchema.index({ code: 1 });
importReceiptSchema.index({ status: 1, createdAt: -1 });
importReceiptSchema.index({ supplier: 1, createdAt: -1 });
importReceiptSchema.index({ branch: 1, createdAt: -1 });

// Static method to generate receipt code
importReceiptSchema.statics.generateCode = async function(date = new Date()) {
    const dateStr = date.toISOString().split('T')[0].replace(/-/g, '');
    const prefix = `PN-${dateStr}`;
    
    // Find the last receipt of the day
    const lastReceipt = await this.findOne({ 
        code: { $regex: `^${prefix}` } 
    }).sort({ code: -1 });
    
    let sequence = 1;
    if (lastReceipt) {
        const lastSequence = parseInt(lastReceipt.code.split('-').pop());
        sequence = lastSequence + 1;
    }
    
    return `${prefix}-${String(sequence).padStart(2, '0')}`;
};

const importReceiptModel = mongoose.models.importReceipt || mongoose.model("importReceipt", importReceiptSchema);

export default importReceiptModel;
