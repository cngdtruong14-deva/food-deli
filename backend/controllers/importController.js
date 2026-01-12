import supplierModel from "../models/supplierModel.js";
import importReceiptModel from "../models/importReceiptModel.js";
import ingredientModel from "../models/ingredientModel.js";
import stockModel from "../models/stockModel.js";
import stockTransactionModel from "../models/stockTransactionModel.js";
import userModel from "../models/userModel.js";

// Helper: Check User Role
const checkUserRole = async (userId) => {
    if (!userId || userId === 'null' || userId === 'undefined') {
        return { role: 'admin', branchId: null };
    }
    const user = await userModel.findById(userId);
    return { 
        role: user?.role || 'admin', 
        branchId: user?.branchId || null,
        name: user?.name || 'Unknown'
    };
};

// =========================================
// SUPPLIER MANAGEMENT
// =========================================

// List all suppliers
const listSuppliers = async (req, res) => {
    try {
        const { active } = req.query;
        const query = active === 'true' ? { isActive: true } : {};
        
        const suppliers = await supplierModel.find(query).sort({ name: 1 });
        res.json({ success: true, data: suppliers });
    } catch (error) {
        console.error("listSuppliers error:", error);
        res.json({ success: false, message: "Error fetching suppliers" });
    }
};

// Add supplier
const addSupplier = async (req, res) => {
    try {
        const { userId, name, contactPerson, phone, email, address, category } = req.body;
        
        // Authorization check
        const { role } = await checkUserRole(userId);
        if (!['admin', 'manager'].includes(role)) {
            return res.json({ success: false, message: "Unauthorized" });
        }

        if (!name || name.trim() === '') {
            return res.json({ success: false, message: "Tên nhà cung cấp là bắt buộc" });
        }

        const supplier = await supplierModel.create({
            name: name.trim(),
            contactPerson: contactPerson || '',
            phone: phone || '',
            email: email || '',
            address: address || '',
            category: category || 'OTHER'
        });

        res.json({ success: true, message: "Thêm NCC thành công", data: supplier });
    } catch (error) {
        console.error("addSupplier error:", error);
        res.json({ success: false, message: "Error adding supplier" });
    }
};

// Update supplier
const updateSupplier = async (req, res) => {
    try {
        const { id } = req.params;
        const { userId, name, contactPerson, phone, email, address, category, isActive } = req.body;

        const { role } = await checkUserRole(userId);
        if (!['admin', 'manager'].includes(role)) {
            return res.json({ success: false, message: "Unauthorized" });
        }

        const updated = await supplierModel.findByIdAndUpdate(id, {
            name, contactPerson, phone, email, address, category, isActive
        }, { new: true });

        if (!updated) {
            return res.json({ success: false, message: "Supplier not found" });
        }

        res.json({ success: true, message: "Cập nhật NCC thành công", data: updated });
    } catch (error) {
        console.error("updateSupplier error:", error);
        res.json({ success: false, message: "Error updating supplier" });
    }
};

// =========================================
// IMPORT RECEIPT MANAGEMENT
// =========================================

// List receipts
const listReceipts = async (req, res) => {
    try {
        const { status, branchId, limit = 50 } = req.query;
        
        const query = {};
        if (status && status !== 'all') query.status = status;
        if (branchId && branchId !== 'null') query.branch = branchId;
        else if (branchId === 'null') query.branch = null;

        const receipts = await importReceiptModel
            .find(query)
            .populate('supplier', 'name category')
            .populate('branch', 'name')
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .lean();

        res.json({ success: true, data: receipts });
    } catch (error) {
        console.error("listReceipts error:", error);
        res.json({ success: false, message: "Error fetching receipts" });
    }
};

// Get single receipt
const getReceipt = async (req, res) => {
    try {
        const { id } = req.params;
        
        const receipt = await importReceiptModel
            .findById(id)
            .populate('supplier')
            .populate('branch', 'name')
            .populate('items.ingredient', 'name unit')
            .lean();

        if (!receipt) {
            return res.json({ success: false, message: "Receipt not found" });
        }

        res.json({ success: true, data: receipt });
    } catch (error) {
        console.error("getReceipt error:", error);
        res.json({ success: false, message: "Error fetching receipt" });
    }
};

