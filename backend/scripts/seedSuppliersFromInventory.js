
import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import supplierModel from "../models/supplierModel.js";
import ingredientModel from "../models/ingredientModel.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const SUPPLIERS = [
    { name: "Nhà Cung Cấp Thịt Sạch", category: "MEAT", contactPerson: "Anh Hùng", phone: "0901234567" },
    { name: "Vựa Hải Sản Biển Đông", category: "MEAT", contactPerson: "Chị Thủy", phone: "0909888777" }, // Using MEAT for protein group
    { name: "Nông Trại Rau Xanh", category: "VEG", contactPerson: "Bác Ba", phone: "0912345678" },
    { name: "Đại Lý Bia Nước Ngọt", category: "OTHER", contactPerson: "Cô Tư", phone: "0987654321" },
    { name: "Cửa Hàng Gia Vị & Đồ Khô", category: "DRY", contactPerson: "Chú Bảy", phone: "0905555555" }
];

const seedSuppliers = async () => {
    try {
        if (!process.env.MONGO_URI && !process.env.MONGO_URL) {
            throw new Error("MONGO_URI is missing in .env");
        }
        await mongoose.connect(process.env.MONGO_URI || process.env.MONGO_URL);
        console.log("✅ Database connected");

        // 1. Create Suppliers
        console.log("🏭 Creating Mock Suppliers...");
        const supplierMap = {}; // Map category/role to Supplier Document

        for (const data of SUPPLIERS) {
            let supplier = await supplierModel.findOne({ name: data.name });
            if (!supplier) {
                supplier = await supplierModel.create(data);
                console.log(`   + Created: ${data.name}`);
            } else {
                console.log(`   . Exists: ${data.name}`);
            }
            supplierMap[data.name] = supplier;
        }

        // 2. Map Ingredients to Suppliers (Conceptual - for now we just list what would be mapped)
        // Since ingredientModel doesn't have supplierId, we can't link them permanently unless we migrateSchema.
        // However, for "Import" feature, the user usually selects a supplier.
        
        // Let's count ingredients per category to show potential volume
        const ingredients = await ingredientModel.find({});
        console.log(`\n📦 Analysis of ${ingredients.length} Ingredients in Inventory:`);

        let countMeat = 0;
        let countVeg = 0;
        let countDry = 0;
        let countOther = 0;

        ingredients.forEach(ing => {
            const cat = ing.category ? ing.category.toLowerCase() : '';
            if (cat.includes('thịt') || cat.includes('meat') || cat.includes('bbq') || cat.includes('hotpot') || cat.includes('seafood') || cat.includes('hải sản')) {
                countMeat++;
            } else if (cat.includes('rau') || cat.includes('veg') || cat.includes('salad') || cat.includes('củ')) {
                countVeg++;
            } else if (cat.includes('khô') || cat.includes('dry') || cat.includes('gia vị') || cat.includes('spice')) {
                countDry++;
            } else {
                countOther++;
            }
        });

        console.log(`   - Meat/Seafood items: ${countMeat} -> Supplied by "Nhà Cung Cấp Thịt Sạch" / "Vựa Hải Sản Biển Đông"`);
        console.log(`   - Vegetable items: ${countVeg} -> Supplied by "Nông Trại Rau Xanh"`);
        console.log(`   - Dry/Spice items: ${countDry} -> Supplied by "Cửa Hàng Gia Vị & Đồ Khô"`);
        console.log(`   - Drink/Other items: ${countOther} -> Supplied by "Đại Lý Bia Nước Ngọt"`);

        console.log("\n✅ Supplier Seeding Complete!");
        console.log("   Now you can use 'Import' feature and select these suppliers.");

        await mongoose.connection.close();
        process.exit(0);
    } catch (error) {
        console.error("❌ Error seeding suppliers:", error);
        process.exit(1);
    }
};

seedSuppliers();
