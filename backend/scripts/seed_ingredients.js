import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from 'url';
import foodModel from "../models/foodModel.js";
import ingredientModel from "../models/ingredientModel.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load Env
const envPath = path.join(__dirname, "../.env");
dotenv.config({ path: envPath });

// Heuristic Analysis Rules
const RULES = [
    // --- PROTEINS (Thịt & Hải Sản) ---
    { keywords: ["bò", "bắp bò", "gầu", "u bò", "đuôi bò"], result: { name: "Thịt Bò Mỹ/Ta", category: "Thịt", unit: "kg" } },
    { keywords: ["gà", "cánh gà", "chân gà", "sụn", "mề"], result: { name: "Thịt Gà (Cánh/Chân/Sụn)", category: "Thịt", unit: "kg" } },
    { keywords: ["heo", "ba chỉ", "dải", "nõn đuôi", "dồi", "lợn", "sườn"], result: { name: "Thịt Heo", category: "Thịt", unit: "kg" } },
    { keywords: ["tim", "cật", "bầu dục"], result: { name: "Tim Cật Heo", category: "Thịt", unit: "kg" } },
    { keywords: ["trâu"], result: { name: "Thịt Trâu", category: "Thịt", unit: "kg" } },
    { keywords: ["ếch"], result: { name: "Thịt Ếch Đồng", category: "Thịt", unit: "kg" } },
    { keywords: ["ngỗng"], result: { name: "Thịt Ngỗng", category: "Thịt", unit: "kg" } },
    { keywords: ["vịt"], result: { name: "Thịt Vịt", category: "Thịt", unit: "kg" } },
    { keywords: ["chim", "câu"], result: { name: "Chim Bồ Câu", category: "Thịt", unit: "con" } },

    // --- SEAFOOD ---
    { keywords: ["tôm", "tôm hùm", "tôm sú"], result: { name: "Tôm Sú/Hùm", category: "Hải Sản", unit: "kg" } },
    { keywords: ["mực", "râu mực"], result: { name: "Mực Ống/Trứng", category: "Hải Sản", unit: "kg" } },
    { keywords: ["bạch tuộc"], result: { name: "Bạch Tuộc", category: "Hải Sản", unit: "kg" } },
    { keywords: ["cá", "cá quả", "cá lăng", "cá chép", "cá diêu hồng", "cá hồi"], result: { name: "Cá Tươi", category: "Hải Sản", unit: "kg" } },
    { keywords: ["ốc", "ốc hương", "ốc mít"], result: { name: "Ốc Các Loại", category: "Hải Sản", unit: "kg" } },
    { keywords: ["hàu"], result: { name: "Hàu Sữa", category: "Hải Sản", unit: "kg" } },
    { keywords: ["cua", "ghẹ"], result: { name: "Cua/Ghẹ", category: "Hải Sản", unit: "kg" } },

    // --- CARBS (Tinh Bột) ---
    { keywords: ["cơm", "rang"], result: { name: "Gạo Tẻ/Nếp", category: "Lương Thực", unit: "kg" } },
    { keywords: ["xôi"], result: { name: "Gạo Nếp", category: "Lương Thực", unit: "kg" } },
    { keywords: ["phở"], result: { name: "Bánh Phở", category: "Lương Thực", unit: "kg" } },
    { keywords: ["bún"], result: { name: "Bún Tươi", category: "Lương Thực", unit: "kg" } },
    { keywords: ["mì", "mỳ"], result: { name: "Mì Trứng/Tôm", category: "Lương Thực", unit: "gói" } },
    { keywords: ["cháo"], result: { name: "Gạo Nấu Cháo", category: "Lương Thực", unit: "kg" } },
    { keywords: ["bánh mì"], result: { name: "Bánh Mì", category: "Lương Thực", unit: "cái" } },

    // --- VEGETABLES (Rau Củ) ---
    { keywords: ["rau", "muống"], result: { name: "Rau Muống", category: "Rau Củ", unit: "bó" } },
    { keywords: ["cải", "cải chip", "cải thảo"], result: { name: "Rau Cải Các Loại", category: "Rau Củ", unit: "kg" } },
    { keywords: ["khoai tây", "khoai lang", "khoai lệ phố"], result: { name: "Khoai Tây/Lang", category: "Rau Củ", unit: "kg" } },
    { keywords: ["ngô", "bắp"], result: { name: "Ngô Ngọt/Bao Tử", category: "Rau Củ", unit: "kg" } },
    { keywords: ["nấm", "kim châm", "hương"], result: { name: "Nấm Các Loại", category: "Rau Củ", unit: "kg" } },
    { keywords: ["dưa chuột", "củ quả", "salad"], result: { name: "Dưa Chuột/Cà Chua", category: "Rau Củ", unit: "kg" } },
    { keywords: ["măng"], result: { name: "Măng Củ/Lá", category: "Rau Củ", unit: "kg" } },
    { keywords: ["ngải cứu"], result: { name: "Rau Ngải Cứu", category: "Rau Củ", unit: "bó" } },
    { keywords: ["chuối", "om"], result: { name: "Chuối Xanh", category: "Rau Củ", unit: "kg" } },

    // --- DRINKS ---
    { keywords: ["bia", "tiger", "heineken", "trúc bạch", "sài gòn"], result: { name: "Bia Lon/Chai", category: "Đồ Uống", unit: "két" } },
    { keywords: ["rượu", "vodka", "men", "táo mèo", "ba kích"], result: { name: "Rượu Ngâm/Chai", category: "Đồ Uống", unit: "lít" } },
    { keywords: ["coca", "pepsi", "7up", "nước ngọt", "sting"], result: { name: "Nước Ngọt Có Gas", category: "Đồ Uống", unit: "thùng" } },
    { keywords: ["nước suối", "aquafina", "lavie"], result: { name: "Nước Suối", category: "Đồ Uống", unit: "thùng" } },

    // --- OTHERS ---
    { keywords: ["trứng"], result: { name: "Trứng Gà/Vịt", category: "Thực Phẩm Mát", unit: "quả" } },
    { keywords: ["đậu", "đậu phụ"], result: { name: "Đậu Phụ", category: "Thực Phẩm Mát", unit: "bìa" } },
];

