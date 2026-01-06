const https = require('https');

const thumbUrl = "https://storage.quannhautudo.com/data/thumb_400/Data/images/product/2025/06/202506281113033899.webp";
const highResUrl = thumbUrl.replace("/data/thumb_400", "");

console.log("Checking High Res URL:", highResUrl);

https.get(highResUrl, (res) => {
    console.log("Status Code:", res.statusCode);
    console.log("Content Length:", res.headers['content-length']);
}).on('error', (e) => {
    console.error("Error:", e);
});
