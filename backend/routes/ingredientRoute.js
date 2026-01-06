import express from "express";
import { addIngredient, listIngredients, updateIngredient, removeIngredient } from "../controllers/ingredientController.js";

const ingredientRouter = express.Router();

ingredientRouter.post("/add", addIngredient);
ingredientRouter.get("/list", listIngredients);
ingredientRouter.post("/update", updateIngredient);
ingredientRouter.post("/remove", removeIngredient);

export default ingredientRouter;
