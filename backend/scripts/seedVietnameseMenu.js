/**
 * Seed Vietnamese Menu Data (Full 148 items from Quán Nhậu Tự Do)
 * Run: node scripts/seedVietnameseMenu.js
 */

import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import models
import categoryModel from "../models/categoryModel.js";
import foodModel from "../models/foodModel.js";

// Read menu data - use the full menu file
const menuDataPath = path.join(__dirname, "../../docs/development/sample-data/menu-quannhautudo.json");
const menuData = JSON.parse(fs.readFileSync(menuDataPath, "utf-8"));

// Better category mapping based on actual menu items
const CATEGORY_MAPPING = {
  "cat-001": "Khai Vị & Gỏi",      // Appetizers & Salads
  "cat-002": "Món Chính",          // Main Dishes - will be split into subcategories
  "cat-003": "Đồ Uống",            // Drinks
  "cat-004": "Tráng Miệng"         // Desserts
};

// New refined categories based on menu analysis
const REFINED_CATEGORIES = [
  { id: "cat-001", name: "Khai Vị & Gỏi", description: "Các món khai vị, gỏi, salad", icon: "🥗" },
  { id: "cat-combo", name: "Combo", description: "Các combo tiết kiệm", icon: "🎁" },
  { id: "cat-hai-san", name: "Hải Sản", description: "Các món hải sản", icon: "🦐" },
  { id: "cat-thit", name: "Thịt & Lợn Mán", description: "Các món thịt, lợn mán, trâu bò", icon: "🥩" },
  { id: "cat-ga", name: "Gà & Ếch", description: "Các món gà, ếch", icon: "🍗" },
  { id: "cat-ca", name: "Các Món Cá", description: "Các món cá", icon: "🐟" },
  { id: "cat-lau", name: "Lẩu", description: "Các món lẩu", icon: "🍲" },
  { id: "cat-rau", name: "Rau & Đồ Xào", description: "Các món rau, đồ xào", icon: "🥬" },
  { id: "cat-nuong", name: "Đồ Nướng", description: "Các món nướng", icon: "🔥" },
  { id: "cat-003", name: "Đồ Uống", description: "Bia, nước ngọt, nước ép", icon: "🍺" },
];

function categorizeProduct(product) {
  const name = product.name.toLowerCase();
  
  // Combo
  if (name.includes("combo")) return "cat-combo";
  
  // Drinks
  if (name.includes("bia") || name.includes("nước") || name.includes("trà") || 
      name.includes("rượu") || name.includes("coca") || name.includes("pepsi") ||
      product.category_id === "cat-003") return "cat-003";
  
  // Hotpot
  if (name.includes("lẩu")) return "cat-lau";
  
  // Fish
  if (name.includes("cá ")) return "cat-ca";
  
  // Seafood
  if (name.includes("tôm") || name.includes("mực") || name.includes("ốc") || 
      name.includes("bạch tuộc") || name.includes("hải sản") || name.includes("sứa")) return "cat-hai-san";
  
  // Chicken & Frog
  if (name.includes("gà") || name.includes("ếch") || name.includes("cánh")) return "cat-ga";
  
  // Grilled
  if (name.includes("nướng")) return "cat-nuong";
  
  // Vegetables
  if (name.includes("rau") || name.includes("cải") || name.includes("muống") || 
      name.includes("đậu") || name.includes("ngọn") || name.includes("măng") ||
      name.includes("khổ qua") || name.includes("ngô")) return "cat-rau";
  
  // Appetizers/Salads
  if (name.includes("gỏi") || name.includes("nộm") || name.includes("salad") || 
      name.includes("khoai") || name.includes("chả") || name.includes("nem") ||
      product.category_id === "cat-001") return "cat-001";
  
  // Default to meat
  return "cat-thit";
}

async function seedData() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URL);
    console.log("✓ Connected to MongoDB");

    // Clear existing data
    console.log("Clearing existing foods and categories...");
    await foodModel.deleteMany({});
    await categoryModel.deleteMany({});

    // Insert refined categories
    console.log("\nInserting categories...");
    const categoryMap = {};
    
    for (const cat of REFINED_CATEGORIES) {
      const newCategory = await categoryModel.create({
        name: cat.name,
        image: "",
        isActive: true
      });
      categoryMap[cat.id] = newCategory._id;
      console.log(`  ✓ ${cat.name}`);
    }

    // Insert Products with refined categorization
    console.log("\nInserting products...");
    let count = 0;
    
    for (const product of menuData.products) {
      // Convert VND to USD (1 USD ≈ 25000 VND)
      const priceUSD = Math.round(product.price / 25000 * 100) / 100;
      
      // Determine refined category
      const refinedCategoryId = categorizeProduct(product);
      
      // Create slug for image name
      const imageSlug = product.name
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d")
        .replace(/Đ/g, "D")
        .replace(/\s+/g, "_")
        .replace(/[^a-z0-9_]/g, "");
      
      await foodModel.create({
        name: product.name,
        description: product.description || `Món ${product.name} đặc biệt`,
        price: priceUSD,
        category: categoryMap[refinedCategoryId],
        image: `${imageSlug}.jpg`,
        isAvailable: product.status === "available",
        stock: 100,
        trackStock: true
      });
      count++;
      if (count % 20 === 0) {
        console.log(`  ... ${count} products inserted`);
      }
    }

    console.log("\n✓ Seed completed!");
    console.log(`  - ${REFINED_CATEGORIES.length} categories`);
    console.log(`  - ${count} products`);
    
    process.exit(0);
  } catch (error) {
    console.error("Error seeding data:", error);
    process.exit(1);
  }
}

seedData();
