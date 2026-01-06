import express from "express";
import { getLiveStatus, getDashboardData } from "../controllers/analyticsController.js";
import authMiddleware from "../middleware/auth.js";

const analyticsRouter = express.Router();

analyticsRouter.get("/live", authMiddleware, getLiveStatus);
analyticsRouter.get("/dashboard", authMiddleware, getDashboardData);

export default analyticsRouter;
