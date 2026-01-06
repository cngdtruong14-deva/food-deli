import express from "express";
import cors from "cors";
import http from "http";
import os from "os";
import { Server } from "socket.io";
import { connectDB } from "./config/db.js";
import foodRouter from "./routes/foodRoute.js";
import userRouter from "./routes/userRoute.js";
import "dotenv/config";
import cartRouter from "./routes/cartRoute.js";
import orderRouter from "./routes/orderRoute.js";
import branchRouter from "./routes/branchRoute.js";
import tableRouter from "./routes/tableRoute.js";
import analyticsRouter from "./routes/analyticsRoute.js";
import ingredientRouter from "./routes/ingredientRoute.js";
import mongoose from "mongoose";

// ============ LAN IP Detection Utility ============
const getLocalIP = () => {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      // Skip internal and non-IPv4 addresses
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
};

// app config
const app = express();
const port = process.env.PORT || 4000;
const host = '0.0.0.0'; // Listen on all network interfaces for LAN access

// Create HTTP server and Socket.io
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // Allow all origins for development (LAN testing)
    methods: ["GET", "POST"],
  },
});

// Export io for use in controllers
export { io };

// middlewares
app.use(express.json());

// CORS configuration - Allow all origins for development
app.use(cors({
  origin: "*", // Allow all origins for LAN testing
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "token", "Authorization"]
}));

// DB connection
connectDB();

// Socket.io connection handling
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // Join a branch room (for staff)
  socket.on("join_branch", (branchId) => {
    socket.join(`branch_${branchId}`);
    console.log(`Socket ${socket.id} joined branch_${branchId}`);
  });

  // Join a user room (for customer order tracking)
  socket.on("join_user", (userId) => {
    socket.join(`user_${userId}`);
    console.log(`Socket ${socket.id} joined user_${userId}`);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

// api endpoints
app.use("/api/food", foodRouter);
app.use("/images", express.static("uploads"));
app.use("/api/user", userRouter);
app.use("/api/cart", cartRouter);
app.use("/api/order", orderRouter);
app.use("/api/branch", branchRouter);
app.use("/api/table", tableRouter);
app.use("/api/analytics", analyticsRouter);
app.use("/api/ingredient", ingredientRouter);

app.get("/", (req, res) => {
  res.send("API Working");
});

// Start server on 0.0.0.0 for LAN access
server.listen(port, host, () => {
  const localIP = getLocalIP();
  console.log(`\n========================================`);
  console.log(`🚀 Server Started Successfully!`);
  console.log(`========================================`);
  console.log(`📍 Local:    http://localhost:${port}`);
  console.log(`📍 Network:  http://${localIP}:${port}`);
  console.log(`========================================`);
  console.log(`📱 For Mobile Testing, use: http://${localIP}:${port}`);
  console.log(`   Update VITE_API_URL in frontend/.env to this IP`);
  console.log(`========================================\n`);
});

// ============ Graceful Shutdown Handler ============
const gracefulShutdown = async (signal) => {
  console.log(`\n⚠️  Received ${signal}. Gracefully shutting down...`);
  
  // Close HTTP server
  server.close(() => {
    console.log('✅ HTTP server closed.');
  });

  // Close Socket.io connections
  io.close(() => {
    console.log('✅ Socket.io connections closed.');
  });

  // Close MongoDB connection
  try {
    await mongoose.connection.close();
    console.log('✅ MongoDB connection closed.');
  } catch (err) {
    console.error('❌ Error closing MongoDB:', err);
  }

  console.log('👋 Shutdown complete. Goodbye!\n');
  process.exit(0);
};

// Handle shutdown signals
process.on('SIGINT', () => gracefulShutdown('SIGINT'));  // Ctrl+C
process.on('SIGTERM', () => gracefulShutdown('SIGTERM')); // Kill command
