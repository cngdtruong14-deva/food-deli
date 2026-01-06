const https = require('https');

const url = "https://storage.quannhautudo.com/Data/images/product/2024/05/30/202405301010201502.webp";

console.log("Checking:", url);

const req = https.request(url, { method: 'HEAD' }, (res) => {
    console.log(`Status: ${res.statusCode}`);
    if (res.statusCode === 200) {
        console.log("Size:", res.headers['content-length']);
    }
});
req.end();
