import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load env from backend root
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const BASE_URL = process.env.BACKEND_URL || "http://localhost:4000";
// Default credentials - ADJUST IF NEEDED
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "test@example.com"; 
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "12345678"; 

export const login = async (role = 'user') => {
    try {
        const email = role === 'admin' ? ADMIN_EMAIL : "user@test.com";
        const password = role === 'admin' ? ADMIN_PASSWORD : "12345678"; // Ensure this user exists

        // If user, try to register/login? Or just assume existing.
        // For simplicity, let's login as admin for stock checks? 
        // Or user for placing order.
        
        let loginEndpoint = "/api/user/login";
        // If testing admin specific actions, might use /api/user/adminlogin if separate?
        // Project seems to use same login or role based.
        
        const response = await axios.post(`${BASE_URL}${loginEndpoint}`, { email, password });
        if (response.data.success) {
            return { 
                token: response.data.token, 
                userId: response.data.userId || "unknown", // Adjust based on actual response
                role: role 
            }; 
        } else {
            throw new Error("Login Failed: " + response.data.message);
        }
    } catch (error) {
        console.error("Login Helper Error:", error.message);
        // Fallback or retry?
        // Return null
        return null;
    }
};

export const getBaseUrl = () => BASE_URL;
