// 1. Load environment variables FIRST
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env từ thư mục backend
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Debug: Check if environment variables are loaded
console.log('-----------------------------------');
console.log('DEBUG: Env Path used:', path.join(__dirname, '..', '.env'));
console.log('DEBUG: MONGO_URI exists?', !!process.env.MONGO_URI);
console.log('-----------------------------------');

// 2. Import other modules
import mongoose from "mongoose";
import foodModel from "../models/foodModel.js";
import ingredientModel from "../models/ingredientModel.js";
import stockModel from "../models/stockModel.js";
import recipeModel from "../models/recipeModel.js";
import { connectDB } from "../config/db.js";
import { SmartRecipeAnalyzer } from './smartRecipeAnalyzer.js';

// ==========================================
// 3. FULL CUSTOM MENU DATA (From menugemini.md)
// ==========================================
// Converted from menugemini.md parts
const CUSTOM_MENU_DATA = [
    // --- ĂN NHẸ / KHAI VỊ ---
    { name: "Đậu lướt ván", category: "Appetizer", ingredients: [{ name: "Đậu Phụ (Bìa)", unit: "bìa", cost: 3000, qty: 3 }, { name: "Dầu Ăn", unit: "lít", cost: 35000, qty: 0.1 }] },
    { name: "Khoai tây chiên Hongkong", category: "Appetizer", ingredients: [{ name: "Khoai Tây Cọng", unit: "kg", cost: 55000, qty: 0.25 }, { name: "Bột Xí Muội/Cajun", unit: "kg", cost: 150000, qty: 0.01 }] },
    { name: "Khoai tây chiên", category: "Appetizer", ingredients: [{ name: "Khoai Tây Cọng", unit: "kg", cost: 55000, qty: 0.25 }, { name: "Tương Ớt", unit: "chai", cost: 15000, qty: 0.05 }] },
    { name: "Ngô mỹ chiên thơm", category: "Appetizer", ingredients: [{ name: "Ngô Ngọt Tách Hạt", unit: "kg", cost: 45000, qty: 0.2 }, { name: "Bơ Tường An", unit: "hộp", cost: 25000, qty: 0.05 }] },
    { name: "Đậu chiên giòn", category: "Appetizer", ingredients: [{ name: "Đậu Phụ (Bìa)", unit: "bìa", cost: 3000, qty: 3 }, { name: "Bột Chiên Giòn", unit: "kg", cost: 30000, qty: 0.05 }] },
    { name: "Nấm chiên phomai", category: "Appetizer", ingredients: [{ name: "Nấm Kim Châm", unit: "kg", cost: 35000, qty: 0.2 }, { name: "Bột Phomai", unit: "kg", cost: 180000, qty: 0.02 }] },
    { name: "Nấm chiên hoàng kim", category: "Appetizer", ingredients: [{ name: "Nấm Đùi Gà", unit: "kg", cost: 40000, qty: 0.2 }, { name: "Bột Trứng Muối", unit: "kg", cost: 180000, qty: 0.02 }] },
    { name: "Nem chua", category: "Appetizer", ingredients: [{ name: "Nem Chua Thanh Hóa", unit: "chục", cost: 35000, qty: 1 }] },
    { name: "Nem Tai Trộn Thính", category: "Appetizer", ingredients: [{ name: "Tai Heo Luộc", unit: "kg", cost: 120000, qty: 0.15 }, { name: "Thính Gạo", unit: "kg", cost: 50000, qty: 0.02 }] },
    { name: "Đậu tẩm hành tóp mỡ", category: "Appetizer", ingredients: [{ name: "Đậu Phụ", unit: "bìa", cost: 3000, qty: 3 }, { name: "Hành Lá", unit: "kg", cost: 30000, qty: 0.05 }, { name: "Tóp Mỡ", unit: "kg", cost: 80000, qty: 0.05 }] },
    { name: "Đậu pháp xào trứng non sốt XO", category: "Appetizer", ingredients: [{ name: "Đậu Cove (Pháp)", unit: "kg", cost: 35000, qty: 0.2 }, { name: "Trứng Non", unit: "kg", cost: 250000, qty: 0.1 }, { name: "Sốt XO", unit: "lít", cost: 120000, qty: 0.02 }] },

    // --- SALAD & GỎI & NỘM ---
    { name: "Gỏi bò cà pháo đồng quê", category: "Salad", ingredients: [{ name: "Thịt Bắp Bò", unit: "kg", cost: 260000, qty: 0.1 }, { name: "Cà Pháo Muối", unit: "kg", cost: 30000, qty: 0.1 }] },
    { name: "Gỏi heo nướng trộn thính", category: "Salad", ingredients: [{ name: "Thịt Ba Chỉ Heo", unit: "kg", cost: 130000, qty: 0.15 }, { name: "Thính Gạo", unit: "kg", cost: 50000, qty: 0.02 }] },
    { name: "Gỏi chân gà trộn thính", category: "Salad", ingredients: [{ name: "Chân Gà Rút Xương", unit: "kg", cost: 90000, qty: 0.2 }, { name: "Thính Gạo", unit: "kg", cost: 50000, qty: 0.02 }] },
    { name: "Gỏi sứa sốt thái cải cay", category: "Salad", ingredients: [{ name: "Sứa Biển", unit: "kg", cost: 60000, qty: 0.2 }, { name: "Cải Mầm", unit: "kg", cost: 40000, qty: 0.1 }, { name: "Sốt Thái", unit: "lít", cost: 80000, qty: 0.05 }] },
    { name: "Gỏi miến trộn thính thịt băm", category: "Salad", ingredients: [{ name: "Miến Dong", unit: "kg", cost: 40000, qty: 0.1 }, { name: "Thịt Băm", unit: "kg", cost: 110000, qty: 0.05 }] },
    { name: "Chân gà sốt thái chua cay", category: "Salad", ingredients: [{ name: "Chân Gà Rút Xương", unit: "kg", cost: 90000, qty: 0.2 }, { name: "Xoài Xanh", unit: "kg", cost: 20000, qty: 0.1 }] },
    { name: "Nộm da trâu người Thái", category: "Salad", ingredients: [{ name: "Da Trâu Muối", unit: "kg", cost: 180000, qty: 0.15 }, { name: "Hoa Chuối", unit: "kg", cost: 15000, qty: 0.2 }] },
    { name: "Nộm da trâu trộn xoài non", category: "Salad", ingredients: [{ name: "Da Trâu Muối", unit: "kg", cost: 180000, qty: 0.15 }, { name: "Xoài Xanh", unit: "kg", cost: 20000, qty: 0.15 }] },
    { name: "Nộm dê bóp thấu", category: "Salad", ingredients: [{ name: "Thịt Dê Tươi", unit: "kg", cost: 280000, qty: 0.1 }, { name: "Khế/Chuối Chát", unit: "kg", cost: 20000, qty: 0.2 }] },
    { name: "Nộm dê rau má", category: "Salad", ingredients: [{ name: "Thịt Dê Tươi", unit: "kg", cost: 280000, qty: 0.1 }, { name: "Rau Má", unit: "kg", cost: 25000, qty: 0.2 }] },
    { name: "Salad rau mầm bò một nắng", category: "Salad", ingredients: [{ name: "Rau Mầm", unit: "kg", cost: 40000, qty: 0.15 }, { name: "Bò Một Nắng", unit: "kg", cost: 450000, qty: 0.05 }] },
    { name: "Gỏi bò sốt wasabi", category: "Salad", ingredients: [{ name: "Thịt Bò Tái", unit: "kg", cost: 250000, qty: 0.1 }, { name: "Mù Tạt (Wasabi)", unit: "tuýp", cost: 30000, qty: 0.05 }] },
    { name: "Nộm bắp bò bóp thấu", category: "Salad", ingredients: [{ name: "Bắp Bò", unit: "kg", cost: 260000, qty: 0.15 }, { name: "Hành Tây", unit: "kg", cost: 20000, qty: 0.1 }] },
    { name: "Salad cá ngừ", category: "Salad", ingredients: [{ name: "Cá Ngừ Hộp", unit: "hộp", cost: 25000, qty: 0.5 }, { name: "Xà Lách", unit: "kg", cost: 25000, qty: 0.2 }] },
    { name: "Salad bắp bò cải xanh", category: "Salad", ingredients: [{ name: "Bắp Bò", unit: "kg", cost: 260000, qty: 0.1 }, { name: "Cải Mầm", unit: "kg", cost: 40000, qty: 0.15 }] },

    // --- RAU XÀO / LUỘC ---
    { name: "Rau ngót lào xào tỏi", category: "Vegetable", ingredients: [{ name: "Rau Ngót Lào", unit: "kg", cost: 50000, qty: 0.3 }, { name: "Tỏi Củ", unit: "kg", cost: 40000, qty: 0.03 }] },
    { name: "Rau bò khai xào tỏi", category: "Vegetable", ingredients: [{ name: "Rau Bò Khai", unit: "kg", cost: 60000, qty: 0.3 }, { name: "Tỏi Củ", unit: "kg", cost: 40000, qty: 0.03 }] },
    { name: "Ngồng cải luộc chấm trứng", category: "Vegetable", ingredients: [{ name: "Ngồng Cải", unit: "kg", cost: 30000, qty: 0.4 }, { name: "Trứng Gà/Vịt", unit: "quả", cost: 3000, qty: 2 }] },
    { name: "Cải mèo xào tỏi", category: "Vegetable", ingredients: [{ name: "Cải Mèo", unit: "kg", cost: 25000, qty: 0.4 }, { name: "Tỏi Củ", unit: "kg", cost: 40000, qty: 0.03 }] },
    { name: "Cải mèo luộc chấm trứng", category: "Vegetable", ingredients: [{ name: "Cải Mèo", unit: "kg", cost: 25000, qty: 0.4 }, { name: "Trứng Gà", unit: "quả", cost: 3000, qty: 2 }] },
    { name: "Rau ngót lào xào ba chỉ gác bếp", category: "Vegetable", ingredients: [{ name: "Rau Ngót Lào", unit: "kg", cost: 50000, qty: 0.3 }, { name: "Ba Chỉ Gác Bếp", unit: "kg", cost: 350000, qty: 0.05 }] },
    { name: "Rau bò khai xào ba chỉ gác bếp", category: "Vegetable", ingredients: [{ name: "Rau Bò Khai", unit: "kg", cost: 60000, qty: 0.3 }, { name: "Ba Chỉ Gác Bếp", unit: "kg", cost: 350000, qty: 0.05 }] },
    { name: "Cải mèo xào ba chỉ gác bếp", category: "Vegetable", ingredients: [{ name: "Cải Mèo", unit: "kg", cost: 25000, qty: 0.4 }, { name: "Ba Chỉ Gác Bếp", unit: "kg", cost: 350000, qty: 0.05 }] },
    { name: "Măng trúc xào ba chỉ gác bếp", category: "Vegetable", ingredients: [{ name: "Măng Trúc", unit: "kg", cost: 55000, qty: 0.25 }, { name: "Ba Chỉ Gác Bếp", unit: "kg", cost: 350000, qty: 0.05 }] },
    { name: "Măng trúc xào bò", category: "Vegetable", ingredients: [{ name: "Măng Trúc", unit: "kg", cost: 55000, qty: 0.3 }, { name: "Thịt Bò Vụn", unit: "kg", cost: 220000, qty: 0.08 }] },
    { name: "Củ quả luộc chấm kho quẹt", category: "Vegetable", ingredients: [{ name: "Củ Quả Tổng Hợp", unit: "kg", cost: 20000, qty: 0.5 }, { name: "Mắm Kho Quẹt", unit: "hộp", cost: 100000, qty: 0.05 }] },
    { name: "Dưa chua xào tóp", category: "Vegetable", ingredients: [{ name: "Dưa Cải Chua", unit: "kg", cost: 15000, qty: 0.3 }, { name: "Tóp Mỡ", unit: "kg", cost: 80000, qty: 0.05 }] },
    { name: "Khổ qua xào trứng", category: "Vegetable", ingredients: [{ name: "Khổ Qua (Mướp Đắng)", unit: "kg", cost: 20000, qty: 0.3 }, { name: "Trứng Gà", unit: "quả", cost: 3000, qty: 2 }] },
    { name: "Ngọn su xào tỏi", category: "Vegetable", ingredients: [{ name: "Ngọn Su Su", unit: "kg", cost: 25000, qty: 0.4 }, { name: "Tỏi Củ", unit: "kg", cost: 40000, qty: 0.03 }] },
    { name: "Cải thảo xào tỏi", category: "Vegetable", ingredients: [{ name: "Cải Thảo", unit: "kg", cost: 15000, qty: 0.4 }, { name: "Nấm Hương", unit: "kg", cost: 250000, qty: 0.01 }] },
    { name: "Muống xào tỏi", category: "Vegetable", ingredients: [{ name: "Rau Muống", unit: "kg", cost: 15000, qty: 0.4 }, { name: "Tỏi Củ", unit: "kg", cost: 40000, qty: 0.04 }] },
    { name: "Khổ qua chà bông", category: "Vegetable", ingredients: [{ name: "Khổ Qua", unit: "kg", cost: 20000, qty: 0.2 }, { name: "Chà Bông Heo", unit: "kg", cost: 180000, qty: 0.03 }] },
    { name: "Tóp mỡ xốt cà chua rau mầm", category: "Vegetable", ingredients: [{ name: "Tóp Mỡ", unit: "kg", cost: 80000, qty: 0.1 }, { name: "Cà Chua", unit: "kg", cost: 20000, qty: 0.1 }, { name: "Rau Mầm", unit: "kg", cost: 40000, qty: 0.05 }] },

    // --- ẾCH ---
    { name: "Ếch sốt tiêu gừng chua cay", category: "Food", ingredients: [{ name: "Ếch Đồng", unit: "kg", cost: 110000, qty: 0.35 }, { name: "Tiêu Gừng", unit: "kg", cost: 40000, qty: 0.05 }] },
    { name: "Ếch chiên hoàng kim", category: "Food", ingredients: [{ name: "Ếch Đồng", unit: "kg", cost: 110000, qty: 0.3 }, { name: "Bột Trứng Muối", unit: "kg", cost: 180000, qty: 0.03 }] },
    { name: "Ếch đồng chiên mắm tỏi", category: "Food", ingredients: [{ name: "Ếch Đồng", unit: "kg", cost: 110000, qty: 0.35 }, { name: "Nước Mắm", unit: "lít", cost: 40000, qty: 0.05 }] },

    // --- TRÂU / BÒ / DÊ ---
    { name: "Dồi dê", category: "Food", ingredients: [{ name: "Dồi Dê", unit: "kg", cost: 180000, qty: 0.25 }, { name: "Rau Thơm", unit: "kg", cost: 30000, qty: 0.05 }] },
    { name: "Trâu xào rau muống", category: "Food", ingredients: [{ name: "Thịt Trâu", unit: "kg", cost: 230000, qty: 0.12 }, { name: "Rau Muống", unit: "kg", cost: 15000, qty: 0.25 }] },
    { name: "Trâu tươi cháy tỏi", category: "Food", ingredients: [{ name: "Thịt Trâu", unit: "kg", cost: 230000, qty: 0.15 }, { name: "Tỏi Củ", unit: "kg", cost: 40000, qty: 0.05 }] },
    { name: "Ba chỉ dê hấp lá tía tô", category: "Food", ingredients: [{ name: "Ba Chỉ Dê", unit: "kg", cost: 260000, qty: 0.2 }, { name: "Lá Tía Tô", unit: "kg", cost: 30000, qty: 0.05 }] },
    { name: "Dê trộn dừa non kèm bánh đa", category: "Food", ingredients: [{ name: "Thịt Dê Tươi", unit: "kg", cost: 280000, qty: 0.15 }, { name: "Cùi Dừa Non", unit: "kg", cost: 40000, qty: 0.1 }, { name: "Bánh Đa", unit: "cái", cost: 5000, qty: 1 }] },
    { name: "Dê xào lăn", category: "Food", ingredients: [{ name: "Thịt Dê Tươi", unit: "kg", cost: 280000, qty: 0.15 }, { name: "Nước Cốt Dừa", unit: "lít", cost: 50000, qty: 0.05 }] },
    { name: "Bò một nắng chấm muối kiến vàng", category: "Food", ingredients: [{ name: "Bò Một Nắng", unit: "kg", cost: 450000, qty: 0.15 }, { name: "Muối Kiến Vàng", unit: "hộp", cost: 30000, qty: 0.05 }] },
    { name: "Bê cháy tỏi", category: "Food", ingredients: [{ name: "Thịt Bê Sữa", unit: "kg", cost: 220000, qty: 0.15 }, { name: "Tỏi Củ", unit: "kg", cost: 40000, qty: 0.05 }] },
    { name: "Bê chao tứ xuyên", category: "Food", ingredients: [{ name: "Thịt Bê Sữa", unit: "kg", cost: 220000, qty: 0.15 }, { name: "Gia Vị Tứ Xuyên", unit: "gói", cost: 10000, qty: 0.5 }] },
    { name: "Bê sữa sốt tiêu xanh", category: "Food", ingredients: [{ name: "Thịt Bê Sữa", unit: "kg", cost: 220000, qty: 0.15 }, { name: "Tiêu Xanh", unit: "kg", cost: 150000, qty: 0.02 }] },

    // --- HEO & LỢN MÁN & NƯỚNG ---
    { name: "Nầm sữa nướng giềng mẻ", category: "BBQ", ingredients: [{ name: "Nầm Heo", unit: "kg", cost: 170000, qty: 0.25 }, { name: "Riềng Mẻ", unit: "kg", cost: 20000, qty: 0.05 }] },
    { name: "Lợn mán nướng giềng mẻ", category: "BBQ", ingredients: [{ name: "Lợn Mán", unit: "kg", cost: 160000, qty: 0.25 }, { name: "Riềng Mẻ", unit: "kg", cost: 20000, qty: 0.05 }] },
    { name: "Nầm sữa cháy tỏi", category: "Food", ingredients: [{ name: "Nầm Heo", unit: "kg", cost: 170000, qty: 0.25 }, { name: "Tỏi Củ", unit: "kg", cost: 40000, qty: 0.05 }] },
    { name: "Thịt dải heo cháy tỏi", category: "Food", ingredients: [{ name: "Dải Heo", unit: "kg", cost: 150000, qty: 0.25 }, { name: "Tỏi Củ", unit: "kg", cost: 40000, qty: 0.05 }] },
    { name: "Lợn mán xào lăn", category: "Food", ingredients: [{ name: "Lợn Mán", unit: "kg", cost: 160000, qty: 0.2 }, { name: "Sả/Ớt", unit: "kg", cost: 20000, qty: 0.05 }] },
    { name: "Lợn mán hấp lá thơm", category: "Food", ingredients: [{ name: "Lợn Mán", unit: "kg", cost: 160000, qty: 0.25 }, { name: "Lá Móc Mật", unit: "kg", cost: 25000, qty: 0.02 }] },
    { name: "Heo một nắng kèm sốt me", category: "Food", ingredients: [{ name: "Heo Một Nắng", unit: "kg", cost: 180000, qty: 0.2 }, { name: "Sốt Me", unit: "kg", cost: 60000, qty: 0.05 }] },
    { name: "Nọng heo cháy tỏi", category: "Food", ingredients: [{ name: "Nọng Heo", unit: "kg", cost: 140000, qty: 0.25 }, { name: "Tỏi Phi", unit: "kg", cost: 60000, qty: 0.03 }] },
    { name: "Heo dăm nướng tảng", category: "BBQ", ingredients: [{ name: "Thịt Heo Dăm", unit: "kg", cost: 130000, qty: 0.3 }, { name: "Sốt BBQ", unit: "kg", cost: 60000, qty: 0.05 }] },
    { name: "Giò heo giòn da", category: "Food", ingredients: [{ name: "Chân Giò Heo", unit: "kg", cost: 90000, qty: 1.2 }, { name: "Dầu Ăn", unit: "lít", cost: 35000, qty: 0.2 }] },
    { name: "Sườn Thái Cay", category: "Food", ingredients: [{ name: "Sườn Heo", unit: "kg", cost: 130000, qty: 0.5 }, { name: "Ớt Hiểm", unit: "kg", cost: 60000, qty: 0.05 }] },
    { name: "Thịt dải nướng mọi", category: "BBQ", ingredients: [{ name: "Dải Heo", unit: "kg", cost: 150000, qty: 0.25 }, { name: "Than Hoa", unit: "kg", cost: 15000, qty: 0.2 }] },
    { name: "Sườn nướng mật ong", category: "BBQ", ingredients: [{ name: "Sườn Non", unit: "kg", cost: 140000, qty: 0.3 }, { name: "Mật Ong", unit: "lít", cost: 120000, qty: 0.03 }] },
    { name: "Lợn mán nướng mắc khén", category: "BBQ", ingredients: [{ name: "Thịt Lợn Mán (Móc hàm)", unit: "kg", cost: 170000, qty: 0.25 }, { name: "Hạt Mắc Khén", unit: "kg", cost: 350000, qty: 0.005 }, { name: "Lá Móc Mật", unit: "kg", cost: 30000, qty: 0.01 }] },
    { name: "Lạp xưởng Tây Bắc", category: "BBQ", ingredients: [{ name: "Lạp Xưởng Hun Khói", unit: "kg", cost: 220000, qty: 0.2 }, { name: "Tương Ớt Mường Khương", unit: "chai", cost: 25000, qty: 0.05 }] },

    // --- GÀ ---
    { name: "Gà H’Mong rang muối", category: "Food", ingredients: [{ name: "Gà Đen", unit: "kg", cost: 190000, qty: 0.6 }, { name: "Bột Rang Muối", unit: "kg", cost: 40000, qty: 0.05 }] },
    { name: "Gà H’Mong chiên mắm", category: "Food", ingredients: [{ name: "Gà Đen", unit: "kg", cost: 190000, qty: 0.6 }, { name: "Nước Mắm", unit: "lít", cost: 40000, qty: 0.05 }] },
    { name: "Gà đen nướng mắc khén", category: "BBQ", ingredients: [{ name: "Gà Đen", unit: "kg", cost: 190000, qty: 0.6 }, { name: "Mắc Khén", unit: "kg", cost: 350000, qty: 0.005 }] },
    { name: "Cánh gà chiên mắm", category: "Food", ingredients: [{ name: "Cánh Gà", unit: "kg", cost: 65000, qty: 0.4 }, { name: "Nước Mắm", unit: "lít", cost: 40000, qty: 0.05 }] },
    { name: "Sụn gà chiên tiêu muối", category: "Food", ingredients: [{ name: "Sụn Gà", unit: "kg", cost: 110000, qty: 0.25 }, { name: "Muối Tiêu", unit: "kg", cost: 20000, qty: 0.02 }] },
    { name: "Sụn gà xào tứ xuyên", category: "Food", ingredients: [{ name: "Sụn Gà", unit: "kg", cost: 110000, qty: 0.25 }, { name: "Ớt Khô", unit: "kg", cost: 100000, qty: 0.02 }] },
    { name: "Tràng trứng chim", category: "Food", ingredients: [{ name: "Tràng Trứng", unit: "kg", cost: 180000, qty: 0.2 }, { name: "Hành Tây", unit: "kg", cost: 20000, qty: 0.1 }] },

    // --- BIA THÁP (TOWER) ---
    { name: "Tháp Hoegaarden 3 lít", category: "Drink", ingredients: [{ name: "Bia Tươi Hoegaarden", unit: "lít", cost: 85000, qty: 3 }] },
    { name: "Tháp Carlsberg 3 lít", category: "Drink", ingredients: [{ name: "Bia Tươi Carlsberg", unit: "lít", cost: 60000, qty: 3 }] },
    { name: "Tháp Budweiser 3 lít", category: "Drink", ingredients: [{ name: "Bia Tươi Budweiser", unit: "lít", cost: 55000, qty: 3 }] },
    { name: "Tháp Blanc 1664 3 lít", category: "Drink", ingredients: [{ name: "Bia Tươi Blanc", unit: "lít", cost: 80000, qty: 3 }] },

    // --- BIA LY ---
    { name: "Ly Hoegaarden 250ml", category: "Drink", ingredients: [{ name: "Bia Tươi Hoegaarden", unit: "lít", cost: 85000, qty: 0.25 }] },
    { name: "Ly Carlsberg 330ml", category: "Drink", ingredients: [{ name: "Bia Tươi Carlsberg", unit: "lít", cost: 60000, qty: 0.33 }] },
    { name: "Ly Budweiser 330ml", category: "Drink", ingredients: [{ name: "Bia Tươi Budweiser", unit: "lít", cost: 55000, qty: 0.33 }] },
    { name: "Ly Blanc 1664 330ml", category: "Drink", ingredients: [{ name: "Bia Tươi Blanc", unit: "lít", cost: 80000, qty: 0.33 }] },

    // --- BIA CHAI ---
    { name: "Bia Tiger Crystal", category: "Drink", ingredients: [{ name: "Bia Tiger Bạc", unit: "chai", cost: 16500, qty: 1 }] },
    { name: "Bia Hoegaarden", category: "Drink", ingredients: [{ name: "Bia Hoegaarden Chai", unit: "chai", cost: 35000, qty: 1 }] },
    { name: "Bia Heineken", category: "Drink", ingredients: [{ name: "Bia Heineken Chai", unit: "chai", cost: 19000, qty: 1 }] },
    { name: "Bia Corona Extra", category: "Drink", ingredients: [{ name: "Bia Corona Chai", unit: "chai", cost: 25000, qty: 1 }] },
    { name: "Bia Carlsberg", category: "Drink", ingredients: [{ name: "Bia Carlsberg Chai", unit: "chai", cost: 16000, qty: 1 }] },
    { name: "Bia Budweiser Aluminum", category: "Drink", ingredients: [{ name: "Bia Budweiser Nhôm", unit: "chai", cost: 45000, qty: 1 }] },
    { name: "Bia Budweiser", category: "Drink", ingredients: [{ name: "Bia Budweiser Chai", unit: "chai", cost: 18000, qty: 1 }] },
    { name: "Bia Blanc 1664", category: "Drink", ingredients: [{ name: "Bia Blanc Chai", unit: "chai", cost: 22000, qty: 1 }] },

    // --- NƯỚC NGỌT & RƯỢU & TRÀ ---
    { name: "Nước suối", category: "Drink", ingredients: [{ name: "Nước Suối Chai", unit: "chai", cost: 5000, qty: 1 }] },
    { name: "Nước cam ép 320ml", category: "Drink", ingredients: [{ name: "Nước Cam Lon", unit: "lon", cost: 10000, qty: 1 }] },
    { name: "Rượu mơ 9chum (500ml)", category: "Drink", ingredients: [{ name: "Rượu Mơ 9 Chum", unit: "chai", cost: 95000, qty: 1 }] },
    { name: "Trà Mơ Hắc Mai", category: "Drink", ingredients: [{ name: "Gói Trà Túi Lọc", unit: "gói", cost: 1000, qty: 1 }, { name: "Syrup Mơ", unit: "ml", cost: 200, qty: 30 }] },
    { name: "Trà Kiwi", category: "Drink", ingredients: [{ name: "Gói Trà Túi Lọc", unit: "gói", cost: 1000, qty: 1 }, { name: "Syrup Kiwi", unit: "ml", cost: 200, qty: 30 }] },
    { name: "Trà Trái Mọng", category: "Drink", ingredients: [{ name: "Gói Trà Túi Lọc", unit: "gói", cost: 1000, qty: 1 }, { name: "Mứt Trái Cây", unit: "g", cost: 300, qty: 30 }] },

    // --- CÁ ---
    { name: "Cá chẽm sốt Pattaya", category: "Seafood", ingredients: [{ name: "Cá Chẽm Phi Lê", unit: "kg", cost: 230000, qty: 0.4 }, { name: "Sốt Thái Pattaya", unit: "lít", cost: 80000, qty: 0.1 }, { name: "Bột Chiên Giòn", unit: "kg", cost: 30000, qty: 0.05 }, { name: "Sả Cây", unit: "kg", cost: 15000, qty: 0.03 }, { name: "Rễ Ngò/Ngò Rí", unit: "kg", cost: 40000, qty: 0.01 }, { name: "Ớt Hiểm", unit: "kg", cost: 60000, qty: 0.01 }] },
    { name: "Cá chẽm hấp chanh", category: "Seafood", ingredients: [{ name: "Cá Chẽm Nguyên Con", unit: "kg", cost: 140000, qty: 0.8 }, { name: "Chanh Tươi", unit: "kg", cost: 30000, qty: 0.15 }, { name: "Gia Vị Hấp", unit: "gói", cost: 5000, qty: 1 }, { name: "Gừng Củ", unit: "kg", cost: 30000, qty: 0.05 }] },
    { name: "Cá diêu hồng chiên sốt chili thái", category: "Seafood", ingredients: [{ name: "Cá Diêu Hồng", unit: "kg", cost: 65000, qty: 1.0 }, { name: "Sốt Chili Thái", unit: "lít", cost: 70000, qty: 0.1 }, { name: "Sả Cây", unit: "kg", cost: 15000, qty: 0.03 }] },
    { name: "Cá quả nướng muối ớt", category: "Seafood", ingredients: [{ name: "Cá Quả (Cá Lóc)", unit: "kg", cost: 95000, qty: 1.0 }, { name: "Muối Ớt Tây Ninh", unit: "kg", cost: 80000, qty: 0.02 }] },
    { name: "Cá dưa chua tứ xuyên", category: "Seafood", ingredients: [{ name: "Cá Lăng/Tầm (Cắt khúc)", unit: "kg", cost: 160000, qty: 0.5 }, { name: "Dưa Cải Chua", unit: "kg", cost: 15000, qty: 0.3 }, { name: "Gia Vị Tứ Xuyên", unit: "gói", cost: 25000, qty: 1 }, { name: "Ớt Khô", unit: "kg", cost: 100000, qty: 0.01 }] },

    // --- TÔM & MỰC ---
    { name: "Tôm sú ủ muối thảo mộc", category: "Seafood", ingredients: [{ name: "Tôm Sú (Size 25)", unit: "kg", cost: 320000, qty: 0.3 }, { name: "Muối Hột", unit: "kg", cost: 5000, qty: 0.3 }, { name: "Sả/Lá Chanh", unit: "kg", cost: 20000, qty: 0.05 }] },
    { name: "Tôm chiên hoàng kim", category: "Seafood", ingredients: [{ name: "Tôm Sú", unit: "kg", cost: 320000, qty: 0.25 }, { name: "Bột Trứng Muối", unit: "kg", cost: 180000, qty: 0.03 }, { name: "Bơ Thực Vật", unit: "kg", cost: 60000, qty: 0.02 }] },
    { name: "Mực hấp sốt Thái", category: "Seafood", ingredients: [{ name: "Mực Trứng", unit: "kg", cost: 280000, qty: 0.3 }, { name: "Sốt Thái Cay", unit: "lít", cost: 80000, qty: 0.1 }, { name: "Sả Cây", unit: "kg", cost: 15000, qty: 0.03 }] },
    { name: "Mực chiên bơ tỏi", category: "Seafood", ingredients: [{ name: "Mực Ống", unit: "kg", cost: 280000, qty: 0.3 }, { name: "Bơ Tường An", unit: "hộp", cost: 25000, qty: 0.1 }, { name: "Tỏi Củ", unit: "kg", cost: 40000, qty: 0.05 }] },

    // --- ỐC HƯƠNG & KHÁC ---
    { name: "Ốc hương ủ muối thảo mộc", category: "Seafood", ingredients: [{ name: "Ốc Hương (Size trung)", unit: "kg", cost: 350000, qty: 0.3 }, { name: "Muối Hột", unit: "kg", cost: 5000, qty: 0.2 }, { name: "Sả Cây", unit: "kg", cost: 15000, qty: 0.1 }, { name: "Lá Chanh", unit: "kg", cost: 30000, qty: 0.01 }] },
    { name: "Bạch tuộc sốt thái cay", category: "Seafood", ingredients: [{ name: "Bạch Tuộc (Baby)", unit: "kg", cost: 180000, qty: 0.3 }, { name: "Sốt Thái Cay", unit: "lít", cost: 80000, qty: 0.1 }, { name: "Cóc Non/Xoài", unit: "kg", cost: 20000, qty: 0.1 }, { name: "Sả Cây", unit: "kg", cost: 15000, qty: 0.02 }] },
    { name: "Ốc móng tay xào rau muống", category: "Seafood", ingredients: [{ name: "Ốc Móng Tay", unit: "kg", cost: 90000, qty: 0.4 }, { name: "Rau Muống", unit: "kg", cost: 15000, qty: 0.3 }, { name: "Tỏi Củ", unit: "kg", cost: 40000, qty: 0.03 }] },
    { name: "Khay hải sản tự do", category: "Seafood", ingredients: [{ name: "Tôm Sú", unit: "kg", cost: 320000, qty: 0.2 }, { name: "Mực Ống", unit: "kg", cost: 280000, qty: 0.2 }, { name: "Ngao/Ngêu", unit: "kg", cost: 30000, qty: 0.5 }, { name: "Sốt Hải Sản", unit: "lít", cost: 80000, qty: 0.1 }, { name: "Sả/Gừng", unit: "kg", cost: 20000, qty: 0.1 }] },

    // --- LẨU (HOTPOT) ---
    { name: "Lẩu gà đen nấm rừng Vân Nam", category: "Hotpot", ingredients: [{ name: "Gà Đen H'Mong", unit: "kg", cost: 190000, qty: 1.0 }, { name: "Set Nấm Rừng (Khô/Tươi)", unit: "kg", cost: 250000, qty: 0.2 }, { name: "Gói Thuốc Bắc", unit: "gói", cost: 15000, qty: 1 }, { name: "Xương Gà (Ninh nước)", unit: "kg", cost: 30000, qty: 0.5 }, { name: "Rau Lẩu Tổng Hợp", unit: "kg", cost: 25000, qty: 0.5 }, { name: "Hạt Mắc Khén", unit: "kg", cost: 350000, qty: 0.005 }, { name: "Gừng Củ", unit: "kg", cost: 30000, qty: 0.05 }, { name: "Sả Cây", unit: "kg", cost: 15000, qty: 0.05 }] },
    { name: "Lẩu bò tươi Tự Do", category: "Hotpot", ingredients: [{ name: "Thịt Bò (Gầu/Bắp)", unit: "kg", cost: 240000, qty: 0.5 }, { name: "Đuôi Bò", unit: "kg", cost: 200000, qty: 0.3 }, { name: "Xương Bò (Ninh nước)", unit: "kg", cost: 40000, qty: 1.0 }, { name: "Rau Lẩu/Bánh Phở", unit: "set", cost: 30000, qty: 1 }, { name: "Gừng Củ", unit: "kg", cost: 30000, qty: 0.05 }, { name: "Hành Tây", unit: "kg", cost: 20000, qty: 0.2 }] },
    { name: "Lẩu riêu cua bắp bò", category: "Hotpot", ingredients: [{ name: "Cua Đồng Xay", unit: "kg", cost: 120000, qty: 0.5 }, { name: "Bắp Bò", unit: "kg", cost: 260000, qty: 0.3 }, { name: "Đậu Phụ", unit: "bìa", cost: 3000, qty: 5 }, { name: "Rau Chuối/Muống", unit: "kg", cost: 20000, qty: 0.5 }, { name: "Hành Tím Khô", unit: "kg", cost: 60000, qty: 0.02 }] },
    { name: "Lẩu ếch măng cay", category: "Hotpot", ingredients: [{ name: "Ếch Đồng (Sơ chế)", unit: "kg", cost: 110000, qty: 1.0 }, { name: "Măng Củ Chua", unit: "kg", cost: 25000, qty: 0.5 }, { name: "Rau Muống/Lá Lốt", unit: "kg", cost: 15000, qty: 0.5 }, { name: "Sả Cây", unit: "kg", cost: 15000, qty: 0.1 }, { name: "Tỏi Củ", unit: "kg", cost: 40000, qty: 0.05 }, { name: "Ớt Hiểm", unit: "kg", cost: 60000, qty: 0.02 }] },

    // --- COMBO & CƠM/MÌ ---
    { name: "COMBO 1", category: "Combo", ingredients: [{ name: "Thịt Trâu Tươi", unit: "kg", cost: 230000, qty: 0.12 }, { name: "Lạp Xưởng Hun Khói", unit: "kg", cost: 220000, qty: 0.1 }, { name: "Má Heo (Nọng)", unit: "kg", cost: 150000, qty: 0.2 }, { name: "Thịt Bắp Bò", unit: "kg", cost: 260000, qty: 0.1 }, { name: "Thịt Bê Sữa", unit: "kg", cost: 220000, qty: 0.2 }, { name: "Cá Chẽm Nguyên Con", unit: "kg", cost: 140000, qty: 0.8 }, { name: "Rau/Gia Vị Combo", unit: "set", cost: 40000, qty: 1 }] },
    { name: "COMBO VIP 1", category: "Combo", ingredients: [{ name: "Gà Đen H'Mong", unit: "con", cost: 250000, qty: 1 }, { name: "Cá Tầm/Chẽm Nguyên Con", unit: "con", cost: 200000, qty: 1 }, { name: "Set Bò Nướng Tảng", unit: "kg", cost: 300000, qty: 0.5 }, { name: "Rượu Mơ 9 Chum", unit: "chai", cost: 95000, qty: 1 }] },
    { name: "Miến xào cua", category: "RiceNoodle", ingredients: [{ name: "Miến Dong", unit: "kg", cost: 40000, qty: 0.15 }, { name: "Thịt Cua Bể (Gỡ sẵn)", unit: "kg", cost: 450000, qty: 0.05 }, { name: "Cà Rốt/Hành Tây", unit: "kg", cost: 20000, qty: 0.1 }] },
    { name: "Mỳ xào bò", category: "RiceNoodle", ingredients: [{ name: "Mì Tôm", unit: "vắt", cost: 2000, qty: 2 }, { name: "Thịt Bò", unit: "kg", cost: 240000, qty: 0.08 }, { name: "Rau Cải Ngọt", unit: "kg", cost: 15000, qty: 0.2 }] },
    { name: "Cơm chiên mắm tép", category: "RiceNoodle", ingredients: [{ name: "Gạo (Thành cơm)", unit: "kg", cost: 22000, qty: 0.2 }, { name: "Mắm Tép Chưng", unit: "hũ", cost: 50000, qty: 0.05 }, { name: "Thịt Heo Băm", unit: "kg", cost: 130000, qty: 0.05 }] },
    { name: "Combo nướng tại bàn", category: "Combo", ingredients: [{ name: "Nọng Heo (Giòn)", unit: "kg", cost: 160000, qty: 0.1 }, { name: "Dẻ Sườn Bò Mỹ", unit: "kg", cost: 350000, qty: 0.1 }, { name: "Bẹ Vai Bò Mỹ", unit: "kg", cost: 280000, qty: 0.1 }, { name: "Nạc Vai Bò Mỹ", unit: "kg", cost: 290000, qty: 0.1 }, { name: "Lõi Vai Bò Mỹ", unit: "kg", cost: 320000, qty: 0.1 }, { name: "Sốt Chấm Nướng (5 loại)", unit: "set", cost: 30000, qty: 1 }, { name: "Panchan (Kim chi/Củ cải)", unit: "set", cost: 15000, qty: 1 }, { name: "Than Hoa", unit: "kg", cost: 15000, qty: 0.5 }] },
    { name: "COMBO 2", category: "Combo", ingredients: [{ name: "Rau Bò Khai", unit: "kg", cost: 60000, qty: 0.3 }, { name: "Cá Trích Ép Trứng", unit: "kg", cost: 650000, qty: 0.05 }, { name: "Ếch Đồng", unit: "kg", cost: 110000, qty: 0.3 }, { name: "Thịt Lợn Mán", unit: "kg", cost: 170000, qty: 0.2 }, { name: "Tôm Sú", unit: "kg", cost: 320000, qty: 0.2 }, { name: "Cá Lăng/Tầm", unit: "kg", cost: 160000, qty: 0.4 }, { name: "Rau/Gia Vị Combo", unit: "set", cost: 45000, qty: 1 }] },
    { name: "COMBO 3", category: "Combo", ingredients: [{ name: "Sứa Biển", unit: "kg", cost: 60000, qty: 0.2 }, { name: "Trứng Non", unit: "kg", cost: 250000, qty: 0.1 }, { name: "Thịt Dê Tươi", unit: "kg", cost: 280000, qty: 0.1 }, { name: "Thịt Lợn Mán", unit: "kg", cost: 170000, qty: 0.2 }, { name: "Tôm Sú", unit: "kg", cost: 320000, qty: 0.2 }, { name: "Gà Đen H'Mong", unit: "kg", cost: 190000, qty: 1.0 }, { name: "Rau/Gia Vị Combo", unit: "set", cost: 50000, qty: 1 }] },
    { name: "COMBO 4", category: "Combo", ingredients: [{ name: "Dải Heo", unit: "kg", cost: 150000, qty: 0.2 }, { name: "Da Trâu Muối", unit: "kg", cost: 180000, qty: 0.1 }, { name: "Nầm Heo", unit: "kg", cost: 170000, qty: 0.2 }, { name: "Cá Chẽm Phi Lê", unit: "kg", cost: 230000, qty: 0.4 }, { name: "Hải Sản Mix (Tôm/Mực)", unit: "kg", cost: 200000, qty: 0.3 }, { name: "Nấm/Rau/Gia Vị", unit: "set", cost: 35000, qty: 1 }] },
    { name: "COMBO 5", category: "Combo", ingredients: [{ name: "Chân Gà Rút Xương", unit: "kg", cost: 90000, qty: 0.2 }, { name: "Thịt Bắp Bò", unit: "kg", cost: 260000, qty: 0.1 }, { name: "Thịt Trâu Tươi", unit: "kg", cost: 230000, qty: 0.15 }, { name: "Heo Một Nắng", unit: "kg", cost: 190000, qty: 0.15 }, { name: "Tôm Sú", unit: "kg", cost: 320000, qty: 0.25 }, { name: "Nầm Heo", unit: "kg", cost: 170000, qty: 0.2 }, { name: "Cá Diêu Hồng", unit: "kg", cost: 65000, qty: 1.0 }, { name: "Rau/Gia Vị Combo", unit: "set", cost: 40000, qty: 1 }] },
    { name: "COMBO 6", category: "Combo", ingredients: [{ name: "Bạch Tuộc", unit: "kg", cost: 180000, qty: 0.2 }, { name: "Dồi Dê", unit: "kg", cost: 180000, qty: 0.2 }, { name: "Thịt Bê Sữa", unit: "kg", cost: 220000, qty: 0.2 }, { name: "Sườn Heo", unit: "kg", cost: 130000, qty: 0.4 }, { name: "Ốc Hương", unit: "kg", cost: 350000, qty: 0.25 }, { name: "Mực Ống", unit: "kg", cost: 280000, qty: 0.3 }, { name: "Ngồng Cải/Nấm", unit: "kg", cost: 30000, qty: 0.3 }, { name: "Rau/Gia Vị Combo", unit: "set", cost: 45000, qty: 1 }] },
    { name: "COMBO 7", category: "Combo", ingredients: [{ name: "Rau Ngót Lào", unit: "kg", cost: 50000, qty: 0.3 }, { name: "Ba Chỉ Heo", unit: "kg", cost: 130000, qty: 0.15 }, { name: "Lạp Xưởng Hun Khói", unit: "kg", cost: 220000, qty: 0.15 }, { name: "Thịt Trâu Tươi", unit: "kg", cost: 230000, qty: 0.15 }, { name: "Thịt Lợn Mán", unit: "kg", cost: 170000, qty: 0.2 }, { name: "Cá Chẽm Phi Lê", unit: "kg", cost: 230000, qty: 0.4 }, { name: "Cá Lăng/Tầm", unit: "kg", cost: 160000, qty: 0.4 }, { name: "Rau/Gia Vị Combo", unit: "set", cost: 50000, qty: 1 }] },
    { name: "COMBO 8", category: "Combo", ingredients: [{ name: "Măng Trúc", unit: "kg", cost: 55000, qty: 0.25 }, { name: "Chân Gà Rút Xương", unit: "kg", cost: 90000, qty: 0.2 }, { name: "Thịt Bê Sữa", unit: "kg", cost: 220000, qty: 0.15 }, { name: "Thịt Lợn Mán", unit: "kg", cost: 170000, qty: 0.2 }, { name: "Cá Chẽm Phi Lê", unit: "kg", cost: 230000, qty: 0.4 }, { name: "Mực Ống", unit: "kg", cost: 280000, qty: 0.3 }, { name: "Gà Đen H'Mong", unit: "kg", cost: 190000, qty: 0.6 }, { name: "Rau/Gia Vị Combo", unit: "set", cost: 45000, qty: 1 }] }
];

