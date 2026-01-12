import express from "express";
import { addIngredient, listIngredients, updateIngredient, removeIngredient, transferStock, reportWaste, auditStock, getStockHistory } from "../controllers/ingredientController.js";

const ingredientRouter = express.Router();

ingredientRouter.post("/add", addIngredient);
ingredientRouter.get("/list", listIngredients);
ingredientRouter.post("/update", updateIngredient);
ingredientRouter.post("/remove", removeIngredient);
ingredientRouter.post("/transfer", transferStock);

// Advanced Inventory Operations
ingredientRouter.post("/waste", reportWaste);
ingredientRouter.post("/audit", auditStock);
ingredientRouter.get("/history/:stockId", getStockHistory);

export default ingredientRouter;