const analyzeFood = (foodName) => {
    const nameLower = foodName.toLowerCase();
    const ingredients = [];

    // 1. Direct Rule Matching
    RULES.forEach(rule => {
        if (rule.keywords.some(k => nameLower.includes(k))) {
            ingredients.push(rule.result);
        }
    });

    // 2. Context-based Implicit Ingredients (Logic suy luận)

    // Dishes with "Nướng", "Xào", "Chiên", "Rang" need Oil and Spices
    if (["nướng", "xào", "chiên", "rang", "sốt"].some(k => nameLower.includes(k))) {
        ingredients.push({ name: "Dầu Ăn", category: "Gia Vị", unit: "lít" });
        ingredients.push({ name: "Gia Vị Tẩm Ướp (Mắm/Muối/Mì)", category: "Gia Vị", unit: "kg" });
        ingredients.push({ name: "Hành Tỏi Khô", category: "Rau Củ", unit: "kg" });
    }

    // "Lẩu" needs specialized setup
    if (nameLower.includes("lẩu")) {
        ingredients.push({ name: "Gói Gia Vị Lẩu", category: "Gia Vị", unit: "gói" });
        ingredients.push({ name: "Rau Nhúng Lẩu (Tổng hợp)", category: "Rau Củ", unit: "kg" });
        ingredients.push({ name: "Đậu Phụ", category: "Thực Phẩm Mát", unit: "bìa" });
        ingredients.push({ name: "Bún/Mì Ăn Lẩu", category: "Lương Thực", unit: "kg" });
    }

    // "Hấp", "Luộc" usually needs dipping sauce & aromatic herbs
    if (nameLower.includes("hấp") || nameLower.includes("luộc")) {
        ingredients.push({ name: "Gừng/Sả/Chanh", category: "Rau Củ", unit: "kg" });
        ingredients.push({ name: "Gia Vị Chấm (Muối/Tiêu/Chanh)", category: "Gia Vị", unit: "kg" });
    }

    // "Nộm", "Salad"
    if (nameLower.includes("nộm") || nameLower.includes("salad")) {
        ingredients.push({ name: "Lạc Rang", category: "Đồ Khô", unit: "kg" });
        ingredients.push({ name: "Rau Thơm Các Loại", category: "Rau Củ", unit: "bó" });
        ingredients.push({ name: "Nước Mắm/Giấm/Đường", category: "Gia Vị", unit: "lít" });
    }

    return ingredients;
};

const runAnalysis = async () => {
    try {
        console.log("Connecting to DB...");
        await mongoose.connect(process.env.MONGO_URL);
        console.log("✓ Connected");

        console.log("Fetching Foods...");
        const foods = await foodModel.find({});
        console.log(`✓ Found ${foods.length} dishes`);

        const ingredientMap = new Map(); // Key: name, Value: Object

        foods.forEach(food => {
            const infIngs = analyzeFood(food.name);
            infIngs.forEach(ing => {
                if (!ingredientMap.has(ing.name)) {
                    ingredientMap.set(ing.name, {
                        ...ing,
                        stock: Math.floor(Math.random() * 50) + 10 // Random initial stock
                    });
                }
            });
        });

        const ingredientList = Array.from(ingredientMap.values());
        console.log(`\nAnalyzed and found ${ingredientList.length} unique ingredients.`);
        
        console.log("Clearing old ingredients...");
        await ingredientModel.deleteMany({});

        console.log("Inserting new ingredients...");
        await ingredientModel.insertMany(ingredientList);

        console.log("\n✓ Ingredient Inventory Populated Successfully!");
        console.log("Sample Ingredients:");
        ingredientList.slice(0, 10).forEach(i => console.log(` - ${i.name} (${i.stock} ${i.unit})`));

        process.exit(0);
    } catch (error) {
        console.error("Analysis Failed:", error);
        process.exit(1);
    }
};

runAnalysis();
