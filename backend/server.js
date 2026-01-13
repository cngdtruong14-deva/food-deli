import express from "express";
import cors from "cors";
import http from "http";
import os from "os";
import { initSocket, getIO } from "./utils/socket.js";
import { connectDB } from "./config/db.js";
import "dotenv/config";
import mongoose from "mongoose";

// Route Imports
import foodRouter from "./routes/foodRoute.js";
import userRouter from "./routes/userRoute.js";
import cartRouter from "./routes/cartRoute.js";
import orderRouter from "./routes/orderRoute.js";
import branchRouter from "./routes/branchRoute.js";
import tableRouter from "./routes/tableRoute.js";
import analyticsRouter from "./routes/analyticsRoute.js";
import ingredientRouter from "./routes/ingredientRoute.js";
import inventoryRouter from "./routes/inventoryRoute.js";
import reviewRouter from "./routes/reviewRoute.js";
import recipeRouter from "./routes/recipeRoute.js";
import importRouter from "./routes/importRoute.js";
import reportRouter from "./routes/reportRoute.js";
// import notificationRouter from "./routes/notificationRoute.js"; // Removed: File does not exist
import benchmarkRouter from "./routes/benchmarkRoute.js";

// Stream Import
import { initStreams, closeStreams } from "./streams/index.js";

// Middleware Import
import { socketAuthMiddleware } from "./middleware/socketAuth.js";

// ============ LAN IP Detection Utility ============
const getLocalIP = () => {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
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
const host = '0.0.0.0';

// Create HTTP server and Socket.io
const server = http.createServer(app);

// CORS Config
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:3000",
  process.env.FRONTEND_URL
].filter(Boolean);

const io = initSocket(server, {
  cors: {
    origin: allowedOrigins.length > 0 ? allowedOrigins : "*",
    methods: ["GET", "POST"],
    credentials: true
  },
});

// NOTE: io is now managed by utils/socket.js. Use getIO() in other modules.

// middlewares
app.use(express.json());
app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "token", "Authorization"]
}));

// DB connection
connectDB();

// Socket.io Authentication
io.use(socketAuthMiddleware);

// Socket.io Connection Handling
io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id} (User: ${socket.userId}, Role: ${socket.userRole})`);

  // Auto-join Admin Room
  if (socket.userRole === 'admin') {
      socket.join('admin_notifications');
      console.log(`👑 Admin ${socket.id} joined 'admin_notifications'`);
  }

  // Join Branch Room
  socket.on("join_branch", (branchId) => {
    if (socket.userRole !== 'admin' && socket.userBranchId?.toString() !== branchId?.toString()) {
      socket.emit('error', { 
        message: 'Unauthorized: You do not have access to this branch',
        code: 'UNAUTHORIZED_BRANCH'
      });
      console.warn(`⚠️ Unauthorized branch access attempt: Socket ${socket.id} tried to join branch_${branchId}`);
      return;
    }
    socket.join(`branch_${branchId}`);
    console.log(`✅ Socket ${socket.id} joined branch_${branchId}`);
  });

  // Join User Room
  socket.on("join_user", (userId) => {
    const requestedUserId = userId?.toString();
    const socketUserId = socket.userId?.toString();
    
    if (socket.userRole !== 'admin' && socketUserId !== requestedUserId) {
      socket.emit('error', { 
        message: 'Unauthorized: You can only join your own user room',
        code: 'UNAUTHORIZED_USER'
      });
      return;
    }
    socket.join(`user_${userId}`);
    console.log(`✅ Socket ${socket.id} joined user_${userId}`);
  });

  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

// API Endpoints
app.use("/api/food", foodRouter);
app.use("/images", express.static("uploads"));
app.use("/api/user", userRouter);
app.use("/api/cart", cartRouter);
app.use("/api/order", orderRouter);
app.use("/api/branch", branchRouter);
app.use("/api/table", tableRouter);
app.use("/api/analytics", analyticsRouter);
app.use("/api/ingredient", ingredientRouter);
app.use("/api/reviews", reviewRouter);
app.use("/api/recipe", recipeRouter);
app.use("/api/import", importRouter);
app.use("/api/reports", reportRouter);
// app.use("/api/notification", notificationRouter); // Removed
app.use("/api/inventory", inventoryRouter);
app.use("/api/benchmark", benchmarkRouter);


app.get("/", (req, res) => {
  res.send("API Working");
});

// Start Server
server.listen(port, host, () => {
    const localIP = getLocalIP();
    console.log(`\n========================================`);
    console.log(`🚀 Server Started Successfully!`);
    
    // Initialize Streams
    initStreams(io);

    console.log(`========================================`);
    console.log(`💻 Local (Dev):   http://localhost:${port}`);
    console.log(`🌐 Network (LAN): http://${localIP}:${port}`);
    console.log(`========================================\n`);
});

// Graceful Shutdown
const gracefulShutdown = async (signal) => {
  console.log(`\n⚠️  Received ${signal}. Gracefully shutting down...`);
  server.close(() => console.log('✅ HTTP server closed.'));
  io.close(() => console.log('✅ Socket.io connections closed.'));
  await closeStreams(); // Close Change Streams
  try {
    await mongoose.connection.close();
    console.log('✅ MongoDB connection closed.');
  } catch (err) {
    console.error('❌ Error closing MongoDB:', err);
  }
  console.log('👋 Shutdown complete.\n');
  process.exit(0);
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
