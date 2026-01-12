import mongoose from "mongoose";
import orderModel from "../models/orderModel.js";
import stockModel from "../models/stockModel.js";
import ingredientModel from "../models/ingredientModel.js"; // For populating stock
import userModel from "../models/userModel.js"; // For populating order

export const initStreams = async (io) => {
    try {
        if (!mongoose.connection.db) {
            console.warn("⚠️ DB Connection not ready for Streams.");
            return;
        }

        // Phase 1: Pre-flight Check (Replica Set)
        const admin = mongoose.connection.db.admin();
        try {
            const status = await admin.replSetGetStatus();
            if (status && (status.ok === 1 || status.ok === true)) {
                console.log("✅ Replica Set detected. Initializing Change Streams...");
                startStreams(io);
                global.CHANGE_STREAMS_ACTIVE = true;
            } else {
                 throw new Error("Not a replica set");
            }
        } catch (err) {
            console.warn("⚠️  Change Streams NOT supported (Standalone Mode). Falling back to Controller Emits.");
            global.CHANGE_STREAMS_ACTIVE = false;
        }

    } catch (error) {
        console.error("❌ Stream Initialization Error:", error);
    }
};

const startStreams = (io) => {
    // 1. Order Stream
    try {
        const orderStream = orderModel.watch([], { fullDocument: 'updateLookup' });
        activeOrderStream = orderStream; // Capture reference

        orderStream.on('change', async (change) => {
            try {
                if (change.operationType === 'insert') {
                    const orderId = change.fullDocument._id;
                    const fullOrder = await orderModel.findById(orderId)
                        .populate('branchId', 'name')
                        .populate('tableId', 'tableNumber floor');
                    
                    if (fullOrder) {
                        const payload = {
                            orderId: fullOrder._id,
                            order: fullOrder,
                            status: fullOrder.status,
                            timestamp: new Date()
                        };
                        
                        if (fullOrder.branchId) {
                            const branchId = fullOrder.branchId._id?.toString() || fullOrder.branchId.toString();
                            io.to(`branch_${branchId}`).emit('new_order', payload);
                            console.log(`[Stream] Emitted new_order for ${orderId} to branch_${branchId}`);
                        }
                    }
                } 
                else if (change.operationType === 'update') {
                    const updatedFields = change.updateDescription.updatedFields;
                    const relevantKeys = Object.keys(updatedFields).some(key => 
                        key.includes('status') || key.includes('shippingStatus') || key.includes('shipper')
                    );

                    if (relevantKeys) {
                        const orderId = change.documentKey._id;
                        const fullOrder = await orderModel.findById(orderId)
                            .populate('branchId', 'name')
                            .populate('tableId', 'tableNumber floor');

                        if (fullOrder) {
                            const payload = {
                                orderId: fullOrder._id,
                                order: fullOrder,
                                status: fullOrder.status,
                                timestamp: new Date()
                            };
                            
                            if (fullOrder.userId) {
                                const userId = fullOrder.userId.toString();
                                io.to(`user_${userId}`).emit('order:status_updated', payload);
                                console.log(`[Stream] Emitted order:status_updated for ${orderId} to user_${userId}`);
                            }

                            if (fullOrder.branchId) {
                                const branchId = fullOrder.branchId._id?.toString() || fullOrder.branchId.toString();
                                io.to(`branch_${branchId}`).emit('order:status_updated', payload);
                                console.log(`[Stream] Emitted order:status_updated for ${orderId} to branch_${branchId}`);
                            }
                        }
                    }
                }
            } catch (err) {
                console.error("Order Stream Error:", err);
            }
        });

        orderStream.on('error', (err) => console.error("Order Stream Connection Error:", err));

    } catch (err) {
        console.error("Failed to watch Order:", err);
    }

    // 2. Stock Stream
    try {
        const stockStream = stockModel.watch([], { fullDocument: 'updateLookup' });
        activeStockStream = stockStream; // Capture reference
        
        stockStream.on('change', async (change) => {
            try {
                if (change.operationType === 'update') {
                    const updatedFields = change.updateDescription.updatedFields;
                    if (updatedFields.quantity !== undefined) {
                         const stockId = change.documentKey._id;
                         const fullStock = await stockModel.findById(stockId).populate('ingredient');
                         
                         if (fullStock) {
                             const payload = {
                                 ingredientId: fullStock.ingredient._id,
                                 quantity: fullStock.quantity,
                                 isOutOfStock: fullStock.quantity <= 0,
                                 branchId: fullStock.branch
                             };
                             
                             io.emit('stock_update', payload);
                             console.log(`[Stream] Emitted stock_update for ${fullStock.ingredient.name}`);
                         }
                    }
                }
            } catch (err) {
                 console.error("Stock Stream Error:", err);
            }
        });
        
    } catch (err) {
        console.error("Failed to watch Stock:", err);
    }
};

let activeOrderStream = null;
let activeStockStream = null;

export const closeStreams = async () => {
    if (activeOrderStream) {
        await activeOrderStream.close();
        console.log("✅ Order Stream closed.");
    }
    if (activeStockStream) {
        await activeStockStream.close();
        console.log("✅ Stock Stream closed.");
    }
};
