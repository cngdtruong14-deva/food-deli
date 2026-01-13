
import mongoose from "mongoose";
import "dotenv/config"; // Relies on .env in CWD (backend/)
import tableModel from "./models/tableModel.js";
import branchModel from "./models/branchModel.js";

const repair = async () => {
    try {
        const uri = process.env.MONGO_URI || process.env.MONGO_URL || process.env.MONGODB_URI;
        if (!uri) throw new Error("No MongoDB URI found via dotenv!");
        
        await mongoose.connect(uri);
        console.log("✅ DB Connected");
        
        // 1. Get a valid branch
        const branch = await branchModel.findOne({});
        if(!branch) throw new Error("❌ No branches found in DB to assign tables to!");
        
        console.log(`Using Branch: ${branch.name} (ID: ${branch._id})`);
        
        // 2. Count orphans
        // We check for null branchId OR missing keys
        const orphanCount = await tableModel.countDocuments({ branchId: null });
        console.log(`Found ${orphanCount} tables with null branchId.`);
        
        // 3. Update orphans
        const result = await tableModel.updateMany(
            { branchId: null },
            { $set: { branchId: branch._id } }
        );
        
        console.log(`✅ Repair complete. Modified ${result.modifiedCount} tables.`);
        
        // 4. Verify Total
        const total = await tableModel.countDocuments({ branchId: branch._id });
        console.log(`Total tables for ${branch.name} is now: ${total}`);

        process.exit(0);
    } catch(e) {
        console.error("❌ Error:", e);
        process.exit(1);
    }
}

repair();
