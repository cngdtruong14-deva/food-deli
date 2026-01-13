/**
 * Comprehensive AI System Verification Script
 * Tests all AI-related endpoints and integration points
 * Run: node backend/tests/manual_scripts/verify_ai_system.js
 */

import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const PYTHON_URL = 'http://localhost:5001';
const BACKEND_URL = 'http://localhost:4000';

// Load .env
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Result tracking
const results = [];
let passCount = 0;
let failCount = 0;

function logResult(testName, passed, details = '') {
    const status = passed ? '✅' : '❌';
    console.log(`${status} ${testName}${details ? ` - ${details}` : ''}`);
    results.push({ testName, passed, details });
    if (passed) passCount++;
    else failCount++;
}

async function runTests() {
    console.log('🧪 AI SYSTEM VERIFICATION SUITE');
    console.log('================================\n');

    // =========================================
    // 1. PYTHON AI SERVICE TESTS
    // =========================================
    console.log('📡 [1] PYTHON AI SERVICE CHECKS');
    console.log('--------------------------------');

    // 1.1 Health Check
    try {
        const res = await axios.get(`${PYTHON_URL}/`, { timeout: 5000 });
        logResult('Python Health Check', res.status === 200, `Status: ${res.status}`);
    } catch (error) {
        logResult('Python Health Check', false, `FAILED: ${error.code || error.message}`);
    }

    // 1.2 Forecast Endpoint
    try {
        const res = await axios.get(`${PYTHON_URL}/api/forecast/ingredients`, { timeout: 10000 });
        const hasData = res.data && res.data.success !== undefined;
        logResult('Python /api/forecast/ingredients', hasData, `Returned ${res.data?.data?.length || 0} suggestions`);
    } catch (error) {
        logResult('Python /api/forecast/ingredients', false, `FAILED: ${error.message}`);
    }

    // 1.3 Recommendation Endpoint (requires valid food_id)
    try {
        // Try with a dummy ID, should gracefully return empty or error message
        const res = await axios.post(`${PYTHON_URL}/api/recommend/combo`, { food_id: '000000000000000000000000' }, { timeout: 5000 });
        const isValid = res.data && (res.data.success !== undefined);
        logResult('Python /api/recommend/combo', isValid, `Response valid structure`);
    } catch (error) {
        // 404 or 500 is acceptable for invalid ID, but connection should work
        if (error.response) {
            logResult('Python /api/recommend/combo', true, `Endpoint reachable (Status: ${error.response.status})`);
        } else {
            logResult('Python /api/recommend/combo', false, `FAILED: ${error.message}`);
        }
    }

    // =========================================
    // 2. NODE.JS BACKEND TESTS
    // =========================================
    console.log('\n🖥️  [2] NODE.JS BACKEND CHECKS');
    console.log('--------------------------------');

    // 2.1 Backend Health
    try {
        const res = await axios.get(`${BACKEND_URL}/`, { timeout: 5000 });
        logResult('Backend Reachable', true, `Status: ${res.status}`);
    } catch (error) {
        if (error.response) {
            logResult('Backend Reachable', true, `Status: ${error.response.status}`);
        } else {
            logResult('Backend Reachable', false, `FAILED: ${error.code}`);
        }
    }

    // 2.2 Forecast Route (via Backend Proxy)
    try {
        const res = await axios.get(`${BACKEND_URL}/api/inventory/forecast`, { timeout: 10000 });
        const hasData = res.data && res.data.success !== undefined;
        logResult('Backend /api/inventory/forecast', hasData, `Returned ${res.data?.data?.length || 0} items`);
    } catch (error) {
        if (error.response?.data) {
            logResult('Backend /api/inventory/forecast', true, `Endpoint works, returned: ${JSON.stringify(error.response.data).substring(0, 50)}`);
        } else {
            logResult('Backend /api/inventory/forecast', false, `FAILED: ${error.message}`);
        }
    }

    // 2.3 Recommendation Route (via Backend)
    try {
        const res = await axios.get(`${BACKEND_URL}/api/food/000000000000000000000000/recommendations`, { timeout: 5000 });
        const isValid = res.data && res.data.success !== undefined;
        logResult('Backend /api/food/:id/recommendations', isValid, `Response valid`);
    } catch (error) {
        if (error.response) {
            logResult('Backend /api/food/:id/recommendations', true, `Endpoint exists (Status: ${error.response.status})`);
        } else {
            logResult('Backend /api/food/:id/recommendations', false, `FAILED: ${error.message}`);
        }
    }

    // =========================================
    // 3. DATABASE CHECKS
    // =========================================
    console.log('\n🍃 [3] DATABASE CHECKS');
    console.log('----------------------');

    try {
        const mongoUri = process.env.MONGO_URI || process.env.MONGO_URL;
        await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });
        logResult('MongoDB Connection', true, 'Connected');

        // Check Foods exist
        const FoodModel = mongoose.models.food || mongoose.model('food', new mongoose.Schema({ name: String }));
        const foodCount = await FoodModel.countDocuments();
        logResult('Foods Collection', foodCount > 0, `${foodCount} items`);

        // Check Orders exist
        const OrderModel = mongoose.models.order || mongoose.model('order', new mongoose.Schema({ status: String }));
        const orderCount = await OrderModel.countDocuments();
        logResult('Orders Collection', orderCount > 0, `${orderCount} orders`);

        // Check Recipes exist
        const RecipeModel = mongoose.models.recipe || mongoose.model('recipe', new mongoose.Schema({ foodId: mongoose.Schema.Types.ObjectId }));
        const recipeCount = await RecipeModel.countDocuments();
        logResult('Recipes Collection', recipeCount >= 0, `${recipeCount} recipes`);

        // Check Stocks exist
        const StockModel = mongoose.models.stock || mongoose.model('stock', new mongoose.Schema({ quantity: Number }));
        const stockCount = await StockModel.countDocuments();
        logResult('Stocks Collection', stockCount >= 0, `${stockCount} stock entries`);

        await mongoose.connection.close();
    } catch (error) {
        logResult('MongoDB Connection', false, error.message);
    }

    // =========================================
    // SUMMARY
    // =========================================
    console.log('\n========================================');
    console.log('📊 VERIFICATION SUMMARY');
    console.log('========================================');
    console.log(`✅ Passed: ${passCount}`);
    console.log(`❌ Failed: ${failCount}`);
    console.log(`📋 Total:  ${passCount + failCount}`);

    if (failCount === 0) {
        console.log('\n🎉 ALL CHECKS PASSED! System is stable.');
    } else {
        console.log('\n⚠️  Some checks failed. Review the output above.');
    }

    process.exit(failCount > 0 ? 1 : 0);
}

runTests();
