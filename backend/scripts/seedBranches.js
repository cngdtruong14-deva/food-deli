import mongoose from "mongoose";
import dotenv from "dotenv";
import branchModel from "../models/branchModel.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url';

// Fix __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env vars
dotenv.config({ path: path.join(__dirname, '../.env') });

const branchesFile = path.join(__dirname, 'branches.json');

const seedBranches = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URL);
        console.log("Connected to MongoDB");

        const rawData = JSON.parse(fs.readFileSync(branchesFile, 'utf8'));

        const branches = rawData.map(item => {
            let cleanName = item.name;
            
            // Remove common prefixes
            cleanName = cleanName.replace(/^(Quán Nhậu Tự Do|Lẩu Bò Tự Do|Nướng Tự Do)\s*-?\s*/i, "");
            
            // Remove slogans after "–" or "-"
            // E.g. "10 Nguyễn Văn Huyên – Quán nhậu..." -> "10 Nguyễn Văn Huyên"
            const parts = cleanName.split(/–|-/);
            let finalName = parts[0].trim();
            
            // If it starts with a number (like "10 ..."), it's likely the address too
            // Priority: Use the explicit address from JSON if it looks valid (longer than the name or contains comma)
            let address = finalName;
            if (item.address && item.address !== item.name && item.address.length > 10) {
                 address = item.address;
            } else if (item.address && item.address.includes(',')) {
                 address = item.address;
            }
            
            // Fallback image if empty
            let image = item.image || ""; 
            // Note: For now we don't have scraped images, so user might need to upload or we use a placeholder.
            
            return {
                name: "Cơ sở " + finalName,
                address: address === finalName ? (finalName + ", Hà Nội") : address,
                phone: item.phone,
                image: item.image, // Use the filename from scraper
                openingHours: item.openingHours || "08:00 - 23:00",
                capacity: item.capacity || "300 khách",
                floors: item.floors || "2 Tầng",
                isActive: true
            };
        });

        console.log(`Prepared ${branches.length} branches for seeding.`);

        // Clear existing? Maybe. Or upsert.
        // Let's clear for now to have a clean state consistent with the site
        await branchModel.deleteMany({});
        console.log("Cleared existing branches.");

        await branchModel.insertMany(branches);
        console.log("Seeded branches successfully!");

        process.exit(0);
    } catch (error) {
        console.error("Error seeding branches:", error);
        process.exit(1);
    }
};

seedBranches();
