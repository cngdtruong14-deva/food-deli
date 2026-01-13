import orderModel from "../models/orderModel.js";
import userModel from "../models/userModel.js";
import tableModel from "../models/tableModel.js";
import mongoose from "mongoose";

// Get live status (Active Tables & Kitchen Backlog)
const getLiveStatus = async (req, res) => {
  try {
    const { branchId, userId } = req.query; // Allow passing via query for consistency
    // Note: userId here is for verifying admin, prefer token context
    const requesterId = req.user ? req.user.id : (req.body.userId || userId);

    const userData = await userModel.findById(requesterId);
    if (!userData || !["admin", "manager"].includes(userData.role)) {
      return res.json({ success: false, message: "Unauthorized" });
    }

    // const { branchId } = req.query; // Removed redundant declaration
    
    // 1. Active Tables
    const activeTablesQuery = { status: "Occupied" };
    if (branchId) {
      activeTablesQuery.branchId = new mongoose.Types.ObjectId(branchId);
    }
    const activeTables = await tableModel.countDocuments(activeTablesQuery);

    // 2. Kitchen Backlog
    const backlogQuery = { status: { $in: ["Confirmed", "Preparing"] } };
    if (branchId) {
        backlogQuery.branchId = new mongoose.Types.ObjectId(branchId);
    }
    const kitchenBacklog = await orderModel.countDocuments(backlogQuery);

    res.json({
      success: true,
      data: {
        activeTables,
        kitchenBacklog
      }
    });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error fetching live status" });
  }
};

// Get Consolidated Dashboard Data
const getDashboardData = async (req, res) => {
  try {
    const requesterId = req.user ? req.user.id : req.body.userId;
    const userData = await userModel.findById(requesterId);
    if (!userData || !["admin", "manager"].includes(userData.role)) {
      return res.json({ success: false, message: "Unauthorized" });
    }

    const { branchId } = req.query;

    // --- PIPELINES ---

    // 1. Revenue by Day (Last 7 Days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const revenueMatch = {
      status: { $in: ["Paid", "Served"] },
      date: { $gte: sevenDaysAgo }
    };
    if (branchId) revenueMatch.branchId = new mongoose.Types.ObjectId(branchId);

    const revenuePipeline = [
      { $match: revenueMatch },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$date", timezone: "+07:00" } },
          dailyRevenue: { $sum: "$amount" },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ];

    // 2. Peak Hours Heatmap
    const peakMatch = { status: { $ne: "Cancelled" } };
    if (branchId) peakMatch.branchId = new mongoose.Types.ObjectId(branchId);

    const peakHoursPipeline = [
      { $match: peakMatch },
      {
        $project: {
          dayOfWeek: { $isoDayOfWeek: { date: "$date", timezone: "+07:00" } }, // 1 (Mon) - 7 (Sun)
          hour: { $hour: { date: "$date", timezone: "+07:00" } }             // 0 - 23
        }
      },
      {
        $group: {
          _id: { day: "$dayOfWeek", hour: "$hour" },
          orderCount: { $sum: 1 }
        }
      },
      { $sort: { "_id.day": 1, "_id.hour": 1 } }
    ];

    // 3. Lost Sales Analysis (Cancellation)
    const cancelMatch = { status: "Cancelled" };
    if (branchId) cancelMatch.branchId = new mongoose.Types.ObjectId(branchId);

    const lostSalesPipeline = [
      { $match: cancelMatch },
      {
        $group: {
          _id: "$cancellationReason",
          count: { $sum: 1 },
          lostRevenue: { $sum: "$amount" }
        }
      }
    ];
    
    // 4. Top Selling Products
    const topProdMatch = { status: { $ne: "Cancelled" } };
    if (branchId) topProdMatch.branchId = new mongoose.Types.ObjectId(branchId);
    
    const topProductsPipeline = [
      { $match: topProdMatch },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.name",
          totalQty: { $sum: "$items.quantity" },
          totalRev: { $sum: { $multiply: ["$items.price", "$items.quantity"] } }
        }
      },
      { $sort: { totalQty: -1 } },
      { $limit: 5 }
    ];

    // Execution
    const [revenueData, peakData, lostSalesData, topProducts] = await Promise.all([
      orderModel.aggregate(revenuePipeline),
      orderModel.aggregate(peakHoursPipeline),
      orderModel.aggregate(lostSalesPipeline),
      orderModel.aggregate(topProductsPipeline)
    ]);

    res.json({
      success: true,
      data: {
        revenue: revenueData,
        peakHours: peakData,
        lostSales: lostSalesData,
        topProducts: topProducts
      }
    });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error fetching dashboard data" });
  }
};

export { getLiveStatus, getDashboardData };
