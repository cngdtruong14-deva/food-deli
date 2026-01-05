import branchModel from "../models/branchModel.js";
import userModel from "../models/userModel.js";

// Add branch (Admin only)
const addBranch = async (req, res) => {
  try {
    const userData = await userModel.findById(req.body.userId);
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

// List all branches
const listBranches = async (req, res) => {
  try {
    const branches = await branchModel.find({ isActive: true });
    res.json({ success: true, data: branches });
  } catch (error) {
    console.log(error);
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
    const userData = await userModel.findById(req.body.userId);
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
    const userData = await userModel.findById(req.body.userId);
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
