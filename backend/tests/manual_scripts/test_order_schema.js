import axios from 'axios';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Fix __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../../../.env') });

const API_URL = "http://localhost:4000/api";
const EMAIL = "schema_test_" + Date.now() + "@example.com";
const PASSWORD = "password123";

async function runTest() {
    console.log("🚀 Starting Order Schema Verification...");

    try {
        // 1. Register/Login
        console.log(`\n🔹 Registering user: ${EMAIL}...`);
        const loginRes = await axios.post(`${API_URL}/user/register`, {
            name: "Schema Test User",
            email: EMAIL,
            password: PASSWORD
        });

        if (!loginRes.data.success) {
            throw new Error("Login failed: " + loginRes.data.message);
        }
        const token = loginRes.data.token;
        console.log("✅ Login Successful.");

        // 2. Place Order with VALID Address
        console.log("\n🔹 Placing Order with VALID Address...");
        const validOrderPayload = {
            userId: loginRes.data.userId, // Legacy fallback, though token is used
            items: [{
                _id: "677d222e4d02636a0cb5743b", // Hardcoded known ID or we need to fetch?
                // Wait, we need a valid food ID. Let's fetch food list first.
                // Or I can mock it if backend doesn't check existence strictly? 
                // Backend checks existence! see orderController line 96: foodModel.findById(item._id)
                // So I must fetch a specific food first.
            }],
            amount: 50000,
            address: {
                firstName: "Test",
                lastName: "User",
                email: "test@example.com",
                phone: "0123456789",
                street: "123 Test St",
                city: "Hanoi"
            }
        };

        // Fetch a food item
        const foodRes = await axios.get(`${API_URL}/food/list`);
        if (foodRes.data.data && foodRes.data.data.length > 0) {
            const food = foodRes.data.data[0];
            validOrderPayload.items = [{
                _id: food._id,
                name: food.name,
                price: food.price,
                quantity: 1,
                image: food.image
            }];
            validOrderPayload.amount = food.price;
        } else {
            throw new Error("No food items found in DB to test with.");
        }

        const orderRes1 = await axios.post(`${API_URL}/order/place`, validOrderPayload, {
            headers: { token }
        });

        if (orderRes1.data.success) {
            console.log("✅ Order with Valid Address Placed Successfully!");
            // console.log(orderRes1.data);
        } else {
            console.error("❌ Order Placement Failed:", orderRes1.data.message);
        }

        // 3. Place Order with INVALID Address (Missing required fields)
        /* 
           NOTE: Since I used strict: true in schema, missing required fields should fail 
           ONLY IF Mongoose validation runs on the subdocument. 
           However, 'default: () => ({})' might bypass it if existing? 
           Let's see if we send an incomplete address.
        */
        console.log("\n🔹 Placing Order with INVALID Address (Missing Street)...");
        const invalidOrderPayload = { ...validOrderPayload };
        invalidOrderPayload.address = {
            firstName: "Test"
            // Missing others
        };

        try {
            const orderRes2 = await axios.post(`${API_URL}/order/place`, invalidOrderPayload, {
                headers: { token }
            });
            if (orderRes2.data.success) {
                console.warn("⚠️ Order with Invalid Address Accepted? (Validation might be loose)");
            } else {
                console.log("✅ Refused Invalid Address as expected:", orderRes2.data.message);
            }
        } catch (error) {
             console.log("✅ Refused Invalid Address (Error Caught).");
        }

    } catch (error) {
        console.error("❌ Test Script Error:", error.message);
        if (error.response) console.error(error.response.data);
    }
}

runTest();
