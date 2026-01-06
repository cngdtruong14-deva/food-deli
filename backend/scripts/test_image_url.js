const https = require('https');

const thumbUrl = "https://storage.quannhautudo.com/data/thumb_400/Data/images/product/2025/06/202506281113033899.webp";
// Hypothesis: Remove '/data/thumb_400' to get 'https://storage.quannhautudo.com/Data/images/...'
const highResUrl = thumbUrl.replace("/data/thumb_400", "");

console.log("Original:", thumbUrl);
console.log("High Res:", highResUrl);

const req = https.request(highResUrl, { method: 'HEAD' }, (res) => {
    console.log(`Status Code: ${res.statusCode}`);
    if (res.statusCode === 200) {
        console.log("High resolution image exists!");
        console.log("Content-Length:", res.headers['content-length']);
    } else {
        console.log("High resolution image NOT found.");
    }
});

req.on('error', (e) => {
    console.error(`Problem with request: ${e.message}`);
});

req.end();
