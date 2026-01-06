/**
 * Seed Vietnamese Menu Data (Full 148 items from Quán Nhậu Tự Do)
 * Run: node scripts/seedVietnameseMenu.js
 */

import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Debug Env Path
const envPath = path.join(__dirname, "../.env");
console.log("Loading .env from:", envPath);
dotenv.config({ path: envPath });
console.log("MONGO_URL:", process.env.MONGO_URL);

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

// Load descriptions if available
let descriptionsMap = {};
try {
  const descriptionsPath = path.resolve(__dirname, '../descriptions.json');
  if (fs.existsSync(descriptionsPath)) {
    descriptionsMap = JSON.parse(fs.readFileSync(descriptionsPath, 'utf8'));
    console.log(`Loaded ${Object.keys(descriptionsMap).length} descriptions from descriptions.json`);
  }
} catch (error) {
  console.log('Could not load descriptions.json, falling back to smart generation', error.message);
}

function cleanDescription(text) {
  if (!text) return "";
  // Remove boilerplate footer
  let cleaned = text.split("Trong quá trình dùng món")[0];
  cleaned = cleaned.split("Giá chưa gồm VAT")[0];
  cleaned = cleaned.split("Bên cạnh đó, nếu quý khách có nhu cầu")[0];
  
  // Remove boilerplate header if present
  cleaned = cleaned.replace(/^Mô tả món ăn\s*/i, "");

  // Format bullet points (replace " - " or "- " with newline + bullet)
  // Look for patterns where a hyphen is preceded by a space or start of line, and followed by text
  cleaned = cleaned.replace(/(\s+-\s+)|(^\s*-\s+)/g, "\n- ");
  
  // Also split major sections if they are just run-on sentences (heuristic)
  cleaned = cleaned.replace(/\.\s+([A-ZÀ-Ỹ])/g, ".\n$1");

  return cleaned.trim();
}

function generateDescription(name, categoryId) {
  // Check strict map first
  if (descriptionsMap[name]) {
    const cleaned = cleanDescription(descriptionsMap[name]);
    if (cleaned.length > 10) return cleaned;
  }
  
  const lowerName = name.toLowerCase();
  
  if (lowerName.includes("combo")) return "Combo tiết kiệm với đầy đủ các món đặc sắc, phù hợp cho nhóm 4-6 người, đảm bảo no nê và trọn vẹn hương vị.";
  if (lowerName.includes("lẩu")) return "Nước dùng hầm xương ngọt thanh, đậm đà hương vị thảo mộc, nhúng kèm thịt bò Mỹ, hải sản tươi sống và rau xanh theo mùa.";
  if (lowerName.includes("gà") || lowerName.includes("cánh")) return "Gà ri thả vườn chắc thịt, da giòn vàng ươm, tẩm ướp gia vị Tây Bắc đặc trưng, chấm cùng muối tiêu chanh.";
  if (lowerName.includes("ếch")) return "Thịt ếch đồng tươi ngon, chắc thịt, chế biến đậm đà, thơm lừng mùi lá lốt và sả ớt.";
  if (lowerName.includes("cá")) return "Cá tươi sống bắt tại bể, thịt trắng ngần ngọt vị tự nhiên, chế biến cầu kỳ giữ trọn hương vị tươi ngon nhất.";
  if (lowerName.includes("tôm") || lowerName.includes("mực") || lowerName.includes("hải sản") || lowerName.includes("ốc")) return "Hải sản tươi sống nhập mới mỗi ngày, chế biến đa dạng từ hấp sả, nướng mỡ hành đến sốt Thái chua cay.";
  if (lowerName.includes("nướng")) return "Nướng trên than hoa thơm lừng, thịt mềm mọng nước, tẩm ướp sốt nướng độc quyền của quán.";
  if (lowerName.includes("bò") || lowerName.includes("trâu")) return "Thịt tươi mềm, không dai, xào lăn hoặc nhúng mẻ đều tuyệt hảo, giữ trọn vị ngọt tự nhiên.";
  if (lowerName.includes("heo") || lowerName.includes("lợn") || lowerName.includes("dồi")) return "Đặc sản lợn mán mẹt, thịt thơm bì giòn, ăn kèm rau rừng và mắm tôm chuẩn vị.";
  if (lowerName.includes("rau") || lowerName.includes("nộm") || lowerName.includes("salad")) return "Rau củ tươi mát, giòn ngon, trộn sốt chua ngọt kích thích vị giác, giải ngấy cực tốt.";
  if (lowerName.includes("khoai") || lowerName.includes("ngô")) return "Món ăn vặt khoái khẩu, chiên vàng giòn rụm, lắc phô mai béo ngậy.";
  if (lowerName.includes("bia") || lowerName.includes("rượu")) return "Đồ uống mát lạnh, sảng khoái, là chất xúc tác không thể thiếu cho mọi cuộc vui.";
  
  return `Món ${name} chế biến theo công thức độc quyền của Bếp trưởng, mang đến hương vị khó quên.`;
}

function categorizeProduct(product) {
  const name = product.name.toLowerCase();
  
  // Combo
  if (name.includes("combo")) return "cat-combo";

  // Drinks (Priority Check)
  if (name.includes("bia") || name.includes("nước") || name.includes("trà ") || name.includes("chè ") || 
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

  // Mon Moi check (Logic based on "new" tag if existed, for now fallback to Mon Nhau or Khac)
  
  // Fallback
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
      // Use VND price directly
      const priceVND = product.price;

      // Determine refined category
      const refinedCategoryId = categorizeProduct(product);
      
      // Create slug for image name - Preserve accents to match existing files
      const imageSlug = product.name
        .toLowerCase()
        .replace(/\s+/g, "_");
      
      const imageFileName = `${imageSlug}.jpg`;
      const imagePath = path.join(__dirname, "../uploads", imageFileName);

      // Check if image exists
      if (!fs.existsSync(imagePath)) {
        console.log(`  ! Skipped ${product.name} (Missing image: ${imageFileName})`);
        continue; 
      }
      
      await foodModel.create({
        name: product.name,
        description: generateDescription(product.name, refinedCategoryId),
        price: priceVND,
        category: categoryMap[refinedCategoryId],
        image: imageFileName,
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
