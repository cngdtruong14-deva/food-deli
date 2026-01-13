import branchModel from "../models/branchModel.js";
import tableModel from "../models/tableModel.js";
import userModel from "../models/userModel.js";

// Add branch (Admin only)
const addBranch = async (req, res) => {
  try {
    const userData = await userModel.findById(req.user ? req.user.id : req.body.userId);
    if (!userData || userData.role !== "admin") {
      return res.json({ success: false, message: "Unauthorized: Admin only" });
    }

    const branch = new branchModel({
      name: req.body.name,
      address: req.body.address,
      phone: req.body.phone || ""
    });

    await branch.save();
    res.json({ success: true, message: "Branch Added", data: branch });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error adding branch" });
  }
};

// List branches (Role Aware)
const listBranches = async (req, res) => {
  try {
    // Note: admin check should use token context
    const userId = req.user ? req.user.id : (req.body.userId || req.query.userId);
    let query = { isActive: true };

    // Role Check - FIX: Handle "null" string properly
    if (userId && userId !== 'null' && userId !== 'undefined') {
        const user = await userModel.findById(userId);
        if (user && user.role === 'manager') {
             // Manager can ONLY see their own branch
             query._id = user.branchId;
        }
        // Admin users can see all branches (no query restriction)
    }
    // If no valid userId, show all active branches (for general access)

    const branches = await branchModel.find(query);
    
    // Calculate occupancy rate for each branch
    const branchData = await Promise.all(branches.map(async (branch) => {
      const tables = await tableModel.find({ branchId: branch._id });
      const totalTables = tables.length;
      const occupiedTables = tables.filter(t => t.status !== "Available").length;
      const occupancyRate = totalTables === 0 ? 0 : Math.round((occupiedTables / totalTables) * 100);
      
      return {
        ...branch.toObject(),
        occupancyRate
      };
    }));

    res.json({ success: true, data: branchData });
  } catch (error) {
    console.error('[branchController] listBranches ERROR:', error.message);
    res.json({ success: false, message: "Error fetching branches" });
  }
};

// Get single branch
const getBranch = async (req, res) => {
  try {
    const branch = await branchModel.findById(req.params.id);
    if (!branch) {
      return res.json({ success: false, message: "Branch not found" });
    }
    res.json({ success: true, data: branch });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error fetching branch" });
  }
};

// Update branch (Admin/Manager)
const updateBranch = async (req, res) => {
  try {
    const userData = await userModel.findById(req.user ? req.user.id : req.body.userId);
    if (!userData || !["admin", "manager"].includes(userData.role)) {
      return res.json({ success: false, message: "Unauthorized" });
    }

    const branch = await branchModel.findByIdAndUpdate(
      req.params.id,
      {
        name: req.body.name,
        address: req.body.address,
        phone: req.body.phone,
        isActive: req.body.isActive
      },
      { new: true }
    );

    if (!branch) {
      return res.json({ success: false, message: "Branch not found" });
    }

    res.json({ success: true, message: "Branch Updated", data: branch });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error updating branch" });
  }
};

// Remove branch (Admin only - soft delete)
const removeBranch = async (req, res) => {
  try {
    const userData = await userModel.findById(req.user ? req.user.id : req.body.userId);
    if (!userData || userData.role !== "admin") {
      return res.json({ success: false, message: "Unauthorized: Admin only" });
    }

    const branch = await branchModel.findByIdAndUpdate(
      req.body.id,
      { isActive: false },
      { new: true }
    );

    if (!branch) {
      return res.json({ success: false, message: "Branch not found" });
    }

    res.json({ success: true, message: "Branch Removed" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error removing branch" });
  }
};

export { addBranch, listBranches, getBranch, updateBranch, removeBranch };
