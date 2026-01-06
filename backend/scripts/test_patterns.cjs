const https = require('https');

const thumbUrl = "https://storage.quannhautudo.com/data/thumb_400/Data/images/product/2025/06/202506281113033899.webp";

// List of potential high-res patterns
const candidates = [
    thumbUrl.replace("/data/thumb_400", ""), // Lowercase data removal
    thumbUrl.replace("/data/thumb_400/Data", "/Data"), // Keep Data
    thumbUrl.replace("/data/thumb_400/Data", ""), // Remove both
    "https://storage.quannhautudo.com/Data/images/product/2025/06/202506281113033899.webp", // Explicit construction
    "https://storage.quannhautudo.com/images/product/2025/06/202506281113033899.webp", // No Data folder
    "https://storage.quannhautudo.com/upload/Data/images/product/2025/06/202506281113033899.webp",
    // Try original URL but change thumb_400 to 'full' or remove 'thumb_400'
    thumbUrl.replace("thumb_400", "full"),
    thumbUrl.replace("thumb_400/", "")
];

function checkUrl(url) {
    if (!url) return;
    const req = https.request(url, { method: 'HEAD' }, (res) => {
        console.log(`[${res.statusCode}] ${url}`);
        if (res.statusCode === 200) {
            console.log(">>> FOUND VALID URL:", url);
            console.log(">>> Content-Length:", res.headers['content-length']);
        }
    });
    req.on('error', (e) => {});
    req.end();
}

console.log("Testing candidate URLs...");
candidates.forEach(url => checkUrl(url));
