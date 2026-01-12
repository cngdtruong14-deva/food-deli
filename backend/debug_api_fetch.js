async function checkAPI() {
    try {
        console.log("Fetching http://localhost:4000/api/food/list ...");
        const res = await fetch("http://localhost:4000/api/food/list");
        const data = await res.json();
        
        console.log("Success:", data.success);
        if (data.success) {
            console.log("Count:", data.data.length);
            if (data.data.length > 0) {
                console.log("First Item:", JSON.stringify(data.data[0], null, 2));
                // Check category type
                console.log("Category Type:", typeof data.data[0].category);
                console.log("Category Value:", data.data[0].category);
            }
        } else {
            console.log("Message:", data.message);
        }
    } catch (e) {
        console.error("Fetch Error:", e);
    }
}

checkAPI();
