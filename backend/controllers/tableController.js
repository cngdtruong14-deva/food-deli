import tableModel from "../models/tableModel.js";
import branchModel from "../models/branchModel.js";
import userModel from "../models/userModel.js";
import { getIO } from "../utils/socket.js";

// Add table (Admin/Manager)
const addTable = async (req, res) => {
  try {
    const userData = await userModel.findById(req.user ? req.user.id : req.body.userId);
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
    const userData = await userModel.findById(req.user ? req.user.id : req.body.userId);
    if (!userData || !["admin", "manager", "staff"].includes(userData.role)) {
      return res.json({ success: false, message: "Unauthorized" });
    }

    const table = await tableModel.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    );

    if (table) {
      getIO().emit("table:status_updated", {
        tableId: table._id,
        branchId: table.branchId,
        status: table.status
      });
    }

    if (!table) {
      return res.json({ success: false, message: "Table not found" });
    }

    // Emit socket event
    // We need io here. tableController needs to import io. 
    // BUT io is exported from server.js. Circular dependency risk?
    // server.js imports tableRoute -> tableController. 
    // tableController imports io from server.js. 
    // This is circular. 
    // Solution: Pass io via req.app.get('io') or import from server.js if it works (implied it worked in orderController).
    
    // Actually, orderController imports { io } from "../server.js".
    
    // Let's add the import to tableController first (in a separate step or assume it's there? No, I must check imports).
    // I will use req.app.get("io") if attached, or import. 
    // Checking orderController... yes it imports. 
    // I will add import in next step.
    
    // Wait, let's look at tableController.js imports again.
    // It does NOT import io.
    
    // I will skip adding the emit here in THIS tool call, 
    // and do it in a multi-replace or separate one that adds the import too.
    
    res.json({ success: true, message: "Table status updated", data: table });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error updating table" });
  }
};

// Remove table (Admin/Manager)
const removeTable = async (req, res) => {
  try {
    const userData = await userModel.findById(req.user ? req.user.id : req.body.userId);
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
