import express from "express";
import { getDashboardStats, getDailySales, getOrdersByStatus } from "../controllers/analyticsController.js";
import authMiddleware from "../middleware/auth.js";

const analyticsRouter = express.Router();

analyticsRouter.get("/dashboard", authMiddleware, getDashboardStats);
analyticsRouter.get("/daily", authMiddleware, getDailySales);
analyticsRouter.get("/status", authMiddleware, getOrdersByStatus);

export default analyticsRouter;