// PANTRY & SPICES (Add to inventory but not as a dish)
const BASIC_PANTRY_ITEMS = [
    // --- GIA VỊ CƠ BẢN ---
    { name: "Đường Kính Trắng", unit: "kg", cost: 20000, category: "Gia Vị" },
    { name: "Muối Tinh", unit: "kg", cost: 5000, category: "Gia Vị" },
    { name: "Muối Hạt", unit: "kg", cost: 4000, category: "Gia Vị" },
    { name: "Bột Ngọt (Mì Chính)", unit: "kg", cost: 60000, category: "Gia Vị" },
    { name: "Hạt Tiêu Đen", unit: "kg", cost: 120000, category: "Gia Vị" },
    { name: "Tiêu Sọ", unit: "kg", cost: 180000, category: "Gia Vị" },
    // --- NƯỚC CHẤM & SỐT ---
    { name: "Nước Mắm Nam Ngư", unit: "lít", cost: 35000, category: "Gia Vị" },
    { name: "Nước Mắm Nhĩ", unit: "lít", cost: 150000, category: "Gia Vị" },
    { name: "Dầu Ăn (Can)", unit: "lít", cost: 35000, category: "Gia Vị" },
    { name: "Dầu Hào Maggi", unit: "chai", cost: 35000, category: "Gia Vị" },
    { name: "Nước Tương (Xì Dầu)", unit: "lít", cost: 25000, category: "Gia Vị" },
    { name: "Tương Ớt Chinsu", unit: "chai", cost: 15000, category: "Gia Vị" },
    { name: "Tương Cà", unit: "chai", cost: 15000, category: "Gia Vị" },
    { name: "Giấm Gạo", unit: "lít", cost: 15000, category: "Gia Vị" },
    { name: "Mẻ (Cơm Mẻ)", unit: "kg", cost: 10000, category: "Gia Vị" },
    { name: "Dầu Mè", unit: "chai", cost: 45000, category: "Gia Vị" },
    { name: "Sốt Mayonnaise", unit: "chai", cost: 35000, category: "Gia Vị" },
    { name: "Sa Tế Tôm", unit: "hũ", cost: 10000, category: "Gia Vị" },
    // --- HƯƠNG LIỆU KHÔ ---
    { name: "Quế Thanh", unit: "kg", cost: 150000, category: "Đồ Khô" },
    { name: "Hoa Hồi", unit: "kg", cost: 200000, category: "Đồ Khô" },
    { name: "Thảo Quả", unit: "kg", cost: 300000, category: "Đồ Khô" },
    { name: "Ngũ Vị Hương", unit: "gói", cost: 5000, category: "Đồ Khô" },
    { name: "Hạt Mùi", unit: "kg", cost: 120000, category: "Đồ Khô" },
    { name: "Đinh Hương", unit: "kg", cost: 250000, category: "Đồ Khô" },
    // --- NGUYÊN LIỆU NẤU ---
    { name: "Rượu Trắng", unit: "lít", cost: 30000, category: "Gia Vị" },
    { name: "Rượu Mai Quế Lộ", unit: "lít", cost: 60000, category: "Gia Vị" },
    { name: "Bột Chiên Xù", unit: "kg", cost: 40000, category: "Đồ Khô" },
    { name: "Bột Năng", unit: "kg", cost: 20000, category: "Đồ Khô" },
    { name: "Bột Bắp", unit: "kg", cost: 20000, category: "Đồ Khô" },
    { name: "Mù Tạt (Vàng/Xanh)", unit: "tuýp", cost: 35000, category: "Gia Vị" }
];

