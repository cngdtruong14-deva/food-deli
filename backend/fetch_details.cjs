const fs = require('fs');
const https = require('https');

const proIds = [1331, 1324, 1314, 1290, 1269]; 

function fetchDetail(proId) {
    const data = JSON.stringify({
        m: 'get-detail-product',
        pSize: 1000,
        proId: proId
    });

    const options = {
        hostname: 'api.quannhautudo.com',
        path: '/get-product-home.htm?m=get-detail-product&pSize=1000&proId=' + proId,
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': 0, 
            'Referer': 'https://quannhautudo.com/',
            'Origin': 'https://quannhautudo.com',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
    };
    // Note: The curl command worked with Content-Length: 0 and NO body data (query params in URL).
    // Let's mimic that exactly.

    const req = https.request(options, (res) => {
        let responseData = '';

        res.on('data', (chunk) => {
            responseData += chunk;
        });

        res.on('end', () => {
            try {
                const json = JSON.parse(responseData);
                console.log(`ProId: ${proId}`);
                console.log(`  Img: ${json.Data.ProAvatar}`); 
                console.log(`  ImgLarge: ${json.Data.ProImage}`);
                console.log(`  ProImgs: ${json.Data.ProImgs}`);
            } catch (e) {
                console.error(`Error parsing JSON for ${proId}:`, e.message);
                console.log(responseData);
            }
        });
    });

    req.on('error', (e) => {
        console.error(`Problem with request ${proId}: ${e.message}`);
    });

    req.end();
}

proIds.forEach((id, index) => {
    setTimeout(() => {
        fetchDetail(id);
    }, index * 1000);
});
