// ============================================
// CRITICAL FIXES FOR orderController.js
// ============================================
// Apply these fixes to: backend/controllers/orderController.js

// ============ FIX 1: Add soldCount Increment on Completion ============
// Location: updateStatus() function, around line 433

// REPLACE THIS:
if (status === "Served" || status === "Delivered") {
  await deductInventoryForOrder(orderId);
}

// WITH THIS:
if (status === "Served" || status === "Delivered") {
  await deductInventoryForOrder(orderId);
  
  // ============ CRITICAL FIX: Increment soldCount for each item ============
  if (updatedOrder && updatedOrder.items) {
    for (const item of updatedOrder.items) {
      try {
        const result = await foodModel.findByIdAndUpdate(
          item._id,
          { $inc: { soldCount: item.quantity } },
          { new: true }
        );
        
        if (result) {
          console.log(`[SoldCount] ✅ Incremented ${item.quantity} for ${item.name || item._id}. New total: ${result.soldCount}`);
        }
      } catch (error) {
        console.error(`[SoldCount] ❌ Error incrementing soldCount for ${item._id}:`, error);
        // Don't fail the entire operation, but log the error
      }
    }
  }
}

// ============ FIX 2: Add soldCount Decrement on Cancellation/Refund ============
// Location: updateStatus() function, around line 414

// REPLACE THIS:
// RESTORE FOOD STOCK ON CANCELLATION (Fix for Real-time Logic)
if (status === "Cancelled" && updatedOrder) {
  const stockUpdates = [];
  for (const item of updatedOrder.items) {
    await foodModel.findByIdAndUpdate(
      item._id, 
      { $inc: { stock: item.quantity } }
    );
    stockUpdates.push({ id: item._id, change: item.quantity });
  }
  
  if (io && stockUpdates.length > 0) {
    io.emit("food:stock_updated", stockUpdates);
  }
}

// WITH THIS:
// RESTORE FOOD STOCK ON CANCELLATION (Fix for Real-time Logic)
if (status === "Cancelled" && updatedOrder) {
  // Get the OLD status before update to check if it was completed
  const oldOrder = await orderModel.findById(orderId).lean();
  const wasCompleted = oldOrder && ["Served", "Delivered", "Paid"].includes(oldOrder.status);
  
  const stockUpdates = [];
  for (const item of updatedOrder.items) {
    // Restore stock
    await foodModel.findByIdAndUpdate(
      item._id, 
      { $inc: { stock: item.quantity } }
    );
    stockUpdates.push({ id: item._id, change: item.quantity });
    
    // ============ CRITICAL FIX: Decrement soldCount if order was previously completed ============
    if (wasCompleted) {
      try {
        const result = await foodModel.findByIdAndUpdate(
          item._id,
          { $inc: { soldCount: -item.quantity } },
          { new: true }
        );
        
        if (result) {
          console.log(`[SoldCount] ⬇️ Decremented ${item.quantity} for ${item.name || item._id} (cancelled). New total: ${result.soldCount}`);
        }
      } catch (error) {
        console.error(`[SoldCount] ❌ Error decrementing soldCount for ${item._id}:`, error);
      }
    }
  }
  
  if (io && stockUpdates.length > 0) {
    io.emit("food:stock_updated", stockUpdates);
  }
}

// ============ FIX 3: Handle Status Transitions Properly ============
// Location: updateStatus() function - COMPLETE REWRITE OF STATUS LOGIC

// REPLACE THE ENTIRE updateStatus function with this improved version:

const updateStatus = async (req, res) => {
  try {
    let userData = await userModel.findById(req.body.userId);
    if (userData && userData.role === "admin") {
      const { orderId, status, reason } = req.body;
      
      // ============ CRITICAL: Get OLD status BEFORE update ============
      const oldOrder = await orderModel.findById(orderId).lean();
      if (!oldOrder) {
        return res.json({ success: false, message: "Order not found" });
      }
      
      const oldStatus = oldOrder.status;
      const wasCompleted = ["Served", "Delivered", "Paid"].includes(oldStatus);
      const willBeCompleted = ["Served", "Delivered", "Paid"].includes(status);
      const willBeCancelled = status === "Cancelled" || status === "Refunded";
      
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
      
      // RESTORE FOOD STOCK ON CANCELLATION
      if (status === "Cancelled" && updatedOrder) {
          const stockUpdates = [];
          for (const item of updatedOrder.items) {
             await foodModel.findByIdAndUpdate(
                item._id, 
                { $inc: { stock: item.quantity } }
             );
             stockUpdates.push({ id: item._id, change: item.quantity });
          }
          
          if (io && stockUpdates.length > 0) {
              io.emit("food:stock_updated", stockUpdates);
          }
      }

      // ============ CRITICAL FIX: Handle soldCount transitions ============
      if (updatedOrder && updatedOrder.items) {
        // Case 1: Order was completed, now being cancelled/refunded → DECREMENT
        if (wasCompleted && willBeCancelled) {
          console.log(`[SoldCount] 🔄 Order ${orderId}: ${oldStatus} → ${status} (Decrementing soldCount)`);
          for (const item of updatedOrder.items) {
            try {
              const result = await foodModel.findByIdAndUpdate(
                item._id,
                { $inc: { soldCount: -item.quantity } },
                { new: true }
              );
              if (result) {
                console.log(`[SoldCount] ⬇️ Decremented ${item.quantity} for ${item.name || item._id}. New total: ${result.soldCount}`);
              }
            } catch (error) {
              console.error(`[SoldCount] ❌ Error decrementing for ${item._id}:`, error);
            }
          }
        }
        // Case 2: Order becoming completed → INCREMENT
        else if (!wasCompleted && willBeCompleted) {
          console.log(`[SoldCount] 🔄 Order ${orderId}: ${oldStatus} → ${status} (Incrementing soldCount)`);
          for (const item of updatedOrder.items) {
            try {
              const result = await foodModel.findByIdAndUpdate(
                item._id,
                { $inc: { soldCount: item.quantity } },
                { new: true }
              );
              if (result) {
                console.log(`[SoldCount] ⬆️ Incremented ${item.quantity} for ${item.name || item._id}. New total: ${result.soldCount}`);
              }
            } catch (error) {
              console.error(`[SoldCount] ❌ Error incrementing for ${item._id}:`, error);
            }
          }
        }
      }

      // ============ SMART INVENTORY: Auto Stock Deduction ============
      if (status === "Served" || status === "Delivered") {
        await deductInventoryForOrder(orderId);
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
