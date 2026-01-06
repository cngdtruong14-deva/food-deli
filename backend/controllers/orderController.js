import orderModel from "../models/orderModel.js";
import userModel from "../models/userModel.js";
import foodModel from "../models/foodModel.js";
import tableModel from "../models/tableModel.js";
import Stripe from "stripe";
import { io } from "../server.js";
import fs from 'fs'; // Added for debug log

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// placing user order for frontend
const placeOrder = async (req, res) => {
  const frontend_url = process.env.FRONTEND_URL || "http://localhost:5173";
  try {
    const orderType = req.body.orderType || "Delivery";
    const paymentMethod = req.body.paymentMethod || "Stripe";
    const guestId = req.body.guestId || null;
    const isDineIn = orderType === "Dine-in";
    const isCOD = paymentMethod === "Cash";
    const items = req.body.items;

    // Verify items and prices from Database (SECURITY FIX)
    const verifiedItems = [];
    let calculatedAmount = 0;
    
    // Stock validation & Price verification
    const outOfStockItems = [];
    
    for (const item of items) {
      const food = await foodModel.findById(item._id);
      if (!food) {
          return res.json({ success: false, message: `Item not found: ${item.name}` });
      }
      
      if (food.trackStock && food.stock < item.quantity) {
        outOfStockItems.push({
          name: food.name,
          available: food.stock,
          requested: item.quantity
        });
      }
      
      verifiedItems.push({
          ...item,
          price: food.price,
          name: food.name
      });
      calculatedAmount += food.price * item.quantity;
    }

    if (outOfStockItems.length > 0) {
      return res.json({
        success: false,
        message: "Some items are out of stock",
        outOfStockItems
      });
    }

    // Deduct stock
    for (const item of items) {
      await foodModel.findByIdAndUpdate(
        item._id,
        { $inc: { stock: -item.quantity } },
        { new: true }
      );
    }
    
    // IMMEDIATE TABLE STATUS UPDATE (Fix for lag)
    if (isDineIn && req.body.tableId) {
      await tableModel.findByIdAndUpdate(req.body.tableId, { status: "Occupied" });
      // Emit socket event if needed, but tableController usually watches DB or logic elsewhere
      if (io) {
         io.emit("table:status_updated", { tableId: req.body.tableId, branchId: req.body.branchId, status: "Occupied" });
      }
    }

    const newOrder = new orderModel({
      userId: req.body.userId, // Null if guest
      guestId: guestId,        // Unique Guest ID
      items: verifiedItems,
      amount: calculatedAmount + (isDineIn ? 0 : 15000),
      address: req.body.address || {},
      orderType: orderType,
      paymentMethod: paymentMethod,
      branchId: req.body.branchId || null,
      tableId: req.body.tableId || null,
      payment: false,
    });
    
    await newOrder.save();
    await userModel.findByIdAndUpdate(req.body.userId, { cartData: {} });

    // Handle Cash Payment (Skip Stripe) - e.g. Dine-in or COD
    if (isCOD) {
       // Only clear cart and return success
       return res.json({ success: true, message: "Order placed successfully" });
    }

    // ... (keep Table update & Socket.io logic)

    // Stripe payment flow with TRUSTED items
    const line_items = verifiedItems.map((item) => ({
      price_data: {
        currency: "vnd",
        product_data: {
          name: item.name,
        },
        unit_amount: Math.round(item.price), // VND is zero-decimal, send exact amount, ensure integer
      },
      quantity: item.quantity,
    }));

    // Add delivery/service charge only for delivery orders
    if (!isDineIn) {
      line_items.push({
        price_data: {
          currency: "vnd",
          product_data: {
            name: "Phí giao hàng",
          },
          unit_amount: 15000, // 15,000 VND
        },
        quantity: 1,
      });
    }

    // console.log("Stripe Line Items:", JSON.stringify(line_items, null, 2));

    // CHECK FOR VALID STRIPE KEY - Bypass if invalid (Dev/Mock Mode)
    if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY.includes("nhap_bi_mat")) {
       console.log("⚠️ Stripe Key missing or invalid. Using MOCK STRIPE mode.");
       return res.json({ 
         success: true, 
         session_url: `${frontend_url}/verify?success=true&orderId=${newOrder._id}` 
       });
    }

    const session = await stripe.checkout.sessions.create({
      line_items: line_items,
      mode: "payment",
      success_url: `${frontend_url}/verify?success=true&orderId=${newOrder._id}`,
      cancel_url: `${frontend_url}/verify?success=false&orderId=${newOrder._id}`,
    });

    res.json({ success: true, session_url: session.url });
  } catch (error) {
    console.log("ORDER ERROR:", error);
    res.json({ success: false, message: "Error placing order: " + error.message });
  }
};

