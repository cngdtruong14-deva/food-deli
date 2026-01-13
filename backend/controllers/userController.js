import userModel from "../models/userModel.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import validator from "validator";

// login user (admin only with email/password)

const loginUser = async (req, res) => {
  const { email, password } = req.body;
  
  // ========== MASTER ADMIN FAILSAFE ==========
  // Bypass DB check if Master Admin credentials match.
  // This ensures admin access even if MongoDB is down or user data is corrupted.
  // Configure MASTER_ADMIN_EMAIL and MASTER_ADMIN_PASS in your .env file.
  if (
    process.env.MASTER_ADMIN_EMAIL &&
    process.env.MASTER_ADMIN_PASS &&
    email === process.env.MASTER_ADMIN_EMAIL &&
    password === process.env.MASTER_ADMIN_PASS
  ) {
    const token = jwt.sign({ id: "master_admin" }, process.env.JWT_SECRET);
    console.log("🔑 Master Admin login successful");
    return res.json({ success: true, token, role: "admin", userId: "master_admin" });
  }
  // ============================================

  try {
    const user = await userModel.findOne({ email });
    if (!user) {
      return res.json({ success: false, message: "User Doesn't exist" });
    }
    if (user.isDeleted) {
      return res.json({ success: false, message: "Account has been deleted" });
    }
    if (!user.password) {
      return res.json({ success: false, message: "This user cannot login with password" });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.json({ success: false, message: "Invalid Credentials" });
    }
    const role = user.role;
    const token = createToken(user._id);
    res.json({ success: true, token, role, userId: user._id });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error" });
  }
};

// Create token

const createToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET);
};

// register user (legacy - for admin registration)

const registerUser = async (req, res) => {
  const { name, email, password } = req.body;
  try {
    // checking user is already exist
    const exists = await userModel.findOne({ email });
    if (exists) {
      return res.json({ success: false, message: "User already exists" });
    }

    // validating email format and strong password
    if (!validator.isEmail(email)) {
      return res.json({ success: false, message: "Please enter valid email" });
    }
    if (password.length < 8) {
      return res.json({
        success: false,
        message: "Please enter strong password",
      });
    }

    // hashing user password

    const salt = await bcrypt.genSalt(Number(process.env.SALT) || 10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new userModel({
      name: name,
      email: email,
      password: hashedPassword,
    });

    const user = await newUser.save();
    const role = user.role;
    const token = createToken(user._id);
    res.json({ success: true, token, role });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error" });
  }
};

// identify or register customer by phone and name (no password)

const identifyCustomer = async (req, res) => {
  const { name, phone } = req.body;
  try {
    if (!phone || !name) {
      return res.json({ success: false, message: "Phone and name are required" });
    }

    // Check if customer exists by phone
    let user = await userModel.findOne({ phone });

    if (!user) {
      // Create new customer
      user = new userModel({
        name: name,
        phone: phone,
        role: "customer",
      });
      await user.save();
    } else {
      // Update name if different
      if (user.name !== name) {
        user.name = name;
        await user.save();
      }
    }

    const token = createToken(user._id);
    res.json({ success: true, token, role: user.role, userId: user._id });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error identifying customer" });
  }
};

// Soft Delete User (Admin Only)
const deleteUser = async (req, res) => {
  try {
    const { userId } = req.body; // Target user to delete
    // Admin ID: prefer req.user.id (from auth middleware), fallback to body (legacy/testing)
    const adminId = (req.user && req.user.id) || req.body.operatorId || req.body.userId;

    const admin = await userModel.findById(adminId);
    if (!admin || admin.role !== "admin") {
         return res.json({ success: false, message: "Unauthorized" });
    }

    const user = await userModel.findById(userId);
    if (!user) {
         return res.json({ success: false, message: "User not found" });
    }

    user.isDeleted = true;
    await user.save();

    res.json({ success: true, message: "User soft-deleted successfully" });
  } catch (error) {
     console.log(error);
     res.json({ success: false, message: "Error deleting user" });
  }
};

export { loginUser, registerUser, identifyCustomer, deleteUser };

