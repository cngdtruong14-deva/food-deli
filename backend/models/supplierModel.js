import mongoose from "mongoose";

const supplierSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: true,
        trim: true
    },
    contactPerson: { 
        type: String,
        default: ''
    },
    phone: { 
        type: String,
        default: ''
    },
    email: { 
        type: String,
        default: ''
    },
    address: { 
        type: String,
        default: ''
    },
    category: { 
        type: String, 
        enum: ['MEAT', 'VEG', 'DRY', 'PACKAGING', 'OTHER'],
        default: 'OTHER'
    },
    isActive: { 
        type: Boolean, 
        default: true 
    }
}, { 
    timestamps: true 
});

// Index for search
supplierSchema.index({ name: 'text' });

const supplierModel = mongoose.models.supplier || mongoose.model("supplier", supplierSchema);

export default supplierModel;
