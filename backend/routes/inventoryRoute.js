import express from "express";
import { auditInventory, getAuditHistory, getSmartRestockSuggestions } from "../controllers/inventoryController.js";

const inventoryRouter = express.Router();

inventoryRouter.post("/audit", auditInventory);
inventoryRouter.get("/history", getAuditHistory);
inventoryRouter.get("/forecast", getSmartRestockSuggestions); // AI Demand Forecasting

export default inventoryRouter;
