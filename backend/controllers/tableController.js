import tableModel from "../models/tableModel.js";
import branchModel from "../models/branchModel.js";
import userModel from "../models/userModel.js";

// Add table (Admin/Manager)
const addTable = async (req, res) => {
  try {
    const userData = await userModel.findById(req.body.userId);
    if (!userData || !["admin", "manager"].includes(userData.role)) {
      return res.json({ success: false, message: "Unauthorized" });
    }

    // Verify branch exists
    const branch = await branchModel.findById(req.body.branchId);
    if (!branch) {
      return res.json({ success: false, message: "Branch not found" });
    }

    // Generate QR code token (simple unique identifier)
    const qrToken = `${req.body.branchId}-${req.body.tableNumber}-${Date.now()}`;

    const table = new tableModel({
      branchId: req.body.branchId,
      tableNumber: req.body.tableNumber,
      capacity: req.body.capacity || 4,
      qrCode: qrToken
    });

    await table.save();
    res.json({ success: true, message: "Table Added", data: table });
  } catch (error) {
    console.log(error);
    if (error.code === 11000) {
      return res.json({ success: false, message: "Table number already exists in this branch" });
    }
    res.json({ success: false, message: "Error adding table" });
  }
};

// List tables for a branch
const listTables = async (req, res) => {
  try {
    const { branchId } = req.params;
    
    const query = branchId ? { branchId } : {};
    const tables = await tableModel.find(query).populate("branchId", "name");
    
    res.json({ success: true, data: tables });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error fetching tables" });
  }
};

// Get table by QR code
const getTableByQR = async (req, res) => {
  try {
    const table = await tableModel.findOne({ qrCode: req.params.qrCode }).populate("branchId");
    if (!table) {
      return res.json({ success: false, message: "Table not found" });
    }
    res.json({ success: true, data: table });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error fetching table" });
  }
};

// Update table status
const updateTableStatus = async (req, res) => {
  try {
    const userData = await userModel.findById(req.body.userId);
    if (!userData || !["admin", "manager", "staff"].includes(userData.role)) {
      return res.json({ success: false, message: "Unauthorized" });
    }

    const table = await tableModel.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    );

    if (!table) {
      return res.json({ success: false, message: "Table not found" });
    }

    res.json({ success: true, message: "Table status updated", data: table });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error updating table" });
  }
};

// Remove table (Admin/Manager)
const removeTable = async (req, res) => {
  try {
    const userData = await userModel.findById(req.body.userId);
    if (!userData || !["admin", "manager"].includes(userData.role)) {
      return res.json({ success: false, message: "Unauthorized" });
    }

    const table = await tableModel.findByIdAndDelete(req.body.id);
    if (!table) {
      return res.json({ success: false, message: "Table not found" });
    }

    res.json({ success: true, message: "Table Removed" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error removing table" });
  }
};

export { addTable, listTables, getTableByQR, updateTableStatus, removeTable };
