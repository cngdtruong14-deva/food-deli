
import mongoose from "mongoose";
import orderModel from "../models/orderModel.js";
import userModel from "../models/userModel.js";
import branchModel from "../models/branchModel.js";
import tableModel from "../models/tableModel.js";
import foodModel from "../models/foodModel.js";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: "d:/tailieu/phanmemmanguonmo/food-deli/Food-Delivery/backend/.env" });

const runDebug = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL);
    console.log("DB Connected");

    // Fetch required data
    const user = await userModel.findOne();
    const branch = await branchModel.findOne();
    const table = await tableModel.findOne({ branchId: branch._id });
    const food = await foodModel.findOne();

    if (!user || !branch || !table || !food) {
        console.log("Missing data for test");
        console.log({ user: !!user, branch: !!branch, table: !!table, food: !!food });
        process.exit(1);
    }

    console.log("Data found:");
    console.log("User ID:", user._id.toString()); // Note: schema says userId is String, so this is fine
    console.log("Branch ID:", branch._id);
    console.log("Table ID:", table._id);
    console.log("Food ID:", food._id);

    const orderData = {
        userId: user._id.toString(),
        items: [{ _id: food._id, quantity: 1, name: food.name, price: food.price }],
        amount: food.price + 15000,
        address: {
            firstName: "Debug",
            lastName: "User",
            phone: "123456789",
            street: "Debug St",
            city: "Debug City"
        },
        orderType: "Dine-in",
        paymentMethod: "Cash",
        branchId: branch._id,
        tableId: table._id,
        payment: false
    };

    console.log("Attempting to save order with data:", orderData);

    const newOrder = new orderModel(orderData);
    await newOrder.save();

    console.log("Order saved successfully!");
    
    // Clean up
    await orderModel.findByIdAndDelete(newOrder._id);
    console.log("Test order deleted.");

  } catch (error) {
    const fs = await import("fs");
    fs.writeFileSync("d:/tailieu/phanmemmanguonmo/food-deli/Food-Delivery/backend/debug_output.txt", `MESSAGE: ${error.message}\nSTACK: ${error.stack}`);
  } finally {
    mongoose.disconnect();
  }
};

runDebug();
