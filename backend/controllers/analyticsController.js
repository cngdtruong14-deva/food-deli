import orderModel from "../models/orderModel.js";
import userModel from "../models/userModel.js";
import mongoose from "mongoose";

// Get dashboard statistics
const getDashboardStats = async (req, res) => {
  try {
    const userData = await userModel.findById(req.body.userId);
    if (!userData || !["admin", "manager"].includes(userData.role)) {
      return res.json({ success: false, message: "Unauthorized" });
    }

    const { branchId } = req.query;
    
    // Build match filter
    const matchFilter = {
      status: { $in: ["Paid", "Served", "Confirmed", "Preparing"] }
    };
    
    if (branchId) {
      matchFilter.branchId = new mongoose.Types.ObjectId(branchId);
    }

    // Total Sales (sum of amount for completed orders)
    const salesResult = await orderModel.aggregate([
      { $match: matchFilter },
      { $group: { _id: null, totalSales: { $sum: "$amount" } } }
    ]);
    const totalSales = salesResult[0]?.totalSales || 0;

    // Total Orders count
    const totalOrders = await orderModel.countDocuments(
      branchId ? { branchId: new mongoose.Types.ObjectId(branchId) } : {}
    );

    // Pending Orders count
    const pendingOrders = await orderModel.countDocuments({
      status: { $in: ["Pending", "Confirmed", "Preparing"] },
      ...(branchId && { branchId: new mongoose.Types.ObjectId(branchId) })
    });

    // Top Selling Foods (aggregate items, group by name, sum quantity)
    const topFoods = await orderModel.aggregate([
      { $match: matchFilter },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.name",
          totalQuantity: { $sum: "$items.quantity" },
          totalRevenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } }
        }
      },
      { $sort: { totalQuantity: -1 } },
      { $limit: 5 },
      {
        $project: {
          name: "$_id",
          quantity: "$totalQuantity",
          revenue: "$totalRevenue",
          _id: 0
        }
      }
    ]);

    // Order breakdown by type
    const ordersByType = await orderModel.aggregate([
      { $match: branchId ? { branchId: new mongoose.Types.ObjectId(branchId) } : {} },
      { $group: { _id: "$orderType", count: { $sum: 1 } } },
      { $project: { type: "$_id", count: 1, _id: 0 } }
    ]);

    res.json({
      success: true,
      data: {
        totalSales,
        totalOrders,
        pendingOrders,
        topFoods,
        ordersByType
      }
    });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error fetching analytics" });
  }
};

// Get daily sales for the last 7 days
const getDailySales = async (req, res) => {
  try {
    const userData = await userModel.findById(req.body.userId);
    if (!userData || !["admin", "manager"].includes(userData.role)) {
      return res.json({ success: false, message: "Unauthorized" });
    }

    const { branchId } = req.query;
    
    // Calculate date 7 days ago
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    // Build match filter
    const matchFilter = {
      date: { $gte: sevenDaysAgo },
      status: { $in: ["Paid", "Served", "Confirmed", "Preparing"] }
    };
    
    if (branchId) {
      matchFilter.branchId = new mongoose.Types.ObjectId(branchId);
    }

    const dailySales = await orderModel.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$date" }
          },
          totalSales: { $sum: "$amount" },
          orderCount: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          date: "$_id",
          sales: "$totalSales",
          orders: "$orderCount",
          _id: 0
        }
      }
    ]);

    res.json({
      success: true,
      data: dailySales
    });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error fetching daily sales" });
  }
};

// Get orders by status breakdown
const getOrdersByStatus = async (req, res) => {
  try {
    const userData = await userModel.findById(req.body.userId);
    if (!userData || !["admin", "manager"].includes(userData.role)) {
      return res.json({ success: false, message: "Unauthorized" });
    }

    const { branchId } = req.query;
    
    const matchFilter = branchId 
      ? { branchId: new mongoose.Types.ObjectId(branchId) } 
      : {};

    const statusBreakdown = await orderModel.aggregate([
      { $match: matchFilter },
      { $group: { _id: "$status", count: { $sum: 1 } } },
      { $project: { status: "$_id", count: 1, _id: 0 } }
    ]);

    res.json({
      success: true,
      data: statusBreakdown
    });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error fetching status breakdown" });
  }
};

export { getDashboardStats, getDailySales, getOrdersByStatus };
