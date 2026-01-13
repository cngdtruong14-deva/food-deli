
import mongoose from "mongoose";
import "dotenv/config";
import tableModel from "../../models/tableModel.js";
import branchModel from "../../models/branchModel.js";

console.log(`Current Dir: ${process.cwd()}`);

const verifyTables = async () => {
  try {
    const uri = process.env.MONGO_URI || process.env.MONGO_URL || process.env.MONGODB_URI;
    console.log(`URI found: ${uri ? "YES (masked)" : "NO"}`);
    
    if (!uri) throw new Error("No MongoDB URI found in env");
    await mongoose.connect(uri);
    console.log("Connected to MongoDB");

    const branches = await branchModel.find({});
    console.log(`Found ${branches.length} branches.`);

    for (const branch of branches) {
      const count = await tableModel.countDocuments({ branchId: branch._id });
      console.log(`Branch: ${branch.name} (${branch._id}) - Tables: ${count}`);
    }
    
    // Also check for tables with no branch or invalid branch
    const orphans = await tableModel.countDocuments({ branchId: null });
    console.log(`Orphan Tables (No Branch): ${orphans}`);

    mongoose.disconnect();
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
};

verifyTables();
