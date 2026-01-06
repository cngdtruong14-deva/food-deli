const https = require('https');

// Lowercase 'data'
const url = "https://storage.quannhautudo.com/data/images/product/2024/05/30/202405301010201502.webp";

console.log("Checking lowercase:", url);

const req = https.request(url, { method: 'HEAD' }, (res) => {
    console.log(`Status: ${res.statusCode}`);
});
req.end();
