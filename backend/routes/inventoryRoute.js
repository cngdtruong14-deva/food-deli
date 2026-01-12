import express from "express";
import { auditInventory, getAuditHistory } from "../controllers/inventoryController.js";

const inventoryRouter = express.Router();

inventoryRouter.post("/audit", auditInventory);
inventoryRouter.get("/history", getAuditHistory);

export default inventoryRouter;
