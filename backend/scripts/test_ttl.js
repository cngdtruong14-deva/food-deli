import mongoose from "mongoose";
import tokenModel from "../models/tokenModel.js";
import userModel from "../models/userModel.js";
import "dotenv/config";

// Configuration
const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://caothang26012002:Thang123@cluster0.35515.mongodb.net/food-del"; // Fallback if env not loaded

const testTTL = async () => {
    try {
        console.log("⏳ Connecting to DB...");
        await mongoose.connect(MONGO_URI);
        console.log("✅ DB Connected.");

        // 1. Find a dummy user or create ID
        const dummyUserId = new mongoose.Types.ObjectId();

        // 2. Insert Dummy Token (Created 20 mins ago)
        // TTL is 15 mins (900s). So 20 mins ago is EXPIRED.
        const twentyMinsAgo = new Date(Date.now() - 20 * 60 * 1000);
        
        const token = await tokenModel.create({
            userId: dummyUserId,
            token: "test-ttl-token-" + Date.now(),
            createdAt: twentyMinsAgo
        });

        console.log(`✅ Inserted Expired Token: ${token._id}`);
        console.log(`   Created At: ${token.createdAt.toISOString()}`);
        console.log(`   Current Time: ${new Date().toISOString()}`);
        console.log("   (Should be deleted by MongoDB TTL thread within ~60s)");

        // 3. Wait loop
        console.log("\n⏳ Waiting 65 seconds for MongoDB TTL thread...");
        
        let counter = 0;
        const interval = setInterval(() => {
            counter += 5;
            process.stdout.write(`...${counter}s`);
        }, 5000);

        setTimeout(async () => {
            clearInterval(interval);
            console.log("\n\n🔍 Checking Token Status...");
            
            const foundToken = await tokenModel.findById(token._id);
            
            if (!foundToken) {
                console.log("✅ SUCCESS: Token was automatically deleted!");
            } else {
                console.log("❌ FAILURE: Token still exists.");
                console.log("   Note: MongoDB TTL thread runs every 60s. It might take extended time on some clusters or if indexes are still building.");
                
                // Cleanup manual
                await tokenModel.findByIdAndDelete(token._id);
                console.log("   (Cleaned up manually)");
            }

            await mongoose.connection.close();
            console.log("👋 Done.");
            process.exit(0);
        }, 65000); // 65 seconds

    } catch (error) {
        console.error("❌ Error:", error);
        process.exit(1);
    }
};

testTTL();