// Create receipt (Draft/Pending)
const createReceipt = async (req, res) => {
    try {
        const { userId, supplierId, branchId, items, notes } = req.body;

        const { role, name } = await checkUserRole(userId);
        if (!['admin', 'manager'].includes(role)) {
            return res.json({ success: false, message: "Unauthorized: Admin/Manager only" });
        }

        if (!supplierId || !items || items.length === 0) {
            return res.json({ success: false, message: "Supplier và items là bắt buộc" });
        }

        // Generate code
        const code = await importReceiptModel.generateCode();

        // Calculate totals
        let totalAmount = 0;
        const processedItems = [];

        for (const item of items) {
            const ingredient = await ingredientModel.findById(item.ingredientId);
            if (!ingredient) continue;

            const lineTotal = item.quantity * item.pricePerUnit;
            totalAmount += lineTotal;

            processedItems.push({
                ingredient: item.ingredientId,
                ingredientName: ingredient.name,
                quantity: item.quantity,
                unit: ingredient.unit,
                pricePerUnit: item.pricePerUnit,
                total: lineTotal
            });
        }

        const receipt = await importReceiptModel.create({
            code,
            supplier: supplierId,
            branch: branchId === 'null' ? null : branchId,
            items: processedItems,
            totalAmount,
            status: 'PENDING',
            notes: notes || '',
            createdBy: userId,
            createdByName: name
        });

        res.json({ success: true, message: `Tạo phiếu ${code} thành công`, data: receipt });
    } catch (error) {
        console.error("createReceipt error:", error);
        res.json({ success: false, message: "Error creating receipt" });
    }
};

// Complete receipt (Update stock, log transaction, update cost)
const completeReceipt = async (req, res) => {
    try {
        const { id } = req.params;
        const { userId } = req.body;

        const { role, name } = await checkUserRole(userId);
        if (!['admin', 'manager'].includes(role)) {
            return res.json({ success: false, message: "Unauthorized" });
        }

        const receipt = await importReceiptModel.findById(id);
        if (!receipt) {
            return res.json({ success: false, message: "Receipt not found" });
        }

        if (receipt.status !== 'PENDING') {
            return res.json({ success: false, message: `Cannot complete receipt with status ${receipt.status}` });
        }

        // Process each item - Update stock and log transaction
        for (const item of receipt.items) {
            // Find or create stock entry
            let stock = await stockModel.findOne({ 
                ingredient: item.ingredient, 
                branch: receipt.branch 
            });

            const previousQty = stock ? stock.quantity : 0;
            const newQty = previousQty + item.quantity;

            if (stock) {
                stock.quantity = newQty;
                stock.lastUpdated = Date.now();
                await stock.save();
            } else {
                stock = await stockModel.create({
                    ingredient: item.ingredient,
                    branch: receipt.branch,
                    quantity: newQty,
                    minThreshold: 5
                });
            }

            // Update ingredient cost price (Weighted Average)
            const ingredient = await ingredientModel.findById(item.ingredient);
            if (ingredient) {
                const oldValue = previousQty * (ingredient.costPrice || 0);
                const newValue = item.quantity * item.pricePerUnit;
                const totalQty = previousQty + item.quantity;
                
                if (totalQty > 0) {
                    ingredient.costPrice = Math.round((oldValue + newValue) / totalQty);
                    await ingredient.save();
                }
            }

            // Log transaction
            await stockTransactionModel.create({
                stock: stock._id,
                ingredient: item.ingredient,
                branch: receipt.branch,
                type: 'IMPORT',
                quantity: item.quantity,
                previousQty,
                newQty,
                reason: `Nhập kho từ phiếu ${receipt.code}`,
                referenceId: receipt.code,
                performedBy: userId,
                performedByName: name
            });
        }

        // Update receipt status
        receipt.status = 'COMPLETED';
        receipt.completedBy = userId;
        receipt.completedByName = name;
        receipt.completedAt = Date.now();
        await receipt.save();

        res.json({ 
            success: true, 
            message: `Hoàn thành phiếu ${receipt.code}. Đã cập nhật ${receipt.items.length} nguyên liệu.`,
            data: receipt
        });
    } catch (error) {
        console.error("completeReceipt error:", error);
        res.json({ success: false, message: "Error completing receipt" });
    }
};

// Cancel receipt
const cancelReceipt = async (req, res) => {
    try {
        const { id } = req.params;
        const { userId, reason } = req.body;

        const { role } = await checkUserRole(userId);
        if (!['admin', 'manager'].includes(role)) {
            return res.json({ success: false, message: "Unauthorized" });
        }

        const receipt = await importReceiptModel.findById(id);
        if (!receipt) {
            return res.json({ success: false, message: "Receipt not found" });
        }

        if (receipt.status !== 'PENDING') {
            return res.json({ success: false, message: `Cannot cancel receipt with status ${receipt.status}` });
        }

        receipt.status = 'CANCELLED';
        receipt.notes = receipt.notes + ` [Cancelled: ${reason || 'No reason'}]`;
        await receipt.save();

        res.json({ success: true, message: `Đã hủy phiếu ${receipt.code}`, data: receipt });
    } catch (error) {
        console.error("cancelReceipt error:", error);
        res.json({ success: false, message: "Error cancelling receipt" });
    }
};

export { 
    listSuppliers, 
    addSupplier, 
    updateSupplier, 
    listReceipts, 
    getReceipt, 
    createReceipt, 
    completeReceipt, 
    cancelReceipt 
};