const verifyOrder = async (req, res) => {
  const { orderId, success, method } = req.body;
  try {
    // For Cash payment, mark as verified (payment still pending until collected)
    if (method === "cash" && success == "true") {
      // COD orders are verified but payment collected later
      await orderModel.findByIdAndUpdate(orderId, { status: "Confirmed" });
      return res.json({ success: true, message: "Order confirmed! Pay at counter." });
    }
    
    if (success == "true") {
      await orderModel.findByIdAndUpdate(orderId, { payment: true });
      res.json({ success: true, message: "Paid" });
    } else {
      // Restore stock & Free Table if payment failed/cancelled
      const order = await orderModel.findById(orderId);
      if (order) {
        // Restore Stock
        for (const item of order.items) {
          await foodModel.findByIdAndUpdate(
            item._id,
            { $inc: { stock: item.quantity } }
          );
        }
        
        // Free Table (Immediately available if payment failed/cancelled)
        if (order.tableId) {
            await tableModel.findByIdAndUpdate(order.tableId, { status: "Available" });
             if (io) {
                // Determine branchId properly. order.branchId might be ID or Object depending on population (here it is ID from verify)
                const branchId = order.branchId; 
                io.emit("table:status_updated", { tableId: order.tableId, branchId: branchId, status: "Available" });
            }
        }
      }
      await orderModel.findByIdAndDelete(orderId);
      res.json({ success: false, message: "Not Paid" });
    }
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error" });
  }
};

// Mark COD order as paid (admin function)
const markAsPaid = async (req, res) => {
  try {
    let userData = await userModel.findById(req.body.userId);
    if (userData && userData.role === "admin") {
      await orderModel.findByIdAndUpdate(req.body.orderId, { 
        payment: true,
        status: "Paid"
      });
      
      // Emit update
      if (io) {
        io.emit("order:status_updated", {
          orderId: req.body.orderId,
          status: "Paid",
        });
      }
      
      res.json({ success: true, message: "Order marked as paid" });
    } else {
      res.json({ success: false, message: "Unauthorized" });
    }
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error" });
  }
};

// user orders for frontend
const userOrders = async (req, res) => {
  try {
    let query = {};
    // Prioritize userId (Logged in), otherwise check guestId (Anonymous)
    if (req.body.userId) {
        query.userId = req.body.userId;
    } else if (req.body.guestId) {
        query.guestId = req.body.guestId;
    } else {
        return res.json({ success: true, data: [] });
    }

    const orders = await orderModel.find(query)
      .populate("branchId", "name")
      .populate("tableId", "tableNumber floor")
      .sort({ date: -1 });

    res.json({ success: true, data: orders });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error" });
  }
};

// Listing orders for admin pannel
const listOrders = async (req, res) => {
  try {
    let userData = await userModel.findById(req.body.userId);
    if (userData && userData.role === "admin") {
      const orders = await orderModel.find({}).populate("branchId", "name").populate("tableId", "tableNumber floor");
      res.json({ success: true, data: orders });
    } else {
      res.json({ success: false, message: "You are not admin" });
    }
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error" });
  }
};

// api for updating status
const updateStatus = async (req, res) => {
  try {
    let userData = await userModel.findById(req.body.userId);
    if (userData && userData.role === "admin") {
      const { orderId, status, reason } = req.body;
      
      const updateData = { status: status };
      
      // Push to timeline
      const pushOperation = { 
        timeline: { status: status, timestamp: new Date() } 
      };

      // Handle Cancellation Reason
      if (status === "Cancelled" && reason) {
        updateData.cancellationReason = reason;
      }

      const updatedOrder = await orderModel.findByIdAndUpdate(
        orderId,
        { 
          $set: updateData,
          $push: pushOperation
        },
        { new: true }
      );

      // Auto-Free Table on Cancellation
      if (status === "Cancelled" && updatedOrder && updatedOrder.tableId) {
          await tableModel.findByIdAndUpdate(updatedOrder.tableId, { status: "Available" });
          if (io) {
             io.emit("table:status_updated", { tableId: updatedOrder.tableId, branchId: updatedOrder.branchId, status: "Available" });
          }
      }

      // Emit real-time event for status update
      if (io && updatedOrder) {
        io.to(`user_${updatedOrder.userId}`).emit("order:status_updated", {
          orderId: updatedOrder._id,
          status: updatedOrder.status,
        });
        
        if (updatedOrder.branchId) {
          io.to(`branch_${updatedOrder.branchId}`).emit("order:status_updated", {
            orderId: updatedOrder._id,
            status: updatedOrder.status,
          });
        }
        
        io.emit("order:status_updated", {
          orderId: updatedOrder._id,
          status: updatedOrder.status,
        });
      }

      res.json({ success: true, message: "Status Updated Successfully" });
    } else {
      res.json({ success: false, message: "You are not an admin" });
    }
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error" });
  }
};

// Cleanup Debug Orders (Admin only)
const cleanupDebugOrders = async (req, res) => {
  try {
    let userData = await userModel.findById(req.body.userId);
    if (!userData || userData.role !== "admin") {
      return res.json({ success: false, message: "Unauthorized" });
    }
    
    // Define criteria for "Ghost/Debug" orders
    const result = await orderModel.deleteMany({
        $or: [
            // Name contains keywords
            { "address.firstName": { $regex: "Debug|Test|Demo|Fake", $options: "i" } },
            { "address.lastName": { $regex: "Debug|Test|Demo|Fake", $options: "i" } },
            // Common dummy phone numbers
            { "address.phone": { $in: ["123456789", "12345678", "000000000", "0999999999", "111111111"] } }
        ]
    });

    res.json({ success: true, message: `Đã dọn dẹp ${result.deletedCount} đơn hàng rác (Debug/Test/Demo/SĐT ảo)`, count: result.deletedCount });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error" });
  }
};

export { placeOrder, verifyOrder, userOrders, listOrders, updateStatus, markAsPaid, cleanupDebugOrders };
