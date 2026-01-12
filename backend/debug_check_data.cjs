const axios = require('axios');

async function checkSystem() {
    try {
        console.log("Checking Backend API...");
        const response = await axios.get('http://localhost:4000/api/food/list');
        console.log("Status:", response.status);
        if (response.data.success) {
            console.log(`Food Items: ${response.data.data.length}`);
            if (response.data.data.length > 0) {
                console.log("Sample Item:", response.data.data[0].name);
            } else {
                console.log("⚠️ WARNING: Food List is EMPTY!");
            }
        } else {
            console.log("API Error:", response.data.message);
        }

        const catResponse = await axios.get('http://localhost:4000/api/food/categories');
        if (catResponse.data.success) {
            console.log(`Categories: ${catResponse.data.data.length}`);
        }

    } catch (e) {
        console.error("Connection Failed:", e.message);
    }
}

checkSystem();
