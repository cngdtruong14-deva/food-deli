import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.join(__dirname, "../.env");
console.log("Loading .env from:", envPath);
dotenv.config({ path: envPath });

// Import models
import categoryModel from "../models/categoryModel.js";
import foodModel from "../models/foodModel.js";
console.log("Models imported successfully");

console.log("MONGO_URL:", process.env.MONGO_URL ? "Exists" : "Missing");

// Full logic from seedVietnameseMenu.js
const menuDataPath = path.join(__dirname, "../../docs/development/sample-data/menu-quannhautudo.json");
const menuData = JSON.parse(fs.readFileSync(menuDataPath, "utf-8"));

// 13 Refined Categories based on User Request
const REFINED_CATEGORIES = [
  { id: "cat-combo", name: "Combo", description: "Các combo tiết kiệm", icon: "🎁" },
  { id: "cat-mon-moi", name: "Món Mới", description: "Các món mới cập nhật", icon: "🆕" },
  { id: "cat-mon-nhau", name: "Món Nhậu", description: "Món nhậu lai rai", icon: "🍻" },
  { id: "cat-de", name: "Dê Tươi", description: "Các món dê tươi", icon: "🐐" },
  { id: "cat-nuong", name: "Đồ Nướng", description: "Các món nướng than hoa", icon: "🔥" },
  { id: "cat-thiet-ban", name: "Thiết Bản", description: "Các món nướng thiết bản", icon: "🍳" },
  { id: "cat-rau", name: "Rau Xanh", description: "Rau củ quả tươi", icon: "🥬" },
  { id: "cat-lau", name: "Lẩu", description: "Lẩu các loại", icon: "🍲" },
  { id: "cat-hai-san", name: "Hải Sản", description: "Tôm, cua, ghẹ, ốc...", icon: "🦐" },
  { id: "cat-ca", name: "Cá Các Món", description: "Các món cá tươi", icon: "🐟" },
  { id: "cat-an-choi", name: "Món Ăn Chơi", description: "Khoai tây, ngô chiên...", icon: "🍟" },
  { id: "cat-salad", name: "Salad - Nộm", description: "Salad và nộm chua ngọt", icon: "🥗" },
  { id: "cat-com", name: "Cơm", description: "Cơm rang, cơm trắng", icon: "🍚" },
  { id: "cat-thit", name: "Món Khác", description: "Các món khác", icon: "🍖" }, // Fallback
  { id: "cat-do-uong", name: "Đồ Uống", description: "Bia, nước ngọt", icon: "🍺" },
];

function categorizeProduct(product) {
  const name = product.name.toLowerCase();
  
  // Combo
  if (name.includes("combo")) return "cat-combo";

  // Drinks (Priority Check)
  if (name.includes("bia") || name.includes("nước") || name.includes("trà") || 
      name.includes("rượu") || name.includes("coca") || name.includes("pepsi") ||
      product.category_id === "cat-003") return "cat-do-uong";

  // De Tuoi
  if (name.includes("dê ") || name.includes("tái chanh")) return "cat-de";
  
  // Ca Cac Mon
  if (name.includes("cá ") || name.includes("cá chép") || name.includes("cá lăng")) return "cat-ca";
  
  // Lau
  if (name.includes("lẩu")) return "cat-lau";
  
  // Hai San
  if (name.includes("tôm") || name.includes("mực") || name.includes("ốc") || 
      name.includes("bạch tuộc") || name.includes("sứa") || name.includes("hàu")) return "cat-hai-san";
  
  // Salad - Nom
  if (name.includes("gỏi") || name.includes("nộm") || name.includes("salad")) return "cat-salad";
  
  // Rau Xanh
  if (name.includes("rau") || name.includes("cải") || name.includes("muống") || 
      name.includes("xu su") || name.includes("lặc lè") || name.includes("măng")) return "cat-rau";

  // Thiet Ban (Heuristic: "sốt", "nóng", "chảo", "cháy tỏi", "tứ xuyên" combined with meat or specifically mentioned)
  if (
      // Explicit keyword
      name.includes("thiết bản") || 
      name.includes("bò sốt") || 
      name.includes("bò lúc lắc") ||
      
      // Meat + Style heuristics (excluding Hotpot/Salad which are caught earlier or later priority?)
      // We need to check exclusion first or rely on order. 
      // Current order: Combo -> Drinks -> De -> Ca -> Lau -> Hai San -> Salad -> Rau.
      // So checks here are safe from Lau/Salad if placed AFTER them?
      // Actually, "Lau" is checked AFTER this in original code? No, let's look at placement.
      
      // Let's make this robust:
      (
        (name.includes("bò") || name.includes("bê") || name.includes("dải") || name.includes("sụn")) &&
        (name.includes("sốt") || name.includes("cháy tỏi") || name.includes("tứ xuyên") || name.includes("tiêu"))
      ) &&
      !name.includes("lẩu") && !name.includes("nộm") && !name.includes("gỏi")
  ) return "cat-thiet-ban";

  // Do Nuong
  if (name.includes("nướng")) return "cat-nuong";

  // Mon An Choi
  if (name.includes("khoai tây") || name.includes("ngô chiên") || name.includes("khoai lệ phố") || 
      name.includes("xúc xích") || name.includes("nem chua")) return "cat-an-choi";
      
  // Com / Mien / Chao
  if (name.includes("cơm") || name.includes("cháo") || name.includes("xôi")) return "cat-com";
  
  // Mon Nhau (General meat dishes that didn't fit elsewhere)
  if (name.includes("lợn") || name.includes("heo") || name.includes("trâu") || 
      name.includes("gà") || name.includes("ếch") || name.includes("dồi")) return "cat-mon-nhau";

  return "cat-thit";
}

function generateDescription(name) {
    return `Món ${name} thơm ngon, chế biến từ nguyên liệu tươi sạch.`;
}

async function runSeed() {
    try {
        console.log("Connecting to MongoDB...");
        await mongoose.connect(process.env.MONGO_URL);
        console.log("✓ Connected to MongoDB");

        console.log("Clearing existing foods and categories...");
        await foodModel.deleteMany({});
        await categoryModel.deleteMany({});

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

        console.log("\nInserting products...");
        let count = 0;
        
        for (const product of menuData.products) {
          const priceVND = product.price;
          const refinedCategoryId = categorizeProduct(product);
          
          const imageSlug = product.name.toLowerCase().replace(/\s+/g, "_");
          const imageFileName = `${imageSlug}.jpg`;
          
          // Debug category check
          if (!categoryMap[refinedCategoryId]) {
              console.error(`ERROR: Missing category map for ID: ${refinedCategoryId} (Product: ${product.name})`);
              continue;
          }

          await foodModel.create({
            name: product.name,
            description: generateDescription(product.name),
            price: priceVND,
            category: categoryMap[refinedCategoryId],
            image: imageFileName,
            isAvailable: product.status === "available",
            stock: 100,
            trackStock: true
          });
          count++;
          if (count % 20 === 0) console.log(`  ... ${count} products inserted`);
        }

        console.log("\n✓ Seed completed!");
        process.exit(0);
    } catch (e) {
        console.error("Seed execution failed:", e);
        process.exit(1);
    }
}

runSeed();
