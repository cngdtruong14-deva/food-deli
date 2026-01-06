const https = require('https');

const url = "https://storage.quannhautudo.com/Data/images/product/2024/05/30/202405301010201502.webp";

const options = {
    method: 'HEAD',
    headers: {
        'Referer': 'https://quannhautudo.com/',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
};

console.log("Checking with headers:", url);

const req = https.request(url, options, (res) => {
    console.log(`Status: ${res.statusCode}`);
});
req.end();
