import mongoose from "mongoose";
import orderModel from "../models/orderModel.js";
import userModel from "../models/userModel.js";
import foodModel from "../models/foodModel.js";
import tableModel from "../models/tableModel.js";
import recipeModel from "../models/recipeModel.js";
import ingredientModel from "../models/ingredientModel.js";
import stockModel from "../models/stockModel.js";
import Stripe from "stripe";
import { getIO } from "../utils/socket.js";
import fs from 'fs'; // Added for debug log

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// ============ SMART INVENTORY: Auto Stock Deduction ============
// Deduct ingredient stock when order is completed (Served/Delivered)
const deductInventoryForOrder = async (orderId) => {
  try {
    const order = await orderModel.findById(orderId);
    if (!order || !order.items || order.items.length === 0) {
      console.log(`[Inventory] No items found for order ${orderId}`);
      return;
    }

    // Determine Branch (Handle null for Central)
    const branchId = order.branchId || null;
    console.log(`[Inventory] Processing stock deduction for order ${orderId} at Branch: ${branchId || 'Central'}`);
    
    for (const item of order.items) {
      // Find recipe for this food item
      const recipe = await recipeModel.findOne({ foodId: item._id });
      
      if (!recipe) {
        console.log(`[Inventory] No recipe found for ${item.name}, skipping`);
        continue;
      }

      // Deduct each ingredient
      for (const ing of recipe.ingredients) {
        const deductAmount = ing.quantityNeeded * item.quantity;
        
        // Update STOCK model for specific branch
        const updatedStock = await stockModel.findOneAndUpdate(
          { ingredient: ing.ingredientId, branch: branchId },
          { 
            $inc: { quantity: -deductAmount },
            $set: { lastUpdated: new Date() }
          },
          { new: true }
        );

        if (updatedStock) {
           // Fetch ingredient name for logging
           const ingredientInfo = await ingredientModel.findById(ing.ingredientId);
           const name = ingredientInfo ? ingredientInfo.name : "Unknown Ingredient";

           console.log(`[Inventory] Deducted ${deductAmount} ${ing.unit} from ${name} at ${branchId || 'Central'}. New qty: ${updatedStock.quantity}`);
          
          // Warning if stock goes negative or below minimum
          if (updatedStock.quantity < 0) {
            console.warn(`[Inventory] WARNING: ${name} has NEGATIVE stock: ${updatedStock.quantity}`);
          } else if (updatedStock.quantity < updatedStock.minThreshold) {
            console.warn(`[Inventory] LOW STOCK: ${name} is below minimum (${updatedStock.quantity}/${updatedStock.minThreshold})`);
            getIO().emit("stock:alert", {
                type: "LOW_STOCK",
                ingredient: name,
                quantity: updatedStock.quantity,
                threshold: updatedStock.minThreshold,
                branchId: branchId
            });
          }
        } else {
            console.warn(`[Inventory] Stock entry not found for ingredient ${ing.ingredientId} at branch ${branchId}`);
        }
      }
    }

    console.log(`[Inventory] Stock deduction completed for order ${orderId}`);
  } catch (error) {
    console.error(`[Inventory] Error deducting stock for order ${orderId}:`, error);
  }
};

