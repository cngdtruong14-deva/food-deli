
const BASE_URL = 'http://localhost:4000';

async function run() {
    try {
        const email = `debug_${Date.now()}@example.com`;
        const password = 'password123';
        console.log(`Creating user: ${email}`);
        
        // 1. Register
        const regRes = await fetch(`${BASE_URL}/api/user/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: "Debug User", email, password })
        });
        const regData = await regRes.json();
        const token = regData.token;

        if (!token) {
            console.log("Register failed, attempting login...");
             const loginRes = await fetch(`${BASE_URL}/api/user/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const loginData = await loginRes.json();
            token = loginData.token;
        }

        if(!token) {
             console.error("Could not get token!");
             return;
        }

        // 2. Mock Item
        const foodRes = await fetch(`${BASE_URL}/api/food/list`);
        const foodData = await foodRes.json();
        const foodItem = foodData.data[0];

        if (!foodItem) {
            console.error("No food items found!");
            return;
        }
        
        console.log(`Testing with food: ${foodItem.name} (${foodItem.price} VND)`);

        // 3. Place Order
        const orderPayload = {
            userId: "temp_user_id", // Middleware handles token verify
            items: [{
                _id: foodItem._id,
                name: foodItem.name,
                price: foodItem.price,
                quantity: 1
            }],
            amount: foodItem.price + 15000,
            address: {
                firstName: "Debug",
                lastName: "User",
                email: email,
                street: "123 Test St", 
                city: "Test City",
                state: "Test State",
                zipcode: "10000",
                country: "VN",
                phone: "0123456789"
            },
            orderType: "Delivery",
            paymentMethod: "Stripe"
        };

        const orderRes = await fetch(`${BASE_URL}/api/order/place`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'token': token
            },
            body: JSON.stringify(orderPayload)
        });

        const orderData = await orderRes.json();
        console.log("SUCCESS:", orderData.success);
        console.log("MESSAGE:", orderData.message);
        if (orderData.outOfStockItems) {
            console.log("OUT OF STOCK:", orderData.outOfStockItems);
        }
    } catch (error) {
        console.error("SCRIPT ERROR:", error);
    }
}

run();
