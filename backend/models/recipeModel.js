import mongoose from "mongoose";

const recipeSchema = new mongoose.Schema({
  foodId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "food", 
    required: true,
    unique: true // One recipe per food item
  },
  ingredients: [{
    ingredientId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "ingredient",
      required: true 
    },
    quantityNeeded: { 
      type: Number, 
      required: true,
      min: 0 
    },
    unit: { 
      type: String, 
      required: true 
    }
  }],
  calculatedCost: { 
    type: Number, 
    default: 0 
  },
  notes: { 
    type: String 
  }
}, { timestamps: true });

// Index for fast lookup by foodId
recipeSchema.index({ foodId: 1 });

const recipeModel = mongoose.models.recipe || mongoose.model("recipe", recipeSchema);

export default recipeModel;