// ==========================================
// 4. EXECUTION
// ==========================================
const seedInventory = async () => {
    try {
        await connectDB();
        console.log("✅ Database connected");

        const analyzer = new SmartRecipeAnalyzer();
        
        // Clear previous inventory & recipes
        await ingredientModel.deleteMany({});
        await recipeModel.deleteMany({});
        console.log("🧹 Cleared Ingredient and Recipe collections");

        // ---------------------------------------------------------
        // A. CREATE INGREDIENTS FROM CUSTOM MENU DATA
        // ---------------------------------------------------------
        const uniqueIngredients = new Map();

        // 1. Gather all unique ingredients from the Custom Menu
        CUSTOM_MENU_DATA.forEach(dish => {
            if (dish.ingredients && Array.isArray(dish.ingredients)) {
                dish.ingredients.forEach(ing => {
                    const name = ing.name || "";
                    if (!name) return;
                    
                    const key = name.toLowerCase().trim();
                    if (!uniqueIngredients.has(key)) {
                        uniqueIngredients.set(key, {
                            name: name,
                            unit: ing.unit,
                            cost: ing.cost,
                            category: getCategoryFromDishCategory(dish.category)
                        });
                    }
                });
            }
        });

        // 2. Gather ingredients from Pantry (Staples)
        BASIC_PANTRY_ITEMS.forEach(item => {
            const name = item.name || "";
            if (!name) return;
            
            const key = name.toLowerCase().trim();
            if (!uniqueIngredients.has(key)) {
                uniqueIngredients.set(key, {
                    name: item.name,
                    unit: item.unit,
                    cost: item.cost,
                    category: item.category || 'Gia Vị'
                });
            }
        });

        // 3. Upsert Ingredients to DB
        console.log(`📝 Processing ${uniqueIngredients.size} unique ingredients from Custom Menu...`);
        const ingredientNameMap = {}; 
        
        // Clear Stocks before reseeding to prevent duplicates
        await stockModel.deleteMany({}); 
        console.log("🧹 Cleared Stock collection");
        
        for (const [key, data] of uniqueIngredients) {
            const ing = await ingredientModel.create({
                name: data.name,
                category: data.category || 'General',
                unit: data.unit,
                costPrice: data.cost
            });
            ingredientNameMap[key] = ing; 
            
            // Central Stock
            await stockModel.create({
                ingredient: ing._id,
                branch: null,
                quantity: 1000,
                minThreshold: 50
            });
        }
        
        // Also load Analyzer ingredients for items NOT in the Custom Menu
        const analyzerIngredients = Object.entries(analyzer.ingredients);
        let extraIngCount = 0;
        for (const [name, data] of analyzerIngredients) {
             const key = name.toLowerCase().trim();
             if (!uniqueIngredients.has(key)) {
                 const ing = await ingredientModel.create({
                    name: name,
                    category: data.category,
                    unit: data.unit,
                    costPrice: data.avgPrice
                 });
                 ingredientNameMap[key] = ing;
                 
                 // Central Stock
                 await stockModel.create({
                    ingredient: ing._id,
                    branch: null,
                    quantity: 500,
                    minThreshold: 20
                });

                 extraIngCount++;
             }
        }
        console.log(`➕ Added ${extraIngCount} supplemental ingredients from Smart Analyzer.`);

        // ---------------------------------------------------------
        // B. GENERATE RECIPES
        // ---------------------------------------------------------
        
        const manualRecipeMap = new Map();
        CUSTOM_MENU_DATA.forEach(item => {
            if (item.name) {
                manualRecipeMap.set(item.name.toLowerCase().trim(), item);
            }
        });

        const foods = await foodModel.find({});
        console.log(`📋 Found ${foods.length} foods to generate recipes for...`);

        let recipeCount = 0;
        let manualCount = 0;
        let smartCount = 0;

        for (const food of foods) {
            let recipeIngredients = [];
            let totalCost = 0;
            let source = "";
            let notes = "";

            const foodNameKey = (food.name || "").toLowerCase().trim();
            if (!foodNameKey) continue;

            // 1. Check Custom Manual Data
            if (manualRecipeMap.has(foodNameKey)) {
                const manualItem = manualRecipeMap.get(foodNameKey);
                source = "Manual Data";
                notes = `Custom Recipe: ${manualItem.category}`;

                if (manualItem.ingredients) {
                    for (const item of manualItem.ingredients) {
                        const iName = item.name || "";
                        if (!iName) continue;
                        
                        const ingKey = iName.toLowerCase().trim();
                        const ingDb = ingredientNameMap[ingKey];
                        
                        if (ingDb) {
                            recipeIngredients.push({
                                ingredientId: ingDb._id,
                                quantityNeeded: item.qty,
                                unit: ingDb.unit
                            });
                            totalCost += (ingDb.costPrice * item.qty);
                        } else {
                            console.warn(`    ⚠️ Missing DB ingredient for Manual Item: ${item.name} in dish ${food.name}`);
                        }
                    }
                    manualCount++;
                }

            } else {
                // 2. Fallback to Smart Recipe Analyzer
                source = "Smart Analyzer";
                const analysis = analyzer.analyzeDishByName(food.name);
                const generatedRecipe = analyzer.generateRecipe(analysis);
                
                notes = `Auto-generated: ${analysis.category.name}`;

                for (const item of generatedRecipe) {
                     const iName = item.ingredientName || "";
                     if (!iName) continue;

                     const ingKey = iName.toLowerCase().trim();
                     let ingDb = ingredientNameMap[ingKey];

                     if (!ingDb) {
                         const foundKey = Object.keys(ingredientNameMap).find(k => k.includes(ingKey) || ingKey.includes(k));
                         if (foundKey) ingDb = ingredientNameMap[foundKey];
                     }

                     if (ingDb) {
                        recipeIngredients.push({
                            ingredientId: ingDb._id,
                            quantityNeeded: item.quantity,
                            unit: ingDb.unit
                        });
                        totalCost += (ingDb.costPrice * item.quantity);
                    }
                }
                smartCount++;
            }

            if (recipeIngredients.length > 0) {
                 await recipeModel.create({
                    foodId: food._id,
                    ingredients: recipeIngredients,
                    calculatedCost: Math.round(totalCost),
                    notes: notes
                 });

                 await foodModel.findByIdAndUpdate(food._id, { costPrice: Math.round(totalCost) });
                 
                 console.log(`   > [${source}] Recipe for [${food.name}]: ${Math.round(totalCost).toLocaleString()} VND`);
                 recipeCount++;
            } else {
                console.log(`   ❌ No recipe generated for: ${food.name}`);
            }
        }

        console.log(`✅ DONE! Summary:`);
        console.log(`   - Total Recipes: ${recipeCount}`);
        console.log(`   - Manual Matches: ${manualCount}`);
        console.log(`   - Smart Auto-Gen: ${smartCount}`);
        
        mongoose.connection.close();
        process.exit(0);

    } catch (error) {
        console.error("❌ Error seeding inventory:", error);
        process.exit(1);
    }
};

// Simple Helper for Category
function getCategoryFromDishCategory(dishCat) {
    if (dishCat === 'Appetizer') return 'Đồ Khô';
    if (dishCat === 'Salad') return 'Thực Phẩm Mát';
    if (dishCat === 'Vegetable') return 'Rau Củ';
    if (dishCat === 'BBQ') return 'Thịt';
    if (dishCat === 'Seafood') return 'Hải Sản';
    if (dishCat === 'Hotpot') return 'Thịt';
    if (dishCat === 'Drink') return 'Đồ Uống';
    return 'Khác';
}

seedInventory();
