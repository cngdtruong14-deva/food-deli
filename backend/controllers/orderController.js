import orderModel from "../models/orderModel.js";
import userModel from "../models/userModel.js";
import foodModel from "../models/foodModel.js";
import Stripe from "stripe";
import { io } from "../server.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// placing user order for frontend
const placeOrder = async (req, res) => {
  const frontend_url = process.env.FRONTEND_URL || "http://localhost:5173";
  try {
    const orderType = req.body.orderType || "Delivery";
    const paymentMethod = req.body.paymentMethod || "Stripe";
    const isDineIn = orderType === "Dine-in";
    const isCOD = paymentMethod === "Cash";
    const items = req.body.items;

    // Stock validation - check all items have enough stock
    const outOfStockItems = [];
    for (const item of items) {
      const food = await foodModel.findById(item._id);
      if (food && food.trackStock && food.stock < item.quantity) {
        outOfStockItems.push({
          name: food.name,
          available: food.stock,
          requested: item.quantity
        });
      }
    }

    if (outOfStockItems.length > 0) {
      return res.json({
        success: false,
        message: "Some items are out of stock",
        outOfStockItems
      });
    }

    // Deduct stock for all items (atomic operation per item)
    for (const item of items) {
      await foodModel.findByIdAndUpdate(
        item._id,
        { $inc: { stock: -item.quantity } },
        { new: true }
      );
    }

    const newOrder = new orderModel({
      userId: req.body.userId,
      items: items,
      amount: req.body.amount,
      address: req.body.address || {},
      orderType: orderType,
      paymentMethod: paymentMethod,
      branchId: req.body.branchId || null,
      tableId: req.body.tableId || null,
      // For COD, order is placed but payment is pending
      payment: false,
    });
    await newOrder.save();
    await userModel.findByIdAndUpdate(req.body.userId, { cartData: {} });

    // Update table status to Occupied if Dine-in
    if (newOrder.tableId) { // Check if tableId exists
       const updatedTable = await tableModel.findByIdAndUpdate(
         newOrder.tableId,
         { status: "Occupied" },
         { new: true }
       );

       if (updatedTable && io) {
          io.emit("table:status_updated", {
             tableId: updatedTable._id,
             branchId: updatedTable.branchId,
             status: "Occupied"
          });
       }
    }

    // Emit real-time event for new order
    if (io) {
      const populatedOrder = await orderModel
        .findById(newOrder._id)
        .populate("branchId", "name")
        .populate("tableId", "tableNumber");

      if (newOrder.branchId) {
        io.to(`branch_${newOrder.branchId}`).emit("order:new", populatedOrder);
      }
      io.emit("order:new", populatedOrder);
    }

    // If COD/Cash payment, skip Stripe and return success directly
    if (isCOD) {
      return res.json({
        success: true,
        message: "Order placed successfully! Pay at counter.",
        orderId: newOrder._id,
        paymentMethod: "Cash",
        redirect_url: `${frontend_url}/verify?success=true&orderId=${newOrder._id}&method=cash`
      });
    }

    // Stripe payment flow
    const line_items = items.map((item) => ({
      price_data: {
        currency: "usd",
        product_data: {
          name: item.name,
        },
        unit_amount: item.price * 100,
      },
      quantity: item.quantity,
    }));

    // Add delivery/service charge only for delivery orders
    if (!isDineIn) {
      line_items.push({
        price_data: {
          currency: "usd",
          product_data: {
            name: "Delivery Charges",
          },
          unit_amount: 2 * 100,
        },
        quantity: 1,
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
    console.log(error);
    res.json({ success: false, message: "Error placing order" });
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
      // Restore stock if payment failed/cancelled
      const order = await orderModel.findById(orderId);
      if (order) {
        for (const item of order.items) {
          await foodModel.findByIdAndUpdate(
            item._id,
            { $inc: { stock: item.quantity } }
          );
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
    const orders = await orderModel.find({ userId: req.body.userId });
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
      const orders = await orderModel.find({}).populate("branchId", "name").populate("tableId", "tableNumber");
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
      const updatedOrder = await orderModel.findByIdAndUpdate(
        req.body.orderId,
        { status: req.body.status },
        { new: true }
      );

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

export { placeOrder, verifyOrder, userOrders, listOrders, updateStatus, markAsPaid };
