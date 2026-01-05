import fs from "fs";
import path from "path";
import mongoose from "mongoose";
import dotenv from "dotenv";

console.log("Imports successful");
console.log("CWD:", process.cwd());
dotenv.config({ path: path.join(path.dirname(new URL(import.meta.url).pathname), "../.env") });
console.log("MONGO_URL:", process.env.MONGO_URL ? "Defined" : "Undefined");
