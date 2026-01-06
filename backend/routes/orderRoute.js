import express from "express";
import authMiddleware from "../middleware/auth.js";
import optionalAuthMiddleware from "../middleware/optionalAuth.js";
import { listOrders, placeOrder, updateStatus, userOrders, verifyOrder, markAsPaid, cleanupDebugOrders } from "../controllers/orderController.js";

const orderRouter = express.Router();

orderRouter.post("/place", optionalAuthMiddleware, placeOrder);
orderRouter.post("/verify", verifyOrder);
orderRouter.post("/status", authMiddleware, updateStatus);
orderRouter.post("/markpaid", authMiddleware, markAsPaid);
orderRouter.post("/userorders", optionalAuthMiddleware, userOrders);
orderRouter.get("/list", authMiddleware, listOrders);
orderRouter.post("/cleanup",authMiddleware,cleanupDebugOrders);

export default orderRouter;