// placing user order for frontend
const placeOrder = async (req, res) => {
  const frontend_url = process.env.FRONTEND_URL || "http://localhost:5173";
  const session = await mongoose.startSession();
  
  try {
    session.startTransaction();
    
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
      const food = await foodModel.findById(item._id).session(session);
      if (!food) {
          await session.abortTransaction();
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
      // HIGH PRIORITY FIX: Use integer math for VND (no decimals)
      // Round each item total to avoid floating point errors
      const itemTotal = Math.round(food.price * item.quantity);
      calculatedAmount += itemTotal;
    }

    // RELAXED LOGIC: Removed Strict Stock Validation (Allow Negative)
     /* 
     if (outOfStockItems.length > 0) {
       await session.abortTransaction();
       return res.json({ ... });
     }
     */

    // CRITICAL FIX: ATOMIC STOCK DEDUCTION (ALLOW NEGATIVE)
    const deductedItems = [];
    
    try {
        for (const item of items) {
            // Updated: Removed { stock: { $gte: item.quantity } } requirement
            // Now allows stock to go negative (Soft Deduction)
            const food = await foodModel.findOneAndUpdate(
                { _id: item._id },
                { $inc: { stock: -item.quantity }, $set: { lastUpdated: new Date() } },
                { new: true, session } // Add session for transaction
            );

            // Note: If food item doesn't exist, it returns null
            if (!food) {
                 // Logic to handle deleting item or ignore? 
                 // If item passed verification earlier, it exists.
                 // But strictly speaking:
                 throw new Error(`Item not found during deduction: ${item.name}`);
            }
            deductedItems.push(item);
        }
    } catch (error) {
        await session.abortTransaction();
        console.error("Stock deduction failed, transaction aborted:", error.message);
        return res.json({ 
            success: false, 
            message: "Purchase failed: Not enough stock for some items. Please try again." 
        });
    }
    
    // IMMEDIATE TABLE STATUS UPDATE (within transaction)
    if (isDineIn && req.body.tableId) {
      await tableModel.findByIdAndUpdate(
        req.body.tableId, 
        { status: "Occupied" },
        { session }
      );
    }

    // HIGH PRIORITY FIX: Round final amount to avoid floating point errors
    const deliveryFee = isDineIn ? 0 : 15000;
    const finalAmount = Math.round(calculatedAmount + deliveryFee);
    
    // Auth ID usually comes from req.user (middleware), legacy/test fallback to body
    const userId = req.user ? req.user.id : req.body.userId;

    const newOrder = new orderModel({
      userId: userId, // Null if guest
      guestId: guestId,        // Unique Guest ID
      items: verifiedItems,
      amount: finalAmount,
      address: req.body.address || {},
      orderType: orderType,
      paymentMethod: paymentMethod,
      branchId: req.body.branchId || null,
      tableId: req.body.tableId || null,
      payment: false,
    });
    
    await newOrder.save({ session });
    
    // Clear cart (within transaction)
    if (userId) {
      await userModel.findByIdAndUpdate(
        userId, 
        { cartData: {} }, 
        { cartData: {} },
        { session }
      );
    }
    
    // Commit transaction - All operations succeed or all fail
    await session.commitTransaction();
    
    // Emit Stock Update Event to all clients (AFTER successful commit)
    // Note: Stock updates are not handled by Change Streams, so always emit
    const stockUpdates = items.map(item => ({
        id: item._id,
        change: -item.quantity 
    }));
    getIO().emit("food:stock_updated", stockUpdates);
    
    // Emit table status update (AFTER successful commit)
    if (isDineIn && req.body.tableId) {
      getIO().emit("table:status_updated", { 
        tableId: req.body.tableId, 
        branchId: req.body.branchId, 
        status: "Occupied" 
      });
    }

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

    const stripeSession = await stripe.checkout.sessions.create({
      line_items: line_items,
      mode: "payment",
      success_url: `${frontend_url}/verify?success=true&orderId=${newOrder._id}`,
      cancel_url: `${frontend_url}/verify?success=false&orderId=${newOrder._id}`,
    });

    res.json({ success: true, session_url: stripeSession.url });
  } catch (error) {
    // CRITICAL FIX: Abort transaction on any error
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    console.error("ORDER ERROR:", error);
    res.json({ success: false, message: "Error placing order: " + error.message });
  } finally {
    // Always end session
    await session.endSession();
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
        const stockUpdates = [];
        for (const item of order.items) {
          await foodModel.findByIdAndUpdate(
            item._id,
            { $inc: { stock: item.quantity } }
          );
          stockUpdates.push({ id: item._id, change: item.quantity });
        }
        
        if (stockUpdates.length > 0) {
            getIO().emit("food:stock_updated", stockUpdates);
        }
        
        // Free Table (Immediately available if payment failed/cancelled)
        if (order.tableId) {
            await tableModel.findByIdAndUpdate(order.tableId, { status: "Available" });
            // Determine branchId properly. order.branchId might be ID or Object depending on population (here it is ID from verify)
            const branchId = order.branchId; 
            getIO().emit("table:status_updated", { tableId: order.tableId, branchId: branchId, status: "Available" });
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
    let userData = await userModel.findById(req.user ? req.user.id : req.body.userId);
    if (userData && userData.role === "admin") {
      await orderModel.findByIdAndUpdate(req.body.orderId, { 
        payment: true,
        status: "Paid"
      });
      
      // Emit update
      getIO().emit("order:status_updated", {
        orderId: req.body.orderId,
        status: "Paid",
      });
      
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
    if (req.user && req.user.id) {
        query.userId = req.user.id;
    } else if (req.body.userId) {
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
    let userData = await userModel.findById(req.user ? req.user.id : req.body.userId);
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
    let userData = await userModel.findById(req.user ? req.user.id : req.body.userId);
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
          getIO().emit("table:status_updated", { tableId: updatedOrder.tableId, branchId: updatedOrder.branchId, status: "Available" });
      }
      
      // RESTORE FOOD STOCK ON CANCELLATION (Fix for Real-time Logic)
      if (status === "Cancelled" && updatedOrder) {
          const stockUpdates = [];
          for (const item of updatedOrder.items) {
             // Only restore if it was a tracked item (though placeOrder checked it, safe to inc)
             await foodModel.findByIdAndUpdate(
                item._id, 
                { $inc: { stock: item.quantity } }
             );
             stockUpdates.push({ id: item._id, change: item.quantity });
          }
          
          if (stockUpdates.length > 0) {
              console.log("[Socket] Emitting Stock Restore on Cancel:", stockUpdates);
              getIO().emit("food:stock_updated", stockUpdates);
          }
      }

      // ============ SMART INVENTORY: Auto Stock Deduction ============
      // Trigger stock deduction when order is completed (Served for Dine-in, Delivered for Delivery)
      if (status === "Served" || status === "Delivered") {
        await deductInventoryForOrder(orderId);
      }

      // Emit real-time event for status update
      // CRITICAL FIX: Only emit if Change Streams are NOT active (prevent double emission)
      // Safe check: getIO() throws if not initialized, so we wrap in try
      let socketReady = false;
      try { getIO(); socketReady = true; } catch(e) { /* Socket not initialized */ }
      
      if (socketReady && updatedOrder && !global.CHANGE_STREAMS_ACTIVE) {
        // Populate order for consistent payload format
        // Note: userId is String, not ObjectId ref, so we can't populate it
        const populatedOrder = await orderModel.findById(updatedOrder._id)
          .populate('branchId', 'name')
          .populate('tableId', 'tableNumber floor');
        
        // Standardized payload format (matches Change Stream format)
        const payload = {
          orderId: populatedOrder._id,
          order: populatedOrder, // Full object for consistency
          status: populatedOrder.status,
          timestamp: new Date()
        };
        
        // userId is String, not ObjectId
        if (populatedOrder.userId) {
          const userId = populatedOrder.userId.toString();
          getIO().to(`user_${userId}`).emit("order:status_updated", payload);
        }
        
        if (populatedOrder.branchId) {
          const branchId = populatedOrder.branchId._id?.toString() || populatedOrder.branchId.toString();
          getIO().to(`branch_${branchId}`).emit("order:status_updated", payload);
        }
        
        // Notify Admins
        getIO().to('admin_notifications').emit("order:status_updated", payload);
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
    let userData = await userModel.findById(req.user ? req.user.id : req.body.userId);
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
