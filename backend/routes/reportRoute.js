import express from "express";
import { 
    getOverviewStats, 
    getRevenueProfitTrend, 
    getTopSellers, 
    getWasteAnalysis 
} from "../controllers/reportController.js";

const reportRouter = express.Router();

// Overview stats (Revenue, COGS, Profit, Waste, Food Cost %)
reportRouter.get("/stats", getOverviewStats);

// Revenue & Profit trend (daily/monthly)
reportRouter.get("/trend", getRevenueProfitTrend);

// Top selling items with margin
reportRouter.get("/top-sellers", getTopSellers);

// Waste analysis by ingredient
reportRouter.get("/waste", getWasteAnalysis);

export default reportRouter;
