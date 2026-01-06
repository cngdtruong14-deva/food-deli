const https = require('https');

// Try web domain instead of storage
const url = "https://quannhautudo.com/Data/images/product/2024/05/30/202405301010201502.webp";

console.log("Checking Web Domain:", url);

const req = https.request(url, { method: 'HEAD' }, (res) => {
    console.log(`Status: ${res.statusCode}`);
});
req.end();
