const mongoose = require('mongoose');
require('dotenv').config();

const check = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        // Define minimal schema just to read stock
        const Food = mongoose.model('food', new mongoose.Schema({ name: String, stock: Number }));
        
        const negStock = await Food.findOne({ stock: { $lt: 0 } });
        
        if (negStock) {
            console.log(`✅ FOUND NEGATIVE STOCK ITEM: ${negStock.name} (Stock: ${negStock.stock})`);
            console.log("   -> Proof that 'Soft Deduction' works!");
        } else {
            console.log("❌ No negative stock items found (Test might not have run or stock > 0)");
        }
    } catch(e) { console.error(e); }
    process.exit();
};
check();
