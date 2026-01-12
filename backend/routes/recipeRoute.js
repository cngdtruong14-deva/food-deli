import express from "express";
import authMiddleware from "../middleware/auth.js";
import { 
  saveRecipe, 
  getRecipe, 
  listRecipes, 
  deleteRecipe,
  recalculateAllCosts 
} from "../controllers/recipeController.js";

const recipeRouter = express.Router();

// Save (Create/Update) a recipe - Admin only
recipeRouter.post("/save", authMiddleware, saveRecipe);

// Get recipe for a specific food - Public (for cost display)
recipeRouter.get("/:foodId", getRecipe);

// List all recipes - Admin only
recipeRouter.post("/list", authMiddleware, listRecipes);

// Delete a recipe - Admin only
recipeRouter.delete("/:foodId", authMiddleware, deleteRecipe);

// Recalculate all costs - Admin only
recipeRouter.post("/recalculate", authMiddleware, recalculateAllCosts);

export default recipeRouter;
