import mongoose from "mongoose";
import dotenv from "dotenv";
import branchModel from "../models/branchModel.js";
import tableModel from "../models/tableModel.js";
import path from "path";
import { fileURLToPath } from 'url';

// Fix __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env vars
dotenv.config({ path: path.join(__dirname, '../.env') });

const seedTables = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URL);
        console.log("Connected to MongoDB");

        // Fetch all branches
        const branches = await branchModel.find({});
        console.log(`Found ${branches.length} branches.`);

        if (branches.length === 0) {
            console.log("No branches found. Please seed branches first.");
            process.exit(1);
        }

        // Clear existing tables
        await tableModel.deleteMany({});
        console.log("Cleared existing tables.");

        const allTables = [];

        // For each branch, create tables
        for (const branch of branches) {
            // Generate 15 tables per branch
            for (let i = 1; i <= 15; i++) {
                const tableNumber = `Bàn ${i}`;
                const capacity = i <= 5 ? 2 : (i <= 10 ? 4 : 8); // Varied capacity

                allTables.push({
                    branchId: branch._id,
                    tableNumber: tableNumber,
                    capacity: capacity,
                    status: "Available",
                    qrCode: `https://quannhautudo.com/menu?table=${tableNumber}&branch=${branch._id}` // Dummy link for now
                });
            }
        }

        // Insert tables
        await tableModel.insertMany(allTables);
        console.log(`Seeded ${allTables.length} tables successfully!`);

        process.exit(0);
    } catch (error) {
        console.error("Error seeding tables:", error);
        process.exit(1);
    }
};

seedTables();
