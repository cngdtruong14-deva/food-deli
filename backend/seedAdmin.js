import mongoose from "mongoose";
import bcrypt from "bcrypt";
import "dotenv/config";
import userModel from "./models/userModel.js";

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL);
    console.log("DB Connected");

    const adminEmail = "admin@demo.com";
    const adminPassword = "admin123";

    // Check if admin already exists
    const existingAdmin = await userModel.findOne({ email: adminEmail });
    if (existingAdmin) {
      console.log("Admin already exists:", adminEmail);
      process.exit(0);
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(adminPassword, salt);

    // Create admin user
    const admin = new userModel({
      name: "Admin",
      email: adminEmail,
      password: hashedPassword,
      role: "admin",
    });

    await admin.save();
    console.log("Admin created successfully!");
    console.log("Email:", adminEmail);
    console.log("Password:", adminPassword);
    process.exit(0);
  } catch (error) {
    console.error("Error seeding admin:", error);
    process.exit(1);
  }
};

seedAdmin();
