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
            // Parse capacity
            // Helper to extract number from string like "350-400 Khách" or "100"
            const extractNumber = (str) => {
                if (!str) return 0;
                const matches = str.match(/([0-9]+)/g);
                if (matches && matches.length > 0) {
                    // If range "350-400", take the larger number for max capacity
                    return Math.max(...matches.map(Number)); 
                }
                return 0;
            };

            const branchCapacity = extractNumber(branch.capacity) || 100; // Default 100 if parse fail
            const branchFloors = extractNumber(branch.floors) || 1; // Default 1 floor

            // Estimate number of tables. Avg capacity per table ~5 (mix of 2,4,6,8,10)
            const estimatedTables = Math.ceil(branchCapacity / 5);
            const tablesPerFloor = Math.ceil(estimatedTables / branchFloors);

            console.log(`Branch: ${branch.name} | Capacity: ${branchCapacity} | Floors: ${branchFloors} | Est. Tables: ${estimatedTables}`);

            let tableCount = 0;

            for (let floor = 1; floor <= branchFloors; floor++) {
                for (let i = 1; i <= tablesPerFloor; i++) {
                    tableCount++;
                    if (tableCount > estimatedTables) break;

                    const tableNumber = `Bàn ${i} - Tầng ${floor}`; // E.g., Bàn 1 - Tầng 1
                    
                    // Assign varied capacity
                    // 20% small (2), 40% medium (4), 20% large (6), 10% x-large (8), 10% party (10+)
                    const rand = Math.random();
                    let capacity = 4;
                    if (rand < 0.2) capacity = 2;
                    else if (rand < 0.6) capacity = 4;
                    else if (rand < 0.8) capacity = 6;
                    else if (rand < 0.9) capacity = 8;
                    else capacity = 10;

                    allTables.push({
                        branchId: branch._id,
                        tableNumber: tableNumber,
                        capacity: capacity,
                        floor: floor, // Added floor
                        status: "Available",
                        qrCode: `https://quannhautudo.com/menu?table=${tableNumber}&branch=${branch._id}`
                    });
                }
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
