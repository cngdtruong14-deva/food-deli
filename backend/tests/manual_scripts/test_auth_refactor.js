import axios from 'axios';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Fix __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../../../.env') });

const API_URL = "http://localhost:4000/api";
// Use a test user functionality if available or login
const TEST_EMAIL = "admin@fooddeli.com" || "testuser@example.com"; 
const TEST_PASSWORD = process.env.MASTER_ADMIN_PASS || "12345678"; // Attempt to use master admin or default

async function runTest() {
    console.log("🚀 Starting Auth Refactor Verification...");

    try {
        // 1. Login to get Token
        console.log(`\n🔹 Attempting login with ${TEST_EMAIL}...`);
        
        // Use Master Admin login if available in env, or try standard
        let loginRes;
        if (process.env.MASTER_ADMIN_PASS) {
             console.log("Using Master Admin Payload...");
             loginRes = await axios.post(`${API_URL}/user/login`, {
                email: process.env.MASTER_ADMIN_EMAIL || "admin@example.com",
                password: process.env.MASTER_ADMIN_PASS
             });
        } else {
             // Fallback: register a temp user? or assume seeding exists.
             // Let's try to register a temp user for test
             const uniqueEmail = `testauth_${Date.now()}@example.com`;
             console.log(`Registering temp user: ${uniqueEmail}`);
             loginRes = await axios.post(`${API_URL}/user/register`, {
                 name: "Auth Test User",
                 email: uniqueEmail,
                 password: "password123"
             });
        }

        if (!loginRes.data.success) {
            console.error("❌ Login/Register Failed:", loginRes.data.message);
            return;
        }

        const token = loginRes.data.token;
        console.log("✅ Login Successful. Token received.");

        // 2. Call a protected endpoint (Get Cart)
        // This endpoint was refactored to use req.user.id
        console.log("\n🔹 Testing Protected Route (Get Cart)...");
        const cartRes = await axios.post(`${API_URL}/cart/get`, {}, {
            headers: { token: token }
        });

        if (cartRes.data.success) {
            console.log("✅ Get Cart Successful!");
            console.log("Response:", JSON.stringify(cartRes.data.cartData).substring(0, 100) + "...");
        } else {
            console.error("❌ Get Cart Failed:", cartRes.data.message);
            // Check if it's an auth issue
            if (cartRes.data.message.includes("Unauthorized") || cartRes.data.message.includes("Error")) {
                console.error("Possible Middleware/Controller mismatch.");
            }
        }

        // 3. Test Invalid Token
        console.log("\n🔹 Testing Invalid Token...");
        try {
            await axios.post(`${API_URL}/cart/get`, {}, {
                headers: { token: "invalid_token_123" }
            });
        } catch (error) {
            // expected 401 or similar?
            // backend usually returns 200 with success: false for auth errors in this codebase (see auth.js)
            // Wait, auth.js returns res.status(401) now?
            // "res.status(401).json(...)" Yes, line 6 and 14 of auth.js.
            if (error.response && error.response.status === 401) {
                console.log("✅ Correctly received 401 for invalid token.");
            } else {
                console.warn("⚠️ Unexpected response for invalid token:", error.message);
            }
        }

    } catch (error) {
        console.error("❌ Test Script Error:", error.message);
        if (error.response) {
            console.error("Response Data:", error.response.data);
        }
    }
}

runTest();
